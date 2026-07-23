import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../../socket/SocketContext.jsx";
import { useGetDoubtSessionDetails, useEndDoubtSession } from "../../doubt/hooks/useDoubt.js";
import useAuthStore from "../../auth/store/auth.store.js";
import { toast } from "react-toastify";
import { useLocalMedia } from "../hooks/useLocalMedia.js";
import { useWebRTCWorkspace } from "../hooks/useWebRTCWorkspace.js";
import {
  RiMicFill,
  RiMicOffFill,
  RiCamera3Fill,
  RiCameraOffFill,
  RiCastFill,
  RiChat1Fill,
  RiFullscreenLine,
  RiFullscreenExitLine,
  RiSendPlaneFill,
  RiAttachment2,
  RiLayoutColumnFill,
  RiPhoneFill,
  RiDownload2Fill,
  RiLayoutGridFill,
  RiAspectRatioFill
} from "react-icons/ri";


/* ── VideoPlayer ─────────────────────────────────────── */
const getFigmaAvatarColor = (name) => {
  if (!name) return "#7E8CE0";
  const firstLetter = name.trim().split(" ")[0].charAt(0).toUpperCase();
  const charCode = firstLetter.charCodeAt(0) || 65;
  const colors = ["#7E8CE0", "#D982B5", "#89ACD9", "#E5734A", "#9D82D9", "#82D9B7"];
  const index = (charCode - 65) % colors.length;
  const safeIndex = index >= 0 && index < colors.length ? index : 0;
  return colors[safeIndex];
};

const VideoPlayer = ({ stream, isMuted = false, label, role, videoOff = false, className = "" }) => {
  const videoRef = useRef(null);
  const [isTrackEnabled, setIsTrackEnabled] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream && !videoOff && isTrackEnabled) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream, videoOff, isTrackEnabled]);

  useEffect(() => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTrackEnabled(false);
      return;
    }

    const checkTrack = () => {
      const enabled = videoTrack.enabled && !videoTrack.muted && videoTrack.readyState === "live";
      setIsTrackEnabled((prev) => (prev !== enabled ? enabled : prev));
    };

    checkTrack();

    videoTrack.addEventListener("mute", checkTrack);
    videoTrack.addEventListener("unmute", checkTrack);
    videoTrack.addEventListener("ended", checkTrack);

    const interval = setInterval(checkTrack, 500);

    return () => {
      videoTrack.removeEventListener("mute", checkTrack);
      videoTrack.removeEventListener("unmute", checkTrack);
      videoTrack.removeEventListener("ended", checkTrack);
      clearInterval(interval);
    };
  }, [stream]);

  const showVideo = stream && !videoOff && isTrackEnabled;
  const firstLetter = label ? label.trim().split(" ")[0].charAt(0).toUpperCase() : "?";
  const avatarBg = getFigmaAvatarColor(label);

  const cleanedLabel = label || "?";
  let displayLabel = cleanedLabel;
  if (!cleanedLabel.toLowerCase().includes("mentor") && !cleanedLabel.toLowerCase().includes("student")) {
    displayLabel = role === "mentor" ? `Mentor: ${cleanedLabel}` : `Student: ${cleanedLabel}`;
  }

  return (
    <div className={`overflow-hidden bg-[#0a0a0f] flex items-center justify-center group ${className} border border-white/10 rounded-xl relative`}>
      {showVideo ? (
        <video ref={videoRef} autoPlay playsInline muted={isMuted} className="w-full h-full object-cover rounded-xl" />
      ) : stream ? (
        <div className="flex items-center justify-center w-full h-full bg-[#0c0c12] relative animate-fade-in">
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold select-none shadow-lg font-['Quicksand'] border border-white/20"
            style={{ backgroundColor: avatarBg }}
          >
            {firstLetter}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-indigo-400">
          <div className="h-6 w-6 rounded-full border-2 border-dashed animate-spin border-indigo-400" />
          <span className="text-[9px] tracking-widest uppercase">Loading…</span>
        </div>
      )}

      {/* Permanently Visible Name Overlay Tag (Role: Name) */}
      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5 shadow-lg text-white border border-white/10 select-none">
        <span className={`h-1.5 w-1.5 rounded-full ${role === "mentor" ? "bg-amber-400" : "bg-blue-400"}`} />
        {displayLabel}
      </div>

      {/* Opposite Corner: Live/Connected Indicator Badge in a Circle Box */}
      {stream && (
        <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full bg-emerald-500/10 backdrop-blur-md text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-emerald-400 border border-emerald-500/20 shadow-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>Live</span>
        </div>
      )}
    </div>
  );
};

/* ── Remix Icons ────────────────────────────────────── */
const IconMic = ({ off, color = "rgba(255,255,255,1)" }) => off ? (
  <RiMicOffFill color={color} size={20} />
) : (
  <RiMicFill color={color} size={20} />
);

const IconCam = ({ off, color = "rgba(255,255,255,1)" }) => off ? (
  <RiCameraOffFill color={color} size={20} />
) : (
  <RiCamera3Fill color={color} size={20} />
);

const IconScreen = ({ color = "rgba(255,255,255,1)" }) => (
  <RiCastFill color={color} size={20} />
);

const IconChat = ({ color = "rgba(255,255,255,1)" }) => (
  <RiChat1Fill color={color} size={20} />
);

const IconPhone = ({ color = "rgba(255,255,255,1)" }) => (
  <RiPhoneFill color={color} size={20} style={{ transform: "rotate(135deg)" }} />
);

const IconMaximize = ({ color = "rgba(255,255,255,1)" }) => (
  <RiFullscreenLine color={color} size={18} />
);

