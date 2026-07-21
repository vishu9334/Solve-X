import { Queue } from "bullmq";
import bullmqRedisConnection from "../configs/bullmqRedis.config.js";

// If Redis is not configured, skip queue initialization gracefully
const emailQueue = bullmqRedisConnection
  ? new Queue("emailQueue", {
      connection: bullmqRedisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    })
  : null;

export default emailQueue;