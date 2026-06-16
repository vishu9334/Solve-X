import { Server } from "socket.io";
import { DoubtSession } from "../../models/doubtSession.model.js";

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
        socket.on("register_user", (userId) => {
            if (userId) {
                onlineUsers.set(userId.toString(), socket.id);
                console.log(`User ${userId} registered with socket ${socket.id}`);
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

// ─── Helper: Send notification to a single user ──────────────────────────────
export const sendNotificationToUser = (userId, eventName, payload) => {
    if (!io || !userId) return;
    const socketId = onlineUsers.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit(eventName, payload);
    }
};

// ─── Helper: Send notification to multiple users ─────────────────────────────
export const sendNotificationToMultipleUsers = (userIds, eventName, payload) => {
    if (!io || !userIds || !Array.isArray(userIds)) return;

    userIds.forEach((id) => {
        const socketId = onlineUsers.get(id.toString());
        if (socketId) {
            io.to(socketId).emit(eventName, payload);
        }
    });
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