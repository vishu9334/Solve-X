import cron from "node-cron";
import { MentorProfile } from "../models/AmentorProfile.model.js";
import { CommonUser } from "../models/AbaseUser.model.js";
import { Attempt } from "../models/assessmentAttempt.model.js";
import { Answer } from "../models/Answer.model.js";
import { AssessmentActivitySession } from "../models/assessmentActivityDataStore.model.js";
import { logger } from "../utils/logger.js";

/**
 * Executes the cleanup of unverified mentors who registered more than 2 days ago.
 */
export const runMentorCleanup = async () => {
    logger.info("Starting unverified mentor cleanup task...");
    try {
        // Find mentor profiles created > 2 days ago that are not verified
        const cutoffDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const unverifiedProfiles = await MentorProfile.find({
            isVerifiedMentor: false,
            createdAt: { $lt: cutoffDate }
        });

        if (unverifiedProfiles.length === 0) {
            logger.info("No unverified mentors found for cleanup.");
            return;
        }

        logger.info(`Found ${unverifiedProfiles.length} unverified mentor(s) to cleanup.`);

        for (const profile of unverifiedProfiles) {
            const userId = profile.userId;

            // Delete associated attempts, answers, activity sessions, base user, and the profile
            const attemptDeleteResult = await Attempt.deleteMany({ userId });
            const answerDeleteResult = await Answer.deleteMany({ userId });
            const activitySessionDeleteResult = await AssessmentActivitySession.deleteMany({ userId });
            const userDeleteResult = await CommonUser.findByIdAndDelete(userId);
            const profileDeleteResult = await MentorProfile.findByIdAndDelete(profile._id);

            logger.info(`Cleaned up mentor userId ${userId}:
              - Deleted CommonUser: ${!!userDeleteResult}
              - Deleted MentorProfile: ${!!profileDeleteResult}
              - Deleted Attempts: ${attemptDeleteResult.deletedCount}
              - Deleted Answers: ${answerDeleteResult.deletedCount}
              - Deleted Activity Sessions: ${activitySessionDeleteResult.deletedCount}
            `);
        }

        logger.info("Unverified mentor cleanup task completed successfully.");
    } catch (error) {
        logger.error(`Error during unverified mentor cleanup: ${error.message} - Stack: ${error.stack}`);
    }
};

/**
 * Initializes the daily cron job at midnight to cleanup unverified mentors.
 */
export const initMentorCleanupCron = () => {
    // Run daily at midnight
    cron.schedule("0 0 * * *", async () => {
        await runMentorCleanup();
    });
    logger.info("Unverified mentor cleanup cron job scheduled successfully (daily at midnight).");
};
