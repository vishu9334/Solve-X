import LottieOverlay from './LottieOverlay';

/**
 * AcceptSuccessOverlay - Thin wrapper around reusable LottieOverlay.
 */
const AcceptSuccessOverlay = ({ isOpen, onComplete }) => {
  return (
    <LottieOverlay
      isOpen={isOpen}
      src="https://lottie.host/fa56ff56-74ec-440a-aa4c-30d760fd9ab4/tT6RGmp8dG.lottie"
      message="Offer Accepted!"
      loop={false}
      colorClass="text-emerald-400"
      borderClass="border-emerald-500/20"
      shadowClass="shadow-[0_25px_50px_-12px_rgba(16,185,129,0.15)]"
      onComplete={onComplete}
      autoCloseDuration={2000}
    />
  );
};

export default AcceptSuccessOverlay;
