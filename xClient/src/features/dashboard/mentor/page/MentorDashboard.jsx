import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useCurrentUser } from "../../../auth/hooks/useCurrentUser.js";
import { useGetMentorDashboard } from "../hook/mentorDashboard.hook.js";

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const StatCard = ({ label, value, tone = "text-amber-300", note, link }) => {
  const cardBody = (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`overflow-hidden rounded-2xl border border-white/10 p-4 shadow-xl sm:rounded-3xl sm:p-5 h-full ${link ? 'hover:border-amber-300/35 transition-colors duration-300 cursor-pointer' : ''}`}
      style={{ background: "radial-gradient(circle at 78% 22%, rgba(251,191,36,0.16), transparent 38%), linear-gradient(135deg, rgba(255,255,255,0.10), transparent 40%), rgba(255,255,255,0.045)" }}
    >
      <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-white/45 font-inter">
        {label}
      </p>
      <p className={`m-0 mt-3 text-3xl font-black sm:text-4xl font-space-grotesk ${tone}`}>{value}</p>
      {note && <p className="m-0 mt-2 text-xs text-white/45">{note}</p>}
    </motion.div>
  );

  if (link) {
    return (
      <Link to={link} className="no-underline block h-full">
        {cardBody}
      </Link>
    );
  }
  return cardBody;
};

const StatusPill = ({ status, verified }) => {
  const style = verified
    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
    : status === "rejected"
      ? "border-rose-400/25 bg-rose-400/10 text-rose-300"
      : "border-amber-400/25 bg-amber-400/10 text-amber-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${style}`}>
      {verified ? "Verified Mentor" : status || "Pending"}
    </span>
  );
};

