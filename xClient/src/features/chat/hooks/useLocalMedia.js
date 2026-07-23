import { useState, useEffect, useRef, useCallback } from "react";

export const useLocalMedia = () => {
  const [localStream, setLocalStream] = useState(null);
  const [resolution, setResolution] = useState("720p");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const rawStreamRef = useRef(null);
  const screenTrackRef = useRef(null); // keep reference to active screen track
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
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach(track => track.stop());
      rawStreamRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setIsScreenSharing(false);
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
      screenTrackRef.current = null;
    } catch (error) {
      console.error("Error accessing user media:", error);
      throw error;
    }
  }, [getConstraints, stopMedia]);

  // Stop screen sharing — restore camera
  const stopScreenShare = useCallback(async () => {
    if (!isScreenSharing) return;

    // Stop the screen track
    if (screenTrackRef.current) {
      screenTrackRef.current.onended = null; // prevent double-call
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    // Restore camera
    try {
      const constraints = getConstraints(resolution);
      const cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      rawStreamRef.current = cameraStream;

      // Replace screen track with camera track inside localStream
      if (localStream) {
        // Remove all video tracks (screen)
        localStream.getVideoTracks().forEach(t => {
          localStream.removeTrack(t);
          t.stop();
        });
        // Add camera video track
        cameraStream.getVideoTracks().forEach(t => localStream.addTrack(t));
        // Trigger useEffect in useWebRTCWorkspace via new MediaStream reference
        setLocalStream(new MediaStream(localStream.getTracks()));
      } else {
        setLocalStream(cameraStream);
      }

      setIsScreenSharing(false);
      setIsVideoOff(false);
    } catch (error) {
      console.error("Error restoring camera after screen share:", error);
    }
  }, [isScreenSharing, localStream, resolution, getConstraints]);

  // Screen Sharing — toggle on/off
  const startScreenShare = useCallback(async () => {
    // If already sharing → stop
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

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

      // When user stops screen share via browser UI, restore camera automatically
      screenTrack.onended = () => {
        screenTrackRef.current = null;
        startCamera(resolution);
      };
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  }, [isScreenSharing, stopScreenShare, localStream, resolution, startCamera]);

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
    stopScreenShare,
    toggleMute,
    toggleVideo,
    stopMedia
  };
};