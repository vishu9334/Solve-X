import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';
import { useLogout } from '../../features/auth/hooks/useLogout.js';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser.js';

const AdminLandingPage = () => {
    const { data: currentUser, isPending } = useCurrentUser();
    const { mutate: performLogout, isPending: isLoggingOut } = useLogout();

    const handleLogout = () => {
        performLogout();
    };

    if (isPending) {
        return (
            <div className="min-h-screen bg-[#07070d] flex items-center justify-center text-white font-mono">
                <div className="animate-pulse">Loading admin session...</div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    if (currentUser.role !== 'admin') {
        if (currentUser.role === 'mentor') return <Navigate to="/mentor-landing" replace />;
        return <Navigate to="/student-landing" replace />;
    }

    return (
        <main className="w-full min-h-screen flex flex-col px-4 pb-32 pt-8 text-white overflow-hidden bg-[radial-gradient(circle_at_82%_6%,rgba(255,217,110,0.42),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(62,62,244,0.55),transparent_34%),radial-gradient(circle_at_28%_99%,rgba(9,12,179,0.60),transparent_48%),linear-gradient(180deg,#050509_0%,#060612_58%,#15131a_100%)] sm:px-6 lg:px-8">
            <CustomCursor />

            <nav className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-black/25 px-5 py-3 backdrop-blur-md">
                <Link to="/" className="flex items-center gap-3 text-white">
                    <img src="/logo.png" alt="Solve-X" className="h-8 w-8 object-contain" />
                    <span className="text-xs font-bold uppercase tracking-[0.22em]">Solve-X</span>
                </Link>
                <div className="flex items-center gap-5">
                    <Link to="/dashboard/admin" className="text-xs font-semibold text-white/70 hover:text-white transition-colors">
                        Dashboard
                    </Link>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-xs font-semibold text-white/70 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                    <Link to="/admin/profile" className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition-transform hover:scale-105">
                        Admin Profile
                    </Link>
                </div>
            </nav>

            <section className="mx-auto w-full max-w-7xl pt-16 sm:pt-20">
                <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
                    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
                        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }} className="mb-5 flex w-fit items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs text-amber-200">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                            System Operator Control Center
                        </motion.div>
                        <motion.h1 variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }} className="max-w-3xl font-raleway text-4xl font-normal leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
                            Manage and scale the{' '}
                            <span className="text-indigo-300">Solve-X platform.</span>
                        </motion.h1>
                        <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="mt-6 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                            Access the dashboard metrics, verify pending mentor applications, check system flags, and review real-time session logs to ensure maximum safety and user retention.
                        </motion.p>
                        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="mt-8 flex flex-wrap gap-3">
                            <Link to="/dashboard/admin" className="rounded-full bg-white px-7 py-3 text-sm font-bold text-black transition-transform hover:scale-105">
                                Enter Dashboard
                            </Link>
                            <Link to="/admin/profile" className="rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10">
                                View Profile
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.75, ease: 'easeOut' }} className="mx-auto w-full max-w-lg">
                        {/* <div className="overflow-hidden rounded-[32px] border border-white/12 bg-white/[.065] p-5 shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-xl"> */}
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-200/70">Administrator</span>
                                <span className="rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1 text-[9px] uppercase tracking-wider text-emerald-100">Live Status</span>
                            </div>
                            <div className="h-64 sm:h-80">
                                <DotLottieReact
                                    src="https://lottie.host/2b1486e1-2a7e-4ea3-807c-3a08d25a7886/Cig7evKYpi.lottie"
                                    loop
                                    autoplay
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[['Users', 'Active'], ['Proctoring', 'Secure'], ['Database', 'Online']].map(([label, value]) => (
                                    <div key={label} className="rounded-xl border border-white/8 bg-black/20 p-3 text-center">
                                        <p className="text-[9px] uppercase tracking-wider text-white/35">{label}</p>
                                        <p className="mt-1 text-xs font-semibold text-white/80">{value}</p>
                                    </div>
                                ))}
                            </div>
                        {/* </div> */}
                    </motion.div>
                </div>
            </section>
        </main>
    );
};

export default AdminLandingPage;
