import cron from "node-cron";
import studentRepository from "../repositorys/implimentations/mongo.student.repository.js";
import { createChatRoom, sendNotificationToUser } from "../helpers/socket/socket.helper.js";
import mailService from "../services/MailService.js";
import { logger } from "../utils/logger.js";
import redis from "../configs/redis.config.js";

export const checkScheduledSessions = async () => {
    logger.info("[ScheduledDoubtCron] Checking for due scheduled sessions...");
    try {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        // Find all sessions in scheduled status via repository
        const sessions = await studentRepository.findScheduledDoubtSessions();

        for (const session of sessions) {
            const scheduledTime = new Date(session.scheduledTime);

            if (!session.selectedMentorId) {
                if (scheduledTime <= now) {
                    logger.info(`[ScheduledDoubtCron] Expiring unmatched scheduled session: ${session._id}`);
                    session.status = "expired";
                    session.expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours TTL
                    await studentRepository.saveDoubtSession(session);

                    sendNotificationToUser(session.studentId, "doubt_expired", {
                        doubtSessionId: session._id,
                        message: "Your scheduled doubt session has expired because no mentor was selected in time."
                    });

                    const studentUser = await studentRepository.findStudentId(session.studentId);
                    if (studentUser) {
                        const subject = "Solve-X Scheduled Session Expired";
                        const htmlContent = `
                            <h2>Solve-X Scheduled Session Expired</h2>
                            <p>Your doubt session for the question: "<strong>${session.question}</strong>" has expired because no mentor was selected by the scheduled time.</p>
                        `;
                        await mailService.sendResultEmail(studentUser.email, subject, htmlContent).catch(console.error);
                    }
                }
                continue;
            }

            if (session.status !== "scheduled") {
                continue;
            }

            // Pre-meeting reminders
            const diffMs = scheduledTime - now;
            const diffMins = Math.round(diffMs / 60000);

            // 1-Hour Reminder (45 to 60 mins away)
            const hasSent1h = await redis?.get(`reminder:1h:${session._id}`);
            if (diffMins <= 60 && diffMins >= 45 && !hasSent1h) {
                logger.info(`[ScheduledDoubtCron] Sending 1-hour pre-meeting reminder for session: ${session._id}`);
                await redis?.set(`reminder:1h:${session._id}`, "true", "EX", 7200); // 2 hours TTL

                const payload = {
                    doubtSessionId: session._id,
                    message: "Reminder: Your scheduled doubt session starts in 1 hour."
                };
                sendNotificationToUser(session.studentId, "scheduled_meeting_reminder_1h", payload);
                sendNotificationToUser(session.selectedMentorId, "scheduled_meeting_reminder_1h", payload);

                const studentUser = await studentRepository.findStudentId(session.studentId);
                const mentorUser = await studentRepository.findStudentId(session.selectedMentorId);

                const subject = "Solve-X Scheduled Session Starts in 1 Hour";
                const htmlContent = `
                    <h2>Solve-X Scheduled Session Reminder</h2>
                    <p>This is a reminder that your scheduled doubt session for the question: "<strong>${session.question}</strong>" starts in 1 hour.</p>
                    <p>Please make sure you are online and ready to join.</p>
                `;
                if (studentUser) await mailService.sendResultEmail(studentUser.email, subject, htmlContent).catch(console.error);
                if (mentorUser) await mailService.sendResultEmail(mentorUser.email, subject, htmlContent).catch(console.error);
            }

            // 5-Minute Reminder (0 to 5 mins away)
            const hasSent5m = await redis?.get(`reminder:5m:${session._id}`);
            if (diffMins <= 5 && diffMins > 0 && !hasSent5m) {
                logger.info(`[ScheduledDoubtCron] Sending 5-minute pre-meeting reminder for session: ${session._id}`);
                await redis?.set(`reminder:5m:${session._id}`, "true", "EX", 3600); // 1 hour TTL

                const payload = {
                    doubtSessionId: session._id,
                    message: "Reminder: Your scheduled doubt session starts in 5 minutes! Get ready to join."
                };
                sendNotificationToUser(session.studentId, "scheduled_meeting_reminder_5m", payload);
                sendNotificationToUser(session.selectedMentorId, "scheduled_meeting_reminder_5m", payload);

                const studentUser = await studentRepository.findStudentId(session.studentId);
                const mentorUser = await studentRepository.findStudentId(session.selectedMentorId);

                const subject = "Solve-X Scheduled Session Starts in 5 Minutes!";
                const htmlContent = `
                    <h2>Solve-X Scheduled Session Final Reminder</h2>
                    <p>Get ready! Your scheduled doubt session for the question: "<strong>${session.question}</strong>" starts in 5 minutes.</p>
                    <p>Please log in to Solve-X now and be ready to join the chat room.</p>
                `;
                if (studentUser) await mailService.sendResultEmail(studentUser.email, subject, htmlContent).catch(console.error);
                if (mentorUser) await mailService.sendResultEmail(mentorUser.email, subject, htmlContent).catch(console.error);
            }

            if (scheduledTime <= now && scheduledTime > twoHoursAgo) {
                // Time to start the session!
                logger.info(`[ScheduledDoubtCron] Starting scheduled session: ${session._id}`);

                const chatRoomId = `doubt_${session._id}_${Date.now()}`;
                session.status = "in_session";
                session.sessionStartedAt = now;
                session.chatRoomId = chatRoomId;
                await studentRepository.saveDoubtSession(session);

                // Start the chat room (notifies users & sets duration timeout)
                createChatRoom(chatRoomId, session.studentId, session.selectedMentorId, session.sessionDuration);

                // Fetch emails via repository
                const studentUser = await studentRepository.findStudentId(session.studentId);
                const mentorUser = await studentRepository.findStudentId(session.selectedMentorId);

                if (studentUser && mentorUser) {
                    const subject = "Your Solve-X Doubt Session is Live!";
                    const htmlContent = `
                        <h2>Solve-X Scheduled Session Started</h2>
                        <p>The doubt session scheduled for the question: "<strong>${session.question}</strong>" is now live.</p>
                        <p>Please log in to the Solve-X platform and join the chat room immediately.</p>
                    `;
                    await mailService.sendResultEmail(studentUser.email, subject, htmlContent).catch(console.error);
                    await mailService.sendResultEmail(mentorUser.email, subject, htmlContent).catch(console.error);
                }

            } else if (scheduledTime <= twoHoursAgo) {
                // Session missed / expired
                logger.info(`[ScheduledDoubtCron] Expiring missed scheduled session: ${session._id}`);

                session.status = "expired";
                session.expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours TTL
                await studentRepository.saveDoubtSession(session);

                // Send platform notifications
                const payload = {
                    doubtSessionId: session._id,
                    message: "The scheduled doubt session has expired because it was not started within 2 hours of the scheduled time."
                };
                sendNotificationToUser(session.studentId, "doubt_expired", payload);
                sendNotificationToUser(session.selectedMentorId, "doubt_expired", payload);

                // Fetch emails via repository
                const studentUser = await studentRepository.findStudentId(session.studentId);
                const mentorUser = await studentRepository.findStudentId(session.selectedMentorId);

                if (studentUser && mentorUser) {
                    const subject = "Solve-X Scheduled Session Expired";
                    const htmlContent = `
                        <h2>Solve-X Scheduled Session Expired</h2>
                        <p>The doubt session scheduled for the question: "<strong>${session.question}</strong>" has expired because no activity occurred within 2 hours of the scheduled time.</p>
                    `;
                    await mailService.sendResultEmail(studentUser.email, subject, htmlContent).catch(console.error);
                    await mailService.sendResultEmail(mentorUser.email, subject, htmlContent).catch(console.error);
                }
            }
        }
    } catch (error) {
        logger.error(`[ScheduledDoubtCron] Error: ${error.message}`);
    }
};

export const initScheduledDoubtCron = () => {
    // Run every minute
    cron.schedule("* * * * *", async () => {
        await checkScheduledSessions();
    });
    logger.info("Scheduled doubt session cron job initialized successfully (runs every minute).");
};
