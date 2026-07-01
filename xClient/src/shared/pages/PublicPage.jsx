import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../../features/auth/store/auth.store';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useLenis } from 'lenis/react';
import CustomCursor from '../components/CustomCursor';
import CharacterSection from '../components/CharacterSection';
import Preloader from '../components/Preloader';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser.js';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.12 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90 } }
};

const heroContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2
        }
    }
};

const heroItemVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.25, 1, 0.5, 1] } }
};

const navContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.3
        }
    }
};

const navItemVariants = {
    hidden: { opacity: 0, y: -15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } }
};

const cardsContainerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.12
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 60 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } }
};

const mentorContainerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const mentorItemVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } }
};

const PublicPage = () => {
    useAuthStore();
    const [isPastHero, setIsPastHero] = useState(false);
    const [preloaderComplete, setPreloaderComplete] = useState(() => window.__solveXPreloaderRun === true);
    const [menuOpen, setMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    const lenis = useLenis();

    // ── Lock body scroll and Lenis during preloader ──
    useEffect(() => {
        if (!preloaderComplete) {
            document.body.style.overflow = 'hidden';
            if (lenis) lenis.stop();
        } else {
            document.body.style.overflow = '';
            if (lenis) {
                lenis.start();
                lenis.scrollTo(0, { immediate: true });
            } else {
                window.scrollTo(0, 0);
            }
        }
        return () => {
            document.body.style.overflow = '';
            if (lenis) lenis.start();
        };
    }, [preloaderComplete, lenis]);

    const handleScrollTo = (e, targetId) => {
        e.preventDefault();
        if (lenis) {
            lenis.scrollTo(targetId, { offset: -88, duration: 1.2 });
        } else {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    // refs
    const pageRef = useRef(null);
    const heroRef = useRef(null);
    const howItWorksRef = useRef(null);
    const mentorSectionRef = useRef(null);

    useMotionValueEvent(scrollY, 'change', (latestScrollY) => {
        const nextIsPastHero = latestScrollY > window.innerHeight - 100;
        setIsPastHero((currentValue) => (
            currentValue === nextIsPastHero ? currentValue : nextIsPastHero
        ));
    });

    const { data: currentUser, isPending } = useCurrentUser();

    if (isPending) {
        return null;
    }

    if (currentUser) {
        if (currentUser.role === 'admin') return <Navigate to="/admin-landing" replace />;
        if (currentUser.role === 'mentor') return <Navigate to="/mentor-landing" replace />;
        return <Navigate to="/student-landing" replace />;
    }

    if (!preloaderComplete) {
        return (
            <Preloader
                onComplete={() => {
                    window.__solveXPreloaderRun = true;
                    setPreloaderComplete(true);
                }}
            />
        );
    }

    return (
        <div ref={pageRef} className="public-page min-h-screen flex flex-col bg-[#f4f4f4] overflow-x-clip custom-cursor-active">

            {/* Custom Cursor */}
            <CustomCursor />

            {/* ── Floating Pill Navbar ── */}
            <motion.header
                initial={false}
                animate={{
                    backgroundColor: isPastHero ? 'rgba(255, 255, 255, 0.95)' : 'rgba(17, 17, 27, 0.90)',
                    borderColor: isPastHero ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.15)',
                    boxShadow: isPastHero
                        ? '0 8px 24px rgba(31, 38, 135, 0.08)'
                        : '0 8px 24px rgba(0, 0, 0, 0.24)',
                }}
                transition={{ type: 'spring', stiffness: 150, damping: 24, mass: 0.8 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 transform-gpu w-[92%] max-w-[1200px] z-50 flex justify-between items-center py-[14px] border px-6 rounded-full"
            >
                {/* Logo */}
                <a
                    href="#hero"
                    onClick={(e) => handleScrollTo(e, '#hero')}
                    className="flex items-center gap-2.5 cursor-pointer"
                >
                    <img src="/logo.png" alt="Solve-X" className="w-7 h-7 object-contain" />
                    <span className={`text-sm font-semibold tracking-[0.15em] uppercase transition-colors duration-300 ${isPastHero ? 'text-black' : 'text-white'}`}>
                        SOLVE-X
                    </span>
                </a>

                {/* Nav Links */}
                <motion.nav
                    variants={navContainerVariants}
                    initial="hidden"
                    animate="show"
                    className="hidden xl:flex items-center gap-6"
                >
                    {[
                        { label: 'Home', to: '#hero', isAnchor: true },
                        { label: 'How It Works', to: '#how-it-works', isAnchor: true },
                        { label: 'Mentor', to: '#mentor', isAnchor: true },
                        { label: 'MentorDocs', to: '/mentor-doc', isAnchor: false },
                        { label: 'StudentDocs', to: '/student-doc', isAnchor: false },
                    ].map((item, i, arr) => (
                        <motion.span key={item.to} variants={navItemVariants} className="flex items-center gap-6">
                            {item.isAnchor ? (
                                <a
                                    href={item.to}
                                    onClick={(e) => handleScrollTo(e, item.to)}
                                    className={`text-sm transition-colors duration-300 tracking-[-0.01em] ${isPastHero ? 'text-slate-700 hover:text-black' : 'text-white/85 hover:text-white'}`}
                                >
                                    {item.label}
                                </a>
                            ) : (
                                <Link
                                    to={item.to}
                                    className={`text-sm transition-colors duration-300 tracking-[-0.01em] ${isPastHero ? 'text-slate-700 hover:text-black' : 'text-white/85 hover:text-white'}`}
                                >
                                    {item.label}
                                </Link>
                            )}
                            {i < arr.length - 1 && (
                                <span className={`w-px h-[22px] shrink-0 ${isPastHero ? 'bg-slate-200' : 'bg-white/30'}`} />
                            )}
                        </motion.span>
                    ))}
                </motion.nav>

                {/* Auth Buttons */}
                <div className="flex items-center gap-2.5">
                    <motion.div
                        whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(62,62,244,0.2)' }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="hidden sm:inline-block"
                    >
                        <Link
                            to="/login"
                            className={`inline-flex h-[42px] w-[100px] items-center justify-center rounded-full border text-sm font-medium tracking-[-0.03em] transition-colors duration-200 ${isPastHero
                                ? 'bg-gradient-to-b from-white to-[#e2e2e2] border-black/12 text-black'
                                : 'bg-gradient-to-b from-white to-[#e2e2e2] border-white/20 text-black'
                                }`}
                        >
                            Log In
                        </Link>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(255,255,255,0.15)' }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="hidden sm:inline-block"
                    >
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 h-[42px] rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 text-sm font-semibold tracking-[-0.03em] text-white transition-all duration-300 hover:bg-white/20 cursor-pointer"
                        >
                            Get Started
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </Link>
                    </motion.div>

                    {/* Mobile Hamburger menu */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={`flex xl:hidden items-center justify-center p-1 bg-transparent border-none focus:outline-none cursor-pointer ${isPastHero ? 'text-black' : 'text-white'}`}
                    >
                        <span className="material-symbols-outlined text-2xl select-none">
                            {menuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>

                {/* Mobile Dropdown Panel */}
                {menuOpen && (
                    <div className="absolute top-[110%] left-0 right-0 z-[1000] flex flex-col gap-3 rounded-3xl border border-blue-500/25 bg-blue-950/45 px-6 py-5 shadow-[0_20px_50px_rgba(30,58,138,0.25)] backdrop-blur-xl xl:hidden text-white">
                        {[
                            { label: 'Home', to: '#hero', isAnchor: true },
                            { label: 'How It Works', to: '#how-it-works', isAnchor: true },
                            { label: 'Mentor', to: '#mentor', isAnchor: true },
                            { label: 'MentorDocs', to: '/mentor-doc', isAnchor: false },
                            { label: 'StudentDocs', to: '/student-doc', isAnchor: false },
                        ].map((item) => (
                            item.isAnchor ? (
                                <a
                                    key={item.to}
                                    href={item.to}
                                    onClick={(e) => {
                                        setMenuOpen(false);
                                        handleScrollTo(e, item.to);
                                    }}
                                    className="text-sm py-2.5 border-b font-semibold transition-colors text-white/80 hover:text-white border-white/10"
                                >
                                    {item.label}
                                </a>
                            ) : (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className="text-sm py-2.5 border-b font-semibold transition-colors text-white/80 hover:text-white border-white/10"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            )
                        ))}
                        <div className="flex flex-col gap-2 pt-2">
                            <Link
                                to="/login"
                                className="w-full h-[42px] flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
                                onClick={() => setMenuOpen(false)}
                            >
                                Log In
                            </Link>
                            <Link
                                to="/register"
                                className="w-full h-[42px] flex items-center justify-center rounded-full border border-white/20 bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition-all cursor-pointer"
                                onClick={() => setMenuOpen(false)}
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                )}
            </motion.header>

            {/* ── Hero Section ── */}
            <section
                ref={heroRef}
                id="hero"
                className="relative w-full min-h-screen flex items-center justify-center px-4 pt-32 pb-32 text-white overflow-hidden bg-[radial-gradient(circle_at_90%_0%,rgba(25,109,300,0.50),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(62,62,244,0.55),transparent_34%),radial-gradient(circle_at_8%_90%,rgba(9,12,179,0.70),transparent_48%),linear-gradient(360deg,#050509_0%,#060612_58%,#15131a_100%)]"
            >
                {/* Bottom fade to #f4f4f4 */}
                <div
                    className="absolute inset-x-0 bottom-0 h-[28vh] min-h-40 pointer-events-none z-0"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(244,244,244,0) 0%, rgba(244,244,244,0.28) 28%, rgba(244,244,244,0.85) 72%, #f4f4f4 100%)',
                    }}
                />

                {/* Hero Content */}
                <motion.div
                    variants={heroContainerVariants}
                    initial="hidden"
                    animate="show"
                    className="flex w-full max-w-[1100px] flex-col items-center gap-7 text-center"
                >

                    {/* Badge */}
                    <motion.div
                        variants={heroItemVariants}
                        className="inline-flex items-center gap-2 rounded-full bg-black/10 border border-white/12 py-2 px-4 backdrop-blur-sm"
                    >
                        <span className="text-[13px] text-white/90 leading-5">
                            ⚡ Real-Time Mentor Matching Platform
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={heroItemVariants}
                        className="mx-auto max-w-[1000px] font-raleway font-normal leading-[0.9] text-white text-balance"
                        style={{ fontSize: 'clamp(2.6rem, 6.5vw, 72px)' }}
                    >
                        Real Doubts. Real Mentors.{' '}
                        <em className="font-serif font-normal italic text-green-500">Real Answers.</em>
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p
                        variants={heroItemVariants}
                        className="mx-auto max-w-[680px] text-base font-light leading-7 text-white/70 md:text-lg text-balance"
                    >
                        Solve-X connects students with industry-expert mentors in real-time. Post your doubts,
                        receive competitive bids from verified mentors within minutes, and resolve issues via
                        interactive 1-on-1 sessions.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div variants={heroItemVariants} className="flex flex-col items-center gap-2.5">
                        <motion.div
                            whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(62,62,244,0.2)' }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="inline-block rounded-full"
                        >
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center rounded-full border bg-white/20 backdrop-blur-md px-8 py-3.5 text-base font-bold text-white transition-all hover:bg-white-300/20 hover:shadow-[0_0_20px_rgba(251,191,36,0.25)] cursor-pointer"
                            >
                                Create an Account — It's Free
                            </Link>
                        </motion.div>
                        <p className="text-sm font-light text-white/50">No credit card required. Get started in seconds.</p>
                    </motion.div>
                </motion.div>
            </section>

            {/* ── How It Works — 3 White Cards ── */}
            <section ref={howItWorksRef} id="how-it-works" className="bg-[#f4f4f4] py-16 md:py-24 px-4">
                <div className="mx-auto w-full max-w-[1200px]">

                    {/* Section header */}
                    <div className="mx-auto rounded-full flex w-full max-w-[860px] flex-col items-center text-center gap-4 mb-14">
                        <h2
                            className="font-raleway font-normal leading-tight tracking-tight text-black"
                            style={{ fontSize: 'clamp(1.9rem, 4vw, 46px)' }}
                        >
                            Resolve your doubt.{' '}
                            <em className="font-serif font-normal italic">Easy as 1-2-3.</em>
                        </h2>
                        <p className="max-w-[560px] text-base leading-[1.7] text-black/55 md:text-lg font-light">
                            No complicated process. Connect with verified expert mentors and get answers in minutes.
                        </p>
                        <motion.div
                            whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(62,62,244,0.2)' }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="inline-block mt-1"
                        >
                            <Link
                                to="/register"
                                className=" inline-flex items-center justify-center gap-2 outline-0 border border-cyan-400/45 bg-cyan-400/10 px-5 py-2.5 text-sm font-bold text-cyan-500 backdrop-blur-md transition-all duration-300 hover:border-cyan-300/80 hover:bg-cyan-400/20 hover:text-white hover:shadow-[0_0_18px_rgba(34,211,238,0.28)] hover:bg-red-500/70 cursor-pointer"
                            >
                                Try Now
                            </Link>
                        </motion.div>
                    </div>

                    {/* 3 Step Cards */}
                    <motion.div
                        variants={cardsContainerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                        className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 lg:gap-8"
                    >
                        {[
                            {
                                step: '1',
                                title: 'Post Your Doubt',
                                desc: 'Describe your problem clearly. Add code, screenshots, or context. Our platform instantly surfaces it to verified expert mentors.',
                            },
                            {
                                step: '2',
                                title: 'Receive Expert Bids',
                                desc: 'Verified mentors review your doubt and submit competitive bids within minutes. You choose who to work with based on rating and price.',
                            },
                            {
                                step: '3',
                                title: 'Solve & Succeed',
                                desc: 'Join a 1-on-1 interactive session. Get your doubt resolved live, with screen sharing and real-time collaboration tools.',
                            },
                        ].map(({ step, title, desc }) => (
                            <motion.div
                                key={step}
                                variants={cardVariants}
                                className="reveal-card group flex flex-col overflow-hidden rounded-[18px] border-[10px] border-white bg-white shadow-[0_18px_60px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(62,62,244,0.12)]"
                            >
                                {/* Icon area */}
                                <div className="relative flex min-h-[180px] flex-1 items-center justify-center overflow-hidden bg-white px-6 pt-8">
                                    <div className="absolute inset-x-10 top-6 h-28 rounded-full bg-[#3e3ef4]/8 blur-3xl" />
                                    <div className="relative z-10 flex h-[90px] w-[90px] items-center justify-center rounded-full bg-[#3e3ef4]/10 transition duration-200 group-hover:bg-[#3e3ef4]/16">
                                        <span className="text-[42px] font-bold text-[#3e3ef4] leading-none">{step}</span>
                                    </div>
                                </div>
                                {/* Text area */}
                                <div className="px-5 pb-6 pt-3">
                                    <h3 className="text-[17px] font-semibold leading-tight tracking-tight text-black mb-2">{title}</h3>
                                    <p className="text-sm leading-relaxed text-black/50 font-light">{desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── Student + Mentor Characters + ₹99 CTA ── */}
            <CharacterSection />

            {/* ── Mentor Onboarding Section ── */}
            <section ref={mentorSectionRef} id="mentor" className="bg-[#f4f4f4] py-12 md:py-20 px-4">
                <div className="mx-auto w-full max-w-[1200px]">
                    <motion.div
                        variants={mentorContainerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.25 }}
                        className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10 items-center"
                    >

                        {/* Lottie Panel */}
                        <motion.div
                            variants={mentorItemVariants}
                            className="reveal-mentor relative flex items-center justify-center rounded-[20px] bg-white border border-black/[0.06] p-6 overflow-hidden shadow-[0_18px_60px_rgba(15,23,42,0.06)] min-h-[320px]"
                        >
                            <div className="absolute inset-x-12 top-1/4 h-32 rounded-full bg-[#3e3ef4]/6 blur-3xl pointer-events-none" />
                            <DotLottieReact
                                src="https://lottie.host/00c04ca9-f35b-4a9a-9462-7b5e99bbf417/6tf7Zeop3V.lottie"
                                loop
                                autoplay
                            />
                        </motion.div>

                        {/* Mentor Info */}
                        <motion.div variants={mentorItemVariants} className="reveal-mentor flex flex-col gap-5">
                            {/* Headline with animated underline */}
                            <div className="relative pb-5">
                                <h2
                                    className="font-edu-vic-wa-nt-beginner text-black leading-relaxed"
                                    style={{ fontSize: 'clamp(1.4rem, 3vw, 36px)' }}
                                >
                                    Want to earn money by sharing your knowledge? Join us as a mentor.
                                </h2>
                                <svg
                                    className="absolute left-0 bottom-0 w-[80%] h-[10px] pointer-events-none overflow-visible"
                                    viewBox="0 0 100 10"
                                    preserveAspectRatio="none"
                                >
                                    <motion.path
                                        d="M0,5 Q50,10 100,3"
                                        stroke="#3e3ef4"
                                        strokeWidth="3.5"
                                        fill="none"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1, ease: 'easeInOut', delay: 0.2 }}
                                    />
                                </svg>
                            </div>

                            {/* Steps — white card rows */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                                className="space-y-3"
                            >
                                {[
                                    { n: '1', title: 'Free Registration', desc: 'No subscription fees. Sign up as a mentor for free and show off your expertise.' },
                                    { n: '2', title: 'Review & Bid on Doubts', desc: 'Browse live doubts, submit your custom bids, and discuss details with students.' },
                                    { n: '3', title: 'Solve and Get Paid', desc: 'Help students via 1-on-1 interactive workspace and earn money directly from student payments.' },
                                ].map(({ n, title, desc }) => (
                                    <motion.div
                                        key={n}
                                        variants={itemVariants}
                                        className="flex items-start gap-4 rounded-[14px] bg-white p-4 border border-black/[0.05] shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
                                    >
                                        <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#3e3ef4] text-white font-bold text-sm">
                                            {n}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-black text-[15px] tracking-tight">{title}</h4>
                                            <p className="text-sm text-black/50 leading-relaxed font-light mt-0.5">{desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Speech bubble + avatar */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                className="flex items-center gap-4"
                            >
                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                    className="w-14 h-14 flex-shrink-0 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 p-1 shadow border border-blue-100"
                                >
                                    <svg viewBox="0 0 100 100" className="w-full h-full">
                                        <circle cx="50" cy="45" r="22" fill="#FFE0B2" />
                                        <path d="M28,45 C28,30 40,20 50,20 C60,20 72,30 72,45 C72,48 68,40 50,40 C32,40 28,48 28,45 Z" fill="#2C3E50" />
                                        <rect x="34" y="40" width="14" height="10" rx="3" fill="none" stroke="#2C3E50" strokeWidth="3" />
                                        <rect x="52" y="40" width="14" height="10" rx="3" fill="none" stroke="#2C3E50" strokeWidth="3" />
                                        <line x1="48" y1="45" x2="52" y2="45" stroke="#2C3E50" strokeWidth="3" />
                                        <path d="M44,55 Q50,60 56,55" fill="none" stroke="#2C3E50" strokeWidth="3" strokeLinecap="round" />
                                        <path d="M70,45 Q70,64 55,68" fill="none" stroke="#90A4AE" strokeWidth="2.5" />
                                        <circle cx="53" cy="68" r="3" fill="#37474F" />
                                        <path d="M20,90 Q50,70 80,90 Z" fill="#1565C0" />
                                        <path d="M42,75 L50,83 L58,75 Z" fill="#FFE0B2" />
                                    </svg>
                                </motion.div>
                                <div className="relative flex-1 bg-white border border-black/[0.08] px-4 py-3 rounded-2xl text-sm text-black/65 shadow-sm">
                                    <span className="font-semibold text-black">Friendly Mentor: </span>
                                    "We do not charge platform commissions. Earn directly by solving doubts. Try it today!"
                                    <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent" />
                                    <div className="absolute left-[-9px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-black/[0.06] border-b-[6px] border-b-transparent -z-10" />
                                </div>
                            </motion.div>

                            {/* CTA Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                <motion.div
                                    whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(52,211,153,0.3)' }}
                                    whileTap={{ scale: 0.96 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="inline-block"
                                >
                                    <Link
                                        to="/register?role=mentor"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 backdrop-blur-md px-6 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-400/20 hover:shadow-[0_0_15px_rgba(52,211,153,0.25)] cursor-pointer"
                                    >
                                        Join as Mentor
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </Link>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                                    whileTap={{ scale: 0.96 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    className="inline-block"
                                >
                                    <Link
                                        to="/mentor-doc"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300/35 bg-slate-500/10 backdrop-blur-md px-6 py-3 text-sm font-semibold text-slate-650 transition-colors hover:bg-slate-500/25 cursor-pointer shadow-sm"
                                    >
                                        Read Docs
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-[#f4f4f4] border-t border-black/8 py-6 px-6">
                <div className="mx-auto max-w-[1200px] flex flex-col sm:flex-row justify-between items-center gap-2 text-[13px] text-black/35">
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

export default PublicPage;
