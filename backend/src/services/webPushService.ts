import fs from "fs";
import path from "path";
import webpush from "web-push";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface StoredAdminPushSubscription {
  id: string;
  userId: string;
  role: string;
  companyId?: string | null;
  subscription: PushSubscriptionData;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const VAPID_FILE = path.join(DATA_DIR, "vapid.json");
const SUBS_FILE = path.join(DATA_DIR, "push-subscriptions.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// In-memory cache of subscriptions
let subscriptionsCache: StoredAdminPushSubscription[] | null = null;
let vapidInitialized = false;
let currentVapidKeys: { publicKey: string; privateKey: string } | null = null;

export function initVapidKeys(): { publicKey: string; privateKey: string } {
  if (currentVapidKeys) return currentVapidKeys;

  ensureDataDir();

  const envPublic = process.env.VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;

  if (envPublic && envPrivate) {
    currentVapidKeys = { publicKey: envPublic, privateKey: envPrivate };
  } else if (fs.existsSync(VAPID_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(VAPID_FILE, "utf-8"));
      if (data.publicKey && data.privateKey) {
        currentVapidKeys = data;
      }
    } catch (err) {
      console.error("[WebPush] Failed to parse vapid.json, generating new keys:", err);
    }
  }

  if (!currentVapidKeys) {
    const generated = webpush.generateVAPIDKeys();
    currentVapidKeys = generated;
    try {
      fs.writeFileSync(VAPID_FILE, JSON.stringify(generated, null, 2), "utf-8");
      console.log("[WebPush] Generated and saved new VAPID keys to data/vapid.json");
    } catch (err) {
      console.error("[WebPush] Failed to save vapid.json:", err);
    }
  }

  if (!vapidInitialized && currentVapidKeys) {
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@swayog.com";
    webpush.setVapidDetails(subject, currentVapidKeys.publicKey, currentVapidKeys.privateKey);
    vapidInitialized = true;
    console.log("[WebPush] VAPID details configured successfully.");
  }

  return currentVapidKeys!;
}

export function getVapidPublicKey(): string {
  const keys = initVapidKeys();
  return keys.publicKey;
}

function loadSubscriptions(): StoredAdminPushSubscription[] {
  if (subscriptionsCache) return subscriptionsCache;
  ensureDataDir();
  if (!fs.existsSync(SUBS_FILE)) {
    subscriptionsCache = [];
    return subscriptionsCache;
  }
  try {
    const content = fs.readFileSync(SUBS_FILE, "utf-8");
    subscriptionsCache = JSON.parse(content) || [];
  } catch (err) {
    console.error("[WebPush] Failed to read push-subscriptions.json:", err);
    subscriptionsCache = [];
  }
  return subscriptionsCache!;
}

function persistSubscriptions(subs: StoredAdminPushSubscription[]) {
  subscriptionsCache = subs;
  ensureDataDir();
  try {
    fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), "utf-8");
  } catch (err) {
    console.error("[WebPush] Failed to write push-subscriptions.json:", err);
  }
}

export async function saveAdminPushSubscription(params: {
  userId: string;
  role: string;
  companyId?: string | null;
  subscription: PushSubscriptionData;
  userAgent?: string;
}): Promise<void> {
  initVapidKeys();
  const subs = loadSubscriptions();
  const now = new Date().toISOString();

  const existingIndex = subs.findIndex((s) => s.subscription.endpoint === params.subscription.endpoint);

  if (existingIndex >= 0) {
    subs[existingIndex] = {
      ...subs[existingIndex],
      userId: params.userId,
      role: params.role,
      companyId: params.companyId ?? subs[existingIndex].companyId,
      subscription: params.subscription,
      userAgent: params.userAgent || subs[existingIndex].userAgent,
      updatedAt: now,
    };
  } else {
    subs.push({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: params.userId,
      role: params.role,
      companyId: params.companyId ?? null,
      subscription: params.subscription,
      userAgent: params.userAgent,
      createdAt: now,
      updatedAt: now,
    });
  }

  persistSubscriptions(subs);
}

export async function removeAdminPushSubscription(endpoint: string): Promise<boolean> {
  const subs = loadSubscriptions();
  const beforeCount = subs.length;
  const filtered = subs.filter((s) => s.subscription.endpoint !== endpoint);
  if (filtered.length !== beforeCount) {
    persistSubscriptions(filtered);
    return true;
  }
  return false;
}

export async function removeAdminPushSubscriptionsByUserId(userId: string): Promise<number> {
  const subs = loadSubscriptions();
  const beforeCount = subs.length;
  const filtered = subs.filter((s) => s.userId !== userId);
  const removed = beforeCount - filtered.length;
  if (removed > 0) {
    persistSubscriptions(filtered);
  }
  return removed;
}

export async function getAdminSubscriptionStatus(userId: string): Promise<{ enabled: boolean; count: number }> {
  const subs = loadSubscriptions();
  const userSubs = subs.filter((s) => s.userId === userId);
  return {
    enabled: userSubs.length > 0,
    count: userSubs.length,
  };
}

export async function sendPushToAdmins(payload: {
  title: string;
  body: string;
  data?: any;
  icon?: string;
  badge?: string;
}): Promise<{ sent: number; failed: number }> {
  try {
    initVapidKeys();
  } catch (err) {
    console.error("[WebPush] Initialization error during sendPushToAdmins:", err);
    return { sent: 0, failed: 0 };
  }

  const subs = loadSubscriptions();
  if (subs.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const jsonPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/logo.png",
    badge: payload.badge || "/favicon.svg",
    data: payload.data || {},
    timestamp: Date.now(),
  });

  let sent = 0;
  let failed = 0;
  const endpointsToRemove: string[] = [];

  for (const item of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: item.subscription.endpoint,
          keys: {
            p256dh: item.subscription.keys.p256dh,
            auth: item.subscription.keys.auth,
          },
        },
        jsonPayload,
        {
          TTL: 86400, // 24 hours in seconds
        }
      );
      sent++;
    } catch (err: any) {
      failed++;
      const statusCode = err?.statusCode;
      // 404 Not Found or 410 Gone means the subscription is expired or cancelled by user
      if (statusCode === 404 || statusCode === 410) {
        console.warn(`[WebPush] Subscription expired or gone (${statusCode}). Queueing removal:`, item.subscription.endpoint);
        endpointsToRemove.push(item.subscription.endpoint);
      } else {
        console.error(`[WebPush] Error sending push to ${item.subscription.endpoint.slice(0, 30)}...:`, err?.message || err);
      }
    }
  }

  if (endpointsToRemove.length > 0) {
    const updated = subs.filter((s) => !endpointsToRemove.includes(s.subscription.endpoint));
    persistSubscriptions(updated);
  }

  return { sent, failed };
}
