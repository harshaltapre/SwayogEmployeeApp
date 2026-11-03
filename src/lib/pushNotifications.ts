import { apiClient } from "./api-utils";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("[Push] Service Worker registration failed:", err);
    return null;
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<{
  success: boolean;
  permission: NotificationPermission;
  error?: string;
}> {
  if (!isPushSupported()) {
    return {
      success: false,
      permission: "denied",
      error: "Browser does not support Web Push notifications.",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        permission,
        error: "Notification permission was not granted by the browser.",
      };
    }

    // Register service worker if needed
    const registration = await registerServiceWorker();
    if (!registration) {
      return {
        success: false,
        permission,
        error: "Failed to initialize background Service Worker.",
      };
    }

    // Retrieve public VAPID key from backend
    const keyResponse = await apiClient.get("/attendance/admin/push/public-key");
    const publicKey = keyResponse.data.publicKey;
    if (!publicKey) {
      return {
        success: false,
        permission,
        error: "Server did not provide a VAPID public key.",
      };
    }

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Subscribe with push manager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // Send subscription payload to backend
    await apiClient.post("/attendance/admin/push/subscribe", {
      subscription: subscription.toJSON(),
    });

    return {
      success: true,
      permission: "granted",
    };
  } catch (err: any) {
    console.error("[Push] Subscription enrollment failed:", err);
    return {
      success: false,
      permission: getNotificationPermission(),
      error: err?.message || "Failed to complete push subscription.",
    };
  }
}

export async function unsubscribeFromPushNotifications(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isPushSupported()) return { success: true };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await apiClient
        .post("/attendance/admin/push/unsubscribe", {
          endpoint: subscription.endpoint,
        })
        .catch(() => {});
      await subscription.unsubscribe();
    }
    return { success: true };
  } catch (err: any) {
    console.error("[Push] Unsubscribe error:", err);
    return { success: false, error: err?.message || "Failed to unsubscribe" };
  }
}

export async function sendTestPushNotification(): Promise<{
  success: boolean;
  sent?: number;
  error?: string;
}> {
  try {
    const response = await apiClient.post("/attendance/admin/push/test");
    return { success: true, sent: response.data.sent };
  } catch (err: any) {
    return {
      success: false,
      error: err?.response?.data?.error || err?.message || "Failed to send test push",
    };
  }
}
