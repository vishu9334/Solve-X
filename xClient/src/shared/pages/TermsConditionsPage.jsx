import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CustomCursor from "../components/CustomCursor";

const TermsConditionsPage = () => {
  return (
    <div className="min-h-screen bg-[#030307] text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-100 relative overflow-x-hidden pb-20">
      <CustomCursor />
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link to="/" className="flex items-center gap-3 no-underline text-white hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="Solve-X" className="h-8 w-8 object-contain" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] font-mono">Solve-X Terms</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2 rounded-full text-xs font-semibold text-white no-underline transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Home
        </Link>
      </header>

      {/* Legal content Card */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-8 sm:p-12 md:p-14 shadow-2xl overflow-hidden font-mono"
        >
          <div className="relative z-10">
            
            {/* Title */}
            <div className="border-b border-white/10 pb-6 mb-8 text-center sm:text-left">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-[0.3em] block mb-2">
                Solve-X Regulations
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Terms & Conditions
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                Last Updated: July 08, 2026
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By creating an account, selecting a role (Student, Mentor, or Admin), or accessing the Solve-X tutoring workspace, you agree to comply with and be bound by these Terms & Conditions. If you do not agree, you must immediately terminate use of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  2. User Accounts & Responsibilities
                </h2>
                <ul className="list-decimal pl-5 space-y-1 text-xs">
                  <li><strong>Eligibility:</strong> You must register with a valid email address and provide accurate information.</li>
                  <li><strong>Security:</strong> You are responsible for keeping your credentials secure. Any action taken by your account is considered authorized by you.</li>
                  <li><strong>Single Identity:</strong> You may not share your account or credentials with other individuals.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  3. Code of Conduct (Doubt Sessions)
                </h2>
                <p>
                  All live video, chat, audio, and file exchanges are subject to standard professional conduct criteria:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                  <li>Zero tolerance for harassment, hate speech, abusive language, or discrimination.</li>
                  <li>Users must not attempt to exploit the Peer-to-Peer file sharing channel to transmit malicious software, viruses, or unauthorized copyright materials.</li>
                  <li>Admins reserve the right to audit doubt session meta logs and resolve disputes between student-mentor sessions.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  4. Proctoring & Mentor Assessment Regulations
                </h2>
                <p>
                  For mentors submitting skill verification assessments:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                  <li>You must complete assessments independently. Cheat sheets, search lookups, or external assistance is strictly prohibited.</li>
                  <li>Suspicious proctoring triggers (like lost browser window focus) will result in automated system termination, zero-score evaluation, and warning emails sent to your registered address.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  5. Termination & Suspensions
                </h2>
                <p>
                  Solve-X operators reserve the right to suspend or delete accounts for violating code of conduct terms or failing multiple proctoring assessments. Suspended users forfeit active session payouts and credit balances.
                </p>
              </section>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsConditionsPage;