const MentorDashboard = () => {
  const { data: currentUser, isPending: isCheckingSession } = useCurrentUser();
  const {
    data: dashboardResponse,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
  } = useGetMentorDashboard();

  if (isCheckingSession) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-white/60">
        Checking mentor session...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.role !== "mentor") {
    if (currentUser.role === "admin") return <Navigate to="/admin-landing" replace />;
    return <Navigate to="/student-landing" replace />;
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
          Loading mentor dashboard
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
          {dashboardError?.message || "Mentor dashboard data load nahi ho paya."}
        </p>
      </div>
    );
  }

  const dashboardData = dashboardResponse?.data || {};
  const {
    profile = {},
    stats = {},
    activeSession = null,
    recentSessions = [],
    opportunities = [],
  } = dashboardData;

  const isVerifiedMentor = Boolean(profile.isVerifiedMentor);
  const rating = Number(profile.rating || 0).toFixed(1);

  return (
    <div
      className="min-h-[calc(100vh-9rem)] overflow-x-hidden px-6 py-4 font-inter text-white sm:px-10 sm:py-6"
      style={{
        background: `
          linear-gradient(90deg, transparent 0 8%, rgba(251,191,36,0.08) 8% 8.4%, transparent 8.4% 18%, rgba(99,102,241,0.06) 18% 18.25%, transparent 18.25%) 0 0 / 280px 100%,
          linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px) 0 0 / 42px 42px,
          linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px) 0 0 / 42px 42px,
          radial-gradient(circle at 82% 6%, rgba(255,217,110,0.30), transparent 28%),
          radial-gradient(circle at 76% 18%, rgba(62,62,244,0.40), transparent 34%),
          radial-gradient(circle at 22% 88%, rgba(16,185,129,0.20), transparent 34%),
          linear-gradient(180deg, #050509 0%, #060612 58%, #15131a 100%)
        `
      }}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
          <div>
            <p className="m-0 text-[9px] font-bold uppercase tracking-[0.22em] text-amber-300 sm:text-[10px] sm:tracking-[0.34em]">
              [ Mentor Dashboard ]
            </p>
            <h1 className="m-0 mt-2 text-2xl font-semibold text-white sm:text-3xl md:text-4xl font-space-grotesk">
              Welcome back, {profile.name || currentUser.name || "Mentor"}
            </h1>
            <p className="m-0 mt-2 max-w-2xl text-sm text-white/55">
              Track your verification, live session, doubt opportunities, earnings and resolved sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={profile.verificationStatus} verified={isVerifiedMentor} />
            <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs text-white/60">
              Skill: <span className="font-bold text-amber-200">{profile.skill?.name || "Not selected"}</span>
            </div>
          </div>
        </header>

        {!isVerifiedMentor && (
          <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 shadow-2xl sm:rounded-3xl sm:p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200">
                  Verification required
                </p>
                <h2 className="m-0 mt-2 text-2xl font-semibold text-white font-space-grotesk">
                  Assessment pass karne ke baad dashboard full active hoga.
                </h2>
                {profile.rejectionReason && (
                  <p className="m-0 mt-2 text-sm text-rose-200">
                    Reason: {profile.rejectionReason}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/60">
                Current status:{" "}
                <span className="font-bold capitalize text-amber-200">
                  {profile.verificationStatus || "pending"}
                </span>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Resolved" value={stats?.totalResolved || 0} tone="text-emerald-300" />
          <StatCard label="Earnings" value={`₹${stats?.totalEarnings || 0}`} tone="text-amber-300" />
          <StatCard label="Active Bids" value={stats?.activeBidsCount || 0} tone="text-sky-300" />
          <StatCard label="Rating" value={rating} tone="text-pink-300" note={`${profile.ratingCount || 0} reviews`} />
          <StatCard label="Profile" value={`${stats?.profileCompletion || 0}%`} tone="text-indigo-300" link="/mentor/profile" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-amber-300 text-2xl font-black text-black sm:h-16 sm:w-16">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name || "Mentor"} className="h-full w-full object-cover" />
                  ) : (
                    (profile.name || "M").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="m-0 text-2xl text-white font-space-grotesk">{profile.name || "Mentor"}</h2>
                  <p className="m-0 truncate text-xs text-white/45">{profile.email || "No email found"}</p>
                </div>
              </div>
              <Link
                to="/mentor/profile"
                className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 hover:border-amber-300 hover:text-white transition-all no-underline"
              >
                Edit
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
                  Professional identity
                </p>
                <p className="m-0 mt-2 text-sm leading-6 text-white/65">
                  {profile.jobTitle || "Job title not added"}
                  {profile.company ? ` at ${profile.company}` : ""}
                </p>
                <p className="m-0 mt-1 text-xs text-white/45">
                  Experience: {profile.experienceYears || 0} years
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
                  Active session
                </p>
                {activeSession ? (
                  <div className="mt-2">
                    <p className="m-0 text-sm font-semibold text-white">
                      {activeSession.question || "Live doubt session"}
                    </p>
                    <p className="m-0 mt-1 text-xs text-white/45">
                      Student: {activeSession.studentId?.name || "Student"} · Duration:{" "}
                      {activeSession.sessionDuration || "N/A"}
                    </p>
                  </div>
                ) : (
                  <p className="m-0 mt-2 text-sm text-white/50">No active live session right now.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl sm:rounded-3xl sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div>
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">
                  Open Opportunities
                </p>
                <h2 className="m-0 mt-2 text-2xl text-white font-space-grotesk">Doubts matching your skill</h2>
              </div>
              <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300">
                {opportunities.length} available
              </span>
            </div>

            <div className="mt-5 flex max-h-none flex-col gap-3 overflow-visible pr-0 xl:max-h-[430px] xl:overflow-y-auto xl:pr-1">
              {opportunities.length > 0 ? (
                opportunities.map((session) => (
                  <motion.article
                    key={session._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3 transition-colors hover:border-amber-300/25 sm:p-4"
                  >
                    <h3 className="m-0 text-sm font-semibold text-white font-space-grotesk">
                      {session.question || "No question found"}
                    </h3>
                    <p className="m-0 mt-2 text-xs text-white/45">
                      Student: <span className="text-white/70">{session.studentId?.name || "Student"}</span>
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/45">
                      <span className="rounded-full bg-white/5 px-3 py-1">
                        Duration: {session.sessionDuration || "N/A"}
                      </span>
                      <span className="rounded-full bg-white/5 px-3 py-1">
                        Posted: {formatDate(session.createdAt)}
                      </span>
                    </div>
                  </motion.article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
                  <p className="m-0 text-xl text-white">No matching doubts right now</p>
                  <p className="m-0 mt-2 text-sm text-white/45">
                    Student jab aapke selected skill me doubt post karega, yaha show hoga.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl sm:rounded-3xl sm:p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300">
                Recent Resolved Sessions
              </p>
              <h2 className="m-0 mt-2 text-2xl text-white font-space-grotesk">Your latest mentoring work</h2>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              Real data
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <article key={session._id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="m-0 text-sm font-semibold text-white font-space-grotesk">
                    {session.question || "Resolved doubt"}
                  </h3>
                  <p className="m-0 mt-2 text-xs text-white/45">
                    Student: <span className="text-white/70">{session.studentId?.name || "Student"}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/45">
                    <span className="rounded-full bg-white/5 px-3 py-1">
                      Completed: {formatDate(session.sessionEndedAt || session.updatedAt)}
                    </span>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-300">
                      {session.status || "completed"}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center lg:col-span-2">
                <p className="m-0 text-xl text-white">No resolved sessions yet</p>
                <p className="m-0 mt-2 text-sm text-white/45">
                  Aap mentor session complete karoge to history yaha show hogi.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MentorDashboard;
