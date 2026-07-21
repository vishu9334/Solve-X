import IORedis from "ioredis";
import config from "./config.js";

const redisUrl = config.REDIS_URL;

// Render Redis uses rediss:// (TLS) — handle both
const bullmqRedisConnection = redisUrl
  ? new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...(redisUrl.startsWith("rediss://") && {
        tls: { rejectUnauthorized: false },
      }),
    })
  : null;

export default bullmqRedisConnection;