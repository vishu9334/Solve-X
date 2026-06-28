import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../socket/SocketContext.jsx";
import { useGetDoubtSessionDetails, useEndDoubtSession, useStartVideoCall } from "../../doubt/hooks/useDoubt.js";
import useAuthStore from "../../auth/store/auth.store.js";
import { toast } from "react-toastify";

const ChatRoomPage = () => {
  const { chatRoomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const currentUser = useAuthStore((state) => state.user);

  // Extract doubtSessionId from chatRoomId (format: doubt_doubtSessionId_timestamp)
  const doubtSessionId = chatRoomId?.split("_")?.[1];

  // Queries & Mutations
  const { data: session, isLoading, isError } = useGetDoubtSessionDetails(doubtSessionId);
  const { mutate: endSession, isPending: isEnding } = useEndDoubtSession();
  const { mutate: startVideoCall, isPending: isStartingVideo } = useStartVideoCall();

  // Local State
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);

  // Refs
  const chatEndRef = useRef(null);

  // Initialize messages and video room details from DB
  useEffect(() => {
    if (session?.chatMessages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(session.chatMessages);
    }
    if (session?.videoRoomUrl) {
      setVideoUrl(session.videoRoomUrl);
    }
  }, [session]);

  // Handle Socket events
  useEffect(() => {
    if (!socket || !chatRoomId || !currentUser) return;

    // Join room
    socket.emit("join_chat_room", { chatRoomId, userId: currentUser._id || currentUser.id });

    // Listen for incoming messages
    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("receive_chat_message", handleReceiveMessage);

    // Listen for session completion / end
    const handleSessionEnded = (data) => {
      toast.warn(data.message || "Doubt session ended.");
      navigate(currentUser.role === "mentor" ? "/dashboard/mentor" : "/dashboard/student");
    };

    socket.on("session_ended", handleSessionEnded);

    // Listen for session start / video link generated
    const handleSessionStarted = ({ videoRoomUrl }) => {
      setVideoUrl(videoRoomUrl);
      toast.info("Video call has been started!");
    };

    socket.on("session:started", handleSessionStarted);

    return () => {
      socket.off("receive_chat_message", handleReceiveMessage);
      socket.off("session_ended", handleSessionEnded);
      socket.off("session:started", handleSessionStarted);
      socket.emit("leave_chat_room", { chatRoomId, userId: currentUser._id || currentUser.id });
    };
  }, [socket, chatRoomId, currentUser, navigate]);

  // Session Duration Timer
  useEffect(() => {
    if (!session || session.status !== "in_session" || !session.sessionStartedAt) return;

    const durationSeconds = session.sessionDuration * 60;
    const startTime = new Date(session.sessionStartedAt).getTime();
    let timerInterval = null;

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsedSeconds);
      setTimeLeft(remaining);

      if (remaining <= 0 && timerInterval) {
        clearInterval(timerInterval);
      }
    };

    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [session]);

  // Autoscroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit("send_chat_message", {
      chatRoomId,
      senderId: currentUser._id || currentUser.id,
      message: inputText.trim(),
    });

    setInputText("");
  };

  const handleEndSession = () => {
    if (window.confirm("Are you sure you want to end this session early?")) {
      endSession(doubtSessionId, {
        onSuccess: () => {
          toast.success("Doubt session ended successfully.");
          navigate(currentUser.role === "mentor" ? "/dashboard/mentor" : "/dashboard/student");
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to end session.");
        }
      });
    }
  };

  const handleStartVideoCall = () => {
    startVideoCall(doubtSessionId, {
      onSuccess: (data) => {
        const url = data?.data?.videoRoomUrl || data?.videoRoomUrl;
        if (url) {
          setVideoUrl(url);
          toast.success("Video call room created successfully!");
        }
      },
      onError: (err) => {
        toast.error(err?.message || "Failed to start video call.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-white/50 font-mono">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
        <span className="animate-pulse text-xs tracking-wider uppercase">Entering Workspace...</span>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-red-400 font-mono">
        Failed to load active workspace session.
      </div>
    );
  }

  const otherUser = currentUser.role === "student" ? session.selectedMentorId : session.studentId;
  const sessionCompleted = session.status === "completed" || timeLeft <= 0;

  // Time format helper
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div
      className="mx-auto w-[94%] max-w-[1000px] py-4 sm:py-6 text-white font-mono flex-1 flex flex-col gap-4 min-h-0"
    >
      {/* Top Header Panel */}
      <header
        className="rounded-2xl border border-white/10 p-4 sm:p-5 flex flex-wrap justify-between items-center gap-4 shadow-lg shrink-0"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), transparent 40%), rgba(255,255,255,0.02)" }}
      >
        <div className="flex items-center gap-3">
          <img
            src={otherUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser?.name || "User"}`}
            alt={otherUser?.name || "User"}
            className="h-10 w-10 rounded-full border border-white/10 bg-white/5 object-cover"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold uppercase text-white tracking-wide">
                {otherUser?.name || "Connecting..."}
              </span>
              
              {!sessionCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Chat
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Chat Closed
                </span>
              )}
            </div>
            <span className="text-[9px] text-white/40 uppercase tracking-widest block mt-0.5">
              {!sessionCompleted ? "Active Workspace" : "Archived Session"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer Display */}
          {session.status === "in_session" && !sessionCompleted && (
            <div
              className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold shadow-md tabular-nums"
              style={{
                borderColor: timeLeft < 120 ? "rgba(251,113,133,0.5)" : "rgba(255,255,255,0.15)",
                color: timeLeft < 120 ? "#fb7185" : "#fff",
                background: timeLeft < 120 ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.03)",
              }}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {sessionCompleted && (
            <span className="text-[10px] font-bold tracking-wider uppercase text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
              Completed
            </span>
          )}

          {/* Join Video Call Button */}
          {videoUrl && !sessionCompleted && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all no-underline shadow-lg hover:scale-105"
            >
              🎥 Join Video Call
            </a>
          )}

          {/* Start Video Call Button (Mentor only, if not started yet) */}
          {currentUser.role === "mentor" && !videoUrl && !sessionCompleted && (
            <button
              onClick={handleStartVideoCall}
              disabled={isStartingVideo}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-lg hover:scale-105 disabled:opacity-50 border-none"
            >
              {isStartingVideo ? "Starting..." : "🎥 Start Video Call"}
            </button>
          )}

          {/* End Session Action Button */}
          {currentUser.role === "student" && !sessionCompleted && (
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isEnding ? "Ending..." : "End Session"}
            </button>
          )}
        </div>
      </header>

      {/* Problem Topic Statement */}
      <div className="rounded-xl border border-white/5 bg-black/25 p-3 text-xs leading-relaxed text-white/70 flex flex-col gap-1 shrink-0">
        <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Question Details</span>
        <p className="m-0 italic">"{session.question}"</p>
      </div>

      {/* Messages Chat Box Area */}
      <div
        className="flex-1 rounded-2xl border border-white/10 p-4 bg-black/35 flex flex-col gap-4 overflow-y-auto max-h-[450px] min-h-[300px] shadow-inner scrollbar-hide"
        data-lenis-prevent
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.01), transparent), rgba(0,0,0,0.3)"
        }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-white/30 text-xs italic gap-1">
            <span>👋 Connected to chat space.</span>
            <span>Type a message below to start resolving the doubt.</span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId?.toString() === (currentUser._id || currentUser.id)?.toString();
            return (
              <div
                key={index}
                className={`flex flex-col max-w-[75%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? "bg-amber-300 text-black font-semibold rounded-tr-none"
                      : "bg-white/10 text-white rounded-tl-none border border-white/5"
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[8px] text-white/35 mt-1">
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Text Chat Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={sessionCompleted ? "This session has been completed." : "Describe your fix, paste code links, or explain..."}
          disabled={sessionCompleted}
          className="flex-1 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white placeholder-white/20 transition-colors focus:border-amber-300/50 focus:outline-none font-mono disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={sessionCompleted || !inputText.trim()}
          className="px-6 bg-white hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatRoomPage;
