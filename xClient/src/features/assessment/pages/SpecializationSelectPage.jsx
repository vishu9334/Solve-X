import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGetSpecializations, useSelectSpecialization } from "../hooks/useAssessment.js";

const SpecializationSelectPage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [customName, setCustomName] = useState("");
  const [mode, setMode] = useState("list"); // "list" | "custom"
  const [errorMsg, setErrorMsg] = useState("");

  const { data: specializations = [], isLoading } = useGetSpecializations();
  const { mutate: selectSpecialization, isPending } = useSelectSpecialization();

  const handleSelect = (spec) => {
    setSelected(spec);
    setCustomName("");
    setErrorMsg("");
  };

  const handleProceed = () => {
    setErrorMsg("");
    if (mode === "custom") {
      if (!customName.trim()) {
        setErrorMsg("Specialization name required.");
        return;
      }
      selectSpecialization(
        { specializationName: customName.trim() },
        {
          onSuccess: (res) => {
            const { attempt, questions, switched, remainingAttempts } = res?.data || {};
            navigate("/mentor/assessment/test", {
              state: {
                attempt,
                questions,
                specializationName: customName.trim(),
                switched: switched || false,
                remainingAttempts: remainingAttempts ?? attempt?.maxAttempts ?? 3,
              },
            });
          },
          onError: (err) => {
            setErrorMsg(err?.message || "Something went wrong. Try again.");
          },
        }
      );
    } else {
      if (!selected) {
        setErrorMsg("Please select a specialization.");
        return;
      }
      selectSpecialization(
        { specializationId: selected._id },
        {
          onSuccess: (res) => {
            const { attempt, questions, switched, remainingAttempts } = res?.data || {};
            navigate("/mentor/assessment/test", {
              state: {
                attempt,
                questions,
                specializationName: selected.name,
                switched: switched || false,
                remainingAttempts: remainingAttempts ?? attempt?.maxAttempts ?? 3,
              },
            });
          },
          onError: (err) => {
            setErrorMsg(err?.message || "Something went wrong. Try again.");
          },
        }
      );
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-9rem)] overflow-x-hidden px-5 py-8 font-inter text-white sm:px-10 sm:py-10"
      style={{
        background: `
          radial-gradient(circle at 80% 5%, rgba(99,102,241,0.35), transparent 30%),
          radial-gradient(circle at 20% 90%, rgba(251,191,36,0.18), transparent 30%),
          linear-gradient(180deg, #050509 0%, #070714 60%, #0e0b18 100%)
        `,
      }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.34em] text-indigo-300">
            [ Step 1 of 2 ]
          </p>
          <h1 className="m-0 mt-2 font-space-grotesk text-3xl font-bold text-white sm:text-4xl">
            Choose Your Specialization
          </h1>
          <p className="m-0 mt-2 max-w-xl text-sm text-white/55">
            Select the skill you want to teach. You'll take a short AI-generated MCQ test to become a verified mentor.
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex gap-3"
        >
          <button
            onClick={() => { setMode("list"); setSelected(null); setErrorMsg(""); }}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 ${
              mode === "list"
                ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
                : "border-white/15 bg-white/5 text-white/50 hover:border-white/30"
            }`}
          >
            Browse Existing
          </button>
          <button
            onClick={() => { setMode("custom"); setSelected(null); setErrorMsg(""); }}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 ${
              mode === "custom"
                ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                : "border-white/15 bg-white/5 text-white/50 hover:border-white/30"
            }`}
          >
            Add New Skill
          </button>
        </motion.div>

        {/* List Mode */}
        {mode === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-white/40">
                <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Loading specializations...
              </div>
            ) : specializations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
                <p className="text-sm text-white/50">No specializations found. Add a custom one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {specializations.map((spec, i) => (
                  <motion.button
                    key={spec._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    onClick={() => handleSelect(spec)}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                      selected?._id === spec._id
                        ? "border-indigo-400/60 bg-indigo-500/15 shadow-lg shadow-indigo-500/10"
                        : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="m-0 font-space-grotesk text-sm font-semibold text-white">
                        {spec.name}
                      </p>
                      {selected?._id === spec._id && (
                        <span className="shrink-0 rounded-full bg-indigo-500 p-0.5">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    {spec.description && (
                      <p className="m-0 mt-1.5 line-clamp-2 text-xs text-white/45">{spec.description}</p>
                    )}
                    <p className="m-0 mt-2 text-[10px] text-white/30">
                      {spec.mentorCount || 0} mentors
                    </p>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Custom Mode */}
        {mode === "custom" && (
          <motion.div
            key="custom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-6"
          >
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
              Add Custom Specialization
            </p>
            <p className="m-0 mt-1 text-xs text-white/50">
              If your skill isn't listed, type it here. A unique AI assessment will be generated for it.
            </p>
            <input
              type="text"
              value={customName}
              onChange={(e) => { setCustomName(e.target.value); setErrorMsg(""); }}
              placeholder="e.g. React Native, System Design, DevOps..."
              className="mt-4 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all"
            />
          </motion.div>
        )}

        {/* Error */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-300"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={handleProceed}
            disabled={isPending || (mode === "list" && !selected) || (mode === "custom" && !customName.trim())}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generating Questions...
              </>
            ) : (
              <>
                Proceed to Assessment
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
          <p className="text-xs text-white/35">AI-generated MCQ · Proctored · ~15 min</p>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
        >
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
            How it works
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-8">
            {[
              { step: "01", text: "Select your specialization above" },
              { step: "02", text: "Take a proctored AI MCQ assessment" },
              { step: "03", text: "Pass to become a verified mentor" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <span className="shrink-0 font-space-grotesk text-lg font-black text-indigo-400/60">{step}</span>
                <p className="m-0 text-xs text-white/50">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SpecializationSelectPage;
