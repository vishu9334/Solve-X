import { Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCurrentUser } from "../../../auth/hooks/useCurrentUser.js";
import { useGetMentorDashboard } from "../hook/mentorDashboard.hook.js";
import { toast } from "react-toastify";
import api from "../../../../lib/axios.js";
import { useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

/* ── helpers ──────────────────────────────────────────────────────── */
const fmt = (date) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "—";

const getDateInputValue = (dateValue) => {
  const d = new Date(dateValue);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getTimeInputValue = (dateValue) => {
  const d = new Date(dateValue);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
};

const CountdownTimer = ({ scheduledTime }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(scheduledTime) - new Date();
      if (difference <= 0) {
        setTimeLeft("Starting soon...");
        return;
      }

      const hrs = Math.floor(difference / (1000 * 60 * 60));
      const mins = Math.floor((difference / 1000 / 60) % 60);
      const secs = Math.floor((difference / 1000) % 60);

      let formatted = "";
      if (hrs > 0) formatted += `${hrs}h `;
      if (mins > 0 || hrs > 0) formatted += `${mins}m `;
      formatted += `${secs}s`;

      setTimeLeft(`Starts in: ${formatted}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [scheduledTime]);

  return (
    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300 font-mono">
      ⏳ {timeLeft}
    </span>
  );
};

const BarTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0d0d14] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-white/50 mb-0.5">{d.label}</p>
      <p className="text-white font-semibold">{d.display}</p>
    </div>
  );
};

/* ── sub-components ───────────────────────────────────────────────── */

/** Verification status banner */
const VerifyBanner = ({ profile }) => {
  const s = profile.verificationStatus;

  if (profile.isVerifiedMentor) return null;

  if (s === "rejected") {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-1">
            Permanently Rejected
          </p>
          <p className="text-white/70 text-sm">
            {profile.rejectionReason || "All 3 attempts used. Contact support for assistance."}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg px-3 py-1.5 shrink-0">
          No attempts remaining
        </span>
      </div>
    );
  }

  if (s === "in_progress") {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1">
            Assessment Failed — Retry Available
          </p>
          <p className="text-white/70 text-sm">
            Dobara assessment de sakte hain. Wohi specialization select karo.
          </p>
        </div>
        <Link
          to="/mentor/assessment/select"
          className="inline-flex items-center gap-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 transition-colors rounded-lg px-4 py-2 shrink-0"
        >
          Retry Assessment
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">
          Verification Required
        </p>
        <p className="text-white/70 text-sm">
          Assessment pass karne ke baad dashboard fully active hoga.
          Current status: <span className="text-white capitalize">{s || "pending"}</span>
        </p>
      </div>
      <Link
        to="/mentor/assessment/select"
        className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg px-4 py-2 shrink-0"
      >
        Start Assessment
      </Link>
    </div>
  );
};

/** Top stat card */
const StatCard = ({ label, value, sub, accent, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.08 }}
    className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-4 flex flex-col gap-1"
  >
    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
    <p className={`text-2xl font-bold ${accent || "text-white"}`}>{value}</p>
    {sub && <p className="text-xs text-white/30">{sub}</p>}
  </motion.div>
);

/** Session row */
const SessionRow = ({ session, isOpportunity, currentUser }) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isSending, setIsSending] = useState(false);

   
  useEffect(() => {
    if (session.sessionType === "scheduled" && session.scheduledTime) {
      const t = setTimeout(() => {
        setDate(getDateInputValue(session.scheduledTime));
        setTime(getTimeInputValue(session.scheduledTime));
      }, 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [session]);

  const handleUseStudentTime = (e) => {
    e.preventDefault();
    if (session.scheduledTime) {
      setDate(getDateInputValue(session.scheduledTime));
      setTime(getTimeInputValue(session.scheduledTime));
      toast.success("Date and Time matched with student's request.");
    }
  };

  const handleUseCurrentTime = (e) => {
    e.preventDefault();
    const now = new Date();
    setDate(getDateInputValue(now));
    setTime(getTimeInputValue(now));
    toast.success("Date and time set to now.");
  };

  const currentUserId = currentUser?._id || currentUser?.id;
  const hasOffered = session.mentorOffers?.some(
    (offer) => {
      const mId = offer.mentorId?._id || offer.mentorId;
      return mId?.toString() === currentUserId?.toString();
    }
  );

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const offerPrice = parseFloat(price);
    if (!offerPrice || offerPrice <= 0 || isNaN(offerPrice)) {
      toast.error("Please enter a valid positive price.");
      return;
    }
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    if (!time) {
      toast.error("Please select a time.");
      return;
    }

    setIsSending(true);
    try {
      const availableTime = `${date} at ${time}`;
      const scheduledDateTime = new Date(`${date}T${time}`);
      const scheduledTimeISO = isNaN(scheduledDateTime.getTime()) ? null : scheduledDateTime.toISOString();

      const response = await api.post("/mentor/reply-doubt", {
        doubtSessionId: session._id,
        price: offerPrice,
        availableTime,
        sessionType: "scheduled",
        scheduledTime: scheduledTimeISO,
      });

      toast.success(response.data?.message || "Offer sent successfully!");
      setIsExpanded(false);
      queryClient.invalidateQueries({ queryKey: ["mentorDashboard"] });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to send offer.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-white/[0.06] last:border-0 text-left">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/80 line-clamp-1">
            {session.question || (isOpportunity ? "Open doubt" : "Resolved doubt")}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/35 mt-1">
            <span>Student: {session.studentId?.name || "—"}</span>
            {isOpportunity ? (
              <>
                <span>Duration: {session.sessionDuration || "?"} min</span>
                {session.sessionType === "scheduled" && session.scheduledTime ? (
                  <span className="text-amber-300 font-semibold">
                    Requested Time: {new Date(session.scheduledTime).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-sky-300">Type: Instant</span>
                )}
                {hasOffered && (
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                    ✓ Bid Submitted
                  </span>
                )}
              </>
            ) : (
              <span>Resolved: {fmt(session.sessionEndedAt || session.updatedAt)}</span>
            )}
            {!isOpportunity && (
              <div className="flex items-center gap-2">
                <span className="text-blue-400/70 capitalize">{session.status || "completed"}</span>
                {session.status === "scheduled" && session.scheduledTime && (
                  <CountdownTimer scheduledTime={session.scheduledTime} />
                )}
              </div>
            )}
          </div>
        </div>

        {isOpportunity ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasOffered) return;
              setIsExpanded(!isExpanded);
            }}
            disabled={hasOffered}
            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors border shrink-0 ${
              hasOffered
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-default"
                : "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white cursor-pointer"
            }`}
          >
            {hasOffered ? "Offered" : isExpanded ? "Cancel" : "Bid Offer"}
          </button>
        ) : (
          session.chatRoomId && (session.status === "in_session" || session.status === "scheduled") && (
            <Link
              to={`/chat/${session.chatRoomId}`}
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors border shrink-0 border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white cursor-pointer no-underline"
            >
              Join Room
            </Link>
          )
        )}
      </div>

      {isOpportunity && isExpanded && (
        <form
          onSubmit={handleSubmitOffer}
          className="mt-3 flex flex-col gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3.5"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="m-0 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
            Send Bid Offer
          </p>

          {session.sessionType === "scheduled" && session.scheduledTime ? (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-2.5 text-xs text-amber-300 font-semibold flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>
                  Student Requested: {new Date(session.scheduledTime).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={handleUseStudentTime}
                className="self-start text-[9px] bg-amber-400 text-black hover:bg-amber-300 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer border-none"
              >
                Use Student's Time
              </button>
            </div>
          ) : (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-2.5 text-xs text-sky-400 font-semibold flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span>Student Requested: Instant (Ask Now)</span>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentTime}
                className="self-start text-[9px] bg-sky-400 text-black hover:bg-sky-300 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer border-none"
              >
                Use Current Time
              </button>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="w-1/2 flex flex-col gap-1">
              <label className="text-[8px] text-neutral-400 font-bold uppercase">Price</label>
              <input
                type="number"
                placeholder="Price ($)"
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || parseFloat(val) >= 0) {
                    setPrice(val);
                  }
                }}
                min="1"
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
              <label className="text-[8px] text-neutral-400 font-bold uppercase">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[8px] text-neutral-400 font-bold uppercase">Available Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-[9px] uppercase tracking-wider py-1.5 rounded-lg cursor-pointer transition-colors border-none"
          >
            {isSending ? "Sending..." : "Submit Bid Offer"}
          </button>
        </form>
      )}
    </div>
  );
};

