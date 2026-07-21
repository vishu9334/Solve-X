import { Redis } from "ioredis";
import config from "./config.js";

const redisUrl = config.REDIS_URL || "redis://127.0.0.1:6379";

// Render Redis uses rediss:// (TLS) — handle both
const redis = new Redis(redisUrl, {
  ...(redisUrl.startsWith("rediss://") && {
    tls: { rejectUnauthorized: false },
  }),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on("connect", () => console.log("Redis connected:", redisUrl.split("@").pop()));
redis.on("error", (err) => console.error("Redis error:", err.message));

export default redis;