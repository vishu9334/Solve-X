import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import CustomCursor from '../components/CustomCursor';

const StudentDocPage = () => {
    const [isPastHero, setIsPastHero] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, 'change', (latestScrollY) => {
        const nextIsPastHero = latestScrollY > 120;
        setIsPastHero((currentValue) => (
            currentValue === nextIsPastHero ? currentValue : nextIsPastHero
        ));
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.12 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90 } }
    };

    return (
        <div className="public-page min-h-screen flex flex-col bg-[#f4f4f4] overflow-x-clip custom-cursor-active selection:bg-indigo-500/20 selection:text-indigo-900 font-sans">
            {/* Custom Cursor */}
            <CustomCursor />

            {/* Floating Navbar */}
            <motion.header
                initial={false}
                animate={{
                    backgroundColor: 'rgba(17, 17, 27, 0.90)',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.24)',
                }}
                transition={{ type: 'spring', stiffness: 150, damping: 24, mass: 0.8 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 transform-gpu w-[92%] max-w-[1200px] z-50 flex justify-between items-center py-[14px] border px-6 rounded-full"
            >
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 cursor-pointer no-underline">
                    <img src="/logo.png" alt="Solve-X" className="w-7 h-7 object-contain" />
                    <span className="text-sm font-semibold tracking-[0.15em] uppercase text-white transition-colors duration-300">
                        SOLVE-X
                    </span>
                </Link>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-6">
                    {[
                        { label: 'Home', to: '/' },
                        { label: 'Mentor Docs', to: '/mentor-doc' },
                        { label: 'Student Docs', to: '/student-doc' },
                    ].map((item, i, arr) => (
                        <span key={item.to} className="flex items-center gap-6">
                            <Link
                                to={item.to}
                                className={`text-sm transition-colors duration-300 tracking-[-0.01em] no-underline font-medium ${
                                    item.to === '/student-doc' ? 'text-indigo-400 font-semibold' : 'text-white/85 hover:text-white'
                                }`}
                            >
                                {item.label}
                            </Link>
                            {i < arr.length - 1 && (
                                <span className="w-px h-[22px] shrink-0 bg-white/30" />
                            )}
                        </span>
                    ))}
                </nav>

                {/* Auth Buttons */}
                <div className="flex items-center gap-2.5">
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm rounded-lg border border-white/60 bg-white/10 backdrop-blur-md whitespace-nowrap tracking-[-0.03em] text-lime-400 transition-all duration-300 hover:bg-white/20 cursor-pointer no-underline font-medium"
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm rounded-lg border border-white/60 bg-white/10 backdrop-blur-md whitespace-nowrap tracking-[-0.03em] text-orange-400 transition-all duration-300 hover:bg-white/20 cursor-pointer no-underline font-medium"
                    >
                        Get Started
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </Link>

                    {/* Mobile Hamburger Menu */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex md:hidden items-center justify-center p-1 bg-transparent border-none focus:outline-none cursor-pointer text-white"
                    >
                        <span className="material-symbols-outlined text-2xl select-none">
                            {menuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>

                {/* Mobile Dropdown Panel */}
                {menuOpen && (
                    <div className={`absolute top-[110%] left-0 right-0 z-[1000] flex flex-col gap-3 rounded-3xl border px-6 py-5 shadow-xl backdrop-blur-md md:hidden ${
                        isPastHero ? 'bg-white/95 text-black border-black/10' : 'bg-[#0c0b11]/95 text-white border-white/15'
                    }`}>
                        {[
                            { label: 'Home', to: '/' },
                            { label: 'Mentor Documentation', to: '/mentor-doc' },
                            { label: 'Student Documentation', to: '/student-doc' },
                        ].map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`text-sm py-2.5 border-b font-semibold no-underline transition-colors ${
                                    isPastHero ? 'text-slate-800 hover:text-black border-black/5' : 'text-white/80 hover:text-white border-white/5'
                                }`}
                                onClick={() => setMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div className="flex flex-col gap-2 pt-2">
                            <Link
                                to="/login"
                                className={`w-full h-[40px] flex items-center justify-center rounded-full border text-sm font-semibold no-underline transition-colors ${
                                    isPastHero ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-black' : 'bg-white/5 hover:bg-white/10 border-white/20 text-white'
                                }`}
                                onClick={() => setMenuOpen(false)}
                            >
                                Log In
                            </Link>
                            <Link
                                to="/register"
                                className="w-full h-[40px] flex items-center justify-center rounded-full bg-black text-white text-sm font-semibold no-underline hover:bg-neutral-900 transition-colors"
                                onClick={() => setMenuOpen(false)}
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                )}
            </motion.header>

            {/* Hero Section */}
            <section className="relative w-full pt-44 pb-32 flex items-center justify-center px-4 text-white overflow-hidden bg-[radial-gradient(circle_at_90%_0%,rgba(25,109,300,0.50),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(62,62,244,0.55),transparent_34%),radial-gradient(circle_at_8%_90%,rgba(9,12,179,0.70),transparent_48%),linear-gradient(360deg,#050509_0%,#060612_58%,#15131a_100%)]">
                {/* Bottom Fade to Light */}
                <div
                    className="absolute inset-x-0 bottom-0 h-[28vh] min-h-40 pointer-events-none z-0"
                    style={{
                        background: 'linear-gradient(180deg, rgba(244,244,244,0) 0%, rgba(244,244,244,0.28) 28%, rgba(244,244,244,0.85) 72%, #f4f4f4 100%)',
                    }}
                />

                <div className="relative z-10 flex w-full max-w-[1100px] flex-col items-center gap-6 text-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-400/20 py-1.5 px-4 backdrop-blur-sm text-xs font-semibold text-indigo-300 uppercase tracking-widest">
                        📚 Scholar Resource Guide
                    </span>
                    <h1 className="mx-auto max-w-[900px] font-raleway font-normal leading-[0.9] text-white text-balance text-4xl sm:text-6xl lg:text-7xl">
                        Student Guide & <em className="font-serif italic font-normal text-indigo-300">Guidelines</em>
                    </h1>
                    <p className="mx-auto max-w-[650px] text-sm font-light leading-relaxed text-white/70 sm:text-base text-balance">
                        Resolve coding doubts, compile issues, and learn from experts. Learn how to set up your account, describe doubts, select budget proposals, and collaborate live in our workspace.
                    </p>
                </div>
            </section>

            {/* Document Body */}
            <main className="relative z-10 w-full max-w-[1100px] mx-auto px-4 sm:px-6 pb-28 flex flex-col gap-16 -mt-16">
                
                {/* Table of Contents Section */}
                <div className="reveal-card overflow-hidden rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)]">
                    <h3 className="text-lg font-bold text-black border-b border-slate-100 pb-3 uppercase tracking-wide">Table of Contents</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs font-semibold text-slate-600 pl-0 list-none">
                        {[
                            { name: '1. What is Solve-X?', id: '#overview' },
                            { name: '2. Step-by-Step Flow (First to Last Step)', id: '#steps-guide' },
                            { name: '3. Bid Evaluation & Budget Control', id: '#bidding-details' },
                            { name: '4. Escrow Payments & Secure Refund Guarantee', id: '#payments-policy' },
                            { name: '5. Inside the 1-on-1 Live Workspace', id: '#workspace-details' },
                            { name: '6. Frequently Asked Questions', id: '#faqs' }
                        ].map((item) => (
                            <li key={item.id} className="m-0">
                                <a href={item.id} className="text-slate-600 hover:text-indigo-600 no-underline flex items-center gap-2 transition-colors">
                                    <span className="text-indigo-400">❖</span> {item.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Section 1: Overview */}
                <section id="overview" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">01</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">What is Solve-X?</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>
                            <strong>Solve-X</strong> is an on-demand, interactive peer-to-peer programming workspace that links developers and students experiencing syntax errors, code blocks, or architecture questions with verified tech experts in real-time.
                        </p>
                        <p>
                            Unlike conventional forums, Q&A boards, or pre-recorded courses, Solve-X gets you in front of a live expert immediately. Sessions are conducted inside a dedicated workspace featuring shared code editor synchronization, voice, video, chat, and a custom digital canvas, guaranteeing a hands-on learning outcome.
                        </p>
                    </div>
                </section>

                {/* Section 2: Step-by-Step Flow */}
                <section id="steps-guide" className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">02</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Step-by-Step User Flow (First to Last Step)</h2>
                    </div>

                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.1 }}
                        className="grid grid-cols-1 gap-6"
                    >
                        {[
                            {
                                step: '1',
                                title: 'Registration & Profile Customization',
                                detail: 'Create a free account by providing your email and resolving a standard OTP verification check. Once registered, setup your student profile, list your target languages, current skill sets, and save your preferred timezone settings.'
                            },
                            {
                                step: '2',
                                title: 'Posting Your First Doubt',
                                detail: 'Navigate to the [Ask Doubt] dashboard. Select the relevant technology category (e.g. Frontend React, Node.js Backend, Data Structures). Write a detailed problem statement outlining your expected behavior and actual errors, choose your preferred session duration (15m, 30m, 45m, 60m) and submit. This instantly publishes your doubt to online, skill-verified mentors.'
                            },
                            {
                                step: '3',
                                title: 'Evaluating Custom Bids',
                                detail: 'Once posted, interested expert mentors review your doubt details and submit competitive pricing bids and time slot proposals. You will receive real-time notifications on your student dashboard and notification bell. Examine mentor ratings, review counts, experience levels, and bid pricing.'
                            },
                            {
                                step: '4',
                                title: 'Confirming Selection & Holding Funds',
                                detail: 'After finding the perfect mentor match, click "Accept". You will complete a checkout form matching the bid amount. The funds are placed securely in Solve-X Escrow. The platform now triggers a live interactive room and notifies the mentor to join.'
                            },
                            {
                                step: '5',
                                title: 'P2P Live Collaboration Room',
                                detail: 'Enter your custom workspace. Sync code blocks inside the collaborative editor, run audio/video calls to talk directly, and write diagrams on the white-board canvas to debug errors. The mentor guides you line-by-line.'
                            },
                            {
                                step: '6',
                                title: 'Resolving & Rating the Mentor',
                                detail: 'When the doubt is resolved and you understand the fix, click "Mark Solved" inside the room. This releases the pre-funded payment to the mentor. Write a review rating your experience to help the community.'
                            }
                        ].map((s) => (
                            <motion.div 
                                key={s.step}
                                variants={itemVariants}
                                className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row gap-5 items-start"
                            >
                                <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 font-bold flex items-center justify-center text-sm font-mono">
                                    {s.step}
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="text-base font-bold text-black uppercase tracking-tight m-0">{s.title}</h4>
                                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed m-0 font-light">{s.detail}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* Section 3: Bidding Details */}
                <section id="bidding-details" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">03</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Bidding System Explained</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>
                            To maintain fair market rates and make expert advice accessible, Solve-X employs a <strong>decentralized bidding system</strong> instead of static hourly rates:
                        </p>
                        <ul className="space-y-2 pl-5 list-disc text-slate-500 text-xs sm:text-sm font-light">
                            <li><strong>Budget Flexibility:</strong> Bids start from as low as <strong>$5 (approx. ₹400)</strong>. Mentors suggest bids depending on the complexity of the doubt.</li>
                            <li><strong>Rating Transparency:</strong> Mentors can only submit offers if they have active certifications in the technology catalog you posted. You can see their detailed review records before spending a penny.</li>
                            <li><strong>Time Slot Control:</strong> Each bid includes the mentor's proposed time slot (e.g. "Available Immediately" or "Available in 30 minutes"). Accept the bid that aligns with your schedule.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 4: Payments & Refunds */}
                <section id="payments-policy" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">04</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Escrow Payments & Secure Refund Guarantee</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>
                            Your financial safety is our absolute priority. Solve-X incorporates an official **Escrow Protection system**:
                        </p>
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-light leading-relaxed">
                            <strong>How Escrow Works:</strong> When you accept a mentor's bid, the money is charged from your account but **held securely by Solve-X**. It is NOT paid to the mentor immediately. The mentor only receives payment when you click the <strong>"Mark Solved"</strong> button after your doubt is successfully cleared.
                        </div>
                        <p>
                            <strong>Refund Policy:</strong> If the mentor is unable to solve your problem, or if the session does not meet educational expectations, you can raise an issue flag in the room. Our technical arbitration team will review the room logs (chat, whiteboard activity, and code changes) and return a **100% refund** to your original payment method if verified.
                        </p>
                    </div>
                </section>

                {/* Section 5: Live Workspace */}
                <section id="workspace-details" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">05</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Inside the 1-on-1 Live Workspace</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>
                            The workspace is a premium real-time collaboration environment loaded with modern diagnostic features:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                <h5 className="font-bold text-black uppercase text-xs tracking-wider mb-2">⚡ Collaborative Code Editor</h5>
                                <p className="text-xs text-slate-500 m-0 font-light leading-relaxed">
                                    Write, modify, and review source code simultaneously with syntax highlighting for over 20+ programming languages.
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                <h5 className="font-bold text-black uppercase text-xs tracking-wider mb-2">📞 Live Audio & Video</h5>
                                <p className="text-xs text-slate-500 m-0 font-light leading-relaxed">
                                    Direct WebRTC voice and video streams. Explain your conceptual blockers and debug together without third-party software.
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                <h5 className="font-bold text-black uppercase text-xs tracking-wider mb-2">🎨 Infinite Whiteboard</h5>
                                <p className="text-xs text-slate-500 m-0 font-light leading-relaxed">
                                    Draw architecture flows, trace execution logic, and explain design patterns visually on a shared canvas.
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                <h5 className="font-bold text-black uppercase text-xs tracking-wider mb-2">🖥️ Instant Screen Sharing</h5>
                                <p className="text-xs text-slate-500 m-0 font-light leading-relaxed">
                                    Share your terminal, compiler outputs, or local IDE setup so your mentor can see the exact error environment.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 6: FAQs */}
                <section id="faqs" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">06</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Frequently Asked Questions (FAQ)</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] space-y-6">
                        {[
                            {
                                q: "Are there any hidden monthly subscription plans?",
                                a: "No. Solve-X has zero subscription fees or monthly retainers. You only pay for the individual doubt session bids that you approve."
                            },
                            {
                                q: "How long does a mentor have to reply to my posted doubt?",
                                a: "Most doubts receive their first bids within 2-5 minutes. Doubts remain active for up to 24 hours, after which they expire if not accepted."
                            },
                            {
                                q: "What should I do if a mentor behaves unprofessionally?",
                                a: "You can click the 'Report Session' flag inside the chat or workspace interface. Solve-X reviews all reported rooms, bans offending accounts, and returns your payment."
                            },
                            {
                                q: "Can I choose my favorite mentor for future doubts?",
                                a: "Yes! You can mark helpful mentors as 'Favorites' on their profile pages and request them directly for future doubts."
                            }
                        ].map((faq, i) => (
                            <div key={i} className="space-y-1.5">
                                <h4 className="text-xs sm:text-sm font-bold text-black uppercase tracking-wide">Q: {faq.q}</h4>
                                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-light m-0">A: {faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Action CTA */}
                <div className="text-center space-y-5 pt-6 border-t border-slate-200">
                    <h3 className="text-xl font-raleway font-semibold text-black uppercase tracking-tight m-0">Have a coding roadblock?</h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-light max-w-md mx-auto leading-relaxed">
                        Connect with verified experts in React, Python, C++, AWS, and more. Bids start at just ₹99.
                    </p>
                    <Link to="/register?role=student" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold uppercase tracking-wider text-xs px-8 py-4 hover:opacity-90 no-underline transition-all shadow-[0_6px_20px_rgba(99,102,241,0.25)] hover:scale-105">
                        Post Your Doubt Now
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#f4f4f4] border-t border-black/8 py-6 px-6 mt-auto">
                <div className="mx-auto max-w-[1200px] flex flex-col sm:flex-row justify-between items-center gap-2 text-[13px] text-black/35 font-mono">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Solve-X" className="w-5 h-5 object-contain opacity-35" />
                        <span>© 2026 SOLVE-X. ALL RIGHTS RESERVED.</span>
                    </div>
                    <span>[ STATUS: READY ]</span>
                </div>
            </footer>
        </div>
    );
};

export default StudentDocPage;
