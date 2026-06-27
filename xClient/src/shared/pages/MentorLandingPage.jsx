import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';
import useAuthStore from '../../features/auth/store/auth.store';
import { useLogout } from '../../features/auth/hooks/useLogout.js';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser.js';

const flowchartSteps = [
    {
        number: '01',
        title: 'Role & Skills',
        shortDesc: 'Choose role and technical stack.',
        accent: 'text-amber-200',
        bgAccent: 'rgba(245, 158, 11, 0.1)',
        borderAccent: 'rgba(245, 158, 11, 0.3)',
        activeShadow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
        icon: '👤',
        theoryTitle: '1. Registration & Expertise Profile',
        motto: '"Know me, and I give you knowledge."',
        theoryText: 'The journey begins by introducing yourself to the Solve-X platform. You register with a mentor profile and select your specialized coding domains (e.g., React, Python, Node.js). Declaring your technical stack enables our system to correctly pair you with matching student doubt requests.',
        bullets: [
            'Create mentor profile (no registration fee)',
            'Define years of experience and stack expertise',
            'System links skills to match student doubts'
        ]
    },
    {
        number: '02',
        title: 'Skill Assessment',
        shortDesc: 'Take custom test for your stack.',
        accent: 'text-indigo-200',
        bgAccent: 'rgba(79, 70, 229, 0.1)',
        borderAccent: 'rgba(79, 70, 229, 0.3)',
        activeShadow: 'shadow-[0_0_20px_rgba(79,70,229,0.25)]',
        icon: '📝',
        theoryTitle: '2. Structured Skill Assessment',
        theoryText: 'Prove your coding proficiency. Solve-X generates a focused, practical coding assessment tailored to your selected tech stack to check debugging and architecture skills.',
        bullets: [
            'Dynamic assessment based on selected skills',
            'Measures practical logic and problem solving',
            'Progress autosaved as you write solutions'
        ]
    },
    {
        number: '03',
        title: 'AI Verification',
        shortDesc: 'AI evaluates accuracy and quality.',
        accent: 'text-fuchsia-200',
        bgAccent: 'rgba(217, 70, 239, 0.1)',
        borderAccent: 'rgba(217, 70, 239, 0.3)',
        activeShadow: 'shadow-[0_0_20px_rgba(217,70,239,0.25)]',
        icon: '🧠',
        theoryTitle: '3. AI Answer Evaluation & Verification',
        theoryText: 'Our AI verification engine analyzes your submitted answers. It measures time and space complexity, logical precision, and how clearly you explain your coding decisions.',
        bullets: [
            'Verifies correctness and complexity analysis',
            'Rates logic structure and documentation quality',
            'Ensures excellent explainability for students'
        ]
    },
    {
        number: '04',
        title: 'Email Result',
        shortDesc: 'Get detailed pass/retry decision email.',
        accent: 'text-sky-200',
        bgAccent: 'rgba(14, 165, 233, 0.1)',
        borderAccent: 'rgba(14, 165, 233, 0.3)',
        activeShadow: 'shadow-[0_0_20px_rgba(14,165,233,0.25)]',
        icon: '✉️',
        theoryTitle: '4. Decision Notification & Email Forwarding',
        theoryText: 'Every mentor receives a transparent email explaining the evaluation decision. If you pass, onboarding starts. If not, the email provides detailed, actionable advice to help you prepare and retry.',
        bullets: [
            'Granular report emailed to your address',
            'Specific reasons provided for pass/retry status',
            'Actionable retry guidelines and resource links'
        ]
    },
    {
        number: '05',
        title: 'Become Verified',
        shortDesc: 'Official badge active, start earning!',
        accent: 'text-emerald-200',
        bgAccent: 'rgba(16, 185, 129, 0.1)',
        borderAccent: 'rgba(16, 185, 129, 0.3)',
        activeShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
        icon: '🏅',
        theoryTitle: '5. Profile Verification & Active Status',
        theoryText: 'Once passed, the official "Verified Mentor" badge is added to your profile. You can instantly access live student requests, place bids, and start hosting collaborative sessions.',
        bullets: [
            'Verified Badge displayed on your profile card',
            'Authorized to place bids on active doubts',
            'Access 1-on-1 Workspace with code/audio tools'
        ]
    }
];

