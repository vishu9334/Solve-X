import { useState, useEffect, useRef, useCallback } from "react";

export const useLocalMedia = () => {
  const [localStream, setLocalStream] = useState(null);
  const [resolution, setResolution] = useState("720p");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const rawStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null); // hidden video element for canvas input
  const animationFrameId = useRef(null);

  // Resolution constraints mapper
  const getConstraints = useCallback((resPreset) => {
    const presets = {
      "2k": { width: 2560, height: 1440 },
      "1080p": { width: 1920, height: 1080 },
      "720p": { width: 1280, height: 720 },
      "360p": { width: 640, height: 360 }
    };
    return {
      audio: true,
      video: presets[resPreset] || presets["720p"]
    };
  }, []);

  // Clean up
  const stopMedia = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach(track => track.stop());
      rawStreamRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
  }, [localStream]);

  // Initialize Media Stream from camera
  const startCamera = useCallback(async (resPreset = "720p") => {
    try {
      // Clean up previous streams
      stopMedia();

      const constraints = getConstraints(resPreset);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      rawStreamRef.current = stream;

      setLocalStream(stream);
      setResolution(resPreset);
      setIsVideoOff(false);
      setIsScreenSharing(false);
    } catch (error) {
      console.error("Error accessing user media:", error);
      throw error;
    }
  }, [getConstraints, stopMedia]);

  // Screen Sharing
  const startScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) return;

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];

      // Stop canvas camera animation loop (but keep audio)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }

      // Replace the existing video track in localStream with screen track
      // This triggers the useEffect([localStream]) in useWebRTCWorkspace to replaceTrack on all senders
      if (localStream) {
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStream.addTrack(screenTrack);
        
        // Force stream state update by creating a new MediaStream instance wrapper
        setLocalStream(new MediaStream(localStream.getTracks()));
      }

      setIsScreenSharing(true);

      // When user stops screen share via browser UI, restore camera
      screenTrack.onended = () => {
        startCamera(resolution);
      };
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  }, [isScreenSharing, localStream, resolution, startCamera]);

  // Audio mute/unmute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Video enable/disable
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Auto clean-up on unmount
  useEffect(() => {
    return () => {
      stopMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    localStream,
    resolution,
    isMuted,
    isVideoOff,
    isScreenSharing,
    startCamera,
    startScreenShare,
    toggleMute,
    toggleVideo,
    stopMedia
  };
};