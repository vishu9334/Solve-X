import IORedis from "ioredis";
import config from "./config.js";

const bullmqRedisConnection = new IORedis(config.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

export default bullmqRedisConnection;