const IconMinimize = ({ color = "rgba(255,255,255,1)" }) => (
  <RiFullscreenExitLine color={color} size={18} />
);

const IconSend = ({ color = "rgba(255,255,255,1)" }) => (
  <RiSendPlaneFill color={color} size={16} />
);

// Split View Layout Icon
const IconLayoutColumn = ({ color = "rgba(255,255,255,1)" }) => (
  <RiLayoutColumnFill color={color} size={16} />
);

// Attachment Icon
const IconAttach = ({ color = "rgba(255,255,255,1)" }) => (
  <RiAttachment2 color={color} size={20} />
);

/* EMOJI LIST moved to module scope to avoid creating components during render */
const EMOJI_LIST = ["😀","😂","🥰","😎","🤩","🎉","🔥","❤️","👍","🌟","💯","🤔","😮","🥳","✨","💪","🙌","😅","🤗","😊"];

/* eslint-disable react-hooks/purity */
const EmojiCanvasPanel = ({ onEmojiSend }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  const spawnEmoji = (emoji, x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const count = 7 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        emoji, x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: -(4 + Math.random() * 5),
        life: 1,
        scale: 0.9 + Math.random() * 0.8,
        rotation: (Math.random() - 0.5) * 0.4,
        rotSpeed: (Math.random() - 0.5) * 0.06,
        decay: 0.013 + Math.random() * 0.008,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${Math.round(p.scale * 26)}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.vy += 0.13;
        p.rotation += p.rotSpeed; p.life -= p.decay;
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.01)", borderRadius: "inherit" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "6px", padding: "14px", alignContent: "flex-start", zIndex: 2, position: "relative" }}>
        {EMOJI_LIST.map((em, idx) => (
          <button key={idx}
            onClick={(e) => {
              const rect = canvasRef.current?.getBoundingClientRect();
              spawnEmoji(em, e.clientX - (rect?.left || 0), e.clientY - (rect?.top || 0));
              onEmojiSend(em);
            }}
            style={{ fontSize: "22px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.12s, background 0.12s", backdropFilter: "blur(6px)", color: "#ffffff" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >{em}</button>
        ))}
      </div>
      <div style={{ padding: "0 16px 14px", display: "flex", justifyContent: "flex-end", zIndex: 2, position: "relative" }}>
        <span style={{ fontSize: "32px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>🙂</span>
      </div>
    </div>
  );
};




/* ── Chat Panel ─────────────────────────────────────── */
const ChatPanel = ({ session, messages, inputText, setInputText, handleSendMessage, sessionCompleted, chatEndRef, inVideoCall }) => (
  <>
    <div className="flex items-center px-4 py-3 shrink-0 border-b border-white/10 bg-[#0a0a14]">
      <span className="text-[10px] font-bold uppercase tracking-widest font-['Quicksand'] text-amber-400">
        {inVideoCall ? "In-Call Chat" : "Session Chat"}
      </span>
    </div>
    <div className="px-4 py-3 shrink-0 border-b border-white/10 bg-white/[0.03]">
      <p className="text-[9px] font-bold uppercase tracking-widest mb-1 text-amber-400">Question</p>
      <p className="text-xs leading-relaxed italic m-0 line-clamp-4 text-white/80">"{session.question}"</p>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0 [scrollbar-width:none] bg-[#060612]" data-lenis-prevent>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-xs gap-1 text-center text-white/40">
          <span>👋 Connected to workspace.</span>
          <span>Type a message below.</span>
        </div>
      ) : (
        messages.map((msg, i) => {
          const isMe = msg.senderId?.toString() === msg._selfId;
          return (
            <div key={`s-${i}`} className={`flex flex-col max-w-[82%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
              <div className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                isMe
                  ? "rounded-tr-none font-semibold text-white bg-blue-600 shadow-md"
                  : "rounded-tl-none bg-white/10 text-white border border-white/10 shadow-sm"
              }`}>{msg.message}</div>
              <span className="text-[8px] mt-0.5 text-white/40">{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          );
        })
      )}
      <div ref={chatEndRef} />
    </div>
    <form onSubmit={handleSendMessage} className="flex gap-2 px-4 py-3 shrink-0 border-t border-white/10 bg-[#0a0a14]">
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={sessionCompleted ? "Session closed." : "Write a message…"}
        disabled={sessionCompleted}
        className="flex-1 rounded-full px-4 py-2.5 text-xs transition-colors focus:outline-none disabled:opacity-40 font-['Quicksand'] border border-white/15 bg-white/5 text-white placeholder-white/40 focus:border-blue-500"
      />
      <button type="submit" disabled={sessionCompleted || !inputText.trim()} className="px-4 rounded-full font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border-none flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 shadow-md">
        <IconSend />
      </button>
    </form>
  </>
);

/* ── Main Component ─────────────────────────────────── */
const ChatRoomPage = () => {
  const { chatRoomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const currentUser = useAuthStore((state) => state.user);
  const doubtSessionId = chatRoomId?.split("_")?.[1];

  const { data: session, isLoading, isError } = useGetDoubtSessionDetails(doubtSessionId);
  const { mutate: endSession, isPending: isEnding } = useEndDoubtSession();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [inVideoCall, setInVideoCall] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [screenMaximized, setScreenMaximized] = useState(false);
  const [videoLayout, setVideoLayout] = useState("pip"); // "grid" | "pip"
  const [pipSize, setPipSize] = useState("medium"); // "small" | "medium" | "large"
  const [focusedStream, setFocusedStream] = useState("peer"); // "peer" | "local"
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { localStream, isMuted, isVideoOff, isScreenSharing, startCamera, startScreenShare, stopScreenShare, toggleMute, toggleVideo, stopMedia } = useLocalMedia();
  const { peers, chatMessages: p2pMessages, fileProgress, incomingFile, sendP2PFile, leaveCall, setIncomingFile } = useWebRTCWorkspace(socket, chatRoomId, currentUser, localStream, isVideoOff);

  useEffect(() => {
    if (inVideoCall) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#0A0A0B";
      document.body.setAttribute("data-in-call", "true");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#ffffff";
      document.body.removeAttribute("data-in-call");
    }
    return () => {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "";
      document.body.removeAttribute("data-in-call");
    };
  }, [inVideoCall]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (session?.chatMessages) setMessages(session.chatMessages); }, [session]);

  const [showEndRequestModal, setShowEndRequestModal] = useState(false);
  const [requestingMentorName, setRequestingMentorName] = useState("");
  const hasHandledEndRef = useRef(false);

  const handleLeaveCall = useCallback(() => {
    stopMedia();
    leaveCall();
    setInVideoCall(false);
    setScreenMaximized(false);
    toast.info("Left video session.");
  }, [stopMedia, leaveCall]);

  const finishSessionEnd = useCallback((msgText) => {
    if (hasHandledEndRef.current) return;
    hasHandledEndRef.current = true;

    if (msgText) toast.info(msgText);
    handleLeaveCall();
    navigate(currentUser.role === "mentor" ? "/dashboard/mentor" : "/dashboard/student");
  }, [currentUser, handleLeaveCall, navigate]);

  useEffect(() => {
    if (!socket || !chatRoomId || !currentUser) return;
    socket.emit("join_chat_room", { chatRoomId, userId: currentUser._id || currentUser.id });
    const handleMsg = (m) => setMessages((prev) => [...prev, m]);
    const handleEnd = (d) => {
      finishSessionEnd(d.message || "Doubt session ended.");
    };

    const handleMentorEndReq = (payload) => {
      if (currentUser.role === "student") {
        setRequestingMentorName(payload.mentorName || "Mentor");
        setShowEndRequestModal(true);
      }
    };

    const handleEndRes = (payload) => {
      if (currentUser.role === "mentor") {
        if (!payload.approved) {
          toast.warn("Student declined session end request.");
        }
      }
    };

    socket.on("receive_chat_message", handleMsg);
    socket.on("session_ended", handleEnd);
    socket.on("mentor_request_end_session", handleMentorEndReq);
    socket.on("end_session_response", handleEndRes);

    return () => {
      socket.off("receive_chat_message", handleMsg);
      socket.off("session_ended", handleEnd);
      socket.off("mentor_request_end_session", handleMentorEndReq);
      socket.off("end_session_response", handleEndRes);
      socket.emit("leave_chat_room", { chatRoomId, userId: currentUser._id || currentUser.id });
    };
  }, [socket, chatRoomId, currentUser, finishSessionEnd]);

  useEffect(() => {
    if (!session || session.status !== "in_session" || !session.sessionStartedAt) return;
    const dur = session.sessionDuration * 60;
    const start = new Date(session.sessionStartedAt).getTime();
    const tick = () => setTimeLeft(Math.max(0, dur - Math.floor((Date.now() - start) / 1000)));
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, p2pMessages]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (isScreenSharing) setScreenMaximized(true); }, [isScreenSharing]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (socket) socket.emit("send_chat_message", { chatRoomId, senderId: currentUser._id || currentUser.id, message: inputText.trim() });
    setInputText("");
  };

  const triggerDirectEndSession = () => {
    endSession(doubtSessionId, {
      onSuccess: () => {
        finishSessionEnd("Session ended.");
      },
      onError: (err) => toast.error(err?.message || "Failed to end session."),
    });
  };

  const handleEndSession = () => {
    if (currentUser.role === "mentor") {
      const targetStudentId = session?.studentId?._id || session?.studentId;
      if (socket) {
        socket.emit("request_end_session", {
          chatRoomId,
          mentorName: currentUser.name,
          studentId: targetStudentId
        });
        toast.info("Sent session end request to student. Waiting for approval...");
      }
    } else {
      if (!window.confirm("Are you sure you want to end this session?")) return;
      triggerDirectEndSession();
    }
  };

  const handleApproveEndRequest = () => {
    setShowEndRequestModal(false);
    if (socket) socket.emit("end_session_response", { chatRoomId, approved: true });
    triggerDirectEndSession();
  };

  const handleDeclineEndRequest = () => {
    setShowEndRequestModal(false);
    if (socket) socket.emit("end_session_response", { chatRoomId, approved: false });
  };

  const handleJoinCall = async () => {
    try { await startCamera("720p"); setInVideoCall(true); toast.success("Joined video session!"); }
    catch { toast.error("Failed to access camera/microphone."); }
  };

  
  const handleFileChange = (e) => { const f = e.target.files[0]; if (f) sendP2PFile(f); };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  /* Enrich messages with self-id for ChatPanel to compare */
  const selfId = currentUser?._id || currentUser?.id;
  const enriched = messages.map((m) => ({ ...m, _selfId: selfId?.toString() }));

  if (isLoading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#050509] font-['Quicksand']">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent border-indigo-500" />
      <span className="text-xs tracking-wider uppercase animate-pulse text-indigo-400">Entering Workspace…</span>
    </div>
  );

  if (isError || !session) return (
    <div className="flex min-h-screen items-center justify-center text-sm bg-[#050509] text-rose-500">Failed to load session.</div>
  );

  const otherUser = currentUser.role === "student" ? session.selectedMentorId : session.studentId;
  const sessionCompleted = session.status === "completed" || timeLeft <= 0;

  /* ────────────────────────────────────────
     MAXIMIZED / FULLSCREEN VIEW
  ──────────────────────────────────────── */
  if (inVideoCall && screenMaximized) {
    const bigStream = localStream;
    const pipStream = peers[0]?.stream ?? null;
    const pipLabel  = peers[0]?.userName ?? (currentUser.role === "student" ? "Mentor" : "Student");
    const pipRole   = peers[0]?.role ?? (currentUser.role === "student" ? "mentor" : "student");

    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden font-['Quicksand'] bg-[#060612] bg-[radial-gradient(circle_at_82%_6%,rgba(255,217,110,0.06),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(62,62,244,0.12),transparent_34%),radial-gradient(circle_at_28%_99%,rgba(9,12,179,0.18),transparent_48%)]">

        {/* Top bar – dark glass header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 bg-[#0a0a14]/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
          <div className="flex items-center gap-2.5">
            <img src={otherUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser?.name || "User"}`} alt="" className="h-8 w-8 rounded-full border object-cover border-white/20" />
            <span className="text-sm font-semibold text-white">{otherUser?.name || "Connecting…"}</span>
            {isScreenSharing && (
              <button
                onClick={stopScreenShare}
                title="Stop Screen Sharing"
                className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/30 cursor-pointer hover:bg-red-500/40 transition-colors"
              >
                <RiCastFill size={12} color="#fca5a5" />
                <span>Stop Sharing</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {session.status === "in_session" && !sessionCompleted && (
              <div className={`flex items-center gap-1.5 text-xs font-bold tabular-nums px-3 py-1 rounded-full border ${timeLeft < 120 ? "bg-red-500/10 text-red-300 border-red-500/30" : "bg-white/10 text-white/90 border-white/15"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />{formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={() => setScreenMaximized(false)}
              title="Minimize Screen / Normal View"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all border-none cursor-pointer text-white hover:bg-blue-500 bg-blue-600 shadow-lg"
            >
              <IconMinimize color="white" />
              <span>Minimize Screen</span>
            </button>
            <button onClick={() => setChatOpen((v) => !v)} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all border-none cursor-pointer hover:opacity-90 text-white ${chatOpen ? "bg-blue-600" : "bg-white/10 border border-white/15"}`}>
              <IconChat /><span>{chatOpen ? "Close Chat" : "Chat"}</span>
            </button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Big stream – dark glass container */}
          <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden p-4">
            {peers.length === 0 ? (
              <div className="w-full max-w-2xl flex flex-col gap-4">
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 w-full bg-black/40">
                  {bigStream ? (
                    isVideoOff ? (
                      <div className="flex items-center justify-center w-full h-full animate-fade-in" style={{ backgroundColor: getFigmaAvatarColor(currentUser.name) }}>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/30 flex items-center justify-center text-white text-5xl sm:text-6xl font-bold select-none shadow font-['Quicksand']">
                          {currentUser.name ? currentUser.name.trim().split(" ")[0].charAt(0).toUpperCase() : "?"}
                        </div>
                      </div>
                    ) : (
                      <video
                        ref={(el) => {
                          if (el && bigStream && el.srcObject !== bigStream) {
                            el.srcObject = bigStream;
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-400 bg-black/40">
                      <div className="h-10 w-10 rounded-full border-2 border-dashed animate-spin border-blue-400" />
                      <span className="text-xs uppercase tracking-widest">Loading stream…</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 text-xs font-semibold px-3 py-1 rounded-md text-white bg-black/70 border border-white/10 shadow-sm">{currentUser.name} (You)</div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-bold px-4 py-2 rounded-full border border-dashed border-white/20 bg-white/5 text-blue-400 max-w-xs mx-auto shadow-sm">
                  <div className="h-4 w-4 rounded-full border border-dashed animate-spin border-blue-400" />
                  <span>Waiting for {currentUser.role === "student" ? "Mentor" : "Student"} to join…</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                {bigStream ? (
                  isVideoOff ? (
                    <div className="flex items-center justify-center w-full h-full animate-fade-in" style={{ backgroundColor: getFigmaAvatarColor(currentUser.name) }}>
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/30 flex items-center justify-center text-white text-5xl sm:text-6xl font-bold select-none shadow font-['Quicksand']">
                        {currentUser.name ? currentUser.name.trim().split(" ")[0].charAt(0).toUpperCase() : "?"}
                      </div>
                    </div>
                  ) : (
                    <video
                      ref={(el) => {
                        if (el && bigStream && el.srcObject !== bigStream) {
                          el.srcObject = bigStream;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-400">
                    <div className="h-10 w-10 rounded-full border-2 border-dashed animate-spin border-blue-400" />
                    <span className="text-xs uppercase tracking-widest">Loading stream…</span>
                  </div>
                )}
                {/* PiP */}
                {pipStream && (
                  <div className="absolute bottom-6 right-6 w-52 aspect-video rounded-2xl overflow-hidden shadow-2xl hover:scale-105 transition-transform cursor-pointer border-2 border-white/20">
                    <VideoPlayer stream={pipStream} isMuted={false} label={pipLabel} role={pipRole} videoOff={peers[0]?.videoOff} className="w-full h-full" />
                  </div>
                )}
                <div className="absolute bottom-6 left-5 text-xs font-semibold px-2.5 py-1 rounded-md text-white bg-black/70 border border-white/10 backdrop-blur-md">{currentUser.name} (You)</div>
              </div>
            )}
          </div>

          {/* Sliding chat panel */}
          <div className={`overflow-hidden transition-[width,min-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-[#0a0a14]/95 border-l border-white/10 flex flex-col ${chatOpen ? "w-[340px] min-w-[340px]" : "w-0 min-w-0"}`}>
            {chatOpen && (
                <ChatPanel
                  session={session} messages={enriched}
                  inputText={inputText} setInputText={setInputText}
                  handleSendMessage={handleSendMessage} sessionCompleted={sessionCompleted}
                  chatEndRef={chatEndRef} inVideoCall={inVideoCall}
                />
            )}
          </div>
        </div>

        {/* Bottom controls – dark glass style */}
        <div className="shrink-0 flex items-center justify-center gap-3 py-3.5 bg-[#0a0a14]/90 backdrop-blur-xl border-t border-white/10 shadow-2xl">
          <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"} className={`p-3 rounded-full transition-all border cursor-pointer flex items-center justify-center w-11 h-11 hover:scale-105 shadow-sm ${isMuted ? "bg-red-600 border-red-500 text-white" : "bg-white/10 border-white/15 hover:bg-white/20 text-white"}`}><IconMic off={isMuted} /></button>
          <button onClick={toggleVideo} title={isVideoOff ? "Cam On" : "Cam Off"} className={`p-3 rounded-full transition-all border cursor-pointer flex items-center justify-center w-11 h-11 hover:scale-105 shadow-sm ${isVideoOff ? "bg-red-600 border-red-500 text-white" : "bg-white/10 border-white/15 hover:bg-white/20 text-white"}`}><IconCam off={isVideoOff} /></button>
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
            className={`p-3 rounded-full transition-all border cursor-pointer flex items-center justify-center w-11 h-11 hover:scale-105 shadow-sm ${isScreenSharing ? "bg-red-600 border-red-500 text-white" : "bg-white/10 border-white/15 hover:bg-white/20 text-white"}`}
          >
            <IconScreen color="white" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="Send File" className="p-3 rounded-full transition-all border border-white/15 cursor-pointer flex items-center justify-center w-11 h-11 hover:bg-white/20 bg-white/10 text-white shadow-sm"><IconAttach /></button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => setScreenMaximized(false)}
            title="Minimize Screen"
            className="p-3 rounded-full transition-all border border-white/15 cursor-pointer flex items-center justify-center w-11 h-11 hover:bg-white/20 bg-white/10 text-white shadow-sm"
          >
            <IconMinimize color="white" />
          </button>
          <button onClick={handleLeaveCall} title="End Call" className="p-3 rounded-full transition-all border-none cursor-pointer flex items-center justify-center w-11 h-11 hover:scale-105 shadow-lg mx-2 bg-red-600 hover:bg-red-700 text-white"><IconPhone /></button>
          {currentUser.role === "student" && !sessionCompleted && (
            <button onClick={handleEndSession} disabled={isEnding} className="text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-full transition-all border cursor-pointer disabled:opacity-50 text-red-300 bg-red-500/20 border-red-500/30 hover:bg-red-500/30">
              {isEnding ? "Ending…" : "End Session"}
            </button>
          )}
        </div>

        {fileProgress && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 rounded-xl p-3 text-xs shadow-2xl z-10 bg-[#0f0f1d] border border-white/15 text-white backdrop-blur-xl">
            <div className="flex justify-between mb-1.5">
              <span className="truncate max-w-[70%] text-white/70">{fileProgress.isSending ? "Uploading" : "Downloading"}: {fileProgress.fileName}</span>
              <span className="font-bold text-blue-400">{fileProgress.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-white/10"><div className="h-full transition-all bg-blue-500" style={{ width: `${fileProgress.progress}%` }} /></div>
          </div>
        )}

        {incomingFile && (
          <div className="absolute inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/70">
            <div className="rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl mx-4 bg-[#12121e] border border-white/15 text-white">
              <RiDownload2Fill size={36} color="#60a5fa" className="mx-auto mb-3" />
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-blue-400">File Received</h3>
              <p className="text-xs break-all text-white/80 font-mono">{incomingFile.fileName}</p>
              <div className="mt-5 flex justify-center gap-3">
                <a href={incomingFile.downloadUrl} download={incomingFile.fileName} onClick={() => setIncomingFile(null)} className="px-4 py-2 font-bold text-xs uppercase rounded-full no-underline bg-blue-600 hover:bg-blue-500 text-white shadow-md">Download</a>
                <button onClick={() => setIncomingFile(null)} className="px-4 py-2 font-bold text-xs uppercase rounded-full border-none cursor-pointer bg-white/10 hover:bg-white/20 text-white">Dismiss</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* EMOJI panel was moved to module scope above to avoid creating component during render */

  const handleEmojiSend = (emoji) => {
    if (socket) socket.emit("send_chat_message", { chatRoomId, senderId: currentUser._id || currentUser.id, message: emoji });
  };

  const handleThumbnailClick = () => {
    setFocusedStream((prev) => (prev === "peer" ? "local" : "peer"));
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "radial-gradient(circle at 82% 6%, rgba(255, 217, 110, 0.08), transparent 28%), radial-gradient(circle at 76% 18%, rgba(62, 62, 244, 0.15), transparent 34%), radial-gradient(circle at 28% 99%, rgba(9, 12, 179, 0.20), transparent 48%), linear-gradient(180deg, #050509 0%, #060612 58%, #15131a 100%)",
      fontFamily: "'Quicksand', sans-serif",
      padding: isMobile ? "12px" : "24px", boxSizing: "border-box", overflow: "hidden",
      position: "relative", color: "#ffffff"
    }}>
      {/* ── TOP HEADER ── */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        marginBottom: isMobile ? "12px" : "16px", 
        flexShrink: 0, 
        gap: "12px", 
        flexWrap: isMobile ? "wrap" : "nowrap" 
      }}>

        {/* Left: Connected User info (Mentor on student view / Student on mentor view) */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px" }}>
          <div style={{ width: isMobile ? "36px" : "48px", height: isMobile ? "36px" : "48px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255, 255, 255, 0.1)", border: "1.5px solid rgba(255, 255, 255, 0.2)" }}>
            <img
              src={otherUser?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${otherUser?.name || "User"}`}
              alt={otherUser?.name || "User"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: currentUser.role === "student" ? "#FF9800" : "#60a5fa", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {currentUser.role === "student" ? "Mentor" : "Student"}
              </span>
              {!sessionCompleted && (
                <span style={{ fontSize: "8px", fontWeight: "800", color: "#34d399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "4px", padding: "1px 5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Live</span>
              )}
            </div>
            <span style={{ fontSize: isMobile ? "14px" : "18px", fontWeight: "700", color: "#ffffff", whiteSpace: "nowrap" }}>
              {otherUser?.name || "Connecting…"}
            </span>
          </div>
        </div>

        {/* Right: controls and status */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "12px", marginLeft: isMobile ? "auto" : "0" }}>
          {session.status === "in_session" && !sessionCompleted && (
            <div style={{ padding: isMobile ? "6px 12px" : "8px 20px", borderRadius: "999px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", fontSize: isMobile ? "12px" : "14px", fontWeight: "700", color: "#ffffff", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
              {formatTime(timeLeft)}
            </div>
          )}
          {sessionCompleted && (
            <div style={{ padding: isMobile ? "6px 12px" : "8px 20px", borderRadius: "999px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", fontSize: isMobile ? "12px" : "14px", fontWeight: "700", color: "#f87171" }}>Completed</div>
          )}
          {!sessionCompleted && !inVideoCall && (
            <button onClick={handleJoinCall} style={{ display: "flex", alignItems: "center", gap: "6px", padding: isMobile ? "6px 12px" : "9px 22px", borderRadius: "8px", fontWeight: "700", fontSize: isMobile ? "11px" : "13px", border: "2px solid #FF9800", color: "#FF9800", background: "transparent", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 152, 0, 0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <RiCamera3Fill size={14} color="#FF9800" />
              <span>Join</span>
            </button>
          )}
          {inVideoCall && (
            <button onClick={handleLeaveCall} style={{ display: "flex", alignItems: "center", gap: "6px", padding: isMobile ? "6px 12px" : "9px 22px", borderRadius: "8px", fontWeight: "700", fontSize: isMobile ? "11px" : "13px", border: "none", color: "#fff", background: "#FF9800", cursor: "pointer", fontFamily: "inherit" }}>
              <RiCamera3Fill size={14} color="white" />
              <span>Call</span>
            </button>
          )}
          {!sessionCompleted && (
            <button onClick={handleEndSession} disabled={isEnding} style={{ padding: isMobile ? "6px 12px" : "9px 22px", borderRadius: "8px", fontWeight: "700", fontSize: isMobile ? "11px" : "13px", border: "none", color: "#fff", background: "#E53935", cursor: "pointer", fontFamily: "inherit", opacity: isEnding ? 0.6 : 1 }}>
              {isEnding ? "..." : "End"}
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column-reverse" : "row",
        flex: 1,
        gap: isMobile ? "10px" : "16px",
        minHeight: 0,
        overflow: "hidden",
        transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)"
      }}>

        {/* LEFT: Chat window */}
        <div style={{
          display: "flex", flexDirection: "column",
          flex: inVideoCall ? (isMobile ? "1" : "0 0 380px") : 1,
          height: isMobile ? (inVideoCall ? "50%" : "calc(100% - 200px)") : "auto",
          borderRadius: "16px", overflow: "hidden",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          minHeight: 0, transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
          backdropFilter: "blur(20px)"
        }}>

          {/* macOS title bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "rgba(255, 255, 255, 0.02)", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#FF5F57", display: "inline-block" }}></span>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#FFBD2E", display: "inline-block" }}></span>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28CA41", display: "inline-block" }}></span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#FF9800", textTransform: "uppercase", letterSpacing: "0.15em" }}>Session chat</span>
            <div style={{ width: "44px" }}></div>
          </div>

          {/* Question strip */}
          <div style={{ padding: "10px 18px", background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
              <span style={{ fontWeight: "700", color: "rgba(255,255,255,0.9)" }}>Question : </span>
              {session.question}
            </span>
          </div>

          {/* Messages */}
          <div className="[scrollbar-width:none]" data-lenis-prevent style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px", minHeight: 0 }}>
            {enriched.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "6px", textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                <span>👋 Connected to workspace.</span>
                <span>Type a message below.</span>
              </div>
            ) : (
              enriched.map((msg, i) => {
                const isMe = msg.senderId?.toString() === msg._selfId;
                const senderName = isMe ? currentUser.name : (otherUser?.name || "Other");
                return (
                  <div key={`s-${i}`} style={{ display: "flex", flexDirection: "column", maxWidth: "75%", gap: "4px", alignSelf: isMe ? "flex-start" : "flex-end", alignItems: isMe ? "flex-start" : "flex-end" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: isMe ? "#60a5fa" : "#c084fc", paddingLeft: isMe ? "2px" : 0, paddingRight: isMe ? 0 : "2px" }}>{senderName}</span>
                    <div style={{ padding: "9px 14px", borderRadius: isMe ? "4px 16px 16px 16px" : "16px 4px 16px 16px", fontSize: "13px", lineHeight: 1.5, background: isMe ? "#2563eb" : "rgba(255, 255, 255, 0.08)", color: "#ffffff", border: isMe ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* RIGHT: Emoji panel or Video */}
        <div style={{
          flex: inVideoCall ? 1 : (isMobile ? "0 0 160px" : "0 0 300px"),
          height: isMobile ? (inVideoCall ? "50%" : "200px") : "auto",
          minWidth: isMobile ? "100%" : (inVideoCall ? "300px" : "300px"),
          borderRadius: "16px", overflow: "hidden",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex", flexDirection: "column", position: "relative",
          transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
          backdropFilter: "blur(20px)"
        }}>
          {inVideoCall ? (
            <>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", padding: "16px", overflow: "hidden" }}>
                {peers.length === 0 ? (
                  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <VideoPlayer stream={localStream} isMuted label={currentUser.name} role={currentUser.role} videoOff={isVideoOff} className="flex-1 rounded-2xl" />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.4)", padding: "4px", flexShrink: 0 }}>
                      <div className="h-4 w-4 rounded-full border border-dashed animate-spin border-white/40" />
                      <span>Waiting for other user to join…</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
                    {videoLayout === "grid" ? (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: isMobile ? "6px" : "12px",
                        width: "100%",
                        height: "100%"
                      }}>
                        <VideoPlayer stream={localStream} isMuted label={currentUser.name} role={currentUser.role} videoOff={isVideoOff} className="w-full h-full rounded-2xl" />
                        {peers.map((peer) => (
                          <VideoPlayer key={peer.socketId} stream={peer.stream} isMuted={false} label={peer.userName} role={peer.role} videoOff={peer.videoOff} className="w-full h-full rounded-2xl" />
                        ))}
                      </div>
                    ) : (
                      <div style={{ width: "100%", height: "100%", position: "relative" }}>
                        {focusedStream === "peer" ? (
                          <>
                            {/* Peer Stream (Full Screen) */}
                            <VideoPlayer
                              stream={peers[0].stream}
                              isMuted={false}
                              label={peers[0].userName}
                              role={peers[0].role || "mentor"}
                              videoOff={peers[0].videoOff}
                              className="w-full h-full rounded-2xl"
                            />

                            {/* Local Stream (Floating Corner Card - Click to swap) */}
                            <div 
                              onClick={handleThumbnailClick}
                              title="Click to focus your camera"
                              style={{
                                position: "absolute",
                                bottom: isMobile ? "8px" : "16px",
                                right: isMobile ? "8px" : "16px",
                                width: isMobile
                                  ? (pipSize === "small" ? "75px" : pipSize === "large" ? "140px" : "105px")
                                  : (pipSize === "small" ? "120px" : pipSize === "large" ? "240px" : "180px"),
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                zIndex: 10,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                                border: "2px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: "12px",
                                overflow: "hidden",
                                aspectRatio: "4/3",
                                cursor: "pointer"
                              }}
                            >
                              <VideoPlayer
                                stream={localStream}
                                isMuted
                                label={`${currentUser.name} (You)`}
                                role={currentUser.role}
                                videoOff={isVideoOff}
                                className="w-full h-full"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Local Stream (Full Screen) */}
                            <VideoPlayer
                              stream={localStream}
                              isMuted
                              label={`${currentUser.name} (You)`}
                              role={currentUser.role}
                              videoOff={isVideoOff}
                              className="w-full h-full rounded-2xl"
                            />

                            {/* Peer Stream (Floating Corner Card - Click to swap) */}
                            <div 
                              onClick={handleThumbnailClick}
                              title={`Click to focus ${peers[0].userName}`}
                              style={{
                                position: "absolute",
                                bottom: isMobile ? "8px" : "16px",
                                right: isMobile ? "8px" : "16px",
                                width: isMobile
                                  ? (pipSize === "small" ? "75px" : pipSize === "large" ? "140px" : "105px")
                                  : (pipSize === "small" ? "120px" : pipSize === "large" ? "240px" : "180px"),
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                zIndex: 10,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                                border: "2px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: "12px",
                                overflow: "hidden",
                                aspectRatio: "4/3",
                                cursor: "pointer"
                              }}
                            >
                              <VideoPlayer
                                stream={peers[0].stream}
                                isMuted={false}
                                label={peers[0].userName}
                                role={peers[0].role || "mentor"}
                                videoOff={peers[0].videoOff}
                                className="w-full h-full"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Video controls */}
              <div style={{ padding: isMobile ? "0 8px 8px" : "0 12px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: isMobile ? "6px" : "8px", flexShrink: 0 }}>
                <button onClick={toggleMute} style={{ width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", background: isMuted ? "#d93025" : "rgba(255,255,255,0.08)", transition: "all 0.15s" }}><IconMic off={isMuted} color="white" /></button>
                <button onClick={toggleVideo} style={{ width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", background: isVideoOff ? "#d93025" : "rgba(255,255,255,0.08)", transition: "all 0.15s" }}><IconCam off={isVideoOff} color="white" /></button>
                <button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
                  style={{ width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", background: isScreenSharing ? "#d93025" : "rgba(255,255,255,0.08)", transition: "all 0.15s" }}
                >
                  <IconScreen color="white" />
                </button>
                <button onClick={handleLeaveCall} style={{ width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", background: "#d93025" }}><IconPhone color="white" /></button>
                <button onClick={() => setScreenMaximized(true)} style={{ width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.08)" }}><IconMaximize color="white" /></button>
                <button onClick={() => fileInputRef.current?.click()} style={{ width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.08)" }}><IconAttach color="white" /></button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                {/* Resizing & layout controls */}
                {peers.length > 0 && (
                  <>
                    <span style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.15)", margin: "0 4px" }} />
                    <button
                      onClick={() => setVideoLayout(prev => prev === "grid" ? "pip" : "grid")}
                      title={videoLayout === "grid" ? "Switch to Picture-in-Picture" : "Switch to Grid Layout"}
                      style={{
                        padding: isMobile ? "4px 8px" : "6px 12px",
                        height: isMobile ? "32px" : "36px",
                        fontSize: isMobile ? "10px" : "11px",
                        fontWeight: "600",
                        color: "#ffffff",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? "4px" : "6px",
                        transition: "all 0.15s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                    >
                      <RiLayoutGridFill size={isMobile ? 12 : 14} />
                      <span>{videoLayout === "grid" ? "PIP" : "Grid"}</span>
                    </button>

                    {videoLayout === "pip" && (
                      <button
                        onClick={() => setPipSize(prev => prev === "small" ? "medium" : prev === "medium" ? "large" : "small")}
                        title="Change picture-in-picture size"
                        style={{
                          padding: isMobile ? "4px 8px" : "6px 12px",
                          height: isMobile ? "32px" : "36px",
                          fontSize: isMobile ? "10px" : "11px",
                          fontWeight: "600",
                          color: "#ffffff",
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: isMobile ? "4px" : "6px",
                          transition: "all 0.15s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
                      >
                        <RiAspectRatioFill size={isMobile ? 12 : 14} />
                        <span style={{ textTransform: "capitalize" }}>{pipSize}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
              {fileProgress && (
                <div style={{ padding: "0 12px 12px", flexShrink: 0 }}>
                  <div style={{ borderRadius: "8px", padding: "8px 10px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px", color: "#aaa" }}>
                      <span style={{ maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileProgress.isSending ? "Uploading" : "Downloading"}: {fileProgress.fileName}</span>
                      <span style={{ fontWeight: "700", color: "#4fc3f7" }}>{fileProgress.progress}%</span>
                    </div>
                    <div style={{ height: "3px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}><div style={{ height: "100%", background: "#2563eb", transition: "width 0.3s", width: `${fileProgress.progress}%` }} /></div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmojiCanvasPanel onEmojiSend={handleEmojiSend} />
          )}
        </div>
      </div>

      {/* ── BOTTOM INPUT BAR ── */}
      <form onSubmit={handleSendMessage} style={{ display: "flex", flexShrink: 0, marginTop: isMobile ? "8px" : "14px", borderRadius: "12px", overflow: "hidden", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(10px)" }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={sessionCompleted ? "Session closed." : "Write your message here..."}
          disabled={sessionCompleted}
          style={{ flex: 1, padding: isMobile ? "12px 16px" : "16px 22px", fontSize: "14px", background: "transparent", color: "#ffffff", border: "none", borderRight: "1px solid rgba(255, 255, 255, 0.08)", outline: "none", fontFamily: "inherit", opacity: sessionCompleted ? 0.4 : 1 }}
        />
        <button
          type="submit"
          disabled={sessionCompleted || !inputText.trim()}
          style={{ padding: isMobile ? "12px 20px" : "16px 32px", fontWeight: "700", fontSize: "14px", background: "rgba(255, 255, 255, 0.06)", color: "#ffffff", border: "none", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em", opacity: (sessionCompleted || !inputText.trim()) ? 0.4 : 1, transition: "background 0.15s" }}
          onMouseEnter={e => { if (!sessionCompleted && inputText.trim()) e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)" }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)" }}
        >
          Send
        </button>
      </form>

      {/* End Session Permission Request Modal for Student */}
      {showEndRequestModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "420px", background: "#12121a", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "20px", padding: "24px", color: "#ffffff", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", fontFamily: "'Quicksand', sans-serif", textAlign: "center" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(255, 152, 0, 0.15)", border: "1px solid rgba(255, 152, 0, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <span style={{ fontSize: "24px" }}>🔔</span>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "700", color: "#ffffff" }}>End session by mentor</h3>
            <p style={{ margin: "0 0 24px", fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.5 }}>
              Mentor <strong style={{ color: "#FF9800" }}>{requestingMentorName || "Mentor"}</strong> has requested to end the doubt session. Do you allow?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleDeclineEndRequest}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#ffffff", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}
              >
                Decline
              </button>
              <button
                onClick={handleApproveEndRequest}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#FF9800", color: "#ffffff", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming file modal */}
      {incomingFile && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 50, backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.6)" }}>
          <div style={{ borderRadius: "16px", padding: "24px", maxWidth: "360px", width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", background: "#18181b", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RiDownload2Fill size={36} color="#60a5fa" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", color: "#60a5fa" }}>File Received</h3>
            <p style={{ fontSize: "11px", wordBreak: "break-all", color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{incomingFile.fileName}</p>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "12px" }}>
              <a href={incomingFile.downloadUrl} download={incomingFile.fileName} onClick={() => setIncomingFile(null)} style={{ padding: "8px 18px", fontWeight: "700", fontSize: "11px", textTransform: "uppercase", borderRadius: "999px", textDecoration: "none", color: "#fff", background: "#2563eb" }}>Download</a>
              <button onClick={() => setIncomingFile(null)} style={{ padding: "8px 18px", fontWeight: "700", fontSize: "11px", textTransform: "uppercase", borderRadius: "999px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.08)", color: "#ffffff" }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoomPage;

