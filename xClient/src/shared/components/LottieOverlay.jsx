import { useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LottieOverlay - A reusable, premium glassmorphic overlay for displaying Lottie animations.
 */
const LottieOverlay = ({ 
  isOpen, 
  src, 
  message, 
  loop = true, 
  colorClass = "text-amber-300", 
  borderClass = "border-white/10",
  shadowClass = "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]",
  onComplete,
  autoCloseDuration
}) => {

  useEffect(() => {
    if (isOpen && src) {
      // Preload Lottie asset
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'fetch';
      link.href = src;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      let timer;
      if (autoCloseDuration && onComplete) {
        timer = setTimeout(() => {
          onComplete();
        }, autoCloseDuration);
      }

      return () => {
        document.head.removeChild(link);
        if (timer) clearTimeout(timer);
      };
    }
  }, [isOpen, src, autoCloseDuration, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#0c0b11]/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            className={`flex flex-col items-center justify-center p-8 rounded-3xl border ${borderClass} ${shadowClass} bg-black/40 max-w-sm w-[90%] mx-auto backdrop-blur-xl`}
          >
            <div className="w-40 h-40 flex items-center justify-center overflow-hidden">
              <DotLottieReact
                src={src}
                loop={loop}
                autoplay
              />
            </div>

            {message && (
              <span className={`font-bold text-xs tracking-[0.2em] uppercase font-mono mt-4 text-center ${colorClass}`}>
                {message}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LottieOverlay;
