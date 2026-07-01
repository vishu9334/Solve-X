import { DoubtSession } from "../models/doubtSession.model.js";

/**
 * Atomic cleanup to mark any expired in-progress sessions as completed.
 * This fixes the issue where active sessions get stuck in the DB in "in_session" status
 * if the server restarts or crashes, which destroys the in-memory timers.
 */
export const cleanExpiredSessions = async () => {
    try {
        const now = new Date();
        const activeResult = await DoubtSession.updateMany(
            {
                status: "in_session",
                sessionStartedAt: { $ne: null },
                $expr: {
                    $lt: [
                        { $add: ["$sessionStartedAt", { $multiply: ["$sessionDuration", 60, 1000] }] },
                        now
                    ]
                }
            },
            {
                $set: {
                    status: "completed",
                    sessionEndedAt: now,
                    expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours TTL
                }
            }
        );

        if (activeResult.modifiedCount > 0) {
            console.log(`[SessionCleanup] Auto-completed ${activeResult.modifiedCount} stuck/expired doubt sessions.`);
        }

        const instantOpenResult = await DoubtSession.updateMany(
            {
                status: "open",
                sessionType: { $ne: "scheduled" },
                createdAt: { $lt: new Date(now.getTime() - 10 * 60 * 1000) }
            },
            {
                $set: {
                    status: "expired",
                    expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000)
                }
            }
        );

        if (instantOpenResult.modifiedCount > 0) {
            console.log(`[SessionCleanup] Auto-expired ${instantOpenResult.modifiedCount} stale open instant doubt sessions.`);
        }

        const scheduledOpenResult = await DoubtSession.updateMany(
            {
                status: "open",
                sessionType: "scheduled",
                selectedMentorId: null,
                scheduledTime: { $ne: null, $lt: now }
            },
            {
                $set: {
                    status: "expired",
                    expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000)
                }
            }
        );

        if (scheduledOpenResult.modifiedCount > 0) {
            console.log(`[SessionCleanup] Auto-expired ${scheduledOpenResult.modifiedCount} stale unaccepted scheduled doubt sessions.`);
        }
    } catch (err) {
        console.error("[SessionCleanup] Error during auto-cleanup:", err.message);
    }
};
