import React, { useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LoadingOverlay - Full screen glassmorphic loading spinner overlay
 * triggered during critical API actions.
 * 
 * Features:
 * - Preloads the external Lottie file on initial component mount to leverage browser cache.
 * - Opens and closes instantly based on the isLoading prop.
 * 
 * @param {boolean} isLoading - Controls the visibility of the overlay.
 * @param {string} message - Custom loading text to display below the Lottie.
 */
const LoadingOverlay = ({ isLoading, message = "Processing..." }) => {
    // Preload the Lottie asset on component mount to avoid network lag when submit is clicked
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'fetch';
        link.href = 'https://lottie.host/4a00c01d-130d-482f-82ec-b62466320665/qS23MeFyyf.lottie';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-white/45 backdrop-blur-[10px]"
                >
                    {/* Glass card container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ delay: 0.05, duration: 0.2 }}
                        className="flex flex-col items-center justify-center p-8 rounded-3xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.06)] bg-white/65 max-w-xs w-full"
                    >
                        {/* Lottie Spinner */}
                        <div className="w-36 h-36 flex items-center justify-center overflow-hidden">
                            <DotLottieReact
                                src="https://lottie.host/4a00c01d-130d-482f-82ec-b62466320665/qS23MeFyyf.lottie"
                                loop
                                autoplay
                            />
                        </div>

                        {/* Custom status message */}
                        <span className="text-slate-600 font-semibold text-xs tracking-[0.15em] uppercase font-mono mt-4 animate-pulse">
                            {message}
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingOverlay;
