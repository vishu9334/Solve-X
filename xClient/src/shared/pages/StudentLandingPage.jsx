import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import CustomCursor from '../components/CustomCursor';
import useAuthStore from '../../features/auth/store/auth.store';
import { useLogout } from '../../features/auth/hooks/useLogout.js';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser.js';

const mentors = [
    { id: 1, name: 'Aarav', skill: 'DSA Expert', price: '₹199', rating: '4.9', time: '2:00 PM', color: '#fbbf24' },
    { id: 2, name: 'Meera', skill: 'MERN Mentor', price: '₹249', rating: '4.8', time: '2:30 PM', color: '#818cf8' },
    { id: 3, name: 'Kabir', skill: 'DSA Expert', price: '₹179', rating: '4.7', time: '3:00 PM', color: '#34d399' },
];

const journeySteps = [
    { number: '01', title: 'Post your doubt', text: 'Choose a skill, write your question, and select your preferred session time.' },
    { number: '02', title: 'Mentors get notified', text: 'Available experts receive your request instantly and send their offers.' },
    { number: '03', title: 'Choose your mentor', text: 'Compare price, rating, expertise, and timing before making your choice.' },
    { number: '04', title: 'Connect in chat', text: 'Your selected mentor is automatically connected in a private chat session.' },
];

const reveal = {
    hidden: { opacity: 0, y: 28 },
    visible: (index = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.12, duration: 0.55, ease: 'easeOut' },
    }),
};

const StepBadge = ({ number, label }) => (
    <div className="mb-5 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 font-mono text-xs text-amber-300">
            0{number}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">{label}</span>
    </div>
);

