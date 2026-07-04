import { createClient, type RedisClientType } from "redis";

import { env } from "../config/env.js";

let client: RedisClientType | null = null;
let connectionAttempted = false;

function prefixed(key: string): string {
  return `${env.REDIS_KEY_PREFIX}:${key}`;
}

async function getRedisClient(): Promise<RedisClientType | null> {
  if (env.REDIS_ENABLED !== "true") {
    return null;
  }

  if (client?.isReady) {
    return client;
  }

  if (!connectionAttempted) {
    connectionAttempted = true;
    client = createClient({
      url: env.REDIS_URL,
      socket: {
        connectTimeout: 300,
      },
    });
    client.on("error", () => {
      // Intentionally no throw: auth routes must gracefully fall back to DB checks.
    });
  }

  if (!client) {
    return null;
  }

  try {
    if (!client.isReady) {
      await Promise.race([
        client.connect(),
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
    }
    if (!client.isReady) {
      if (client.isOpen) {
        await client.disconnect().catch(() => undefined);
      }
      return null;
    }

    return client;
  } catch {
    return null;
  }
}

export async function isRefreshTokenRevoked(tokenHash: string): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) {
    return false;
  }

  try {
    const value = await redis.get(prefixed(`refresh-revoked:${tokenHash}`));
    return value === "1";
  } catch {
    return false;
  }
}

export async function markRefreshTokenRevoked(tokenHash: string, expiresAt: Date): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) {
    return;
  }

  const ttlSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
  try {
    await redis.set(prefixed(`refresh-revoked:${tokenHash}`), "1", { EX: ttlSeconds });
  } catch {
    // Ignore cache failures; DB remains source of truth.
  }
}

export async function incrementRateLimitCounter(
  key: string,
  windowMs: number,
): Promise<{ count: number; ttlMs: number } | null> {
  const redis = await getRedisClient();
  if (!redis || !redis.isReady) {
    return null;
  }

  const redisKey = prefixed(`rate-limit:${key}`);

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pExpire(redisKey, windowMs);
    }

    const ttlMs = await redis.pTTL(redisKey);
    return {
      count,
      ttlMs: ttlMs > 0 ? ttlMs : windowMs,
    };
  } catch {
    return null;
  }
}

export async function clearManagedRedisCache(): Promise<{ redisEnabled: boolean; deletedKeys: number }> {
  const redis = await getRedisClient();
  if (!redis || !redis.isReady) {
    return { redisEnabled: false, deletedKeys: 0 };
  }

  const matchPattern = `${env.REDIS_KEY_PREFIX}:*`;
  const batch: string[] = [];
  let deletedKeys = 0;

  try {
    for await (const key of redis.scanIterator({ MATCH: matchPattern, COUNT: 100 })) {
      batch.push(String(key));
      if (batch.length >= 200) {
        deletedKeys += await redis.del(batch);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      deletedKeys += await redis.del(batch);
    }

    return { redisEnabled: true, deletedKeys };
  } catch {
    return { redisEnabled: true, deletedKeys: 0 };
  }
}
