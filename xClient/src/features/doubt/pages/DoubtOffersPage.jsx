import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGetDoubtSessionOffers, useGetDoubtSessionDetails, useSelectMentor } from "../hooks/useDoubt.js";
import { useState } from "react";
import NotificationSendingOverlay from "../../../shared/components/NotificationSendingOverlay";
import AcceptSuccessOverlay from "../../../shared/components/AcceptSuccessOverlay";

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const DoubtOffersPage = () => {
  const { doubtSessionId } = useParams();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successRedirectUrl, setSuccessRedirectUrl] = useState("");

  // Queries & Mutations
  const { data: session, isLoading: isSessionLoading } = useGetDoubtSessionDetails(doubtSessionId);
  const { data: offers = [], isLoading: isOffersLoading } = useGetDoubtSessionOffers(doubtSessionId);
  const { mutate: selectMentor, isPending: isAccepting } = useSelectMentor();

  const handleAcceptOffer = (mentorId) => {
    setErrorMsg("");
    selectMentor(
      { doubtSessionId, selectedMentorId: mentorId },
      {
        onSuccess: (data) => {
          const chatRoomId = data?.data?.chatRoomId || data?.chatRoomId;
          const targetUrl = chatRoomId ? `/chat/${chatRoomId}` : "/dashboard/student";
          setSuccessRedirectUrl(targetUrl);
          setShowSuccess(true);
        },
        onError: (err) => {
          setErrorMsg(err?.message || "Failed to accept offer. Please try again.");
        }
      }
    );
  };

  if (isSessionLoading || isOffersLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-white/50 font-mono">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
        <span className="animate-pulse text-xs tracking-wider uppercase">Loading offers...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-red-400 font-mono">
        Doubt session not found.
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="mx-auto w-[94%] max-w-[1000px] py-6 text-white font-mono flex-1 flex flex-col gap-6"
    >
      <NotificationSendingOverlay isOpen={isAccepting} message="Accepting offer & setting up chat room..." />
      <AcceptSuccessOverlay 
        isOpen={showSuccess} 
        onComplete={() => {
          setShowSuccess(false);
          if (successRedirectUrl) {
            navigate(successRedirectUrl);
          }
        }} 
      />
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col gap-2 border-b border-white/10 pb-5">
        <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
          [ Doubt Offers Panel ]
        </p>
        <h1 className="m-0 text-2xl font-black uppercase tracking-wider font-space-grotesk sm:text-3xl">
          Review Mentor Bids
        </h1>
        <p className="m-0 text-xs text-white/55 leading-relaxed">
          Compare mentor prices, ratings, and experience to accept the best match for your session.
        </p>
      </motion.div>

      {/* Session Details Widget */}
      <motion.div
        variants={fadeInUp}
        className="rounded-2xl border border-white/10 p-5 sm:p-6 shadow-xl"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), transparent 40%), rgba(255,255,255,0.02)" }}
      >
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/5 pb-4 mb-4">
          <div>
            <span className="text-[10px] text-white/40 uppercase block tracking-wider">Topic / Category</span>
            <span className="text-sm font-bold text-amber-300 uppercase tracking-wide">
              {session.specializedId?.name || "Specialization"}
            </span>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-[10px] text-white/40 uppercase block tracking-wider">Duration</span>
              <span className="text-xs font-semibold text-white/80">{session.sessionDuration} Mins</span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 uppercase block tracking-wider">Status</span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-300 bg-amber-300/10 px-2 py-0.5 rounded-full border border-amber-300/10">
                {session.status}
              </span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-white/40 uppercase block tracking-wider mb-1">Your Problem Statement</span>
          <p className="m-0 text-sm leading-relaxed text-white/90 bg-black/20 p-4 rounded-xl border border-white/5">
            {session.question}
          </p>
        </div>
      </motion.div>

      {/* Offers List */}
      <motion.section variants={fadeInUp} className="flex flex-col gap-4">
        <h2 className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-white/90">
          Matched Mentor Offers ({offers.length})
        </h2>

        {errorMsg && (
          <div className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl uppercase tracking-wider">
            ⚠️ {errorMsg}
          </div>
        )}

        {offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-8 text-center text-white/40 text-xs">
            <span className="animate-pulse block text-base mb-1">⏳ Waiting for mentors to bid...</span>
            Mentors will see your doubt and place their offers here in real-time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => {
              const mentor = offer.mentorId || {};
              const profile = offer.mentorProfile || {};
              return (
                <motion.div
                  key={offer.mentorId?._id || offer._id}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border border-white/10 p-5 flex flex-col justify-between gap-4 shadow-lg transition-all"
                  style={{ background: "radial-gradient(circle at 80% 20%, rgba(251,191,36,0.05), transparent 45%), rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={mentor.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${mentor.name || "Mentor"}`}
                        alt={mentor.name}
                        className="h-12 w-12 rounded-full border border-white/10 bg-white/5 object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm uppercase tracking-wide text-white">
                          {mentor.name}
                        </span>
                        <span className="text-[11px] text-white/60">
                          {profile.jobTitle || "Mentor"} {profile.company ? `@ ${profile.company}` : ""}
                        </span>
                        <div className="flex gap-2 items-center mt-1 text-[9px] text-white/40">
                          <span>Exp: {profile.experienceYears || 0} Years</span>
                          <span>•</span>
                          <span>{profile.preferredLanguage || "English"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-amber-300 font-bold">
                      <span>★</span>
                      <span>{Number(profile.rating || 5.0).toFixed(1)}</span>
                      {profile.ratingCount > 0 && (
                        <span className="text-[9px] text-white/40 font-normal">({profile.ratingCount})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <span className="text-[9px] text-white/45 uppercase block tracking-wider">Offer Price</span>
                      <span className="text-lg font-black text-emerald-400 font-space-grotesk">
                        ₹{offer.price}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/45 uppercase block tracking-wider">Availability</span>
                      <span className="text-xs font-bold text-white/80">{offer.availableTime || "Immediate"}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptOffer(mentor._id || mentor)}
                    disabled={isAccepting}
                    className="w-full mt-1 py-2.5 bg-amber-300 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAccepting ? "Accepting Offer..." : "Accept Offer & Start Chat"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
};

export default DoubtOffersPage;