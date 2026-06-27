import { CommonUser } from "../models/AbaseUser.model.js";
import emailQueue from "../queue/email.queue.js";
import { sendNotificationToUser } from "./socket/socket.helper.js";

/**
 * Returns the current month key in "YYYY-MM" format for Redis keys.
 */
const getCurrentMonthKey = () => new Date().toISOString().slice(0, 7);

/**
 * Returns a human-readable month string like "June 2026".
 */
const getHumanMonth = () =>
    new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

/**
 * Triggers a warning for a mentor who has ignored too many notifications.
 * - Sends an in-app socket notification (delivered instantly if online, or on next login if offline)
 * - Sends an immediate email via BullMQ queue (always, regardless of online/offline status)
 *
 * @param {string} mentorId  - MongoDB ObjectId of the mentor
 * @param {number} ignoreCount - Number of notifications ignored this month
 */
export async function triggerMentorIgnoreWarning(mentorId, ignoreCount) {
    try {
        const mentor = await CommonUser.findById(mentorId).lean();
        if (!mentor) {
            console.warn(`[MentorWarning] Mentor ${mentorId} not found, skipping warning.`);
            return;
        }

        const month = getHumanMonth();
        const warningMessage = `⚠️ You have ignored ${ignoreCount} student notifications in ${month}. Please stay active on the platform.`;

        // ── 1. In-app socket notification ────────────────────────────────────
        // sendNotificationToUser already handles offline → Redis pending delivery
        await sendNotificationToUser(mentorId.toString(), "mentor_warning", {
            message: warningMessage,
            ignoreCount,
            month,
            type: "warning"
        });

        // ── 2. Instant email via BullMQ (always fired, online or offline) ────
        const subject = `⚠️ Solve-X Warning — You have ignored ${ignoreCount} student queries`;
        const body = `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0c0b11;color:#fff;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.1)">
                <h2 style="color:#fbbf24;margin-top:0">⚠️ Mentor Activity Warning</h2>
                <p>Hello <strong>${mentor.name}</strong>,</p>
                <p>
                    We noticed that you ignored <strong>${ignoreCount} student doubt notifications</strong>
                    in <strong>${month}</strong> without providing any response.
                </p>
                <p>
                    Please stay active on your <strong>Solve-X Mentor Dashboard</strong> and
                    respond to incoming student doubts in a timely manner.
                </p>
                <p style="color:rgba(255,255,255,0.6);font-size:13px">
                    If this activity continues, your mentor status may be reviewed
                    and your platform access could be restricted.
                </p>
                <br/>
                <p>Best regards,<br/><strong>The Solve-X Team</strong></p>
            </div>
        `;

        await emailQueue.add("send-mentor-warning", {
            email: mentor.email,
            subject,
            body
        });

        console.log(`[MentorWarning] Warning sent to mentor ${mentor.email} (${ignoreCount} ignores in ${month})`);
    } catch (err) {
        console.error(`[MentorWarning] Failed to send warning to mentor ${mentorId}:`, err.message);
    }
}
