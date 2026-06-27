import React from 'react';
import LottieOverlay from './LottieOverlay';

/**
 * NotificationSendingOverlay - Thin wrapper around reusable LottieOverlay.
 */
const NotificationSendingOverlay = ({ isOpen, message = "Sending notification..." }) => {
  return (
    <LottieOverlay
      isOpen={isOpen}
      src="https://lottie.host/078f5ad1-529f-4bc3-b7eb-32f20d61bcb1/pFjIIB7bqo.lottie"
      message={message}
      loop={true}
      colorClass="text-amber-300 animate-pulse"
      borderClass="border-white/10"
      shadowClass="shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
    />
  );
};

export default NotificationSendingOverlay;
