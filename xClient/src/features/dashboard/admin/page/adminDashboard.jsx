import { Navigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { useCurrentUser } from "../../../auth/hooks/useCurrentUser.js";
import { useGetAdminDashboard } from "../hooks/adminDashboard.hook.js";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

/* ─── helpers ────────────────────────────────────────────────────── */
const fmt = (date) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "—";

/* ─── custom tooltips ────────────────────────────────────────────── */
const BarTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0d0d14] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-white/50 mb-0.5">{d.name || d.label}</p>
      <p className="text-white font-semibold">{d.display ?? payload[0].value}</p>
    </div>
  );
};

const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d14] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-white/50 mb-0.5">{payload[0].name}</p>
      <p className="text-white font-semibold">{payload[0].value} mentors</p>
    </div>
  );
};

/* ─── stat card — exact mentor pattern ───────────────────────────── */
const StatCard = ({ label, value, sub, accent, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.07 }}
    className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-4 flex flex-col gap-1"
  >
    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
    <p className={`text-2xl font-bold ${accent || "text-white"}`}>{value}</p>
    {sub && <p className="text-xs text-white/30">{sub}</p>}
  </motion.div>
);

/* ─── session row — exact mentor pattern ─────────────────────────── */
const SessionRow = ({ session }) => {
  const statusColor =
    session.status === "completed"
      ? "text-emerald-400/70"
      : session.status === "in_session"
      ? "text-sky-400/70"
      : "text-amber-400/70";

  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-white/[0.06] last:border-0">
      <p className="text-sm text-white/80 line-clamp-1">
        {session.question || "No question"}
      </p>
      <div className="flex flex-wrap gap-3 text-[11px] text-white/35">
        <span>Student: {session.studentId?.name || "—"}</span>
        <span>Mentor: {session.selectedMentorId?.name || "Unassigned"}</span>
        <span>{fmt(session.createdAt)}</span>
        <span className={`capitalize font-medium ${statusColor}`}>
          {session.status || "open"}
        </span>
      </div>
    </div>
  );
};

/* ─── skill row ──────────────────────────────────────────────────── */
const SkillRow = ({ skill, index }) => {
  const COLORS = ["#3b82f6","#60a5fa","#93c5fd","#fbbf24","#34d399","#a78bfa"];
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06] last:border-0">
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: COLORS[index % COLORS.length] }}
        />
        <span className="text-sm text-white/80 font-medium">{skill.name}</span>
      </div>
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          color: COLORS[index % COLORS.length],
          background: `${COLORS[index % COLORS.length]}18`,
          border: `1px solid ${COLORS[index % COLORS.length]}30`,
        }}
      >
        {skill.mentorCount} mentors
      </span>
    </div>
  );
};

/* ─── chart card wrapper — mentor card style ─────────────────────── */
const ChartCard = ({ tag, title, children }) => (
  <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5 flex flex-col gap-3">
    <div>
      <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">{tag}</p>
      <p className="text-sm font-semibold text-white">{title}</p>
    </div>
    {children}
  </div>
);

