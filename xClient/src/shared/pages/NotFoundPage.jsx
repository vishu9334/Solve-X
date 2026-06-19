import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
    return (
        <div 
            className="min-h-screen w-full flex flex-col justify-between items-center bg-[#f2f2f7] text-slate-800 p-8 overflow-hidden select-none"
            style={{
                background: 'radial-gradient(circle at center, #ffffff 0%, #e5e5ea 100%)'
            }}
        >
            {/* Ambient background glowing blobs */}
            <div className="absolute top-[20%] left-[10%] w-[320px] h-[320px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full bg-amber-500/10 blur-[90px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

            {/* Top Bar */}
            <div className="w-full max-w-6xl flex justify-between items-center opacity-50 text-[10px] tracking-[0.3em] font-mono mt-2 text-slate-500">
                <Link to="/public" className="flex items-center space-x-2 hover:opacity-85 transition-opacity">
                    <img src="/logo.png" alt="Solve-X Logo" className="w-6 h-6 object-contain" />
                    <span>SOLVE-X</span>
                </Link>
                <span>ERROR_404_PAGE</span>
            </div>

            {/* Glassmorphic Central Box */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative flex flex-col items-center justify-center py-12 px-8 md:px-16 rounded-[32px] border border-white/60 shadow-[0_30px_70px_rgba(0,0,0,0.03)] z-10 max-w-md w-full"
                style={{
                    background: 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)'
                }}
            >
                {/* Lottie Animation Wrapper */}
                <div className="w-64 h-64 flex items-center justify-center overflow-hidden mb-6">
                    <DotLottieReact
                        src="https://lottie.host/457598b3-c738-47e9-a605-71c411b01b37/0TYWEhMqt9.lottie"
                        loop
                        autoplay
                    />
                </div>

                {/* Text Context */}
                <div className="text-center space-y-3">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-sans">
                        Oops! Lost in Code?
                    </h1>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                        The page you are looking for doesn't exist, has been moved, or is currently under construction.
                    </p>
                </div>

                {/* CTA Button */}
                <div className="mt-8 w-full flex justify-center">
                    <Link
                        to="/public"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-black/12 bg-white px-8 py-3.5 text-sm font-semibold tracking-[-0.01em] text-slate-800 transition-all hover:bg-neutral-50 shadow-sm active:scale-95 duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="m12 19-7-7 7-7"/>
                            <path d="M5 12h14"/>
                        </svg>
                        Back to Home
                    </Link>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="w-full max-w-6xl flex justify-between items-center text-[9px] tracking-[0.25em] font-mono text-slate-400/60 border-t border-slate-200/60 pt-6 mt-4">
                <span>© 2026 SOLVE-X. ALL RIGHTS RESERVED.</span>
                <span>[ STATUS: 404_NOT_FOUND ]</span>
            </div>
        </div>
    );
};

export default NotFoundPage;