const FlowConnector = ({ active }) => (
    <div className="hidden lg:flex items-center justify-center flex-1 mx-1 z-10">
        <svg width="48" height="16" viewBox="0 0 48 16" fill="none" className="overflow-visible w-full">
            <path
                d="M 2 8 L 44 8"
                stroke={active ? "#6366f1" : "rgba(255,255,255,0.15)"}
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className={active ? "animate-flow-line" : ""}
            />
            <path 
                d="M 39 3 L 45 8 L 39 13" 
                stroke={active ? "#6366f1" : "rgba(255,255,255,0.15)"} 
                strokeWidth="2.5" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
        </svg>
    </div>
);

const FlowConnectorVertical = ({ active }) => (
    <div className="flex justify-center my-2 lg:hidden z-10">
        <svg width="16" height="40" viewBox="0 0 16 40" fill="none" className="overflow-visible">
            <path
                d="M 8 2 L 8 36"
                stroke={active ? "#6366f1" : "rgba(255,255,255,0.15)"}
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className={active ? "animate-flow-line" : ""}
            />
            <path 
                d="M 3 31 L 8 37 L 13 31" 
                stroke={active ? "#6366f1" : "rgba(255,255,255,0.15)"} 
                strokeWidth="2.5" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
        </svg>
    </div>
);

