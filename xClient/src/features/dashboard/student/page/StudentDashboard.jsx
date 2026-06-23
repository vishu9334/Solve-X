import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useCurrentUser } from "../../../auth/hooks/useCurrentUser.js";
import { useGetStudentDashboard } from "../hook/studentDashboard.hook.js";

const StatCard = ({ label, value, tone = "text-amber-300", helper }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45 }}
    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-xl sm:rounded-3xl sm:p-5"
  >
    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_35%,rgba(251,191,36,0.08))]" />
    <div className="relative">
      <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">
        {label}
      </p>
      <p className={`m-0 mt-3 text-3xl font-black sm:text-4xl ${tone}`}>{value}</p>
      {helper && <p className="m-0 mt-2 text-xs text-white/45">{helper}</p>}
    </div>
  </motion.div>
);

const StatusBadge = ({ status }) => {
  const style =
    status === "completed"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : status === "in_session"
        ? "border-sky-400/25 bg-sky-400/10 text-sky-300"
        : status === "open"
          ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
          : "border-white/15 bg-white/5 text-white/50";

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${style}`}>
      {status || "unknown"}
    </span>
  );
};

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const StudentDashboard = () => {
  const { data: currentUser, isPending: isCheckingSession } = useCurrentUser();
  const {
    data: dashboardResponse,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
  } = useGetStudentDashboard();

  if (isCheckingSession) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-white/60">
        Checking student session...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.role !== "student") {
    if (currentUser.role === "admin") return <Navigate to="/admin-landing" replace />;
    return <Navigate to="/mentor-landing" replace />;
  }

  if (isDashboardLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-white">
        <div className="h-44 w-44">
          <DotLottieReact
            src="https://lottie.host/9afc5d4a-2c61-442d-a9bf-3d2fb40fd9e3/aqVwXNG7Kj.lottie"
            loop
            autoplay
          />
        </div>
        <p className="m-0 text-xs font-bold uppercase tracking-[0.22em] text-white/50">
          Loading student dashboard
        </p>
      </div>
    );
  }

  if (isDashboardError) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
        <div className="h-52 w-52">
          <DotLottieReact
            src="https://lottie.host/8e039cbf-c1db-4ecb-85f8-37e14bbb277e/PWiyGNpCea.lottie"
            loop
            autoplay
          />
        </div>
        <p className="m-0 max-w-md text-sm font-semibold text-red-300">
          {dashboardError?.message || "Student dashboard data load nahi ho paya."}
        </p>
      </div>
    );
  }

  const dashboardData = dashboardResponse?.data || {};
  const { profile = {}, stats = {}, recentSessions = [] } = dashboardData;

  return (
    <div className="min-h-[calc(100vh-9rem)] overflow-x-hidden bg-[radial-gradient(circle_at_82%_6%,rgba(255,217,110,0.28),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(62,62,244,0.38),transparent_34%),linear-gradient(180deg,#050509_0%,#060612_58%,#15131a_100%)] px-0 py-4 font-josefin-sans text-white sm:py-6 flex flex-col">
      <div className="mx-auto w-[94%] max-w-[1200px] flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
          <div>
            <p className="m-0 text-[9px] font-bold uppercase tracking-[0.22em] text-amber-300 sm:text-[10px] sm:tracking-[0.34em]">
              [ Student Dashboard ]
            </p>
            <h1 className="m-0 mt-2 font-josefin-sans text-2xl font-semibold text-white sm:text-3xl md:text-4xl">
              Welcome back, {profile.name || currentUser.name || "Student"}
            </h1>
            <p className="m-0 mt-2 max-w-2xl text-sm text-white/55">
              Your doubts, live sessions, subscription and mentor connection activity in one place.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left sm:w-auto sm:text-right">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              Subscription
            </p>
            <p className="m-0 mt-1 text-sm font-bold capitalize text-emerald-300">
              {profile.subscriptionStatus || "inactive"}
            </p>
            <p className="m-0 text-xs text-white/45">
              {profile.daysLeft || 0} days left
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Asked" value={stats.totalAsked || 0} tone="text-sky-300" />
          <StatCard label="Open Doubts" value={stats.openAsked || 0} tone="text-amber-300" />
          <StatCard label="Live Sessions" value={stats.activeAsked || 0} tone="text-indigo-300" />
          <StatCard label="Completed" value={stats.completedAsked || 0} tone="text-emerald-300" />
          <StatCard label="Total Spent" value={`₹${stats.totalSpent || 0}`} tone="text-pink-300" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-2xl font-black text-black sm:h-16 sm:w-16">
                {(profile.name || "S").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="m-0 font-josefin-sans text-2xl text-white">
                  {profile.name || "Student"}
                </h2>
                <p className="m-0 truncate text-xs text-white/45">{profile.email || "No email found"}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
                Bio
              </p>
              <p className="m-0 mt-2 text-sm leading-6 text-white/65">
                {profile.bio || "Profile bio abhi add nahi hua. Student profile page se update kar sakte ho."}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
                Subscription expiry
              </p>
              <p className="m-0 mt-2 text-sm text-white/65">
                {formatDate(profile.subscriptionExpiresAt)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">
                  Recent Sessions
                </p>
                <h2 className="m-0 mt-2 font-josefin-sans text-2xl text-white">
                  Doubt history
                </h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                Live data
              </span>
            </div>

            <div className="mt-5 flex max-h-none flex-col gap-3 overflow-visible pr-0 xl:max-h-[430px] xl:overflow-y-auto xl:pr-1">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <motion.article
                    key={session._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3 transition-colors hover:border-amber-300/25 sm:p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <h3 className="m-0 text-sm font-semibold text-white">
                          {session.question || "No question found"}
                        </h3>
                        <p className="m-0 mt-2 text-xs text-white/45">
                          Mentor:{" "}
                          <span className="text-white/70">
                            {session.selectedMentorId?.name || "Not selected yet"}
                          </span>
                        </p>
                      </div>
                      <StatusBadge status={session.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/45">
                      <span className="rounded-full bg-white/5 px-3 py-1">
                        Duration: {session.sessionDuration || "N/A"}
                      </span>
                      <span className="rounded-full bg-white/5 px-3 py-1">
                        Created: {formatDate(session.createdAt)}
                      </span>
                    </div>
                  </motion.article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
                  <p className="m-0 font-josefin-sans text-xl text-white">No doubt sessions yet</p>
                  <p className="m-0 mt-2 text-sm text-white/45">
                    Jab student doubt post karega, uski history yaha show hogi.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
