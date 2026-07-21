import IORedis from "ioredis";
import config from "./config.js";

const redisUrl = config.REDIS_URL || "redis://127.0.0.1:6379";

// Render Redis uses rediss:// (TLS) — handle both
const bullmqRedisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(redisUrl.startsWith("rediss://") && {
    tls: { rejectUnauthorized: false },
  }),
});

export default bullmqRedisConnection;