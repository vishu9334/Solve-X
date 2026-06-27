import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import CustomCursor from '../components/CustomCursor';

const MentorDocPage = () => {
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
                    backgroundColor: isPastHero ? 'rgba(255, 255, 255, 0.95)' : 'rgba(17, 17, 27, 0.90)',
                    borderColor: isPastHero ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.15)',
                    boxShadow: isPastHero ? '0 8px 24px rgba(31, 38, 135, 0.08)' : '0 8px 24px rgba(0, 0, 0, 0.24)',
                }}
                transition={{ type: 'spring', stiffness: 150, damping: 24, mass: 0.8 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 transform-gpu w-[92%] max-w-[1200px] z-50 flex justify-between items-center py-[14px] border px-6 rounded-full"
            >
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 cursor-pointer no-underline">
                    <img src="/logo.png" alt="Solve-X" className="w-7 h-7 object-contain" />
                    <span className={`text-sm font-semibold tracking-[0.15em] uppercase transition-colors duration-300 ${isPastHero ? 'text-black' : 'text-white'}`}>
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
                                    isPastHero 
                                        ? item.to === '/mentor-doc' ? 'text-indigo-600 font-semibold' : 'text-slate-700 hover:text-black' 
                                        : item.to === '/mentor-doc' ? 'text-indigo-400 font-semibold' : 'text-white/85 hover:text-white'
                                }`}
                            >
                                {item.label}
                            </Link>
                            {i < arr.length - 1 && (
                                <span className={`w-px h-[22px] shrink-0 ${isPastHero ? 'bg-slate-200' : 'bg-white/30'}`} />
                            )}
                        </span>
                    ))}
                </nav>

                {/* Auth Buttons */}
                <div className="flex items-center gap-2.5">
                    <Link
                        to="/login"
                        className={`hidden sm:inline-flex h-[42px] w-[100px] items-center justify-center rounded-full border text-sm font-medium tracking-[-0.03em] no-underline transition-colors duration-200 ${
                            isPastHero
                                ? 'bg-gradient-to-b from-white to-[#e2e2e2] border-black/12 text-black hover:to-white'
                                : 'bg-gradient-to-b from-white to-[#e2e2e2] border-white/20 text-black hover:to-white'
                        }`}
                    >
                        Log In
                    </Link>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 h-[42px] rounded-full border border-white/25 bg-gradient-to-b from-[#242424] from-[19%] to-black px-5 text-sm font-medium tracking-[-0.03em] text-white no-underline transition-colors duration-300 hover:from-[#2e2e2e] hover:to-neutral-900 cursor-pointer"
                    >
                        Get Started
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </Link>

                    {/* Mobile Hamburger Menu */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={`flex md:hidden items-center justify-center p-1 bg-transparent border-none focus:outline-none cursor-pointer ${isPastHero ? 'text-black' : 'text-white'}`}
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
                        🎓 Mentor Expert Guide
                    </span>
                    <h1 className="mx-auto max-w-[900px] font-raleway font-normal leading-[0.9] text-white text-balance text-4xl sm:text-6xl lg:text-7xl">
                        Mentor Guide & <em className="font-serif italic font-normal text-indigo-300">Guidelines</em>
                    </h1>
                    <p className="mx-auto max-w-[650px] text-sm font-light leading-relaxed text-white/70 sm:text-base text-balance">
                        Share your technical expertise, bid on student issues, and earn directly with 0% platform commission fees. Learn about verification, bidding rules, and live workspace guidelines.
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
                            { name: '1. What is Solve-X for Mentors?', id: '#overview' },
                            { name: '2. Earning Flow (First to Last Step)', id: '#steps-guide' },
                            { name: '3. Strategic Bidding Guidelines', id: '#bidding-details' },
                            { name: '4. Escrow Financials & 0% Platform Commission', id: '#payments-policy' },
                            { name: '5. Technical Workspace Operations', id: '#workspace-details' },
                            { name: '6. Mentor Code of Conduct & Rules', id: '#conduct-rules' },
                            { name: '7. Frequently Asked Questions', id: '#faqs' }
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
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">What is Solve-X for Mentors?</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>
                            Solve-X is a real-time peer-to-peer workspace linking students experiencing coding blocks with tech experts who can help them resolve issues instantly.
                        </p>
                        <p>
                            As a mentor on Solve-X, you are not writing solutions to static tickets or recording content tutorials. Instead, you enter a collaborative 1-on-1 environment to code, speak, draw, and guide students live. This offers an interactive, rewarding format to monetize your software engineering skills.
                        </p>
                    </div>
                </section>

                {/* Section 2: Step-by-Step Earning Flow */}
                <section id="steps-guide" className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">02</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Step-by-Step Earning Flow (First to Last Step)</h2>
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
                                title: 'Onboarding & Profile Setup',
                                detail: 'Register a Solve-X account. Choose the "Mentor" role. Fill out your professional profile: add an avatar, write a professional headline, specify your experience years, and list your specialized programming stacks (e.g. JavaScript, Python, AWS, SQL).'
                            },
                            {
                                step: '2',
                                title: 'Credentials Verification Process',
                                detail: 'Solve-X implements a verification process to ensure student security. Our moderation team reviews your professional history, skills list, and linked social profiles (like LinkedIn/GitHub). Approvals are completed within 24 hours.'
                            },
                            {
                                step: '3',
                                title: 'Receiving Doubt Notifications',
                                detail: 'Once verified, you will receive real-time notifications on your Mentor Dashboard and header notification bell whenever a student posts a doubt matching your skill tags. These cards contain detailed problem descriptions and preferred session times.'
                            },
                            {
                                step: '4',
                                title: 'Submitting a Bid Proposal',
                                detail: 'If you can resolve the student\'s doubt, submit a custom bid. Specify your price proposal (e.g. $10) and your available time slot (e.g. "Available immediately" or "Available at 4:30 PM"). You can edit or withdraw active bids before they are accepted.'
                            },
                            {
                                step: '5',
                                title: 'Peer-to-Peer Live Troubleshooting',
                                detail: 'Once the student accepts your bid, enter the 1-on-1 Workspace. Use the real-time collaborative code editor, voice/video streams, chat, and white-board drawings to help the student understand and resolve their bug.'
                            },
                            {
                                step: '6',
                                title: 'Resolution Acceptance & Direct Payout',
                                detail: 'After successfully solving the doubt, the student clicks "Mark Solved". Solve-X Escrow immediately releases the pre-funded payment amount. This is transferred directly to your wallet/bank account with 0% platform deductions.'
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

                {/* Section 3: Bidding Rules */}
                <section id="bidding-details" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">03</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Strategic Bidding Guidelines</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>
                            To maximize your bid acceptance rates and build a solid professional reputation on Solve-X, follow these practices:
                        </p>
                        <ul className="space-y-2 pl-5 list-disc text-slate-500 text-xs sm:text-sm font-light">
                            <li><strong>Honest Pricing:</strong> Bid reasonably depending on the complexity of the doubt. Students compare multiple bids before choosing a mentor.</li>
                            <li><strong>Clear Time Commitments:</strong> Only select "Available Immediately" if you are sitting at your development machine and ready to click join. Keep your calendar accurate.</li>
                            <li><strong>Read Doubt Details Carefully:</strong> Do not place generic bids. Read the code description and error stack posted by the student. If the technology is outside your expertise, skip the doubt.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 4: Payments Policy */}
                <section id="payments-policy" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">04</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Escrow Financials & 0% Platform Commission</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>
                            Solve-X operates on an **expert-first financial framework**. We believe your knowledge is valuable and you should be compensated directly:
                        </p>
                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs sm:text-sm font-light leading-relaxed">
                            <strong>Zero Platform Commission:</strong> Solve-X takes **0% commission** from mentor earnings. The bid price accepted by the student is the exact amount you receive in your payout wallet.
                        </div>
                        <p>
                            <strong>Escrow Lock:</strong> To prevent fraud and ensure you get paid after resolving a doubt, students are charged upfront before entering the session. Once they mark the doubt solved, these funds release instantly.
                        </p>
                        <p>
                            <strong>Dispute Resolution:</strong> If a student refuses to release funds despite you providing the correct fix, you can flag a dispute. Solve-X moderators will check the workspace logs, code changes, and chat history. If you resolved the issue, moderators will manually release your payout.
                        </p>
                    </div>
                </section>

                {/* Section 5: Technical Workspace Operations */}
                <section id="workspace-details" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">05</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Technical Workspace Operations</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>
                            The live session workspace has advanced collaborative features designed to make debugging effortless:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                <h5 className="font-bold text-black uppercase text-xs tracking-wider mb-2">💻 Interactive Sync Editor</h5>
                                <p className="text-xs text-slate-500 m-0 font-light leading-relaxed">
                                    Simultaneous editing with tab spacing control, theme selections, and custom language support.
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                <h5 className="font-bold text-black uppercase text-xs tracking-wider mb-2">🔊 WebRTC Voice & Video</h5>
                                <p className="text-xs text-slate-500 m-0 font-light leading-relaxed">
                                    Conduct direct video calls. Share tips, explain best practices, and collaborate verbally.
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                <h5 className="font-bold text-black uppercase text-xs tracking-wider mb-2">🎨 Architecture Canvas</h5>
                                <p className="text-xs text-slate-500 m-0 font-light leading-relaxed">
                                    An interactive whiteboard to draw design architectures, network flows, and data structure maps.
                                </p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                <h5 className="font-bold text-black uppercase text-xs tracking-wider mb-2">🖥️ Multi-Screen Sharing</h5>
                                <p className="text-xs text-slate-500 m-0 font-light leading-relaxed">
                                    Review the student\'s terminal window, browser logs, or compiler settings to pinpoint complex errors.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 6: Mentor Code of Conduct */}
                <section id="conduct-rules" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">06</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Mentor Code of Conduct & Rules</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>
                            Solve-X is built on high educational standards. Mentors must follow these professional guidelines:
                        </p>
                        <ul className="space-y-3 pl-5 list-disc text-slate-500 text-xs sm:text-sm font-light">
                            <li><strong>Be a Teacher, Not Just a Fixer:</strong> Explain the cause of the bug and why the fix works. Help the student grow their skills instead of just pasting code chunks.</li>
                            <li><strong>Professional Demeanor:</strong> Maintain professional, polite behavior. Offensive language, harassment, or impatience will lead to immediate account termination.</li>
                            <li><strong>No Off-Platform Payments:</strong> Discussing, asking for, or accepting payments outside Solve-X is strictly prohibited. Escrow protection is only available for platform transactions.</li>
                            <li><strong>No Plagiarism or AI Dumping:</strong> Do not just copy-paste unverified code dumps or ChatGPT responses without explaining the logic to the student.</li>
                        </ul>
                    </div>
                </section>

                {/* Section 7: FAQs */}
                <section id="faqs" className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">07</span>
                        <h2 className="text-2xl font-raleway font-semibold text-black tracking-tight uppercase m-0">Frequently Asked Questions (FAQ)</h2>
                    </div>
                    <div className="reveal-card rounded-[24px] border-[10px] border-white bg-white p-6 sm:p-8 shadow-[0_18px_60px_rgba(15,23,42,0.03)] space-y-6">
                        {[
                            {
                                q: "Are there any platform registration fees?",
                                a: "No. Solve-X has zero onboarding costs, bidding charges, or profile listing fees for mentors. We keep onboarding 100% free."
                            },
                            {
                                q: "How long does verification take?",
                                a: "Verification is conducted by our moderation team within 24 hours. You will receive an email and a dashboard banner update once approved."
                            },
                            {
                                q: "What happens if a student exits the room without marking it solved?",
                                a: "If the student exits, the session enters an automatic 15-minute wait state. If they do not return, you can click 'Request Arbitration'. Our team will check the log data and release the payment."
                            },
                            {
                                q: "How do payouts work?",
                                a: "Payouts are transferred directly to your connected Stripe or bank account. You can request payouts instantly on your mentor wallet dashboard once the escrow releases."
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
                    <h3 className="text-xl font-raleway font-semibold text-black uppercase tracking-tight m-0">Ready to share your expertise?</h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-light max-w-md mx-auto leading-relaxed">
                        Join our expert community. Solve real-world issues, guide aspiring developers, and earn payouts with 0% platform commission.
                    </p>
                    <Link to="/register?role=mentor" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold uppercase tracking-wider text-xs px-8 py-4 hover:opacity-90 no-underline transition-all shadow-[0_6px_20px_rgba(99,102,241,0.25)] hover:scale-105">
                        Apply Now as Mentor
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

export default MentorDocPage;
