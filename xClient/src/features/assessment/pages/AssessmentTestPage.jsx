import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useStartActivitySession,
  useRecordActivityEvent,
  useSubmitAssessment,
  useGetActiveAssessment,
} from "../hooks/useAssessment.js";

/* ─── Helpers ──────────────────────────────────────────────────── */
const getScreenSnapshot = () => ({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  outerWidth: window.outerWidth,
  outerHeight: window.outerHeight,
  screenWidth: window.screen.width,
  screenHeight: window.screen.height,
  availWidth: window.screen.availWidth,
  availHeight: window.screen.availHeight,
  isFullscreen: Boolean(document.fullscreenElement),
  isTabHidden: document.hidden,
  hasFocus: document.hasFocus(),
});

/* ─── Sub-components ──────────────────────────────────────────── */
const WarningToast = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    className="fixed left-1/2 bottom-6 z-50 -translate-x-1/2 rounded-2xl border border-rose-400/40 bg-rose-950/90 px-6 py-4 shadow-2xl backdrop-blur-xl"
    style={{ maxWidth: "90vw" }}
  >
    <div className="flex items-center gap-3">
      <svg className="h-5 w-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      <p className="text-sm font-semibold text-rose-200">{message}</p>
      <button onClick={onClose} className="ml-2 text-white/40 hover:text-white">✕</button>
    </div>
  </motion.div>
);