const renderTheoryVisual = (stepIndex, assessmentPassed, setAssessmentPassed) => {
    switch (stepIndex) {
        case 0:
            return (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-semibold text-amber-200">Skills Selected</span>
                        <span className="text-[10px] text-white/40">Role: Mentor</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['JavaScript', 'React', 'Node.js', 'Algorithms', 'MongoDB', 'Python', 'CSS'].map((skill) => (
                            <span key={skill} className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[11px] text-amber-100 font-mono">
                                + {skill}
                            </span>
                        ))}
                    </div>
                    <div className="border border-dashed border-white/10 rounded-xl p-3 text-center text-xs text-white/30 font-mono">
                        [ Searching related student doubts... ]
                    </div>
                </div>
            );
        case 1:
            return (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                        <span className="text-indigo-300 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"/> test_runner.js</span>
                        <span className="text-[10px] text-white/30">14:20 elapsed</span>
                    </div>
                    <div className="space-y-1 select-none text-white/40">
                        <p>1 <span className="text-indigo-400">function</span> <span className="text-amber-200">reverseArray</span>(arr) {'{'}</p>
                        <p>2     <span className="text-indigo-400">let</span> left = 0;</p>
                        <p>3     <span className="text-indigo-400">let</span> right = arr.length - 1;</p>
                        <p>4     <span className="text-indigo-400">while</span> (left &lt; right) {'{'}</p>
                        <p>5         <span className="text-indigo-400">let</span> temp = arr[left];</p>
                        <p>6         arr[left] = arr[right];</p>
                        <p>7         arr[right] = temp;</p>
                        <p>8         left++; right--;</p>
                        <p>9     {'}'}</p>
                        <p>10    <span className="text-indigo-400">return</span> arr;</p>
                        <p>11 {'}'}</p>
                    </div>
                    <div className="mt-3 border-t border-white/5 pt-2 text-emerald-400/90 text-[10px]">
                        ✓ All unit tests passed on local compile.
                    </div>
                </div>
            );
        case 2:
            return (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-semibold text-fuchsia-300">AI Evaluation Report</span>
                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">Completed</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Syntax & Accuracy', val: '94%', color: 'bg-emerald-400' },
                            { label: 'Explainability & Comments', val: '88%', color: 'bg-emerald-400' },
                            { label: 'Time-Space Complexity', val: '92%', color: 'bg-emerald-400' },
                        ].map(({ label, val, color }) => (
                            <div key={label} className="space-y-1">
                                <div className="flex justify-between text-[10px] text-white/50">
                                    <span>{label}</span>
                                    <span className="font-semibold text-white">{val}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${color} rounded-full`} style={{ width: val }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-lg bg-fuchsia-500/5 border border-fuchsia-500/10 p-2.5 text-[10px] text-fuchsia-200/70 font-mono">
                        <strong>AI Note:</strong> Excellent use of two-pointer swap; O(1) space complexity logic satisfies guidelines.
                    </div>
                </div>
            );
        case 3:
            return (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs">✉️</span>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-mono">Solve-X Notification</span>
                        </div>
                        <div className="flex gap-1">
                            <button type="button" onClick={() => setAssessmentPassed(true)} className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold transition-colors ${assessmentPassed ? 'bg-emerald-400 text-black' : 'bg-white/5 text-white/50'}`}>Pass</button>
                            <button type="button" onClick={() => setAssessmentPassed(false)} className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold transition-colors ${!assessmentPassed ? 'bg-rose-400 text-black' : 'bg-white/5 text-white/50'}`}>Retry</button>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="text-[10px] text-white/40 space-y-0.5 font-mono border-b border-white/5 pb-2">
                            <p>To: mentor.applicant@gmail.com</p>
                            <p>Subject: Assessment Results</p>
                        </div>
                        <h4 className={`text-sm font-semibold ${assessmentPassed ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {assessmentPassed ? 'Congratulations! You Passed' : 'Assessment Retry Recommended'}
                        </h4>
                        <p className="text-[10.5px] leading-relaxed text-white/60">
                            {assessmentPassed 
                                ? 'Your answers showed exceptional coding style and communication. Your account is approved!' 
                                : 'Your test logic needs minor refinements in computational complexity. Review the feedback and try again!'}
                        </p>
                        <div className={`rounded-lg p-2.5 text-[9.5px] leading-relaxed ${assessmentPassed ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-200/70' : 'bg-rose-500/5 border border-rose-500/10 text-rose-200/70'}`}>
                            <strong>Reason:</strong> {assessmentPassed ? 'All sections cleared verification benchmarks.' : 'Score on time complexity section fell below 70% threshold.'}
                        </div>
                    </div>
                </div>
            );
        case 4:
            return (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 flex flex-col items-center justify-center text-center space-y-4 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                    <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-emerald-400/25 blur-sm animate-pulse" />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 border border-emerald-400/30 text-2xl text-emerald-300 font-bold">
                            ✓
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 justify-center">
                            <span className="font-semibold text-sm">Alex Rivera</span>
                            <span className="rounded-full bg-emerald-400 text-black px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider uppercase">Verified</span>
                        </div>
                        <p className="text-[10.5px] text-white/40 mt-1">Full-Stack Engineer · ⭐ 5.0 (New)</p>
                    </div>
                    <div className="flex gap-2 w-full pt-1">
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-2 text-center">
                            <span className="text-[9px] uppercase text-white/30 block">Wallet</span>
                            <span className="text-xs font-semibold text-emerald-300 font-mono">₹99/min</span>
                        </div>
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-2 text-center">
                            <span className="text-[9px] uppercase text-white/30 block">Status</span>
                            <span className="text-xs font-semibold text-emerald-400 animate-pulse font-mono">Active</span>
                        </div>
                    </div>
                </div>
            );
        default:
            return null;
    }
};

