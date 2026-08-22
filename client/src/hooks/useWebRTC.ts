import { useCallback, useEffect, useRef } from 'react';
import { socketClient } from '../api/socketClient';
import { useCallStore } from '../store/callStore';

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC() {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const {
    isMuted,
    isCameraOff,
    setActive,
    endCall,
    setLocalStreamActive,
    setRemoteStreamActive,
  } = useCallStore();

  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Helper: stop all tracks and cleanup peer connection ────────────────
  const cleanupWebRTC = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current = null;

    peerConnection.current?.close();
    peerConnection.current = null;

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setLocalStreamActive(false);
    setRemoteStreamActive(false);

    // Blank out video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, [setLocalStreamActive, setRemoteStreamActive]);

  // ─── Get local media stream ──────────────────────────────────────────────
  const getLocalStream = useCallback(async (type: 'audio' | 'video'): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    setLocalStreamActive(true);

    if (localVideoRef.current && type === 'video') {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  }, [setLocalStreamActive]);

  // ─── Create RTCPeerConnection ────────────────────────────────────────────
  const createPeerConnection = useCallback((targetUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    peerConnection.current = pc;

    // Add local tracks to peer connection
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // ICE candidate handler — send to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = socketClient.getSocket();
        socket?.emit('call:ice-candidate', {
          targetUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setActive();
        // Start duration timer
        if (!durationIntervalRef.current) {
          durationIntervalRef.current = setInterval(() => {
            useCallStore.getState().tickDuration();
          }, 1000);
        }
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleEndCall(targetUserId);
      }
    };

    // Receive remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      setRemoteStreamActive(true);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    return pc;
  }, [setActive, setRemoteStreamActive]);

  // ─── Initiate a call (caller side) ──────────────────────────────────────
  const startCall = useCallback(async (targetUserId: string, type: 'audio' | 'video') => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    try {
      const stream = await getLocalStream(type);
      if (!stream) return;

      const pc = createPeerConnection(targetUserId);

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer over signaling
      socket.emit('call:webrtc-offer', {
        targetUserId,
        offer,
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      cleanupWebRTC();
      endCall();
    }
  }, [getLocalStream, createPeerConnection, cleanupWebRTC, endCall]);

  // ─── Answer an incoming call (callee side) ───────────────────────────────
  const answerCall = useCallback(async (callerId: string, offer: RTCSessionDescriptionInit, type: 'audio' | 'video') => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    try {
      await getLocalStream(type);

      const pc = createPeerConnection(callerId);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:webrtc-answer', {
        targetUserId: callerId,
        answer,
      });
    } catch (err) {
      console.error('Failed to answer call:', err);
      cleanupWebRTC();
      endCall();
    }
  }, [getLocalStream, createPeerConnection, cleanupWebRTC, endCall]);

  // ─── End call ────────────────────────────────────────────────────────────
  const handleEndCall = useCallback((targetUserId: string) => {
    const socket = socketClient.getSocket();
    socket?.emit('call:end', { targetUserId });
    cleanupWebRTC();
    endCall();
  }, [cleanupWebRTC, endCall]);

  // ─── Toggle mute ────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // ─── Toggle camera ───────────────────────────────────────────────────────
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isCameraOff]);

  // ─── Socket signaling listeners ───────────────────────────────────────────
  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    // Caller receives answer from callee
    const handleAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnection.current;
      if (pc && pc.signalingState !== 'closed') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error('Error setting remote description:', err);
        }
      }
    };

    // Receive ICE candidates
    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnection.current;
      if (pc && pc.signalingState !== 'closed') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    socket.on('call:webrtc-answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);

    return () => {
      socket.off('call:webrtc-answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupWebRTC();
    };
  }, [cleanupWebRTC]);

  return {
    localVideoRef,
    remoteVideoRef,
    localStreamRef,
    remoteStreamRef,
    startCall,
    answerCall,
    handleEndCall,
    cleanupWebRTC,
  };
}