const FullscreenPrompt = ({ onEnter }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-4 max-w-md rounded-3xl border border-indigo-400/30 bg-[#0a0a18] p-8 text-center shadow-2xl"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15">
        <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>
        </svg>
      </div>
      <h2 className="m-0 font-space-grotesk text-2xl font-bold text-white">Fullscreen Required</h2>
      <p className="m-0 mt-2 text-sm text-white/55">
        This is a proctored assessment. Fullscreen mode is required to begin. Tab switching and window resizing are monitored.
      </p>
      <button
        onClick={onEnter}
        className="mt-6 w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white hover:bg-indigo-400 transition-all duration-200"
      >
        Enter Fullscreen & Start Test
      </button>
    </motion.div>
  </div>
);

const ResultScreen = ({ result, specializationName, onGoHome, countdown }) => {
  const passed = result?.evaluation?.isPassed;
  const score = result?.evaluation?.score ?? 0;
  const status = result?.attemptStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="mx-4 max-w-lg w-full rounded-3xl border p-8 text-center shadow-2xl"
        style={{
          borderColor: passed ? "rgba(52,211,153,0.35)" : "rgba(251,113,133,0.35)",
          background: passed
            ? "radial-gradient(circle at 50% 0%, rgba(16,185,129,0.12), transparent 55%), #070714"
            : "radial-gradient(circle at 50% 0%, rgba(239,68,68,0.12), transparent 55%), #070714",
        }}
      >
        <div
          className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
          style={{
            background: passed ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          }}
        >
          {passed ? "🎉" : "😔"}
        </div>
        <h2 className="m-0 font-space-grotesk text-3xl font-black" style={{ color: passed ? "#34d399" : "#fb7185" }}>
          {passed ? "Assessment Passed!" : "Assessment Failed"}
        </h2>
        <p className="m-0 mt-2 text-sm text-white/55">
          Specialization: <span className="font-semibold text-white">{specializationName}</span>
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="m-0 text-3xl font-black font-space-grotesk" style={{ color: passed ? "#34d399" : "#fb7185" }}>
            {score}%
          </p>
          <p className="m-0 mt-1 text-xs text-white/45">Score</p>
        </div>

        {passed ? (
          <p className="m-0 mt-4 text-sm text-emerald-300">
            🚀 You are now a <strong>Verified Mentor</strong>! Students can find and book you for doubt sessions.
          </p>
        ) : (
          <div className="m-0 mt-4 text-sm">
          {result?.evaluation?.isScorePassed && result?.evaluation?.activityDecision === "rejected" ? (
              <p className="text-rose-400 font-semibold leading-relaxed">
                ⚠️ You met the passing score threshold ({score}%) but failed due to serious proctoring violations (page close, excessive tab switches, or critical activity during the test).
              </p>
            ) : (
              <p className="text-white/50">
                {status === "failed"
                  ? "You have exhausted all attempts. Please contact support."
                  : "Don't worry! You can try again by selecting your specialization again."}
              </p>
            )}
          </div>
        )}

        <button
          onClick={onGoHome}
          className="mt-6 w-full rounded-xl py-3 text-sm font-bold transition-all duration-200"
          style={{
            background: passed ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)",
            color: passed ? "#34d399" : "#818cf8",
            border: `1px solid ${passed ? "rgba(52,211,153,0.3)" : "rgba(99,102,241,0.3)"}`,
          }}
        >
          Back to Dashboard
        </button>

        {/* Auto-redirect countdown */}
        {countdown > 0 && (
          <p className="m-0 mt-3 text-xs text-white/30">
            Redirecting to dashboard in <strong className="text-white/50">{countdown}s</strong> automatically…
          </p>
        )}
      </motion.div>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────────── */
const AssessmentTestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: activeAssessment, isLoading: isActiveAssessmentLoading } = useGetActiveAssessment();

  const { attempt: stateAttempt, questions: stateQuestions, specializationName: stateSpecializationName, switched: stateSwitched, remainingAttempts: stateRemainingAttempts } = location.state || {};

  const attempt = activeAssessment?.attempt || stateAttempt;
  const questions = activeAssessment?.questions?.questions || stateQuestions?.questions || [];
  const specializationName = activeAssessment?.specialized?.name || stateSpecializationName;
  const remainingAttempts = activeAssessment?.remainingAttempts ?? stateRemainingAttempts ?? 3;
  const switched = stateSwitched;

  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins default
  const [hasInitializedTime, setHasInitializedTime] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [toast, setToast] = useState(null);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);

  const activitySessionIdRef = useRef(null);
  const hasStartedRef = useRef(false);
  const timerRef = useRef(null);
  const redirectTimerRef = useRef(null);

  const { mutateAsync: startSession } = useStartActivitySession();
  const { mutateAsync: recordEvent } = useRecordActivityEvent();
  const { mutateAsync: submitAssessment } = useSubmitAssessment();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const addWarning = useCallback(() => {
    setWarnings((w) => w + 1);
  }, []);

  const submitFinal = async (isTimeExpired = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearInterval(timerRef.current);
    setTimeExpired(isTimeExpired);

    const answersArray = questions.map((q) => ({
      questionId: q.questionText,
      selectedAnswer: answers[q.questionText] || "",
    }));

    try {
      const res = await submitAssessment({ attemptId: attempt._id, answers: answersArray });
      setResult(res?.data || {});
      
      // Exit fullscreen only after successful submission
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
      } catch {
        // Safe to ignore fullscreen exit error
      }
    } catch (err) {
      showToast(err?.message || "Submission failed. Try again.");
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async (eventType = "TIME_EXPIRED") => {
    clearInterval(timerRef.current);
    if (activitySessionIdRef.current) {
      await recordEvent({
        sessionId: activitySessionIdRef.current,
        eventType,
        message: eventType === "TIME_EXPIRED" ? "Time limit expired" : "Auto-submitted",
        screen: getScreenSnapshot(),
      }).catch(() => {});
    }
    submitFinal(eventType === "TIME_EXPIRED");
  };

  // Initialize timer once activeAssessment is loaded
  useEffect(() => {
    if (activeAssessment && !hasInitializedTime) {
      const duration = activeAssessment.questions?.durationMinutes || 15;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(duration * 60);
      setHasInitializedTime(true);
    } else if (!isActiveAssessmentLoading && !activeAssessment && stateQuestions && !hasInitializedTime) {
      const duration = stateQuestions?.durationMinutes || 15;
      setTimeLeft(duration * 60);
      setHasInitializedTime(true);
    }
  }, [activeAssessment, isActiveAssessmentLoading, stateQuestions, hasInitializedTime]);

  // Redirect if no state and no active assessment query found
  useEffect(() => {
    if (!isActiveAssessmentLoading && !attempt && !questions.length) {
      navigate("/mentor/assessment/select", { replace: true });
    }
  }, [isActiveAssessmentLoading, attempt, questions]);

  // Pause all background React Query refetches during assessment
  // This prevents auth token refresh from kicking user out mid-test
  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: { refetchOnWindowFocus: false, refetchInterval: false },
    });
    return () => {
      // Restore normal refetch behaviour when leaving assessment
      queryClient.setDefaultOptions({
        queries: { refetchOnWindowFocus: true },
      });
    };
  }, []);

  // Auto-redirect after result is shown: 5 mins if time expired, 60s otherwise
  useEffect(() => {
    if (!result) return;
    const initialCountdown = timeExpired ? 300 : 60;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRedirectCountdown(initialCountdown);
    redirectTimerRef.current = setInterval(() => {
      setRedirectCountdown((c) => {
        if (c <= 1) {
          clearInterval(redirectTimerRef.current);
          navigate("/dashboard/mentor", { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(redirectTimerRef.current);
  }, [result, timeExpired]);

  // Start proctoring session after fullscreen entered
  // Note: startSession already creates a TEST_STARTED event internally
  const handleEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore fullscreen error
    }
    setShowFullscreenPrompt(false);

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      const res = await startSession({
        category: specializationName,
        screen: getScreenSnapshot(),
      });
      activitySessionIdRef.current =
        res?.data?._id || res?.data?.id || null;
    } catch {
      // non-fatal; proctoring is best-effort on client
    }
  };

  // Timer countdown
  useEffect(() => {
    if (showFullscreenPrompt || result) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit("TIME_EXPIRED");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [showFullscreenPrompt, result]);

  // Proctoring: tab switch
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.hidden && activitySessionIdRef.current) {
        addWarning();
        showToast("⚠️ Tab switch detected! This has been recorded.");
        await recordEvent({
          sessionId: activitySessionIdRef.current,
          eventType: "TAB_SWITCHED",
          message: "User switched tabs",
          screen: getScreenSnapshot(),
        }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Proctoring: window blur
  useEffect(() => {
    const handleBlur = async () => {
      if (activitySessionIdRef.current) {
        addWarning();
        showToast("⚠️ Window lost focus! Stay on the test.");
        await recordEvent({
          sessionId: activitySessionIdRef.current,
          eventType: "WINDOW_BLUR",
          message: "Window lost focus",
          screen: getScreenSnapshot(),
        }).catch(() => {});
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  // Proctoring: fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement && !showFullscreenPrompt && activitySessionIdRef.current && !result && !isSubmitting) {
        addWarning();
        showToast("⚠️ Fullscreen exited! Please re-enter fullscreen.");
        await recordEvent({
          sessionId: activitySessionIdRef.current,
          eventType: "FULLSCREEN_EXITED",
          message: "User exited fullscreen",
          screen: getScreenSnapshot(),
        }).catch(() => {});
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [showFullscreenPrompt, result, isSubmitting]);




  const handleAnswer = (questionText, option) => {
    setAnswers((prev) => ({ ...prev, [questionText]: option }));
  };

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (isActiveAssessmentLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-white">
        <div className="h-20 w-20 animate-pulse rounded-full border-4 border-indigo-500/30 border-t-indigo-500 flex items-center justify-center">
          <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">Loading</span>
        </div>
      </div>
    );
  }

  if (!attempt || questions.length === 0) return null;

  return (
    <>
      {showFullscreenPrompt && <FullscreenPrompt onEnter={handleEnterFullscreen} />}
      {result && (
        <ResultScreen
          result={result}
          specializationName={specializationName}
          countdown={redirectCountdown}
          onGoHome={() => { clearInterval(redirectTimerRef.current); navigate("/dashboard/mentor", { replace: true }); }}
        />
      )}

      {/* Switched specialization banner */}
      {switched && !showFullscreenPrompt && !result && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-amber-400/40 bg-amber-950/90 px-5 py-3 shadow-xl backdrop-blur-md"
          style={{ maxWidth: "92vw" }}
        >
          <p className="m-0 text-center text-xs font-semibold text-amber-200">
            ⚡ You switched specializations — you have{" "}
            <strong className="text-amber-300">{remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining</strong>{" "}
            across all assessments. Make it count!
          </p>
        </motion.div>
      )}

      <AnimatePresence>{toast && <WarningToast message={toast} onClose={() => setToast(null)} />}</AnimatePresence>

      <div
        className="flex min-h-screen flex-col font-inter text-white"
        style={{
          background: `
            radial-gradient(circle at 90% 5%, rgba(99,102,241,0.25), transparent 30%),
            radial-gradient(circle at 10% 95%, rgba(251,191,36,0.1), transparent 30%),
            linear-gradient(180deg, #050509 0%, #07071a 100%)
          `,
        }}
      >
        {/* Top Bar */}
        <header className="flex w-full items-center justify-between border-b border-white/8 bg-black/60 px-6 py-3.5 backdrop-blur-md sticky top-0 z-50 box-border">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Solve-X" className="w-6 h-6 object-contain" />
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">SOLVE-X // ASSESSMENT MODE</p>
              <p className="m-0 mt-0.5 font-space-grotesk text-xs font-semibold text-white/80">{specializationName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {warnings > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1">
                <svg className="h-3 w-3 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <span className="text-[11px] font-bold text-rose-300">{warnings} warning{warnings > 1 ? "s" : ""}</span>
              </div>
            )}

            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
              {currentIdx + 1} / {questions.length}
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="h-1 bg-white/8">
          <motion.div
            className="h-full bg-indigo-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col items-center justify-start px-4 py-8 sm:px-8">
          <div className="w-full max-w-3xl">
            <AnimatePresence mode="wait">
              {currentQ && (
                <motion.div
                  key={currentIdx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.28 }}
                  className="flex flex-col gap-6"
                >
                  {/* Question */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl">
                    <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">
                      Question {currentIdx + 1}
                    </p>
                    <h2 className="m-0 mt-3 font-space-grotesk text-lg font-semibold leading-7 text-white sm:text-xl">
                      {currentQ.questionText}
                    </h2>
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-3">
                    {(currentQ.options || []).map((option, oi) => {
                      const isSelected = answers[currentQ.questionText] === option;
                      return (
                        <motion.button
                          key={oi}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswer(currentQ.questionText, option)}
                          className="flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200"
                          style={{
                            borderColor: isSelected ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.1)",
                            background: isSelected
                              ? "rgba(99,102,241,0.15)"
                              : "rgba(255,255,255,0.03)",
                            boxShadow: isSelected ? "0 0 0 1px rgba(99,102,241,0.3)" : "none",
                          }}
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-200"
                            style={{
                              borderColor: isSelected ? "rgba(99,102,241,0.7)" : "rgba(255,255,255,0.18)",
                              background: isSelected ? "rgba(99,102,241,0.3)" : "transparent",
                              color: isSelected ? "#fff" : "rgba(255,255,255,0.5)",
                            }}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className={`text-sm leading-5 ${isSelected ? "font-semibold text-white" : "text-white/70"}`}>
                            {option}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/60 transition-all hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                </svg>
                Previous
              </button>

              {/* Dot navigation */}
              <div className="hidden flex-wrap justify-center gap-1.5 sm:flex" style={{ maxWidth: 280 }}>
                {questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className="h-2 w-2 rounded-full transition-all duration-200"
                    style={{
                      background:
                        i === currentIdx
                          ? "#818cf8"
                          : answers[q.questionText]
                          ? "#34d399"
                          : "rgba(255,255,255,0.2)",
                      transform: i === currentIdx ? "scale(1.5)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  className="flex items-center gap-2 rounded-xl border border-indigo-400/35 bg-indigo-500/15 px-5 py-2.5 text-sm font-semibold text-indigo-200 transition-all hover:bg-indigo-500/25"
                >
                  Next
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={submitFinal}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Test
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Answered tracker */}
            <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4">
              <div className="flex items-center justify-between text-xs text-white/45">
                <span>Answered: <strong className="text-emerald-300">{answeredCount}</strong> / {questions.length}</span>
                <span>Skipped: <strong className="text-amber-300">{questions.length - answeredCount}</strong></span>
                <span>Warnings: <strong className="text-rose-300">{warnings}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Timer at the bottom right */}
        {!showFullscreenPrompt && !result && (
          <div
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border px-4 py-2 font-space-grotesk text-base font-bold shadow-2xl backdrop-blur-md tabular-nums"
            style={{
              borderColor: timeLeft < 120 ? "rgba(251,113,133,0.5)" : "rgba(255,255,255,0.15)",
              color: timeLeft < 120 ? "#fb7185" : "#fff",
              background: timeLeft < 120 ? "rgba(239,68,68,0.25)" : "rgba(12,11,17,0.85)",
            }}
          >
            <svg className="h-4 w-4 opacity-70 animate-pulse text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
            </svg>
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default AssessmentTestPage;
