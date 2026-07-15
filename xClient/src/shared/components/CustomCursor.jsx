import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CustomCursor = () => {
    const dotRef = useRef(null);
    const ringRef = useRef(null);

    useEffect(() => {
        const dot = dotRef.current;
        const ring = ringRef.current;
        if (!dot || !ring) return;

        // Quickset for initial position at screen center
        gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

        // Reuse the same tween setters instead of allocating new tweens on
        // every mouse event. This keeps pointer movement from competing with scroll.
        const moveDotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
        const moveDotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
        const moveRingX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
        const moveRingY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });

        const handleMouseMove = (e) => {
            moveDotX(e.clientX);
            moveDotY(e.clientY);
            moveRingX(e.clientX);
            moveRingY(e.clientY);
        };

        // Hover targets — all links, buttons, and interactive elements
        const addHoverListeners = () => {
            const targets = document.querySelectorAll('a, button, [data-cursor-hover]');
            targets.forEach((el) => {
                el.addEventListener('mouseenter', handleHoverEnter);
                el.addEventListener('mouseleave', handleHoverLeave);
            });
            return targets;
        };

        const handleHoverEnter = () => {
            gsap.to(ring, {
                width: 56,
                height: 56,
                borderColor: 'rgba(62, 62, 244, 0.6)',
                boxShadow: '0 0 20px rgba(62, 62, 244, 0.3)',
                duration: 0.3,
                ease: 'power2.out',
            });
            gsap.to(dot, {
                width: 6,
                height: 6,
                backgroundColor: '#3e3ef4',
                duration: 0.2,
            });
        };

        const handleHoverLeave = () => {
            gsap.to(ring, {
                width: 36,
                height: 36,
                borderColor: 'rgba(255, 255, 255, 0.45)',
                boxShadow: '0 0 0 rgba(0,0,0,0)',
                duration: 0.3,
                ease: 'power2.out',
            });
            gsap.to(dot, {
                width: 5,
                height: 5,
                backgroundColor: '#ffffff',
                duration: 0.2,
            });
        };

        // Hide on leave window
        const handleMouseLeave = () => {
            gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
        };
        const handleMouseEnter = () => {
            gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        const targets = addHoverListeners();

        // Re-observe for dynamic content
        const observer = new MutationObserver(() => {
            const newTargets = document.querySelectorAll('a, button, [data-cursor-hover]');
            newTargets.forEach((el) => {
                el.addEventListener('mouseenter', handleHoverEnter);
                el.addEventListener('mouseleave', handleHoverLeave);
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
            targets.forEach((el) => {
                el.removeEventListener('mouseenter', handleHoverEnter);
                el.removeEventListener('mouseleave', handleHoverLeave);
            });
            observer.disconnect();
        };
    }, []);

    return (
        <>
            {/* Small dot */}
            <div
                ref={dotRef}
                className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block transform-gpu will-change-transform"
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#3e3ef4',
                    boxShadow: '0 0 10px rgba(62,62,244,0.8)'
                }}
            />
            {/* Magnetic ring */}
            <div
                ref={ringRef}
                className="fixed top-0 left-0 pointer-events-none z-[9998] hidden md:block transform-gpu will-change-transform"
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(62, 62, 244, 0.45)',
                    backgroundColor: 'rgba(62, 62, 244, 0.05)',
                    transition: 'width 0.3s, height 0.3s, border-color 0.3s',
                }}
            />
        </>
    );
};

export default CustomCursor;
