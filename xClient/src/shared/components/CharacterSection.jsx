import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CharacterSection = () => {
    const sectionRef = useRef(null);
    const studentRef = useRef(null);
    const mentorRef = useRef(null);
    const questionRef = useRef(null);
    const bulbRef = useRef(null);
    const connectLineRef = useRef(null);
    const priceRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {

            // Question mark float
            gsap.to(questionRef.current, {
                y: -14,
                duration: 1.6,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            // Lightbulb pulse
            gsap.to(bulbRef.current, {
                scale: 1.15,
                opacity: 1,
                duration: 0.9,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            // Student head confused shake
            const studentHead = studentRef.current?.querySelector('.student-head');
            if (studentHead) {
                gsap.to(studentHead, {
                    rotation: 4,
                    duration: 0.6,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                    transformOrigin: 'center bottom',
                });
            }

            // Mentor arm wave
            const mentorArm = mentorRef.current?.querySelector('.mentor-arm');
            if (mentorArm) {
                gsap.to(mentorArm, {
                    rotation: -12,
                    duration: 1.2,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                    transformOrigin: 'left center',
                });
            }

            // Scroll — characters slide in toward each other
            gsap.from(studentRef.current, {
                x: -120,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 75%',
                    toggleActions: 'play none none none',
                },
            });

            gsap.from(mentorRef.current, {
                x: 120,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 75%',
                    toggleActions: 'play none none none',
                },
            });

            // Connecting line draws in
            if (connectLineRef.current) {
                gsap.from(connectLineRef.current, {
                    scaleX: 0,
                    duration: 1.2,
                    delay: 0.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 70%',
                        toggleActions: 'play none none none',
                    },
                });
            }

            // Price counter: 0 → 99
            if (priceRef.current) {
                const counter = { val: 0 };
                gsap.to(counter, {
                    val: 99,
                    duration: 1.5,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: priceRef.current,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    },
                    onUpdate: () => {
                        if (priceRef.current) {
                            priceRef.current.textContent = '₹' + Math.round(counter.val);
                        }
                    },
                });
            }

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            id="characters"
            className="relative bg-[#f4f4f4] py-16 md:py-24 px-4 overflow-hidden"
        >
            <div className="mx-auto w-full max-w-[1200px]">

                {/* Section Title */}
                <div className="text-center mb-16">
                    <h2
                        className="font-raleway font-normal tracking-tight text-black leading-tight"
                        style={{ fontSize: 'clamp(1.8rem, 4vw, 44px)' }}
                    >
                        How Solve-X{' '}
                        <em className="font-serif font-normal italic">works for you</em>
                    </h2>
                    <p className="mt-3 text-base font-light text-black/50 max-w-lg mx-auto md:text-lg">
                        A student asks. A mentor answers. It's that simple.
                    </p>
                </div>

                {/* Characters Row */}
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0">

                    {/* ── Student Character ── */}
                    <div ref={studentRef} className="flex flex-col items-center md:flex-1">
                        <div className="relative w-[220px] h-[280px] md:w-[260px] md:h-[320px]">
                            <svg viewBox="0 0 260 320" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">

                                {/* Desk */}
                                <rect x="30" y="220" width="200" height="12" rx="6" fill="#e2e0e0" />
                                <rect x="70" y="232" width="12" height="60" rx="3" fill="#d0cece" />
                                <rect x="178" y="232" width="12" height="60" rx="3" fill="#d0cece" />

                                {/* Laptop on desk */}
                                <rect x="80" y="192" width="100" height="28" rx="4" fill="#2C3E50" />
                                <rect x="85" y="196" width="90" height="18" rx="2" fill="#4FC3F7" />
                                {/* Code lines on screen */}
                                <rect x="90" y="200" width="30" height="2" rx="1" fill="#81D4FA" />
                                <rect x="90" y="205" width="45" height="2" rx="1" fill="#B3E5FC" />
                                <rect x="90" y="210" width="20" height="2" rx="1" fill="#E1F5FE" />
                                {/* Laptop base */}
                                <path d="M70,220 L80,192 L180,192 L190,220 Z" fill="#34495E" opacity="0.3" />

                                {/* Body — sitting */}
                                <path d="M100,190 Q130,165 160,190 L155,220 L105,220 Z" fill="#3e3ef4" />
                                {/* Collar */}
                                <path d="M118,175 L130,185 L142,175" fill="none" stroke="#fff" strokeWidth="2" />

                                {/* Arms reaching to laptop */}
                                <path d="M105,195 Q85,200 90,210" fill="none" stroke="#FFE0B2" strokeWidth="10" strokeLinecap="round" />
                                <path d="M155,195 Q175,200 170,210" fill="none" stroke="#FFE0B2" strokeWidth="10" strokeLinecap="round" />

                                {/* Head */}
                                <g className="student-head">
                                    <circle cx="130" cy="155" r="28" fill="#FFE0B2" />
                                    {/* Hair — messy student hair */}
                                    <path d="M102,152 C102,130 118,118 130,118 C142,118 158,130 158,152 C158,155 152,145 130,145 C108,145 102,155 102,152 Z" fill="#2C3E50" />
                                    {/* Eyes — confused wide open */}
                                    <circle cx="120" cy="155" r="4" fill="#2C3E50" />
                                    <circle cx="140" cy="155" r="4" fill="#2C3E50" />
                                    <circle cx="121" cy="154" r="1.5" fill="#fff" />
                                    <circle cx="141" cy="154" r="1.5" fill="#fff" />
                                    {/* Eyebrows — confused raised */}
                                    <path d="M114,148 Q120,144 126,148" fill="none" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M134,148 Q140,144 146,148" fill="none" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
                                    {/* Mouth — confused/wondering "o" */}
                                    <ellipse cx="130" cy="168" rx="4" ry="3.5" fill="#C09070" />
                                </g>

                                {/* Question mark floating */}
                                <g ref={questionRef}>
                                    <text x="155" y="115" fontSize="36" fontWeight="bold" fill="#3e3ef4" opacity="0.7" fontFamily="serif">?</text>
                                </g>

                                {/* Thought bubbles */}
                                <circle cx="150" cy="130" r="3" fill="#3e3ef4" opacity="0.3" />
                                <circle cx="153" cy="122" r="4" fill="#3e3ef4" opacity="0.2" />
                            </svg>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 text-sm font-medium text-black border border-black/6 shadow-sm">
                                🧑‍💻 Student
                            </span>
                            <p className="mt-2 text-sm text-black/45 font-light">"I have a doubt..."</p>
                        </div>
                    </div>

                    {/* ── Connecting Line / Arrow ── */}
                    <div className="hidden md:flex flex-col items-center gap-2 px-4 z-10">
                        <div
                            ref={connectLineRef}
                            className="relative"
                            style={{ transformOrigin: 'left center' }}
                        >
                            <svg width="140" height="50" viewBox="0 0 140 50" fill="none">
                                {/* Dashed flowing line */}
                                <path
                                    d="M5,25 Q35,5 70,25 Q105,45 135,25"
                                    stroke="#3e3ef4"
                                    strokeWidth="2.5"
                                    fill="none"
                                    strokeDasharray="6 4"
                                    strokeLinecap="round"
                                />
                                {/* Arrow tip */}
                                <polygon points="130,20 140,25 130,30" fill="#3e3ef4" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-[#3e3ef4] tracking-wide uppercase">Connects</span>
                    </div>

                    {/* ── Mentor Character ── */}
                    <div ref={mentorRef} className="flex flex-col items-center md:flex-1">
                        <div className="relative w-[220px] h-[280px] md:w-[260px] md:h-[320px]">
                            <svg viewBox="0 0 260 320" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">

                                {/* Whiteboard behind mentor */}
                                <rect x="140" y="60" width="100" height="80" rx="6" fill="#fff" stroke="#e0e0e0" strokeWidth="2" />
                                {/* Board content — formulas/diagrams */}
                                <rect x="152" y="75" width="40" height="3" rx="1.5" fill="#3e3ef4" opacity="0.5" />
                                <rect x="152" y="83" width="55" height="3" rx="1.5" fill="#3e3ef4" opacity="0.35" />
                                <rect x="152" y="91" width="30" height="3" rx="1.5" fill="#3e3ef4" opacity="0.2" />
                                <circle cx="210" cy="108" r="12" fill="none" stroke="#3e3ef4" strokeWidth="1.5" opacity="0.3" />
                                <path d="M204,108 L216,108 M210,102 L210,114" stroke="#3e3ef4" strokeWidth="1.5" opacity="0.3" />
                                {/* Board stand */}
                                <rect x="185" y="140" width="10" height="50" rx="3" fill="#d0cece" />

                                {/* Body — standing */}
                                <path d="M80,185 Q110,165 140,185 L140,290 L80,290 Z" fill="#1565C0" />
                                {/* Tie */}
                                <path d="M108,185 L110,210 L112,185" fill="#0D47A1" />

                                {/* Legs */}
                                <rect x="88" y="270" width="14" height="40" rx="5" fill="#2C3E50" />
                                <rect x="118" y="270" width="14" height="40" rx="5" fill="#2C3E50" />
                                {/* Shoes */}
                                <ellipse cx="95" cy="310" rx="14" ry="6" fill="#1a1a2e" />
                                <ellipse cx="125" cy="310" rx="14" ry="6" fill="#1a1a2e" />

                                {/* Left arm (resting) */}
                                <path d="M80,200 Q65,230 75,260" fill="none" stroke="#FFE0B2" strokeWidth="10" strokeLinecap="round" />

                                {/* Right arm — pointing to board (animated) */}
                                <g className="mentor-arm">
                                    <path d="M140,200 Q165,175 175,140" fill="none" stroke="#FFE0B2" strokeWidth="10" strokeLinecap="round" />
                                    {/* Pointing finger */}
                                    <circle cx="175" cy="137" r="4" fill="#FFE0B2" />
                                </g>

                                {/* Head */}
                                <circle cx="110" cy="160" r="28" fill="#FFE0B2" />
                                {/* Hair — neat, professional */}
                                <path d="M82,156 C82,132 96,120 110,120 C124,120 138,132 138,156 C138,159 132,148 110,148 C88,148 82,159 82,156 Z" fill="#5D4037" />
                                {/* Glasses */}
                                <rect x="96" y="154" width="12" height="9" rx="3" fill="none" stroke="#2C3E50" strokeWidth="2.5" />
                                <rect x="112" y="154" width="12" height="9" rx="3" fill="none" stroke="#2C3E50" strokeWidth="2.5" />
                                <line x1="108" y1="158" x2="112" y2="158" stroke="#2C3E50" strokeWidth="2.5" />
                                {/* Eyes — confident */}
                                <circle cx="102" cy="158" r="2.5" fill="#2C3E50" />
                                <circle cx="118" cy="158" r="2.5" fill="#2C3E50" />
                                {/* Smile — friendly */}
                                <path d="M102,170 Q110,177 118,170" fill="none" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
                                {/* Headset */}
                                <path d="M138,155 Q142,170 125,178" fill="none" stroke="#90A4AE" strokeWidth="2.5" />
                                <circle cx="124" cy="178" r="3" fill="#37474F" />

                                {/* Lightbulb */}
                                <g ref={bulbRef} style={{ transformOrigin: '80px 60px' }}>
                                    <circle cx="80" cy="70" r="16" fill="#FFD54F" opacity="0.25" />
                                    <text x="72" y="78" fontSize="24">💡</text>
                                </g>
                            </svg>
                        </div>
                        <div className="mt-4 text-center">
                            <span className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 text-sm font-medium text-black border border-black/6 shadow-sm">
                                👨‍🏫 Mentor
                            </span>
                            <p className="mt-2 text-sm text-black/45 font-light">"Let me explain..."</p>
                        </div>
                    </div>
                </div>

                {/* ── ₹99 Pricing CTA ── */}
                <div className="mt-20 md:mt-28 flex justify-center">
                    <div className="relative w-full max-w-[700px] rounded-[24px] bg-white border border-black/[0.06] p-8 md:p-12 text-center shadow-[0_18px_60px_rgba(62,62,244,0.08)] overflow-hidden">
                        {/* Glow accents */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#3e3ef4]/8 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-[#FFD54F]/10 blur-3xl pointer-events-none" />

                        <p className="text-sm font-medium text-[#3e3ef4] tracking-wide uppercase mb-3">Start Solving Now</p>

                        <h3
                            className="font-raleway font-normal text-black leading-tight"
                            style={{ fontSize: 'clamp(1.5rem, 3.5vw, 38px)' }}
                        >
                            Have a doubt? Solve it starting at just{' '}
                            <span
                                ref={priceRef}
                                className="inline-block font-bold text-[#3e3ef4]"
                                style={{ minWidth: '3ch' }}
                            >
                                ₹0
                            </span>
                        </h3>

                        <p className="mt-4 text-sm text-black/45 font-light max-w-md mx-auto md:text-base">
                            Most mentors respond in under 5 minutes. Pay only for the sessions you choose.
                            No hidden fees. No subscriptions.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                to="/register"
                                className="gsap-btn inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-gradient-to-b from-[#242424] from-[19%] to-black px-7 py-3 text-sm font-medium tracking-[-0.03em] text-white transition-colors hover:from-[#2e2e2e] hover:to-neutral-900 cursor-pointer"
                            >
                                Get Started
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </Link>
                            <Link
                                to="/student-doc"
                                className="gsap-btn inline-flex items-center justify-center gap-2 rounded-full border border-black/12 bg-white px-7 py-3 text-sm font-medium tracking-[-0.03em] text-black transition-colors hover:bg-neutral-50 cursor-pointer shadow-sm"
                            >
                                View Details
                            </Link>
                        </div>

                        <p className="mt-5 text-xs text-black/30 font-light">
                            🕒 Average mentor response time: &lt;5 min &nbsp;·&nbsp; ⭐ 4.9/5 satisfaction
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CharacterSection;
