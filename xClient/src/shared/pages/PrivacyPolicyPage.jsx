import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CustomCursor from "../components/CustomCursor";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-[#030307] text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-100 relative overflow-x-hidden pb-20">
      <CustomCursor />
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link to="/" className="flex items-center gap-3 no-underline text-white hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="Solve-X" className="h-8 w-8 object-contain" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] font-mono">Solve-X Privacy</span>
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
                Solve-X Security & Compliance
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Privacy Policy
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                Last Updated: July 08, 2026
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  1. Information We Collect
                </h2>
                <p className="mb-2">
                  To provide a seamless peer-to-peer mentoring and doubt-solving experience, Solve-X collects the following user information:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong>Account Credentials:</strong> Name, Email, password hashes, and profiles (such as skills, timezone, bio, and educational credentials).</li>
                  <li><strong>Active Session Logs:</strong> Duration of the doubt-solving session, timestamps, and status details.</li>
                  <li><strong>Chat Messages:</strong> Standard workspace chat messages are stored securely in our MongoDB database to maintain your resolving history.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  2. WebRTC Media & Hardware Access (Camera / Microphone)
                </h2>
                <p>
                  To run live sessions, Solve-X accesses your device camera and microphone using standard browser APIs (`getUserMedia`).
                </p>
                <p className="mt-2 font-mono text-xs text-amber-300">
                  CRITICAL PRIVACY RULES:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                  <li>We **NEVER** stream, relay, or store your camera or microphone feeds on our servers.</li>
                  <li>All audio and video feeds are strictly Peer-to-Peer (P2P) and encrypted using standard **DTLS-SRTP** protocol tunnels.</li>
                  <li>You can revoke device camera or microphone permissions at any time directly through your browser security settings.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  3. Peer-to-Peer (P2P) Data Channels & File Transfers
                </h2>
                <p>
                  Files, codes, and live instant messages transferred during a video call utilize standard WebRTC `RTCDataChannel` connections:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                  <li><strong>No Server Intermediary:</strong> Files are chunked and streamed directly from the sender's browser memory to the receiver's browser memory.</li>
                  <li><strong>Automatic Encryption:</strong> All data channel payloads are fully encrypted end-to-end (E2EE) and cannot be intercepted by outside parties or the Solve-X server.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  4. Automated Proctoring & AI Evaluation
                </h2>
                <p>
                  For mentors undergoing competency screening assessments:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                  <li>We evaluate assessment answers and topic proficiencies using third-party LLMs (Mistral AI). No personally identifiable details are shared.</li>
                  <li>Automated proctoring monitors browser window focus and active sessions to flags cheating behaviors. Disproportionate infractions will trigger automated profile suspensions.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3 font-mono">
                  5. Contact Us
                </h2>
                <p>
                  For any privacy questions or requests regarding data deletion, please contact the Solve-X Security Compliance department at **security@solve-x.org**.
                </p>
              </section>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