const StudentLandingPage = () => {
    const { data: currentUser, isPending } = useCurrentUser();
    const [selectedMentorId, setSelectedMentorId] = useState(1);
    const [menuOpen, setMenuOpen] = useState(false);
    const selectedMentor = mentors.find((mentor) => mentor.id === selectedMentorId);
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

    if (currentUser.role !== 'student') {
        if (currentUser.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
        return <Navigate to="/dashboard/mentor" replace />;
    }

    return (
        <main className="relative min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_82%_6%,rgba(255,217,110,0.42),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(62,62,244,0.55),transparent_34%),radial-gradient(circle_at_28%_99%,rgba(9,12,179,0.60),transparent_48%),linear-gradient(180deg,#050509_0%,#060612_58%,#15131a_100%)] px-4 pb-24 pt-8 text-white sm:px-6 lg:px-8">
            <CustomCursor />


            <nav className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-md">
                <Link to="/" className="flex items-center gap-3 text-white">
                    <img src="/logo.png" alt="Solve-X" className="h-8 w-8 object-contain" />
                    <span className="text-xs font-bold uppercase tracking-[0.22em]">Solve-X</span>
                </Link>

                {/* Desktop menu links - visible on lg and above */}
                <div className="hidden lg:flex items-center gap-5">
                    <Link to="/dashboard/student" className="text-xs font-semibold text-white/70 hover:text-white transition-colors">
                        Dashboard
                    </Link>
                    <Link to="/student/profile" className="text-xs font-semibold text-white/70 hover:text-white transition-colors">
                        Profile
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
                    <Link to="/student/ask-doubt" className="rounded-full border border-amber-300/40 bg-amber-300/10 backdrop-blur-md px-5 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-300/20 hover:shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                        Ask a Doubt
                    </Link>
                </div>

                {/* Mobile/Tablet Hamburger Icon */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex lg:hidden items-center justify-center p-1 bg-transparent border-none text-white focus:outline-none cursor-pointer"
                >
                    <span className="material-symbols-outlined text-2xl select-none">
                        {menuOpen ? 'close' : 'menu'}
                    </span>
                </button>

                {/* Mobile Dropdown Panel */}
                {menuOpen && (
                    <div className="absolute top-[110%] left-0 right-0 z-[1000] flex flex-col gap-3 rounded-3xl border border-white/15 bg-[#0c0b11]/95 px-6 py-5 shadow-xl backdrop-blur-md lg:hidden">
                        <Link
                            to="/dashboard/student"
                            className="text-white/70 hover:text-white no-underline transition-colors py-2.5 border-b border-white/5 font-semibold text-xs tracking-wider"
                            onClick={() => setMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/student/profile"
                            className="text-white/70 hover:text-white no-underline transition-colors py-2.5 border-b border-white/5 font-semibold text-xs tracking-wider"
                            onClick={() => setMenuOpen(false)}
                        >
                            Profile
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
                            to="/student/ask-doubt"
                            className="mt-2 w-full h-[42px] flex items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10 backdrop-blur-md text-amber-300 text-xs font-bold hover:bg-amber-300/20 transition-all cursor-pointer"
                            onClick={() => setMenuOpen(false)}
                        >
                            Ask a Doubt
                        </Link>
                    </div>
                )}
            </nav>

            <section className="relative z-10 mx-auto w-full max-w-7xl pt-20">
                <motion.div initial="hidden" animate="visible" className="mx-auto max-w-3xl text-center">
                    <motion.div variants={reveal} className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs text-amber-200">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        From doubt to solution, in real time
                    </motion.div>
                    <motion.h1 variants={reveal} custom={1} className="font-raleway text-4xl font-normal leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
                        Your doubt finds the{' '}
                        <span className="font-serif italic text-amber-200">right mentor.</span>
                    </motion.h1>
                    <motion.p variants={reveal} custom={2} className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                        Post your question once. Solve-X finds available experts, brings their offers to you, and opens a private chat with the mentor you choose.
                    </motion.p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.65, ease: 'easeOut' }}
                    className="relative mx-auto mt-12 grid max-w-4xl items-center gap-4 sm:grid-cols-[1fr_150px_1fr]"
                >
                    <div className="relative overflow-hidden rounded-[28px] border border-amber-200/20 bg-amber-200/[.07] p-4 shadow-[0_20px_50px_rgba(0,0,0,.22)] backdrop-blur-md">
                        <div className="absolute left-4 top-4 z-10 rounded-full border border-amber-200/20 bg-black/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                            Mentor
                        </div>
                        <div className="h-44 sm:h-52">
                            <DotLottieReact
                                src="https://lottie.host/2b84a845-2537-42b1-babc-649e5e2b48bd/Hq2VMhDj0q.lottie"
                                loop
                                autoplay
                            />
                        </div>
                        <p className="relative z-10 -mt-2 text-center text-xs text-white/50">The mentor connects through the laptop and guides the student.</p>
                    </div>

                    <div aria-hidden="true" className="relative hidden h-full min-h-28 items-center justify-center sm:flex">
                        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-amber-200/20 via-indigo-300/70 to-emerald-300/20" />
                        <motion.div
                            animate={{ x: [-45, 45, -45] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-indigo-200/30 bg-[#161635] shadow-[0_0_30px_rgba(129,140,248,.35)]"
                        >
                            <span className="text-xl">⚡</span>
                        </motion.div>
                        <span className="absolute bottom-[23%] font-mono text-[9px] uppercase tracking-[0.18em] text-indigo-200/55">Live match</span>
                    </div>

                    <div className="relative overflow-hidden rounded-[28px] border border-emerald-200/20 bg-emerald-200/[.07] p-4 shadow-[0_20px_50px_rgba(0,0,0,.22)] backdrop-blur-md">
                        <div className="absolute right-4 top-4 z-10 rounded-full border border-emerald-200/20 bg-black/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                            Student
                        </div>
                        <div className="h-44 sm:h-52">
                            <DotLottieReact
                                src="https://lottie.host/f3da4e6c-7f31-44aa-a5e9-28685d82ef96/NNCcgMPazz.lottie"
                                loop
                                autoplay
                            />
                        </div>
                        <p className="relative z-10 -mt-2 text-center text-xs text-white/50">The student posts a question and preferred session time.</p>
                    </div>
                </motion.div>

                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto mt-10 max-w-6xl"
                    aria-labelledby="student-journey-title"
                >
                    <div className="mb-6 text-center">
                        <p className="font-shantell-sans text-sm text-amber-200/80">Simple steps, real guidance</p>
                        <h2 id="student-journey-title" className="mt-1 font-shantell-sans text-2xl font-semibold text-white sm:text-3xl">
                            How a student connects with a mentor
                        </h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {journeySteps.map((step, index) => (
                            <motion.article
                                key={step.number}
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.45 }}
                                className="relative rounded-2xl border border-white/10 bg-white/[.045] p-5 backdrop-blur-sm"
                            >
                                <span className="font-shantell-sans text-sm font-semibold text-indigo-300">Step {step.number}</span>
                                <h3 className="mt-3 font-shantell-sans text-lg font-semibold text-white">{step.title}</h3>
                                <p className="mt-2 font-shantell-sans text-sm leading-6 text-white/50">{step.text}</p>
                                {index < journeySteps.length - 1 && (
                                    <span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-lg text-amber-200/40 lg:block">→</span>
                                )}
                            </motion.article>
                        ))}
                    </div>
                </motion.section>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.7 }}
                    className="relative mt-16 rounded-[32px] border border-white/10 bg-[#090914]/75 p-4 shadow-[0_30px_100px_rgba(0,0,0,.4)] backdrop-blur-xl sm:p-7 lg:p-10"
                >
                    <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-indigo-300">Live student journey</p>
                            <h2 className="mt-2 text-xl font-medium sm:text-2xl">See how your mentor connection happens</h2>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/45">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                            </span>
                            Socket connection active
                        </div>
                    </div>

                    <div className="relative grid gap-5 lg:grid-cols-[1fr_.7fr_1.35fr_1fr]">
                        <svg aria-hidden="true" className="pointer-events-none absolute left-[8%] top-[44%] hidden h-16 w-[84%] overflow-visible lg:block" preserveAspectRatio="none">
                            <motion.path
                                d="M0 30 C90 -5 130 65 220 30 S350 30 450 30 S580 30 700 30"
                                fill="none"
                                stroke="rgba(251,191,36,.45)"
                                strokeWidth="2"
                                strokeDasharray="7 9"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.9, duration: 2, ease: 'easeInOut' }}
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>

                        <motion.article variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative z-10 rounded-3xl border border-white/10 bg-white/[.045] p-5">
                            <StepBadge number="1" label="Post your doubt" />
                            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                <label className="text-[10px] uppercase tracking-widest text-white/35">Selected skill</label>
                                <div className="mt-2 flex items-center justify-between rounded-xl border border-indigo-300/20 bg-indigo-400/10 px-3 py-2 text-sm">
                                    Data Structures <span className="text-indigo-300">⌄</span>
                                </div>
                                <label className="mt-4 block text-[10px] uppercase tracking-widest text-white/35">Your question</label>
                                <div className="mt-2 min-h-20 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/65">
                                    How do I optimize binary search for rotated arrays?
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-[10px] text-white/35">
                                    <span>◷ 2:00 PM</span><span>•</span><span>Expected 30 min</span>
                                </div>
                            </div>
                        </motion.article>

                        <motion.article variants={reveal} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative z-10 flex flex-col rounded-3xl border border-white/10 bg-white/[.045] p-5">
                            <StepBadge number="2" label="Smart match" />
                            <div className="flex flex-1 flex-col items-center justify-center py-5 text-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }} className="relative flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-indigo-300/45">
                                    <div className="absolute inset-3 rounded-full border border-amber-300/30" />
                                    <span className="text-3xl">⚡</span>
                                </motion.div>
                                <p className="mt-5 text-sm font-semibold">Finding DSA experts</p>
                                <p className="mt-2 text-xs leading-5 text-white/40">Skill, rating and availability are matched instantly.</p>
                                <div className="mt-4 flex gap-1.5">
                                    {[0, 1, 2].map((item) => <motion.span key={item} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: item * 0.16 }} className="h-1.5 w-1.5 rounded-full bg-indigo-300" />)}
                                </div>
                            </div>
                        </motion.article>

                        <motion.article variants={reveal} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative z-10 rounded-3xl border border-white/10 bg-white/[.045] p-5">
                            <StepBadge number="3" label="Choose your mentor" />
                            <div className="space-y-2.5">
                                {mentors.map((mentor) => {
                                    const isSelected = mentor.id === selectedMentorId;
                                    return (
                                        <motion.button
                                            type="button"
                                            key={mentor.id}
                                            onClick={() => setSelectedMentorId(mentor.id)}
                                            whileHover={{ x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${isSelected ? 'border-amber-300/55 bg-amber-300/10' : 'border-white/10 bg-black/20 hover:bg-white/[.07]'}`}
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#101018]" style={{ backgroundColor: mentor.color }}>{mentor.name[0]}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold">{mentor.name}</span>
                                                <span className="block truncate text-[10px] text-white/40">{mentor.skill} · ★ {mentor.rating}</span>
                                            </span>
                                            <span className="text-right">
                                                <span className="block text-sm font-bold text-amber-200">{mentor.price}</span>
                                                <span className="block text-[9px] text-white/35">{mentor.time}</span>
                                            </span>
                                            <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${isSelected ? 'border-amber-300 bg-amber-300 text-black' : 'border-white/20 text-transparent'}`}>✓</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <p className="mt-4 text-center text-[10px] text-white/35">Try selecting a different mentor</p>
                        </motion.article>

                        <motion.article layout variants={reveal} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative z-10 overflow-hidden rounded-3xl border border-emerald-300/20 bg-emerald-300/[.06] p-5">
                            <StepBadge number="4" label="Auto-connect" />
                            <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
                                <motion.span key={selectedMentor.id} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="flex h-11 w-11 items-center justify-center rounded-full font-bold text-[#101018]" style={{ backgroundColor: selectedMentor.color }}>{selectedMentor.name[0]}</motion.span>
                                <div>
                                    <p className="text-sm font-semibold">{selectedMentor.name}</p>
                                    <p className="text-[10px] text-emerald-300">● Online · Chat secured</p>
                                </div>
                            </div>
                            <motion.div key={`mentor-${selectedMentor.id}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mr-6 rounded-2xl rounded-tl-sm bg-white/10 p-3 text-xs leading-5 text-white/70">
                                Hi! I reviewed your rotated-array question. Let&apos;s solve it together.
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="ml-8 mt-3 rounded-2xl rounded-tr-sm bg-indigo-500 p-3 text-xs leading-5 text-white">
                                Great, I&apos;m ready! 👋
                            </motion.div>
                            <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] text-white/35">
                                Type your message... <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-black">➤</span>
                            </div>
                        </motion.article>
                    </div>

                    <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
                        {[['01', 'You stay in control', 'Compare price, rating and timing.'], ['02', 'Real-time updates', 'No refreshing or waiting for email.'], ['03', 'Private by default', 'Only your chosen mentor joins chat.']].map(([number, title, description]) => (
                            <div key={number} className="flex gap-3 rounded-2xl bg-white/[.035] p-4">
                                <span className="font-mono text-xs text-indigo-300">{number}</span>
                                <div><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-[10px] leading-4 text-white/35">{description}</p></div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="mt-12 flex flex-col items-center text-center">
                    <p className="text-sm text-white/45">One question can change the way you understand a topic.</p>
                    <span className='w-full max-h-min pt-5'>
                        <h1 className='text-9xl font-bold text-green-600'>Solve-X</h1>
                    </span>
                </div>
            </section>
        </main>
    );
};

export default StudentLandingPage;