/* ── main ─────────────────────────────────────────────────────────── */
const MentorDashboard = () => {
  const { data: currentUser, isPending: isCheckingSession } = useCurrentUser();
  const {
    data: dashboardResponse,
    isLoading,
    isError,
    error,
  } = useGetMentorDashboard();

  const [tab, setTab] = useState("opportunities"); // "opportunities" | "sessions"

  /* ── guards ─────────────────────────────────────────────────────── */
  if (!isCheckingSession && !currentUser) return <Navigate to="/" replace />;
  if (!isCheckingSession && currentUser && currentUser.role !== "mentor") {
    if (currentUser.role === "admin") return <Navigate to="/admin-landing" replace />;
    return <Navigate to="/student-landing" replace />;
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080810]">
        <p className="text-red-400 text-sm">
          {error?.message || "Dashboard load nahi ho paya."}
        </p>
      </div>
    );
  }

  /* ── data ───────────────────────────────────────────────────────── */
  const loading = isCheckingSession || isLoading;
  const {
    profile = {},
    stats = {},
    activeSession = null,
    recentSessions = [],
    opportunities = [],
  } = dashboardResponse?.data || {};

  const totalResolved = stats.totalResolved || 0;
  const totalEarnings = stats.totalEarnings || 0;
  const activeBids = stats.activeBidsCount || 0;
  const profileCompletion = stats.profileCompletion || 0;
  const rating = Number(profile.rating || 0);
  const ratingCount = profile.ratingCount || 0;
  const isVerified = Boolean(profile.isVerifiedMentor);
  const displayName = profile.name || currentUser?.name || "Mentor";
  const initials = displayName.slice(0, 2).toUpperCase();

  /* ── chart data ─────────────────────────────────────────────────── */
  // Normalize all values to 0–100 scale so every bar is visible.
  // Tooltip shows the real value — chart shows relative height only.
  const norm = (val, max) => Math.max(8, Math.round((val / (max || 1)) * 100));
  const chartData = [
    { label: "Sessions",      display: String(totalResolved),                                           value: norm(totalResolved, 50),      color: "#3b82f6" },
    { label: "Earnings",      display: totalEarnings >= 1000 ? `₹${(totalEarnings/1000).toFixed(1)}k` : `₹${totalEarnings}`, value: norm(totalEarnings, 10000), color: "#60a5fa" },
    { label: "Bids",          display: String(activeBids),                                              value: norm(activeBids, 20),         color: "#93c5fd" },
    { label: "Rating",        display: `${rating.toFixed(1)} ★`,                                       value: norm(rating, 5),              color: "#bfdbfe" },
    { label: "Profile",       display: `${profileCompletion}%`,                                        value: profileCompletion,            color: "#dbeafe" },
    { label: "Opportunities", display: String(opportunities.length),                                   value: norm(opportunities.length, 20), color: "#e0f2fe" },
  ];

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="w-full min-h-screen flex flex-col px-4 pb-24 pt-32 sm:pt-24 text-white overflow-x-hidden bg-[radial-gradient(circle_at_82%_6%,rgba(255,217,110,0.42),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(62,62,244,0.55),transparent_34%),radial-gradient(circle_at_28%_99%,rgba(9,12,179,0.60),transparent_48%),linear-gradient(180deg,#050509_0%,#060612_58%,#15131a_100%)] sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
        >
          <div>
            <h1 className="text-xl font-bold text-white">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              Track sessions, earnings, doubts, and bids.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
              isVerified
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                : "border-white/10 text-white/40 bg-white/5"
            }`}>
              {isVerified ? "Verified Mentor" : (profile.verificationStatus || "Pending")}
            </span>
            <span className="text-[11px] px-3 py-1 rounded-full border border-blue-500/20 text-blue-300/70 bg-blue-500/5">
              {profile.specialization?.name || profile.skill?.name || "No skill"}
            </span>
          </div>
        </motion.div>

        {/* ── Verification banner ─────────────────────────────────── */}
        <VerifyBanner profile={profile} />

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="Sessions"
            value={totalResolved}
            sub={`${ratingCount} reviews`}
            accent="text-blue-400"
            index={0}
          />
          <StatCard
            label="Rating"
            value={`${rating.toFixed(1)} ★`}
            sub={`${ratingCount} reviews`}
            accent="text-white"
            index={1}
          />
          <StatCard
            label="Earnings"
            value={totalEarnings >= 1000 ? `₹${(totalEarnings / 1000).toFixed(1)}k` : `₹${totalEarnings}`}
            sub="Lifetime"
            accent="text-white"
            index={2}
          />
          <StatCard
            label="Active Bids"
            value={activeBids}
            sub="Pending offers"
            accent="text-white"
            index={3}
          />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              label="Open Doubts"
              value={opportunities.length}
              sub="Matching skill"
              accent="text-white"
              index={4}
            />
          </div>
        </div>

        {/* ── Main grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left col — Profile + Active Session ────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4"
          >

            {/* Profile card */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {profile.avatar
                    ? <img src={profile.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    : initials
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <p className="text-xs text-white/40 truncate">{profile.email || "—"}</p>
                </div>
                <Link
                  to="/mentor/profile"
                  className="text-[11px] text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-lg px-2.5 py-1 transition-colors shrink-0"
                >
                  Edit
                </Link>
              </div>

              <div className="space-y-3 border-t border-white/[0.06] pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Title</p>
                  <p className="text-xs text-white/70">
                    {profile.jobTitle || "Not set"}
                    {profile.company ? ` @ ${profile.company}` : ""}
                    {profile.experienceYears ? ` · ${profile.experienceYears}y exp` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Specialization</p>
                  <p className="text-xs text-white/70">
                    {profile.specialization?.name || profile.skill?.name || "Not selected"}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-white/30">Profile Completion</p>
                    <p className="text-[11px] text-blue-400 font-semibold">{profileCompletion}%</p>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Session card */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Active Session</p>
              {activeSession ? (
                <div className="space-y-2">
                  <p className="text-sm text-white/80 line-clamp-2">
                    {activeSession.question || "Live doubt session"}
                  </p>
                  <p className="text-xs text-white/40">
                    Student: <span className="text-white/60">{activeSession.studentId?.name || "—"}</span>
                    {" · "}{activeSession.sessionDuration || "?"} min
                  </p>
                  {activeSession.chatRoomId && (
                    <Link
                      to={`/chat/${activeSession.chatRoomId}`}
                      className="mt-3 flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg px-3 py-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Join Chat Room
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-xs text-white/30">No active session right now.</p>
              )}
            </div>
          </motion.div>

          {/* Right col — Chart + Tabs ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="lg:col-span-2 flex flex-col gap-4"
          >

            {/* Bar chart */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Performance</p>
              <p className="text-sm font-semibold text-white mb-4">All Stats at a Glance</p>

              <div className="h-36 sm:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      stroke="transparent"
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip content={<BarTip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {chartData.map((d) => (
                        <Cell key={d.label} fill={d.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabbed list — Opportunities / Recent Sessions */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5 flex-1">
              {/* Tab switcher */}
              <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-lg p-1 w-full sm:w-fit">
                {[
                  { key: "opportunities", label: `Opportunities (${opportunities.length})` },
                  { key: "sessions",      label: `Recent Sessions (${recentSessions.length})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex-1 sm:flex-none text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                      tab === key
                        ? "bg-blue-600 text-white"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="space-y-0 max-h-72 overflow-y-auto pr-1 scrollbar-hide" data-lenis-prevent>
                {tab === "opportunities" ? (
                  opportunities.length > 0 ? (
                    opportunities.map((s) => (
                      <SessionRow key={s._id} session={s} isOpportunity currentUser={currentUser} />
                    ))
                  ) : (
                    <p className="text-xs text-white/30 py-6 text-center">No matching doubts right now.</p>
                  )
                ) : (
                  recentSessions.length > 0 ? (
                    recentSessions.map((s) => (
                      <SessionRow key={s._id} session={s} currentUser={currentUser} />
                    ))
                  ) : (
                    <p className="text-xs text-white/30 py-6 text-center">No resolved sessions yet.</p>
                  )
                )}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
