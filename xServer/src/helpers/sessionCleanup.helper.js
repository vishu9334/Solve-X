import { DoubtSession } from "../models/doubtSession.model.js";

/**
 * Atomic cleanup to mark any expired in-progress sessions as completed.
 * This fixes the issue where active sessions get stuck in the DB in "in_session" status
 * if the server restarts or crashes, which destroys the in-memory timers.
 */
export const cleanExpiredSessions = async () => {
    try {
        const now = new Date();
        const result = await DoubtSession.updateMany(
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

        if (result.modifiedCount > 0) {
            console.log(`[SessionCleanup] Auto-completed ${result.modifiedCount} stuck/expired doubt sessions.`);
        }
    } catch (err) {
        console.error("[SessionCleanup] Error during auto-cleanup:", err.message);
    }
};
