import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  useGetDoubtSessionOffers,
  useGetDoubtSessionDetails,
  useSelectMentor,
  useEndDoubtSession,
} from "../hooks/useDoubt.js";
import { useState } from "react";
import NotificationSendingOverlay from "../../../shared/components/NotificationSendingOverlay";
import AcceptSuccessOverlay from "../../../shared/components/AcceptSuccessOverlay";

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const DoubtOffersPage = () => {
  const { doubtSessionId } = useParams();
  const navigate = useNavigate();

  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successRedirectUrl, setSuccessRedirectUrl] = useState("");

  const { data: session, isLoading: isSessionLoading } =
    useGetDoubtSessionDetails(doubtSessionId);

  const { data: offers = [], isLoading: isOffersLoading } =
    useGetDoubtSessionOffers(doubtSessionId);

  const { mutate: selectMentor, isPending: isAccepting } = useSelectMentor();
  const { mutate: endSession } = useEndDoubtSession();

  const handleCancelSession = () => {
    if (window.confirm("Are you sure you want to cancel this doubt request?")) {
      endSession(doubtSessionId, {
        onSuccess: () => {
          navigate("/dashboard/student");
        }
      });
    }
  };

  const handleAcceptOffer = (mentorId) => {
    setErrorMsg("");

    selectMentor(
      { doubtSessionId, selectedMentorId: mentorId },
      {
        onSuccess: (data) => {
          const chatRoomId = data?.data?.chatRoomId || data?.chatRoomId;
          const targetUrl = chatRoomId
            ? `/chat/${chatRoomId}`
            : "/dashboard/student";

          setSuccessRedirectUrl(targetUrl);
          setShowSuccess(true);
        },
        onError: (err) => {
          setErrorMsg(
            err?.message || "Failed to accept offer. Please try again."
          );
        },
      }
    );
  };

  if (isSessionLoading || isOffersLoading) {
    return (
      <div className="flex flex-1 w-full -mt-32 sm:-mt-24 pt-32 sm:pt-24 flex-col items-center justify-center gap-3 bg-[#050509] px-4 text-white/50 font-mono">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />

        <span className="animate-pulse text-xs tracking-wider uppercase">
          Loading offers...
        </span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-1 w-full -mt-32 sm:-mt-24 pt-32 sm:pt-24 items-center justify-center bg-[#050509] px-4 text-red-400 font-mono">
        Doubt session not found.
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="w-full flex-1 flex flex-col items-center -mt-32 sm:-mt-24 pt-32 sm:pt-24 overflow-x-hidden bg-[radial-gradient(circle_at_82%_6%,rgba(255,217,110,0.42),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(62,62,244,0.55),transparent_34%),radial-gradient(circle_at_28%_99%,rgba(9,12,179,0.60),transparent_48%),linear-gradient(180deg,#050509_0%,#060612_58%,#15131a_100%)] text-white"
    >
      <NotificationSendingOverlay
        isOpen={isAccepting}
        message="Accepting offer & setting up chat room..."
      />

      <AcceptSuccessOverlay
        isOpen={showSuccess}
        onComplete={() => {
          setShowSuccess(false);

          if (successRedirectUrl) {
            navigate(successRedirectUrl);
          }
        }}
      />

      <main className="mx-auto flex flex-1 w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex w-full flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 sm:pb-8"
        >
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-lime-400">
              [ Doubt Offers Panel ]
            </p>

            <h1 className="m-0 text-[clamp(2rem,5vw,3.5rem)] font-black uppercase leading-[0.95] tracking-tight font-space-grotesk">
              Review Mentor Bids
            </h1>

            <p className="m-0 max-w-3xl text-sm leading-relaxed text-emerald-300/75 sm:text-base mt-2">
              Compare mentor prices, ratings, and experience to accept the best
              match for your session.
            </p>
          </div>
          
          <button
            onClick={handleCancelSession}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all shrink-0 cursor-pointer border-none"
          >
            Cancel Doubt Request
          </button>
        </motion.header>

        {/* Session Details */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-6 flex w-full flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-md sm:p-5 lg:p-6"
        >
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-white/45">
                Topic / Category
              </span>

              <span className="text-sm font-bold uppercase tracking-wide text-green-400">
                {session.specializedId?.name || "Specialization"}
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-white/40">
                  Duration
                </span>

                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white/90">
                  {session.sessionDuration} Mins
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase tracking-wider text-white/40">
                  Status
                </span>

                <span className="rounded-full border border-amber-300/10 bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {session.status}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/40">
              Your Problem Statement
            </span>

            <p className="m-0 rounded-xl border border-white/5 bg-white/10 p-4 text-sm leading-relaxed text-white/90">
              {session.question}
            </p>
          </div>
        </motion.section>

        {/* Offers List */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-6 flex w-full flex-col gap-4 pb-10"
        >
          <h2 className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-white/90">
            Matched Mentor Offers ({offers.length})
          </h2>

          {errorMsg && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[10px] font-bold uppercase tracking-wider text-red-400">
              ⚠️ {errorMsg}
            </div>
          )}

          {offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-8 text-center text-xs text-white/40">
              <span className="mb-1 block animate-pulse text-base">
                ⏳ Waiting for mentors to bid...
              </span>
              Mentors will see your doubt and place their offers here in
              real-time.
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
              {offers.map((offer) => {
                const mentor = offer.mentorId || {};
                const profile = offer.mentorProfile || {};

                return (
                  <motion.div
                    key={offer.mentorId?._id || offer._id}
                    whileHover={{ y: -3 }}
                    className="flex min-h-full flex-col justify-between gap-4 rounded-2xl border border-white/10 p-4 shadow-lg transition-all sm:p-5"
                    style={{
                      background:
                        "radial-gradient(circle at 80% 20%, rgba(251,191,36,0.05), transparent 45%), rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            mentor.avatar ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${mentor.name || "Mentor"
                            }`
                          }
                          alt={mentor.name || "Mentor"}
                          className="h-12 w-12 shrink-0 rounded-full border border-white/10 bg-white/5 object-cover"
                        />

                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-bold uppercase tracking-wide text-white">
                            {mentor.name}
                          </span>

                          <span className="text-[11px] text-white/60">
                            {profile.jobTitle || "Mentor"}
                            {profile.company ? ` @ ${profile.company}` : ""}
                          </span>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-white/40">
                            <span>
                              Exp: {profile.experienceYears || 0} Years
                            </span>
                            <span>•</span>
                            <span>
                              {profile.preferredLanguage || "English"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                        <span>★</span>

                        <span>{Number(profile.rating || 5.0).toFixed(1)}</span>

                        {profile.ratingCount > 0 && (
                          <span className="text-[9px] font-normal text-white/40">
                            ({profile.ratingCount})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-white/45">
                          Offer Price
                        </span>

                        <span className="text-lg font-black text-emerald-400 font-space-grotesk">
                          ₹{offer.price}
                        </span>
                      </div>

                      <div className="sm:text-right">
                        <span className="block text-[9px] uppercase tracking-wider text-white/45">
                          Availability / Schedule
                        </span>

                        <span className="text-xs font-bold text-white/80">
                          {offer.sessionType === "scheduled" &&
                            offer.scheduledTime
                            ? `Scheduled: ${new Date(
                              offer.scheduledTime
                            ).toLocaleString()}`
                            : offer.availableTime || "Immediate"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleAcceptOffer(offer.mentorId?._id || offer.mentorId)
                      }
                      disabled={isAccepting}
                      className="mt-1 w-full cursor-pointer rounded-xl bg-amber-300 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAccepting
                        ? "Accepting Offer..."
                        : offer.sessionType === "scheduled"
                          ? "Accept & Confirm Schedule"
                          : "Accept Offer & Start Chat"}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </main>
    </motion.div>
  );
};

export default DoubtOffersPage;