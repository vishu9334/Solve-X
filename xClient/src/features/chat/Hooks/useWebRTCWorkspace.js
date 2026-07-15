import { useEffect, useRef, useState, useCallback } from "react";

const CHUNK_SIZE = 16384; // 16KB chunks for WebRTC cross-browser safety

export const useWebRTCWorkspace = (socket, chatRoomId, currentUser, localStream, isVideoOff) => {
  const [peers, setPeers] = useState([]); // Array of { socketId, userName, role, stream, videoOff }
  const [chatMessages, setChatMessages] = useState([]);
  const [fileProgress, setFileProgress] = useState(null); // { fileName, progress, isSending }
  const [incomingFile, setIncomingFile] = useState(null); // downloaded blob metadata

  const [peerMediaStates, setPeerMediaStates] = useState({}); // Key: socketId, Value: { videoOff }
  const peerMediaStatesRef = useRef({});
  peerMediaStatesRef.current = peerMediaStates;

  const isVideoOffRef = useRef(isVideoOff);
  isVideoOffRef.current = isVideoOff;

  const pcsRef = useRef({}); // Key: socketId, Value: RTCPeerConnection
  const dcsRef = useRef({}); // Key: socketId, Value: RTCDataChannel
  const fileBuffers = useRef({}); // Key: transferId, Value: ArrayBuffer chunks accumulator

  const updatePeersList = () => {
    setPeers(
      Object.keys(pcsRef.current).map((socketId) => ({
        socketId,
        userName: pcsRef.current[socketId].userName,
        role: pcsRef.current[socketId].role,
        stream: pcsRef.current[socketId].remoteStream,
        videoOff: !!peerMediaStatesRef.current[socketId]?.videoOff,
      }))
    );
  };

  // --- Send Instant Chat Message P2P ---
  const sendP2PMessage = useCallback((text) => {
    const msgPacket = {
      type: "CHAT",
      senderId: currentUser._id || currentUser.id,
      senderName: currentUser.name,
      message: text,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, { ...msgPacket, isSelf: true }]);

    // Broadcast through all active peer data channels
    Object.values(dcsRef.current).forEach((dc) => {
      if (dc.readyState === "open") {
        dc.send(JSON.stringify(msgPacket));
      }
    });
  }, [currentUser]);

  // --- Send File P2P (Chunked Protocol) ---
  const sendP2PFile = useCallback((file) => {
    if (!file) return;
    const fileId = `${Date.now()}_${file.name}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    setFileProgress({ fileName: file.name, progress: 0, isSending: true });

    const reader = new FileReader();
    let offset = 0;
    let chunkIndex = 0;

    // Send metadata packet to all channels
    const metaPacket = {
      type: "FILE_META",
      fileId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      totalChunks,
    };

    Object.values(dcsRef.current).forEach((dc) => {
      if (dc.readyState === "open") {
        dc.send(JSON.stringify(metaPacket));
      }
    });

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      const buffer = e.target.result;

      // Broadcast chunk packet
      Object.values(dcsRef.current).forEach((dc) => {
        if (dc.readyState === "open") {
          dc.send(buffer); // sending raw binary chunk
        }
      });

      offset += buffer.byteLength;
      chunkIndex++;

      const pct = Math.round((chunkIndex / totalChunks) * 100);
      setFileProgress({ fileName: file.name, progress: pct, isSending: true });

      if (offset < file.size) {
        // Yield thread to keep UI smooth during loops
        setTimeout(readNextChunk, 1);
      } else {
        // Send end packet
        const endPacket = { type: "FILE_END", fileId };
        Object.values(dcsRef.current).forEach((dc) => {
          if (dc.readyState === "open") {
            dc.send(JSON.stringify(endPacket));
          }
        });
        setFileProgress(null);
      }
    };

    readNextChunk();
  }, []);

  // Register all incoming channel operations
  const registerDataChannelEvents = useCallback((channel, targetSocketId) => {
    let currentFileMeta = null;

    const sendCurrentState = () => {
      const packet = {
        type: "MEDIA_STATE",
        senderId: currentUser._id || currentUser.id,
        videoOff: isVideoOffRef.current,
      };
      if (channel.readyState === "open") {
        try {
          channel.send(JSON.stringify(packet));
        } catch (e) {
          console.error("Error sending initial MEDIA_STATE P2P:", e);
        }
      }
    };

    if (channel.readyState === "open") {
      sendCurrentState();
    } else {
      channel.onopen = sendCurrentState;
    }

    channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        try {
          const packet = JSON.parse(event.data);

          if (packet.type === "CHAT") {
            setChatMessages((prev) => [...prev, { ...packet, isSelf: false }]);
          } else if (packet.type === "MEDIA_STATE") {
            setPeerMediaStates((prev) => ({
              ...prev,
              [targetSocketId]: {
                videoOff: packet.videoOff,
              }
            }));
          } else if (packet.type === "FILE_META") {
            currentFileMeta = packet;
            fileBuffers.current[packet.fileId] = [];
            setFileProgress({ fileName: packet.fileName, progress: 0, isSending: false });
          } else if (packet.type === "FILE_END") {
            const meta = currentFileMeta;
            if (meta) {
              const bufferList = fileBuffers.current[packet.fileId];
              const blob = new Blob(bufferList, { type: meta.mimeType });
              setIncomingFile({
                fileName: meta.fileName,
                downloadUrl: URL.createObjectURL(blob),
              });
              setFileProgress(null);
              delete fileBuffers.current[packet.fileId];
            }
          }
        } catch (e) {
          console.error("JSON parsing error on text channel:", e);
        }
      } else {
        // Incoming binary file chunk
        if (currentFileMeta) {
          fileBuffers.current[currentFileMeta.fileId].push(event.data);
          const currentLength = fileBuffers.current[currentFileMeta.fileId].length;
          const pct = Math.round((currentLength / currentFileMeta.totalChunks) * 100);
          setFileProgress({ fileName: currentFileMeta.fileName, progress: pct, isSending: false });
        }
      }
    };

    channel.onclose = () => {
      delete dcsRef.current[targetSocketId];
    };
  }, [currentUser]);

  // Core Connection Initializer
  const initPeerConnection = useCallback((targetSocketId, details, isInitiator) => {
    if (pcsRef.current[targetSocketId]) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun.services.mozilla.com" }
      ],
    });

    pc.userName = details.userName;
    pc.role = details.role;
    pc.remoteStream = new MediaStream();

    // Bind local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc:signal", {
          targetSocketId,
          signalData: { type: "candidate", candidate: e.candidate },
        });
      }
    };

    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((track) => {
        pc.remoteStream.addTrack(track);
      });
      updatePeersList();
    };

    // Signaling initiator generates Offer
    if (isInitiator) {
      const dc = pc.createDataChannel("solve-x-datachannel", { ordered: true });
      dcsRef.current[targetSocketId] = dc;
      registerDataChannelEvents(dc, targetSocketId);

      pc.createOffer().then((offer) => {
        return pc.setLocalDescription(offer);
      }).then(() => {
        socket.emit("webrtc:signal", {
          targetSocketId,
          signalData: { type: "offer", sdp: pc.localDescription },
        });
      });
    } else {
      // Remote responder binds channels
      pc.ondatachannel = (e) => {
        dcsRef.current[targetSocketId] = e.channel;
        registerDataChannelEvents(e.channel, targetSocketId);
      };
    }

    pcsRef.current[targetSocketId] = pc;
    updatePeersList();
  }, [localStream, socket, registerDataChannelEvents]);

  // Clean up all connections on unmount/leave
  const leaveCall = useCallback(() => {
    if (socket) {
      socket.emit("webrtc:leave");
    }
    Object.keys(pcsRef.current).forEach((id) => {
      pcsRef.current[id].close();
      if (dcsRef.current[id]) dcsRef.current[id].close();
    });
    pcsRef.current = {};
    dcsRef.current = {};
    setPeers([]);
    setChatMessages([]);
  }, [socket]);

  // Dynamically update tracks on stream initialization, screen share, or resolution change
  useEffect(() => {
    if (!localStream) return;

    Object.values(pcsRef.current).forEach((pc) => {
      const senders = pc.getSenders();

      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];

      if (videoTrack) {
        const videoSender = senders.find((s) => s.track?.kind === "video" || s.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(videoTrack).catch((e) => {
            console.warn("replaceTrack video failed:", e);
          });
        } else {
          try {
            pc.addTrack(videoTrack, localStream);
          } catch (e) {
            console.warn("addTrack video failed:", e);
          }
        }
      }

      if (audioTrack) {
        const audioSender = senders.find((s) => s.track?.kind === "audio" || s.kind === "audio");
        if (audioSender) {
          audioSender.replaceTrack(audioTrack).catch((e) => {
            console.warn("replaceTrack audio failed:", e);
          });
        } else {
          try {
            pc.addTrack(audioTrack, localStream);
          } catch (e) {
            console.warn("addTrack audio failed:", e);
          }
        }
      }
    });
  }, [localStream]);

  // Initialize Socket.io listeners
  useEffect(() => {
    if (!socket || !chatRoomId || !currentUser) return;

    socket.emit("webrtc:join", {
      chatRoomId,
      userId: currentUser._id || currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
    });

    const handlePeerList = (peerList) => {
      peerList.forEach((peer) => {
        // We initiate the offer since we just joined and discovered existing peers
        initPeerConnection(peer.socketId, peer, true);
      });
    };

    const handlePeerJoined = (peer) => {
      // Keep passive until signaling offer arrives
      initPeerConnection(peer.socketId, peer, false);
    };

    const handleSignal = ({ senderSocketId, signalData }) => {
      const pc = pcsRef.current[senderSocketId];
      if (!pc) return;

      if (signalData.type === "offer") {
        pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp))
          .then(() => pc.createAnswer())
          .then((answer) => pc.setLocalDescription(answer))
          .then(() => {
            socket.emit("webrtc:signal", {
              targetSocketId: senderSocketId,
              signalData: { type: "answer", sdp: pc.localDescription },
            });
          });
      } else if (signalData.type === "answer") {
        pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
      } else if (signalData.type === "candidate") {
        pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
      }
    };

    const handlePeerLeft = ({ socketId }) => {
      if (pcsRef.current[socketId]) {
        pcsRef.current[socketId].close();
        delete pcsRef.current[socketId];
      }
      if (dcsRef.current[socketId]) {
        dcsRef.current[socketId].close();
        delete dcsRef.current[socketId];
      }
      updatePeersList();
    };

    socket.on("webrtc:peer-list", handlePeerList);
    socket.on("webrtc:peer-joined", handlePeerJoined);
    socket.on("webrtc:signal", handleSignal);
    socket.on("webrtc:peer-left", handlePeerLeft);

    return () => {
      socket.off("webrtc:peer-list", handlePeerList);
      socket.off("webrtc:peer-joined", handlePeerJoined);
      socket.off("webrtc:signal", handleSignal);
      socket.off("webrtc:peer-left", handlePeerLeft);
      leaveCall();
    };
  }, [socket, chatRoomId, currentUser, initPeerConnection, leaveCall]);
  // Broadcast local video state toggles to all active P2P data channels
  useEffect(() => {
    const packet = {
      type: "MEDIA_STATE",
      senderId: currentUser._id || currentUser.id,
      videoOff: isVideoOff,
    };
    Object.values(dcsRef.current).forEach((dc) => {
      if (dc.readyState === "open") {
        try {
          dc.send(JSON.stringify(packet));
        } catch (e) {
          console.error("Error broadcasting MEDIA_STATE:", e);
        }
      }
    });
  }, [isVideoOff, currentUser]);

  // Dynamically update peer list videoOff flags whenever peerMediaStates updates
  useEffect(() => {
    setPeers((prev) =>
      prev.map((peer) => ({
        ...peer,
        videoOff: !!peerMediaStates[peer.socketId]?.videoOff,
      }))
    );
  }, [peerMediaStates]);

  return {
    peers,
    chatMessages,
    fileProgress,
    incomingFile,
    sendP2PMessage,
    sendP2PFile,
    leaveCall,
    setIncomingFile,
  };
};