/* ═══════════════════ MAIN COMPONENT ═════════════════════════════── */
const AdminDashboard = () => {
  const { data: currentUser, isPending: isCheckingSession } = useCurrentUser();
  const {
    data: adminResponse,
    isLoading,
    isError,
    error,
  } = useGetAdminDashboard();

  const [tab, setTab] = useState("sessions"); // "sessions" | "skills"

  /* ── guards ──────────────────────────────────────────────────── */
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080810]">
        <p className="text-white/40 text-sm">Checking admin session…</p>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/" replace />;
  if (currentUser.role !== "admin") {
    if (currentUser.role === "mentor") return <Navigate to="/mentor-landing" replace />;
    return <Navigate to="/student-landing" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080810]">
        <p className="text-white/40 text-sm">Loading admin dashboard…</p>
      </div>
    );
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

  /* ── data ────────────────────────────────────────────────────── */
  const {
    users = {},
    subscriptions = {},
    proctoringFlagStats = {},
    doubtSessions = {},
    recentSessions = [],
    popularSpecializations = [],
  } = adminResponse?.data || {};

  const totalOnline = (users.onlineStudents || 0) + (users.onlineMentors || 0);

  /* ── mentor:student ratio (real DB data) ─────────────────────── */
  const totalS = users.totalStudents || 0;
  const totalM = users.totalMentors || 0;
  const ratioDisplay = totalM === 0
    ? "N/A"
    : totalS === 0
      ? `0:1`
      : `1:${(totalS / totalM).toFixed(1)}`;

  /* ── chart: doubt status bar ─────────────────────────────────── */
  const doubtBarData = [
    { label: "Open",      display: String(doubtSessions.open || 0),      value: doubtSessions.open || 0,      color: "#fbbf24" },
    { label: "Live",      display: String(doubtSessions.live || 0),      value: doubtSessions.live || 0,      color: "#38bdf8" },
    { label: "Completed", display: String(doubtSessions.completed || 0), value: doubtSessions.completed || 0, color: "#34d399" },
  ];

  /* ── chart: user engagement bar ─────────────────────────────── */
  const userBarData = [
    { label: "Students", display: `${users.totalStudents || 0} total`, value: users.totalStudents || 0, color: "#3b82f6" },
    { label: "Online S",  display: `${users.onlineStudents || 0} online`, value: users.onlineStudents || 0, color: "#60a5fa" },
    { label: "Mentors",  display: `${users.totalMentors || 0} total`, value: users.totalMentors || 0, color: "#a78bfa" },
    { label: "Online M", display: `${users.onlineMentors || 0} online`, value: users.onlineMentors || 0, color: "#c4b5fd" },
  ];

  /* ── chart: skills donut (fixed: was using wrong field name) ─── */
  const SKILL_COLORS = ["#3b82f6","#60a5fa","#93c5fd","#fbbf24","#34d399","#a78bfa"];
  const skillPieData = popularSpecializations.slice(0, 6).map((s) => ({
    name: s.name,
    value: s.mentorCount || 0,
  }));

  /* ── render ──────────────────────────────────────────────────── */
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/30 mb-1">
              Solve-X Administrator
            </p>
            <h1 className="text-xl font-bold text-white">
              Admin Overview
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              Platform metrics, doubt sessions, users and skills.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              System Live
            </span>
          </div>
        </motion.div>

        {/* ── Row 1: User + Subscription stats ───────────────────── */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/20 mb-2 ml-0.5">
            Users &amp; Subscriptions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <StatCard label="Total Students"        value={users.totalStudents || 0}               sub={`${users.onlineStudents || 0} online now`} accent="text-blue-400"    index={0} />
            <StatCard label="Total Mentors"         value={users.totalMentors || 0}                sub={`${users.onlineMentors || 0} online now`}  accent="text-violet-400"  index={1} />
            <StatCard label="Mentor:Student Ratio"  value={ratioDisplay}                           sub="Per mentor (live DB)"                      accent="text-amber-400"   index={2} />
            <StatCard label="Active Subscriptions"  value={subscriptions.activeSubscriptions || 0} sub="Paying students"                           accent="text-emerald-400" index={3} />
            <StatCard label="Online Now"            value={totalOnline}                            sub="Students + mentors"                        accent="text-sky-400"     index={4} />
          </div>
        </div>

        {/* ── Row 2: Doubt + Proctoring stats ────────────────────── */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/20 mb-2 ml-0.5">
            Doubt Sessions &amp; Proctoring
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Open Doubts"         value={doubtSessions.open || 0}                 sub="Awaiting mentor"         accent="text-amber-400"  index={4} />
            <StatCard label="Live Sessions"       value={doubtSessions.live || 0}                 sub="In progress now"         accent="text-sky-400"    index={5} />
            <StatCard label="Completed Doubts"    value={doubtSessions.completed || 0}            sub="Resolved total"          accent="text-emerald-400" index={6} />
            <StatCard label="Proctoring Warnings" value={proctoringFlagStats.totalWarnings || 0}  sub="Flagged sessions"        accent="text-red-400"    index={7} />
          </div>
        </div>

        {/* ── Charts row ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Doubt status bar */}
          <ChartCard tag="Analytics" title="Doubt Resolution Status">
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doubtBarData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="transparent"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<BarTip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={48}>
                    {doubtBarData.map((d) => (
                      <Cell key={d.label} fill={d.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Skills donut */}
          <ChartCard tag="Analytics" title="Most In-Demand Skills">
            {skillPieData.length > 0 ? (
              <div className="h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skillPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="45%"
                      outerRadius="70%"
                      paddingAngle={3}
                    >
                      {skillPieData.map((_, i) => (
                        <Cell key={i} fill={SKILL_COLORS[i % SKILL_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-white/30 py-10 text-center">No skills data yet.</p>
            )}
          </ChartCard>

          {/* User engagement bar */}
          <ChartCard tag="Analytics" title="Students vs Mentors">
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userBarData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="transparent"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<BarTip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={36}>
                    {userBarData.map((d) => (
                      <Cell key={d.label} fill={d.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* ── Bottom: tabbed lists ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-5"
        >
          {/* Tab switcher — exact mentor pattern */}
          <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-lg p-1 w-full sm:w-fit">
            {[
              { key: "sessions", label: `Recent Sessions (${recentSessions.length})` },
              { key: "skills",   label: `Popular Skills (${popularSpecializations.length})` },
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

          {/* List content */}
          <div className="max-h-72 overflow-y-auto pr-1 scrollbar-hide" data-lenis-prevent>
            {tab === "sessions" ? (
              recentSessions.length > 0 ? (
                recentSessions.map((s) => <SessionRow key={s._id} session={s} />)
              ) : (
                <p className="text-xs text-white/30 py-6 text-center">No recent sessions found.</p>
              )
            ) : (
              popularSpecializations.length > 0 ? (
                popularSpecializations.map((skill, i) => (
                  <SkillRow key={skill._id || i} skill={skill} index={i} />
                ))
              ) : (
                <p className="text-xs text-white/30 py-6 text-center">No skills data yet.</p>
              )
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AdminDashboard;