import { Queue } from "bullmq";
import bullmqRedisConnection from "../configs/bullmqRedis.config.js";

const emailQueue = new Queue("emailQueue", {
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
});

export default emailQueue;