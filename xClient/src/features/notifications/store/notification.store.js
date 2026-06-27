import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Map socket event names → human-readable notification config
const EVENT_MAP = {
    student_asked_question: {
        type: "new_doubt",
        icon: "RiMailUnreadLine",
        getMessage: (p) => `New doubt: "${p.question?.slice(0, 60)}..."`,
        route: null,
    },
    mentor_offer_received: {
        type: "offer",
        icon: "RiMailAiLine",
        getMessage: (p) => `Mentor ${p.mentorName} sent a bid of $${p.price}!`,
        route: (p) => `/student/doubt-sessions/${p.doubtSessionId}/offers`,
    },
    mentor_selected_for_doubt: {
        type: "selected",
        icon: "RiAwardLine",
        getMessage: () => "Student selected you! Join the chat room.",
        route: (p) => `/chat/${p.chatRoomId}`,
    },
    mentor_not_selected: {
        type: "rejected",
        icon: "RiMailCloseLine",
        getMessage: () => "Another mentor was selected for this doubt.",
        route: null,
    },
    join_chat_room: {
        type: "chat",
        icon: "RiMessage2Line",
        getMessage: () => "Chat room is ready! Join now.",
        route: (p) => `/chat/${p.chatRoomId}`,
    },
    session_ended: {
        type: "ended",
        icon: "RiCheckboxCircleLine",
        getMessage: () => "Session has ended.",
        route: null,
    },
    session_expired: {
        type: "expired",
        icon: "RiPassExpiredLine",
        getMessage: () => "Session duration has expired.",
        route: null,
    },
    doubt_expired: {
        type: "doubt_expired",
        icon: "RiPassExpiredLine",
        getMessage: () => "No mentor responded. The doubt has expired.",
        route: null,
    },
    mentor_warning: {
        type: "warning",
        icon: "RiErrorWarningLine",
        getMessage: (p) => p.message || "You received a warning notification.",
        route: null,
    },
};

const useNotificationStore = create(
    devtools(
        persist(
            (set, get) => ({
                // Array of notification objects
                notifications: [],
                // Count of unread notifications
                unreadCount: 0,

                /**
                 * Add a notification from a socket event.
                 */
                addNotification: (eventName, payload, isOffline = false) => {
                    const config = EVENT_MAP[eventName];
                    if (!config) return; // unknown event — skip

                    const newNotif = {
                        id: `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                        type: config.type,
                        icon: config.icon,
                        message: config.getMessage(payload),
                        route: config.route ? config.route(payload) : null,
                        payload,
                        isRead: false,
                        isOffline,
                        createdAt: payload.createdAt || new Date().toISOString(),
                    };

                    set(
                        (state) => ({
                            notifications: [newNotif, ...state.notifications].slice(0, 50),
                            unreadCount: state.unreadCount + 1,
                        }),
                        false,
                        "notification/add"
                    );
                },

                /**
                 * Mark all notifications as read and reset badge count.
                 */
                markAllRead: () =>
                    set(
                        (state) => ({
                            notifications: state.notifications.map((n) => ({
                                ...n,
                                isRead: true,
                            })),
                            unreadCount: 0,
                        }),
                        false,
                        "notification/markAllRead"
                    ),

                /**
                 * Mark a single notification as read by id.
                 */
                markOneRead: (id) =>
                    set(
                        (state) => {
                            const updated = state.notifications.map((n) =>
                                n.id === id ? { ...n, isRead: true } : n
                            );
                            const unreadCount = updated.filter((n) => !n.isRead).length;
                            return { notifications: updated, unreadCount };
                        },
                        false,
                        "notification/markOneRead"
                    ),

                /**
                 * Remove a notification by id.
                 */
                removeNotification: (id) =>
                    set(
                        (state) => {
                            const updated = state.notifications.filter((n) => n.id !== id);
                            const unreadCount = updated.filter((n) => !n.isRead).length;
                            return { notifications: updated, unreadCount };
                        },
                        false,
                        "notification/removeNotification"
                    ),

                /**
                 * Clear all notifications (called on logout).
                 */
                clearAll: () =>
                    set({ notifications: [], unreadCount: 0 }, false, "notification/clearAll"),
            }),
            {
                name: "solve-x-notifications", // LocalStorage Key
            }
        ),
        { name: "NotificationStore" }
    )
);

export default useNotificationStore;
