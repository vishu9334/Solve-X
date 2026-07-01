import { Server } from "socket.io";
import { DoubtSession } from "../../models/doubtSession.model.js";
import redis from "../../configs/redis.config.js";

let io = null;
const onlineUsers = new Map();       // Key: userId, Value: socketId
const activeChatTimers = new Map();  // Key: chatRoomId, Value: setTimeout ref

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        // ─── Register user (Student or Mentor) ───────────────────
        socket.on("register_user", async (userId) => {
            if (!userId) return;
            onlineUsers.set(userId.toString(), socket.id);
            console.log(`User ${userId} registered with socket ${socket.id}`);

            // ── Deliver any pending (offline) notifications ───────
            try {
                const pendingKey = `notif:pending:${userId}`;
                const pendingRaw = await redis.lrange(pendingKey, 0, -1);
                if (pendingRaw.length > 0) {
                    for (const raw of [...pendingRaw].reverse()) {
                        try {
                            const notif = JSON.parse(raw);

                            // Check if student_asked_question has already expired
                            if (notif.eventName === "student_asked_question") {
                                const session = await DoubtSession.findById(notif.payload.doubtSessionId);
                                if (!session || ["expired", "completed", "in_session"].includes(session.status)) {
                                    socket.emit("doubt_expired", {
                                        doubtSessionId: notif.payload.doubtSessionId,
                                        message: `A student's doubt request for "${notif.payload.question?.slice(0, 40)}..." arrived while you were offline, but has already expired.`
                                    });
                                    continue;
                                }
                            }

                            socket.emit(notif.eventName, { ...notif.payload, _offline: true });
                        } catch (_) { /* skip malformed */ }
                    }
                    await redis.del(pendingKey);
                    console.log(`Delivered ${pendingRaw.length} pending notification(s) to user ${userId}`);
                }
            } catch (err) {
                console.error("Failed to deliver pending notifications:", err.message);
            }
        });

        // ─── Join a chat room ────────────────────────────────────
        socket.on("join_chat_room", ({ chatRoomId, userId }) => {
            if (!chatRoomId || !userId) return;
            socket.join(chatRoomId);
            console.log(`User ${userId} joined chat room: ${chatRoomId}`);

            // Notify the room that this user joined
            socket.to(chatRoomId).emit("user_joined_room", {
                userId,
                message: "User joined the chat room."
            });
        });

        // ─── Send chat message in room ───────────────────────────
        socket.on("send_chat_message", async ({ chatRoomId, senderId, message }) => {
            if (!chatRoomId || !senderId || !message) return;

            const chatMessage = {
                senderId,
                message,
                sentAt: new Date()
            };

            // Save message to DB
            try {
                await DoubtSession.findOneAndUpdate(
                    { chatRoomId },
                    { $push: { chatMessages: chatMessage } }
                );
            } catch (err) {
                console.error("Failed to save chat message:", err.message);
            }

            // Broadcast message to everyone in the room (including sender)
            io.in(chatRoomId).emit("receive_chat_message", chatMessage);
        });

        // ─── Leave chat room ─────────────────────────────────────
        socket.on("leave_chat_room", ({ chatRoomId, userId }) => {
            if (!chatRoomId) return;
            socket.leave(chatRoomId);
            console.log(`User ${userId} left chat room: ${chatRoomId}`);
        });

        // ─── Disconnect ──────────────────────────────────────────
        socket.on("disconnect", () => {
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });
    });

    return io;
};

// ─── Helper: Get all currently online user IDs ───────────────────────────────
export const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};

// ─── Helper: Send notification to a single user ──────────────────────────────
// If online → direct socket.emit
// If offline → push to Redis pending list (delivered on next login)
export const sendNotificationToUser = async (userId, eventName, payload) => {
    if (!io || !userId) return;
    const socketId = onlineUsers.get(userId.toString());

    if (socketId) {
        // User is online — deliver directly
        io.to(socketId).emit(eventName, payload);
    } else {
        // User is offline — store in Redis for delivery on next login
        try {
            const pendingKey = `notif:pending:${userId}`;
            const notif = { eventName, payload, createdAt: new Date().toISOString() };
            await redis.lpush(pendingKey, JSON.stringify(notif));
            await redis.ltrim(pendingKey, 0, 49);        // max 50 pending per user
            await redis.expire(pendingKey, 7 * 24 * 60 * 60); // 7 days TTL
            console.log(`Notification stored for offline user ${userId}: ${eventName}`);
        } catch (err) {
            console.error("Failed to store offline notification:", err.message);
        }
    }
};

// ─── Helper: Send notification to multiple users ─────────────────────────────
export const sendNotificationToMultipleUsers = async (userIds, eventName, payload) => {
    if (!io || !userIds || !Array.isArray(userIds)) return;
    for (const id of userIds) {
        await sendNotificationToUser(id, eventName, payload);
    }
};

// ─── Helper: Create a chat room with auto-expire timer ───────────────────────
export const createChatRoom = (chatRoomId, studentId, mentorId, sessionDurationMinutes) => {
    if (!io) return;

    // Update session status to in_session
    DoubtSession.findOneAndUpdate(
        { chatRoomId },
        {
            status: "in_session",
            sessionStartedAt: new Date()
        }
    ).catch(err => console.error("Failed to update session status:", err.message));

    // Notify both users to join the chat room
    sendNotificationToUser(studentId, "join_chat_room", { chatRoomId });
    sendNotificationToUser(mentorId, "join_chat_room", { chatRoomId });

    // Set auto-expire timer for session duration
    const timer = setTimeout(async () => {
        try {
            // Update DB — mark as completed + set TTL (4 hours)
            const session = await DoubtSession.findOneAndUpdate(
                { chatRoomId, status: "in_session" },
                {
                    status: "completed",
                    sessionEndedAt: new Date(),
                    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours TTL
                },
                { new: true }
            );

            if (session) {
                // Notify both users in the room
                io.in(chatRoomId).emit("session_expired", {
                    doubtSessionId: session._id,
                    message: "Session time is over. Chat room will be closed."
                });

                // Disconnect all sockets from the room
                const sockets = await io.in(chatRoomId).fetchSockets();
                sockets.forEach(s => s.leave(chatRoomId));

                console.log(`Chat room ${chatRoomId} expired and destroyed.`);
            }
        } catch (err) {
            console.error("Failed to expire chat room:", err.message);
        }

        activeChatTimers.delete(chatRoomId);
    }, sessionDurationMinutes * 60 * 1000);

    activeChatTimers.set(chatRoomId, timer);
};

// ─── Helper: Manually destroy a chat room ────────────────────────────────────
export const destroyChatRoom = async (chatRoomId) => {
    if (!io) return;

    // Clear the auto-expire timer if it exists
    const timer = activeChatTimers.get(chatRoomId);
    if (timer) {
        clearTimeout(timer);
        activeChatTimers.delete(chatRoomId);
    }

    // Notify and disconnect all users in the room
    io.in(chatRoomId).emit("session_ended", {
        message: "Session has been ended."
    });

    const sockets = await io.in(chatRoomId).fetchSockets();
    sockets.forEach(s => s.leave(chatRoomId));

    console.log(`Chat room ${chatRoomId} manually destroyed.`);
};

