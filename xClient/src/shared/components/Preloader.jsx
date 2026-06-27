import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import gsap from 'gsap';

// Web Audio API Synthesizer Helper
class SoundSynth {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playHover() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Soft clean pop/synth chime sound on hover
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    playWowVocal() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Sound Source: Sawtooth + Triangle mix for rich vocal formants
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';

        // Pitch envelope: slides from curious to enthusiastic tone to mimic "Wow!"
        osc1.frequency.setValueAtTime(155, now);
        osc1.frequency.linearRampToValueAtTime(240, now + 0.15);
        osc1.frequency.exponentialRampToValueAtTime(175, now + 0.45);

        osc2.frequency.setValueAtTime(156, now);
        osc2.frequency.linearRampToValueAtTime(241, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(176, now + 0.45);

        // Double Formant Filters (vowel track simulation for "W-O-A")
        const filter1 = this.ctx.createBiquadFilter();
        const filter2 = this.ctx.createBiquadFilter();

        filter1.type = 'bandpass';
        filter1.Q.setValueAtTime(9, now);
        filter1.frequency.setValueAtTime(300, now);
        filter1.frequency.exponentialRampToValueAtTime(750, now + 0.35);

        filter2.type = 'bandpass';
        filter2.Q.setValueAtTime(9, now);
        filter2.frequency.setValueAtTime(800, now);
        filter2.frequency.exponentialRampToValueAtTime(1150, now + 0.35);

        // Vocal volume envelope
        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        // Routing
        osc1.connect(filter1);
        osc2.connect(filter1);
        osc1.connect(filter2);
        osc2.connect(filter2);

        const mix = this.ctx.createGain();
        mix.gain.setValueAtTime(0.35, now);

        filter1.connect(mix);
        filter2.connect(mix);
        mix.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
    }

    playSuccessChime() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5 arpeggio

        notes.forEach((freq, idx) => {
            const delay = idx * 0.05;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + delay + 0.3);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1500, now + delay);

            gain.gain.setValueAtTime(0.0, now + delay);
            gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.45);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 0.5);
        });
    }
}

const synth = new SoundSynth();

