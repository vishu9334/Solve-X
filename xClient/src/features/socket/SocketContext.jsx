/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import useAuthStore from "../auth/store/auth.store.js";
import { router } from "../../app/Router.jsx";
import useNotificationStore from "../notifications/store/notification.store.js";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    // Only connect if user and token are present
    if (!user || !accessToken) {
      if (socket) {
        socket.disconnect();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null);
      }
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.MODE === "production"
        ? window.location.origin
        : "http://localhost:8001");

    const newSocket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });

    setSocket(newSocket);

    const register = () => {
      const userId = user._id || user.id;
      if (userId) {
        newSocket.emit("register_user", userId);
        console.log("Socket client registered user:", userId);
      }
    };

    console.log("Attempting socket connection to:", socketUrl);

    if (newSocket.connected) {
      console.log("Socket already connected synchronously.");
      register();
    }

    newSocket.on("connect", () => {
      console.log("Socket connected successfully. ID:", newSocket.id);
      register();
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err.message, err);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected, reason:", reason);
    });

    // ─── Socket Event Listeners ─────────────────────────────────

    // For Mentor: Student asked a question matching their skill
    newSocket.on("student_asked_question", (data) => {
      const requestedTime = data.sessionType === "scheduled" && data.scheduledTime
        ? ` for ${new Date(data.scheduledTime).toLocaleString()}`
        : "";
      toast.info(`🔔 New Doubt posted${requestedTime} in ${data.specializationName}: "${data.question}"`, {
        toastId: `asked_${data.doubtSessionId}`,
      });
      useNotificationStore.getState().addNotification("student_asked_question", data, data?._offline);
      // Invalidate dashboard to update "Open Opportunities"
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] });
    });

    // For both: Session scheduled in future
    newSocket.on("meeting_scheduled", (data) => {
      toast.success(data.message || "Doubt session scheduled successfully!");
      useNotificationStore.getState().addNotification("meeting_scheduled", data, data?._offline);
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] });
    });

    // For Mentor: Accepted by student for a doubt
    newSocket.on("mentor_selected_for_doubt", (data) => {
      toast.success(`🎉 You have been selected for the doubt: "${data.question}"! Join chat.`, {
        autoClose: false,
      });
      useNotificationStore.getState().addNotification("mentor_selected_for_doubt", data, data?._offline);
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
    });

    // For Mentor: Offer not selected
    newSocket.on("mentor_not_selected", (data) => {
      toast.info(data.message || "Student selected another mentor.");
      useNotificationStore.getState().addNotification("mentor_not_selected", data, data?._offline);
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] });
    });

    // For Student: Mentor sent an offer/bid
    newSocket.on("mentor_offer_received", (data) => {
      toast.info(data.message || `💬 Mentor ${data.mentorName} sent a bid of $${data.price}. Accept the mentor offer to continue.`, {
        toastId: `offer_${data.mentorId}`,
      });
      useNotificationStore.getState().addNotification("mentor_offer_received", data, data?._offline);
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["doubtSessionOffers"] });
    });

    // For both: Join chat room redirect/update
    newSocket.on("join_chat_room", (data) => {
      useNotificationStore.getState().addNotification("join_chat_room", data, data?._offline);
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] });
      if (data?.chatRoomId) {
        router.navigate(`/chat/${data.chatRoomId}`);
      }
    });

    // For both: Session ended by student/system
    newSocket.on("session_ended", (data) => {
      toast.warn(data.message || "Doubt session has ended.");
      useNotificationStore.getState().addNotification("session_ended", data, data?._offline);
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] });
    });

    // For both: Session expired (timer over)
    newSocket.on("session_expired", (data) => {
      toast.error(data.message || "Session expired.");
      useNotificationStore.getState().addNotification("session_expired", data, data?._offline);
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] });
    });

    // For Student: Doubt expired (no bids accepted/submitted in time)
    newSocket.on("doubt_expired", (data) => {
      toast.error(data.message || "Doubt session expired.");
      useNotificationStore.getState().addNotification("doubt_expired", data, data?._offline);
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
    });

    // For Mentor: Ignore warning notification
    newSocket.on("mentor_warning", (data) => {
      toast.error(data.message || "Aapko ek warning mili hai.", {
        autoClose: false,
      });
      useNotificationStore.getState().addNotification("mentor_warning", data, data?._offline);
    });

    newSocket.on("disconnect", () => {
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, accessToken, queryClient]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
