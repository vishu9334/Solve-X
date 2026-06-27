import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CustomCursor from "../components/CustomCursor";

const AdminDocPage = () => {
  return (
    <div className="min-h-screen bg-[#030307] text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-100 relative overflow-x-hidden pb-20">
      <CustomCursor />
      
      {/* Import Premium Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Styled Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Header / Nav */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link to="/admin-landing" className="flex items-center gap-3 no-underline text-white hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="Solve-X" className="h-8 w-8 object-contain" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] font-space-grotesk">Solve-X Operator</span>
        </Link>
        <Link
          to="/admin-landing"
          className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 px-5 py-2 rounded-full text-xs font-semibold text-blue-300 no-underline transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Control Center
        </Link>
      </header>

      {/* A4 Paper Wrapper */}
      <div className="max-w-[850px] mx-auto px-4 sm:px-6 mt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-3xl border border-blue-500/15 bg-black/40 backdrop-blur-2xl p-8 sm:p-12 md:p-16 shadow-[0_30px_100px_rgba(9,12,179,0.18)] overflow-hidden font-outfit"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {/* Subtle Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.018] rotate-[-12deg]">
            <img src="/logo.png" alt="Watermark" className="w-[450px] h-[450px] object-contain" />
          </div>

          <div className="relative z-10">
            {/* Title Block */}
            <div className="border-b border-blue-500/20 pb-8 mb-10 text-center sm:text-left">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] block mb-2 font-space-grotesk">
                SYSTEM ARCHITECTURE SPECIFICATION
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-space-grotesk leading-tight">
                Solve-X Live Video Call Integration
              </h1>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-2xl">
                Technical design document (HLD & LLD) describing the migration from Daily.co to Jitsi Meet for instant, ephemeral student-mentor video sessions.
              </p>
            </div>

            {/* Document Metadata Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-blue-950/20 border border-blue-500/10 rounded-2xl p-4 mb-10 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block mb-0.5 uppercase tracking-wider text-[8px] font-bold">Author</span>
                <span className="font-semibold text-blue-300">Solve-X Architect</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 uppercase tracking-wider text-[8px] font-bold">Document Version</span>
                <span className="font-semibold text-blue-300">v2.1.0 (Active)</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 uppercase tracking-wider text-[8px] font-bold">Protocol</span>
                <span className="font-semibold text-blue-300">WebRTC / Jitsi SDK</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5 uppercase tracking-wider text-[8px] font-bold">License Status</span>
                <span className="font-semibold text-emerald-400">100% Free / Open Source</span>
              </div>
            </div>

            {/* SECTION 1 */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-blue-300 font-space-grotesk m-0">
                  1. High-Level Design (HLD)
                </h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                The Solve-X video subsystem uses an ephemeral, peer-to-peer WebRTC mesh network structure powered by Jitsi Meet. When a doubt session is accepted, a private meeting channel is generated dynamically. Jitsi's global routing infrastructure automatically routes traffic to the nearest geographic SFU (Selective Forwarding Unit) nodes, maintaining sub-100ms latency.
              </p>

              {/* Architecture diagram box */}
              <div className="rounded-2xl border border-blue-500/10 bg-blue-950/10 p-6 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 text-center font-space-grotesk">
                  Solve-X Live Connection Topography
                </h3>
                
                {/* Visual Flow diagram */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-center text-xs">
                  <div className="flex-1 bg-black/40 border border-blue-500/20 rounded-xl p-4 flex flex-col items-center gap-2">
                    <span className="text-lg">👨‍🎓</span>
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">Student Client</span>
                    <span className="text-[9px] text-slate-500">React App (xClient)</span>
                  </div>

                  <div className="h-6 w-px bg-blue-500/30 sm:w-10 sm:h-px self-center" />

                  <div className="flex-1 bg-blue-950/40 border border-blue-400/30 rounded-xl p-4 flex flex-col items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <span className="text-lg">⚙️</span>
                    <span className="font-bold text-blue-300 uppercase tracking-wider text-[10px]">Backend Server</span>
                    <span className="text-[9px] text-slate-500">Express / MongoDB</span>
                  </div>

                  <div className="h-6 w-px bg-blue-500/30 sm:w-10 sm:h-px self-center" />

                  <div className="flex-1 bg-black/40 border border-blue-500/20 rounded-xl p-4 flex flex-col items-center gap-2">
                    <span className="text-lg">🧑‍🏫</span>
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">Mentor Client</span>
                    <span className="text-[9px] text-slate-500">React App (xClient)</span>
                  </div>
                </div>

                {/* Shared Server Router */}
                <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center">
                  <div className="bg-indigo-950/30 border border-indigo-400/20 rounded-xl px-6 py-4 flex flex-col items-center gap-1.5 w-full max-w-sm text-center">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest font-space-grotesk">Jitsi Meet Server Node</span>
                    <p className="text-[9px] text-slate-400 m-0">Handles WebRTC SFU forwarding, screensharing streams, and ephemeral room routing.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p>
                  <strong>No Account / Card Limitations:</strong> Unlike Daily.co, Jitsi Meet does not require card registration or developer accounts. Ephemeral rooms are dynamically created and destroyed when the last user exits, saving cloud infrastructure and payment costs.
                </p>
                <p>
                  <strong>Security & Privacy:</strong> Meeting rooms are unlisted and named using long, non-guessable hashes containing the unique doubt session ID and an epoch timestamp. This prevents session hijacking.
                </p>
              </div>
            </section>

            {/* SECTION 2 */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-blue-300 font-space-grotesk m-0">
                  2. Low-Level Design (LLD)
                </h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Below is the detailed implementation logic showing how room requests are handled, saved in MongoDB, and broadcasted to both connected clients via Socket.io.
              </p>

              {/* Step list */}
              <div className="space-y-6 text-sm">
                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="m-0 font-bold text-white">Call Hook / Start Room Request</h4>
                    <p className="mt-1 text-slate-400 leading-relaxed text-xs">
                      The mentor clicks "Start Video Call" in their Chat Workspace. The client triggers the `useStartVideoCall` mutation hook which sends a POST request to `/api/v1/daily/connect/:doubtId`.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="m-0 font-bold text-white">Create Ephemeral Jitsi Room Object</h4>
                    <p className="mt-1 text-slate-400 leading-relaxed text-xs">
                      The backend `dailyService` generates a unique hash string `solvex-doubt-[doubtId]-[timestamp]`. It packs it into a response payload pointing to Jitsi's free public server: `https://meet.jit.si/[roomName]`.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="m-0 font-bold text-white">Database Synchronization</h4>
                    <p className="mt-1 text-slate-400 leading-relaxed text-xs">
                      The generated `videoRoomUrl` and `videoRoomName` are saved inside the matching `DoubtSession` document in MongoDB, ensuring that if a user reloads the browser, the video call state is fully retained.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="m-0 font-bold text-white">Real-Time Socket Broadcast</h4>
                    <p className="mt-1 text-slate-400 leading-relaxed text-xs">
                      The backend server invokes `sendNotificationToUser` to dispatch a `session:started` event containing the URL to both the Student and the Mentor.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3 */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-blue-300 font-space-grotesk m-0">
                  3. Implementation Details & Code Structure
                </h2>
              </div>

              {/* Code Snippet 1 */}
              <div className="mb-6">
                <div className="flex justify-between items-center bg-zinc-900 border border-b-0 border-blue-500/15 rounded-t-xl px-4 py-2 text-[10px] font-mono text-slate-400">
                  <span>Backend Generation (daily.service.js)</span>
                  <span className="text-blue-400 uppercase tracking-widest text-[8px] font-bold">Node.js</span>
                </div>
                <pre className="m-0 p-4 bg-zinc-950 border border-blue-500/15 rounded-b-xl overflow-x-auto text-[11px] font-mono text-emerald-400/90 leading-relaxed">
{`createDailRoom = async (doubtId) => {
    const room = await dailyRepository.dailyDoubtFind(doubtId);
    if (!room) throw new ApiError(400, "Session doubt not found");

    const roomName = \`solvex-doubt-\${doubtId}-\${Date.now()}\`;
    return {
        name: roomName,
        url: \`https://meet.jit.si/\${roomName}\`
    };
}`}
                </pre>
              </div>

              {/* Code Snippet 2 */}
              <div className="mb-6">
                <div className="flex justify-between items-center bg-zinc-900 border border-b-0 border-blue-500/15 rounded-t-xl px-4 py-2 text-[10px] font-mono text-slate-400">
                  <span>Frontend Listeners (ChatRoomPage.jsx)</span>
                  <span className="text-blue-400 uppercase tracking-widest text-[8px] font-bold">React / Hooks</span>
                </div>
                <pre className="m-0 p-4 bg-zinc-950 border border-blue-500/15 rounded-b-xl overflow-x-auto text-[11px] font-mono text-emerald-400/90 leading-relaxed">
{`useEffect(() => {
    if (!socket || !chatRoomId) return;

    socket.on("session:started", ({ videoRoomUrl }) => {
        setVideoUrl(videoRoomUrl);
        toast.info("Video call has been started!");
    });

    return () => {
        socket.off("session:started");
    };
}, [socket, chatRoomId]);`}
                </pre>
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-blue-500/15 pt-8 text-center text-slate-500 text-[10px] uppercase tracking-widest">
              © {new Date().getFullYear()} Solve-X Inc. All Rights Reserved. Confidential Operator Docs.
            </footer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDocPage;
