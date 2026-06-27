import { Worker } from "bullmq";
import bullmqRedisConnection from "../configs/bullmqRedis.config.js";
import mailService from "../services/MailService.js";

console.log("Email worker file loaded...");

const emailWorker = new Worker(
  "emailQueue",

  async (job) => {
    console.log("Email job received:", job.name, job.data);

    if (job.name === "send-otp") {
      const { email, otp } = job.data;

      await mailService.sendOtpEmail(email, otp);

      return {
        success: true,
        email,
      };
    }

    if (job.name === "send-result-email") {
      const { email, subject, body } = job.data;

      await mailService.sendResultEmail(email, subject, body);

      return {
        success: true,
        email,
      };
    }

    if (job.name === "send-mentor-warning") {
      const { email, subject, body } = job.data;

      await mailService.sendResultEmail(email, subject, body);

      return {
        success: true,
        email,
      };
    }

    throw new Error(`Unknown email job: ${job.name}`);
  },

  {
    connection: bullmqRedisConnection,
    concurrency: 5,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job completed: ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
  console.log(`Email job failed: ${job?.id}`);
  console.log(error.message);

});
emailWorker.on("error", (error) => {
    console.log("Email worker error:", error.message);
  });

export default emailWorker;