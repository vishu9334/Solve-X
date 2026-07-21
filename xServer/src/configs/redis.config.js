import { Redis } from "ioredis";
import config from "./config.js";

const redisUrl = config.REDIS_URL;

if (!redisUrl) {
  console.warn("⚠️  WARNING: REDIS_URL is not set. Redis features (email queue, caching) will be disabled.");
}

// Render Redis uses rediss:// (TLS) — handle both
const redis = redisUrl
  ? new Redis(redisUrl, {
      ...(redisUrl.startsWith("rediss://") && {
        tls: { rejectUnauthorized: false },
      }),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    })
  : null;

if (redis) {
  redis.on("connect", () =>
    console.log("✅ Redis connected:", redisUrl.split("@").pop())
  );
  redis.on("error", (err) =>
    console.error("❌ Redis error:", err.message)
  );
}

export default redis;