const MentorLandingPage = () => {
    const { data: currentUser, isPending } = useCurrentUser();
    const [assessmentPassed, setAssessmentPassed] = useState(true);
    const [activeStep, setActiveStep] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const { mutate: performLogout, isPending: isLoggingOut } = useLogout();

    const handleLogout = () => {
        performLogout();
    };

    if (isPending) {
        return (
            <div className="min-h-screen bg-[#050509] flex items-center justify-center text-white font-mono">
                <div className="animate-pulse">Loading session...</div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    if (currentUser.role !== 'mentor') {
        if (currentUser.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
        return <Navigate to="/dashboard/student" replace />;
    }

    return (
        <main className="w-full min-h-screen flex flex-col px-4 pb-24 pt-8 text-white overflow-x-hidden bg-[radial-gradient(circle_at_82%_6%,rgba(255,217,110,0.42),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(62,62,244,0.55),transparent_34%),radial-gradient(circle_at_28%_99%,rgba(9,12,179,0.60),transparent_48%),linear-gradient(180deg,#050509_0%,#060612_58%,#15131a_100%)] sm:px-6 lg:px-8">
            <CustomCursor />

            <nav className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-black/25 px-5 py-3 backdrop-blur-md">
                <Link to="/" className="flex items-center gap-3 text-white">
                    <img src="/logo.png" alt="Solve-X" className="h-8 w-8 object-contain" />
                    <span className="text-xs font-bold uppercase tracking-[0.22em]">Solve-X</span>
                </Link>

                {/* Desktop menu links - visible on md and above */}
                <div className="hidden md:flex items-center gap-5">
                    <Link to="/dashboard/mentor" className="text-xs font-semibold text-white/70 hover:text-white transition-colors">
                        Dashboard
                    </Link>
                    {currentUser && (
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="text-xs font-semibold text-white/70 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                    )}
                    <Link to="/dashboard/mentor" className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition-transform hover:scale-105">
                        Become a Mentor
                    </Link>
                </div>

                {/* Mobile/Tablet Hamburger Icon */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex md:hidden items-center justify-center p-1 bg-transparent border-none text-white focus:outline-none cursor-pointer"
                >
                    <span className="material-symbols-outlined text-2xl select-none">
                        {menuOpen ? 'close' : 'menu'}
                    </span>
                </button>

                {/* Mobile Dropdown Panel */}
                {menuOpen && (
                    <div className="absolute top-[110%] left-0 right-0 z-[1000] flex flex-col gap-3 rounded-3xl border border-white/15 bg-[#0c0b11]/95 px-6 py-5 shadow-xl backdrop-blur-md md:hidden">
                        <Link
                            to="/dashboard/mentor"
                            className="text-white/70 hover:text-white no-underline transition-colors py-2.5 border-b border-white/5 font-semibold text-xs tracking-wider"
                            onClick={() => setMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        {currentUser && (
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    handleLogout();
                                }}
                                disabled={isLoggingOut}
                                className="w-full text-left bg-transparent border-none text-rose-400 py-2.5 border-b border-white/5 font-semibold text-xs tracking-wider cursor-pointer disabled:opacity-50"
                            >
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </button>
                        )}
                        <Link
                            to="/dashboard/mentor"
                            className="mt-2 w-full h-[40px] flex items-center justify-center rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors"
                            onClick={() => setMenuOpen(false)}
                        >
                            Become a Mentor
                        </Link>
                    </div>
                )}
            </nav>

            <section className="mx-auto w-full max-w-7xl pt-16 sm:pt-20">
                <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
                    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
                        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} className="mb-5 flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs text-emerald-200">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                            Build trust before you teach
                        </motion.div>
                        <motion.h1 variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }} className="max-w-3xl font-raleway text-4xl font-normal leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
                            Knowledge earns the{' '}
                            <span className="font-shantell-sans text-amber-200">verified badge.</span>
                        </motion.h1>
                        <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="mt-6 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                            Select your expertise, prove it through an assessment, and let AI verify your answers. Every applicant receives an email with the decision and its reason.
                        </motion.p>
                        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="mt-8 flex flex-wrap gap-3">
                            <Link to="/mentor/assessment/select" className="rounded-full bg-white px-7 py-3 text-sm font-bold text-black transition-transform hover:scale-105">Start mentor journey</Link>
                            <Link to="/mentor-doc" className="rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10">Read mentor guide</Link>
                        </motion.div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.75, ease: 'easeOut' }} className="mx-auto w-full max-w-lg">
                       
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-200/70">Mentor applicant</span>
                                <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[9px] uppercase tracking-wider text-amber-100">Assessment mode</span>
                            </div>
                            <div className="h-64 sm:h-80">
                                <DotLottieReact
                                    src="https://lottie.host/2a388c9a-e5ae-4054-bba4-8e44ec3d2c15/EbRaALXgnI.lottie"
                                    loop
                                    autoplay
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[['Skill', 'DSA'], ['Questions', '20'], ['Time', '30 min']].map(([label, value]) => (
                                    <div key={label} className="rounded-xl border border-white/8 bg-black/20 p-3 text-center">
                                        <p className="text-[9px] uppercase tracking-wider text-white/35">{label}</p>
                                        <p className="mt-1 text-xs font-semibold text-white/80">{value}</p>
                                    </div>
                                ))}
                            </div>
                        
                    </motion.div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes flow-line {
                        from { stroke-dashoffset: 20; }
                        to { stroke-dashoffset: 0; }
                    }
                    .animate-flow-line {
                        animation: flow-line 0.8s linear infinite;
                    }
                ` }} />

                <motion.section 
                    initial={{ opacity: 0, y: 30 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true, amount: 0.2 }} 
                    transition={{ duration: 0.65 }} 
                    className="mt-24" 
                    aria-labelledby="mentor-process-title"
                >
                    {/* Header with Motto */}
                    <div className="mx-auto mb-14 max-w-3xl text-center">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="inline-block mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 backdrop-blur-md"
                        >
                            <p className="font-serif italic text-lg md:text-xl text-amber-200 leading-relaxed">
                                "Know me, and I give you knowledge."
                            </p>
                        </motion.div>
                        <h2 id="mentor-process-title" className="mt-2 font-shantell-sans text-3xl font-semibold sm:text-4xl">
                            How Mentor Verification Works
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-white/45">
                            Click or hover on any step below to explore the AI evaluation and verification process.
                        </p>
                    </div>

                    {/* Flowchart Nodes */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-1 lg:gap-2 mb-12">
                        {flowchartSteps.map((step, idx) => {
                            const isSelected = activeStep === idx;
                            return (
                                <React.Fragment key={step.number}>
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setActiveStep(idx)}
                                        onMouseEnter={() => setActiveStep(idx)}
                                        className={`relative w-full lg:w-48 text-left rounded-2xl border p-4 transition-all duration-300 cursor-pointer z-10 ${
                                            isSelected 
                                                ? `bg-white/[0.07] border-white/30 ${step.activeShadow}` 
                                                : 'bg-black/20 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] text-white/70">
                                                {step.number}
                                            </span>
                                            <span className="text-lg">{step.icon}</span>
                                        </div>
                                        <h3 className={`font-shantell-sans text-sm font-semibold ${step.accent}`}>
                                            {step.title}
                                        </h3>
                                        <p className="mt-1 text-[11px] text-white/40 leading-relaxed">
                                            {step.shortDesc}
                                        </p>
                                        
                                        {/* Glow indicator */}
                                        {isSelected && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full blur-[2px]" />
                                        )}
                                    </motion.button>
                                    
                                    {/* Connector */}
                                    {idx < flowchartSteps.length - 1 && (
                                        <>
                                            <FlowConnector active={activeStep >= idx} />
                                            <FlowConnectorVertical active={activeStep >= idx} />
                                        </>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Dynamic Theory Display Panel */}
                    <motion.div 
                        key={activeStep}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="rounded-3xl border border-white/10 bg-[#090914]/80 p-6 shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-8"
                    >
                        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
                            {/* Left: Text Theory */}
                            <div className="space-y-5">
                                <div>
                                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">Step Detail & Theory</span>
                                    <h3 className="mt-1 font-shantell-sans text-2xl font-semibold text-white">
                                        {flowchartSteps[activeStep].theoryTitle}
                                    </h3>
                                    {flowchartSteps[activeStep].motto && (
                                        <p className="mt-1.5 font-serif italic text-amber-200 text-sm">
                                            {flowchartSteps[activeStep].motto}
                                        </p>
                                    )}
                                </div>
                                
                                <p className="text-sm leading-relaxed text-white/60">
                                    {flowchartSteps[activeStep].theoryText}
                                </p>
                                
                                <ul className="space-y-2.5 pt-2">
                                    {flowchartSteps[activeStep].bullets.map((bullet, index) => (
                                        <li key={index} className="flex items-start gap-2.5 text-xs text-white/70">
                                            <span className="text-emerald-400 mt-0.5">✔</span>
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Right: Interactive Visual State */}
                            <div>
                                <div>
                                    {renderTheoryVisual(activeStep, assessmentPassed, setAssessmentPassed)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.section>

                <div className="mt-14 flex flex-col items-center text-center">
                    <p className="font-shantell-sans text-base text-white/55">Ready to prove what you know?</p>
                    <Link to="/mentor/assessment/select" className="mt-5 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black transition-transform hover:scale-105">Apply as a mentor →</Link>
                </div>
            </section>
        </main>
    );
};

export default MentorLandingPage;
