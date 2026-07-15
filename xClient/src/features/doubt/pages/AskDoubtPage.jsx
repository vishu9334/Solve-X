import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGetSpecialistMentors, useAskDoubt, useGetSpecializationMentors } from "../hooks/useDoubt";
import NotificationSendingOverlay from "../../../shared/components/NotificationSendingOverlay";

// Reveal animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: custom * 0.1, duration: 0.5, ease: "easeOut" }
    })
};

const AskDoubtPage = () => {
    const navigate = useNavigate();
    const { data: catalogs = [], isLoading, isError } = useGetSpecialistMentors();
    const { mutate: askDoubt, isPending } = useAskDoubt();

    const [selectedSpec, setSelectedSpec] = useState(null); // Selected specialization object
    const [questionText, setQuestionText] = useState("");
    const [sessionTime, setSessionTime] = useState("15");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [sessionType, setSessionType] = useState("instant");
    const [scheduledTime, setScheduledTime] = useState("");

    const { data: mentors = [], isLoading: isMentorsLoading } = useGetSpecializationMentors(selectedSpec?.specializationId);


    const handleFormSubmit = (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!selectedSpec) {
            setErrorMsg("Please select a specialization catalog first.");
            return;
        }

        if (!questionText.trim()) {
            setErrorMsg("Please write details about your doubt/problem.");
            return;
        }

        let finalScheduledTime = null;
        if (sessionType === "scheduled") {
            if (!scheduledTime) {
                setErrorMsg("Please select a date and time for your scheduled session.");
                return;
            }
            finalScheduledTime = new Date(scheduledTime).toISOString();
        }

        askDoubt(
            {
                specializationIdentifier: selectedSpec.specializationId,
                selectSessionTime: parseInt(sessionTime, 10),
                questionText: questionText.trim(),
                sessionType,
                scheduledTime: finalScheduledTime
            },
            {
                onSuccess: (data) => {
                    setSuccessMsg(data?.message || "Doubt posted successfully! Redirecting...");
                    setQuestionText("");
                    setTimeout(() => {
                        navigate("/dashboard/student");
                    }, 3000);
                },
                onError: (err) => {
                    setErrorMsg(err?.message || "Something went wrong while posting your doubt.");
                }
            }
        );
    };

    const pageBackgroundStyle = {
        background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%30noiseFilter)' opacity='0.055'/%3E%3C/svg%3E"), radial-gradient(circle at 100% 50%, rgba(255, 255, 255, 0.75) 0%, rgba(200, 220, 255, 0.45) 25%, transparent 60%), radial-gradient(circle at 80% 80%, #16247d 0%, #0d123d 60%, #000000 100%)`
    };

    if (isLoading) {
        return (
            <div
                className="w-full flex-1 flex flex-col items-center justify-center -mt-32 sm:-mt-24 pt-32 sm:pt-24 min-h-[500px]"
                style={pageBackgroundStyle}
            >
                <div className="flex flex-col items-center justify-center gap-3 text-white/50 font-mono">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
                    <span className="animate-pulse text-xs tracking-wider uppercase">Loading specializations...</span>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div
                className="w-full flex-1 flex flex-col items-center justify-center -mt-32 sm:-mt-24 pt-32 sm:pt-24 min-h-[500px]"
                style={pageBackgroundStyle}
            >
                <div className="text-red-400 font-mono uppercase text-xs tracking-wider">
                    Failed to load specialization catalogs. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full flex-1 flex flex-col items-center -mt-32 sm:-mt-24 pt-32 sm:pt-24 pb-12"
            style={pageBackgroundStyle}
        >
            <motion.div
                initial="hidden"
                animate="visible"
                className="mx-auto w-[94%] max-w-[1100px] py-6 text-white font-mono flex-1"
            >
                <NotificationSendingOverlay isOpen={isPending} message="Posting Doubt & notifying mentors..." />
                {/* Header Area */}
                <motion.div variants={fadeInUp} custom={0} className="flex flex-col gap-2 border-b border-white/10 pb-5">
                    <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-700">
                        [ Ask a Specialist ]
                    </p>
                    <h1 className="m-0 text-2xl font-black uppercase tracking-wider font-space-grotesk sm:text-3xl">Post your Doubt Session</h1>
                    <p className="m-0 text-xs text-white/55 leading-relaxed">
                        Select your technology category, write your issue, and verified mentors will bid to help you live.
                    </p>
                </motion.div>

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.25fr_1fr]">
                    {/* 1. Catalog Selection */}
                    <motion.section variants={fadeInUp} custom={1} className="flex flex-col gap-6">
                        <h2 className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-white/90">
                            1. Select Technology Catalog
                        </h2>

                        <div className="flex flex-col gap-6">
                            {catalogs.map((catalog, index) => (
                                <motion.div
                                    key={catalog.categoryName}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="rounded-2xl border border-white/10 p-5 shadow-xl sm:rounded-3xl"
                                    style={{ background: "radial-gradient(circle at 78% 92%, rgba(255,280,236,0.12), transparent 38%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 40%), rgba(255,255,255,0.03)" }}
                                >
                                    <h3 className="m-0 text-[11px] font-black tracking-[0.24em] text-indigo-400 uppercase mb-4">
                                        {catalog.categoryName}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {catalog.mentors.map((spec) => {
                                            const isSelected = selectedSpec?.specializationId === spec.specializationId;
                                            return (
                                                <motion.button
                                                    key={spec.specializationId}
                                                    type="button"
                                                    onClick={() => setSelectedSpec(spec)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${isSelected
                                                            ? "border-amber-300 bg-amber-300/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                                                            : "border-white/10 bg-black/35 hover:border-white/25"
                                                        }`}
                                                >
                                                    <span className="font-bold text-xs uppercase tracking-[0.1em] text-white">
                                                        {spec.specializationName}
                                                    </span>
                                                    <span className="text-[10px] text-white/50 mt-1 line-clamp-2 min-h-[30px] leading-relaxed">
                                                        {spec.description || "Learn from verified experts."}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-3 text-[9px] text-lime-200/70 font-bold bg-white/5 w-fit px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        Mentors: {spec.mentorCount || 0}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Available Experts Panel */}
                        {selectedSpec && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-white/10 p-5 shadow-xl sm:rounded-3xl"
                                style={{ background: "radial-gradient(circle at 10% 20%, rgba(251,191,36,0.06), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.05), transparent 40%), rgba(255,255,255,0.02)" }}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="m-0 text-[11px] font-black tracking-[0.24em] text-amber-300 uppercase">
                                        Available Experts ({selectedSpec.specializationName})
                                    </h3>
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                        Online
                                    </span>
                                </div>

                                {isMentorsLoading ? (
                                    <div className="flex justify-center items-center py-6 text-white/50 text-[10px] uppercase tracking-wider animate-pulse">
                                        Finding available mentors...
                                    </div>
                                ) : mentors.length === 0 ? (
                                    <div className="text-white/40 text-center py-6 text-xs italic">
                                        No verified mentors found for this specialization at the moment.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide" data-lenis-prevent>
                                        {mentors.map((mentor) => {
                                            const user = mentor.userId || {};
                                            return (
                                                <div
                                                    key={mentor._id}
                                                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-200"
                                                >
                                                    <div className="flex gap-3 items-center">
                                                        <img
                                                            src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name || 'Mentor'}`}
                                                            alt={user.name}
                                                            className="h-10 w-10 rounded-full bg-white/10 object-cover border border-white/10"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs uppercase tracking-wide text-white">
                                                                {user.name}
                                                            </span>
                                                            <span className="text-[10px] text-white/60 mt-0.5">
                                                                {mentor.jobTitle || "Mentor"} {mentor.company ? `@ ${mentor.company}` : ""}
                                                            </span>
                                                            <div className="flex gap-3 items-center mt-1 text-[9px] text-white/40">
                                                                <span>Exp: {mentor.experienceYears || 0} Yrs</span>
                                                                <span>•</span>
                                                                <span>{mentor.preferredLanguage || "English"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                                                            <span>★</span>
                                                            <span>{mentor.rating?.toFixed(1) || "5.0"}</span>
                                                            {mentor.ratingCount > 0 && (
                                                                <span className="text-[8px] text-white/40 font-normal">
                                                                    ({mentor.ratingCount})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[8px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                                            Verified
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.section>

                    {/* 2. Form Input */}
                    <motion.section variants={fadeInUp} custom={2} className="flex flex-col gap-6">
                        <h2 className="m-0 text-sm font-bold uppercase tracking-[0.16em] text-white/90">
                            2. Describe your Problem
                        </h2>

                        <form
                            onSubmit={handleFormSubmit}
                            className="rounded-2xl border border-white/10 p-5 sm:p-6 flex flex-col gap-5 shadow-2xl sm:rounded-3xl"
                            style={{ background: "radial-gradient(circle at 20% 80%, rgba(251,191,36,0.08), transparent 38%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 40%), rgba(255,255,255,0.03)" }}
                        >
                            {/* Selected Spec Indicator */}
                            <div className="rounded-xl bg-black/30 p-3 border border-white/5 text-xs flex justify-between items-center">
                                <div>
                                    <span className="text-white/40 uppercase block text-[8px] tracking-[0.16em] mb-1">Selected skill:</span>
                                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                                        {selectedSpec ? selectedSpec.specializationName : "None (Select from left)"}
                                    </span>
                                </div>
                                {selectedSpec && (
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-300 bg-amber-300/10 px-2 py-1 rounded-full border border-amber-300/20">
                                        READY
                                    </span>
                                )}
                            </div>

                            {/* Doubt description input */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white/70 uppercase tracking-[0.16em]">
                                    What is your doubt / problem statement?
                                </label>
                                <textarea
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    placeholder="Explain your code error or query. For example: Why is my React useEffect calling API twice on initial render?"
                                    rows={6}
                                    className="w-full rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white placeholder-white/20 transition-colors focus:border-amber-300/50 focus:outline-none leading-relaxed font-mono"
                                />
                            </div>

                            {/* Session duration select */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white/70 uppercase tracking-[0.16em]">
                                    Preferred Session Time
                                </label>
                                <select
                                    value={sessionTime}
                                    onChange={(e) => setSessionTime(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white focus:border-amber-300/50 focus:outline-none font-mono"
                                >
                                    <option value="15">15 Minutes Session</option>
                                    <option value="30">30 Minutes Session</option>
                                    <option value="45">45 Minutes Session</option>
                                    <option value="60">60 Minutes Session</option>
                                </select>
                            </div>

                            {/* Session Schedule type selection */}
                            <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                                <label className="text-[10px] font-bold text-white/70 uppercase tracking-[0.16em]">
                                    Choose Session Schedule
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSessionType("instant");
                                            setScheduledTime("");
                                        }}
                                        className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${sessionType === "instant"
                                                ? "border-amber-300 bg-amber-300/10 text-amber-300"
                                                : "border-white/10 bg-black/25 text-white/60 hover:border-white/20"
                                            }`}
                                    >
                                        ⚡ Ask Now (Instant)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSessionType("scheduled")}
                                        className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${sessionType === "scheduled"
                                                ? "border-amber-300 bg-amber-300/10 text-amber-300"
                                                : "border-white/10 bg-black/25 text-white/60 hover:border-white/20"
                                            }`}
                                    >
                                        📅 Schedule for Later
                                    </button>
                                </div>

                                {sessionType === "scheduled" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="flex flex-col gap-3 mt-1"
                                    >
                                        {/* Quick suggestions */}
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[9px] text-white/40 uppercase tracking-wider">Quick Suggestions:</span>
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const offset = new Date(Date.now() + 30 * 60 * 1000);
                                                        const localIso = new Date(offset.getTime() - offset.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                        setScheduledTime(localIso);
                                                    }}
                                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-white/70 border border-white/5 rounded-full cursor-pointer uppercase tracking-wider"
                                                >
                                                    +30 Mins
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const offset = new Date(Date.now() + 60 * 60 * 1000);
                                                        const localIso = new Date(offset.getTime() - offset.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                        setScheduledTime(localIso);
                                                    }}
                                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-white/70 border border-white/5 rounded-full cursor-pointer uppercase tracking-wider"
                                                >
                                                    +1 Hour
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const offset = new Date(Date.now() + 2 * 60 * 60 * 1000);
                                                        const localIso = new Date(offset.getTime() - offset.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                                                        setScheduledTime(localIso);
                                                    }}
                                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-white/70 border border-white/5 rounded-full cursor-pointer uppercase tracking-wider"
                                                >
                                                    +2 Hours
                                                </button>
                                            </div>
                                        </div>

                                        {/* Custom date time picker */}
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[9px] text-white/40 uppercase tracking-wider">Custom Date & Time:</span>
                                            <input
                                                type="datetime-local"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="w-full rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white focus:border-amber-300/50 focus:outline-none font-mono"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Error and Success Notifications with AnimatePresence */}
                            <AnimatePresence mode="wait">
                                {errorMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl uppercase tracking-wider"
                                    >
                                        ⚠️ {errorMsg}
                                    </motion.div>
                                )}

                                {successMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl uppercase tracking-wider"
                                    >
                                        ✓ {successMsg}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit button */}
                            <motion.button
                                type="submit"
                                disabled={isPending || !selectedSpec}
                                whileHover={{ scale: !selectedSpec ? 1 : 1.02 }}
                                whileTap={{ scale: !selectedSpec ? 1 : 0.98 }}
                                className="w-full py-3 bg-white text-black hover:bg-amber-300 transition-all font-bold rounded-full cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-[0.2em] mt-2 shadow-lg"
                            >
                                {isPending ? "Posting Doubt..." : "Submit & Notify"}
                            </motion.button>
                        </form>
                    </motion.section>
                </div>
            </motion.div>
        </div>
    );
};

export default AskDoubtPage;