export const Preloader = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const circleRef = useRef(null);
    const containerRef = useRef(null);

    // Simulate page assets progress loading
    useEffect(() => {
        let currentProgress = 0;
        const interval = setInterval(() => {
            const increment = Math.floor(Math.random() * 15) + 6;
            currentProgress = Math.min(currentProgress + increment, 100);
            setProgress(currentProgress);

            if (currentProgress >= 100) {
                clearInterval(interval);
                setIsLoaded(true);
            }
        }, 120 + Math.random() * 80);

        return () => clearInterval(interval);
    }, []);

    // Interactive actions
    const handleCircleMouseEnter = () => {
        if (isExiting) return;
        synth.playHover();

        // Gentle scale up and glow animation using GSAP
        gsap.to(circleRef.current, {
            scale: 1.06,
            boxShadow: '0 20px 45px rgba(62, 62, 244, 0.25), 0 0 30px rgba(255, 159, 67, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.8)',
            duration: 0.35,
            ease: 'power2.out'
        });
    };

    const handleCircleMouseLeave = () => {
        if (isExiting) return;

        gsap.to(circleRef.current, {
            scale: 1,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
            borderColor: 'rgba(255, 255, 255, 0.45)',
            duration: 0.45,
            ease: 'power2.out'
        });
    };

    const handleCircleClick = () => {
        if (isExiting) return;

        // Play click synthesized sound
        synth.playWowVocal();

        // Squish and stretch animation on click
        const tl = gsap.timeline();
        tl.to(circleRef.current, {
            scaleX: 1.15,
            scaleY: 0.85,
            duration: 0.08,
            ease: 'power1.inOut'
        })
            .to(circleRef.current, {
                scaleX: 0.9,
                scaleY: 1.1,
                duration: 0.12,
                ease: 'power2.out'
            })
            .to(circleRef.current, {
                scaleX: 1,
                scaleY: 1,
                duration: 0.2,
                ease: 'elastic.out(1, 0.5)'
            });

        // Trigger loading transition once loaded
        if (isLoaded) {
            synth.playSuccessChime();
            setIsExiting(true);

            setTimeout(() => {
                onComplete();
            }, 800);
        }
    };

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 0.96,
                        filter: 'blur(15px)',
                        transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] }
                    }}
                    className="fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-[#f2f2f7] text-slate-800 p-8 overflow-hidden select-none"
                    style={{
                        background: 'radial-gradient(circle at center, #f5f5f7 0%, #e5e5ea 100%)'
                    }}
                >
                    {/* Background floating glass-morphic accent color circles (Blue and Orange and Grey) */}
                    <div
                        className="absolute top-[20%] left-[15%] w-[380px] h-[380px] rounded-full bg-amber-400/12 blur-[90px] pointer-events-none animate-pulse"
                        style={{ animationDuration: '7s' }}
                    />
                    <div
                        className="absolute bottom-[20%] right-[15%] w-[420px] h-[420px] rounded-full bg-blue-500/12 blur-[100px] pointer-events-none animate-pulse"
                        style={{ animationDuration: '9s' }}
                    />

                    {/* Header */}
                    <div className="w-full max-w-6xl flex justify-between items-center opacity-50 text-[10px] tracking-[0.3em] font-mono mt-2 text-slate-500">
                        <div>SOLVE-X SYSTEMS</div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#3e3ef4] animate-ping" />
                            <span>LOTTIE_WELCOME_STATION</span>
                        </div>
                    </div>

                    {/* Glassmorphic Central Interactive Circle Container */}
                    <div className="relative flex flex-col items-center justify-center my-auto">
                        <motion.div
                            ref={circleRef}
                            onClick={handleCircleClick}
                            onMouseEnter={handleCircleMouseEnter}
                            onMouseLeave={handleCircleMouseLeave}
                            className="relative w-60 h-60 md:w-68 md:h-68 rounded-full cursor-pointer flex items-center justify-center z-10 border border-white/45 shadow-[0_15px_35px_rgba(0,0,0,0.03)] overflow-hidden"
                            style={{
                                background: 'rgba(255, 255, 255, 0.4)',
                                backdropFilter: 'blur(30px)',
                                WebkitBackdropFilter: 'blur(30px)'
                            }}
                            animate={{
                                y: [0, -10, 0]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 3.5,
                                ease: 'easeInOut'
                            }}
                        >
                            {/* DotLottieReact Animation Player */}
                            <div className="w-[82%] h-[82%] flex items-center justify-center">
                                <DotLottieReact
                                    src="https://lottie.host/68fbf26d-950c-438d-84c2-c52276cd1a8d/wLmVW6AevN.lottie"
                                    loop
                                    autoplay
                                />
                            </div>
                        </motion.div>

                        {/* Interactive Hint & Status */}
                        <div className="mt-10 text-center min-h-[55px] w-full">
                            {isLoaded ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center gap-1"
                                >
                                    <span className="text-[#3e3ef4] font-bold tracking-[0.18em] text-[13px] uppercase animate-pulse">
                                        Welcome!
                                    </span>
                                    <span className="text-[10px] text-slate-500 tracking-[0.2em] font-mono uppercase">
                                        Click circle to enter Solve-X
                                    </span>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-[9px] text-slate-400 tracking-[0.25em] uppercase font-mono">
                                        Loading platform modules
                                    </span>
                                    <div className="w-44 h-1 bg-slate-200/80 rounded-full overflow-hidden border border-white">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-[#3e3ef4] to-amber-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                                        {progress}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer bar */}
                    <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center text-[9px] tracking-[0.25em] font-mono text-slate-400/60 border-t border-slate-200/60 pt-6 gap-3 mt-4">
                        <div>CLICK THE CIRCLE TO ACTIVATE SOUNDS & ENTRANCE</div>
                        <div>
                            <span>DEVELOPED BY ANTIGRAVITY &copy; 2026</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Preloader;
