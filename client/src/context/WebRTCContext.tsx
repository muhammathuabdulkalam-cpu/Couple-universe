/**
 * WebRTCContext — single shared peer connection instance for the entire chat.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { socketClient } from '../api/socketClient';
import { useAuthStore } from '../store/authStore';
import { useCallStore } from '../store/callStore';

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

interface WebRTCContextValue {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (targetUserId: string, type: 'audio' | 'video') => Promise<void>;
  answerCall: (callerId: string, offer: RTCSessionDescriptionInit, type: 'audio' | 'video') => Promise<void>;
  hangUp: (targetUserId: string) => void;
}

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

export const useWebRTCContext = (): WebRTCContextValue => {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error('useWebRTCContext must be used inside WebRTCProvider');
  return ctx;
};

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { setActive, endCall, setLocalStreamActive, setRemoteStreamActive } = useCallStore();

  // Keep video element srcObjects updated whenever streams or refs change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef.current]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef.current]);

  // ─── Cleanup ────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    setLocalStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    setRemoteStream(null);

    peerRef.current?.close();
    peerRef.current = null;

    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }

    setLocalStreamActive(false);
    setRemoteStreamActive(false);

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, [setLocalStreamActive, setRemoteStreamActive]);

  // ─── Get user media ──────────────────────────────────────────────────────
  const getLocalStream = useCallback(async (type: 'audio' | 'video'): Promise<MediaStream> => {
    try {
      const nav = navigator as any;
      const mediaDevices = navigator.mediaDevices || (
        (nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia)
          ? {
              getUserMedia: (constraints: MediaStreamConstraints) =>
                new Promise<MediaStream>((resolve, reject) => {
                  const legacyFunc = nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia;
                  legacyFunc.call(navigator, constraints, resolve, reject);
                }),
            }
          : null
      );

      if (!mediaDevices || !mediaDevices.getUserMedia) {
        throw new Error(
          `Camera/Microphone access is blocked by browser security rules when accessing over HTTP IP (${window.location.hostname}). Please open the app via http://localhost:${window.location.port || '5174'} or HTTPS to enable calls.`
        );
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
          : false,
      });
      setLocalStream(stream);
      setLocalStreamActive(true);
      return stream;
    } catch (err: any) {
      console.error('❌ getUserMedia failed:', err.name, err.message);
      if (err.message && err.message.includes('localhost')) {
        throw err;
      }
      throw new Error(
        err.name === 'NotAllowedError'
          ? 'Microphone/camera permission denied. Please allow access in your browser settings.'
          : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
          ? 'No camera or microphone found on your device.'
          : `Could not access media: ${err.message || 'Unknown media error'}`
      );
    }
  }, [setLocalStreamActive]);

  // ─── Create peer connection ──────────────────────────────────────────────
  const createPC = useCallback((targetUserId: string, stream: MediaStream): RTCPeerConnection => {
    if (peerRef.current) {
      peerRef.current.close();
    }

    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    peerRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Send ICE candidates to remote peer
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketClient.getSocket()?.emit('call:ice-candidate', {
          targetUserId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 WebRTC connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setActive();
        if (!durationRef.current) {
          durationRef.current = setInterval(() => {
            useCallStore.getState().tickDuration();
          }, 1000);
        }
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.warn('⚠️ WebRTC connection failed/disconnected');
        hangUp(targetUserId);
      }
    };

    // Receive remote stream
    pc.ontrack = (e) => {
      console.log('📹 Received remote stream track:', e.track?.kind);
      const incomingStream = (e.streams && e.streams[0]) ? e.streams[0] : new MediaStream([e.track]);
      setRemoteStream(incomingStream);
      setRemoteStreamActive(true);
    };

    return pc;
  }, [setActive, setRemoteStreamActive]);

  // ─── Start call (caller) ─────────────────────────────────────────────────
  const startCall = useCallback(async (targetUserId: string, type: 'audio' | 'video') => {
    console.log(`📞 Starting ${type} call to:`, targetUserId);
    try {
      // Notify server and target recipient about incoming call
      const currentUser = useAuthStore.getState().user;
      socketClient.getSocket()?.emit('call:initiate', {
        targetUserId,
        callType: type,
        callerName: currentUser?.name || 'Partner',
        callerAvatar: currentUser?.avatar || '',
      });

      const stream = await getLocalStream(type);
      const pc = createPC(targetUserId, stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('📤 Sending WebRTC offer to:', targetUserId);
      socketClient.getSocket()?.emit('call:webrtc-offer', { targetUserId, offer });
    } catch (err: any) {
      console.error('❌ startCall failed:', err.message);
      cleanup();
      endCall();
      throw err;
    }
  }, [getLocalStream, createPC, cleanup, endCall]);

  // ─── Answer call (callee) ────────────────────────────────────────────────
  const answerCall = useCallback(async (
    callerId: string,
    offer: RTCSessionDescriptionInit,
    type: 'audio' | 'video'
  ) => {
    console.log(`✅ Answering ${type} call from:`, callerId);
    try {
      setActive();
      const stream = await getLocalStream(type);
      const pc = createPC(callerId, stream);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('📤 Sending WebRTC answer to:', callerId);
      socketClient.getSocket()?.emit('call:webrtc-answer', { targetUserId: callerId, answer });
    } catch (err: any) {
      console.error('❌ answerCall failed:', err.message);
      cleanup();
      endCall();
    }
  }, [getLocalStream, createPC, cleanup, endCall, setActive]);

  // ─── Hang up ─────────────────────────────────────────────────────────────
  const hangUp = useCallback((targetUserId: string) => {
    console.log('nitifying hangup:', targetUserId);
    const duration = useCallStore.getState().callDuration;
    const callType = useCallStore.getState().callType || 'audio';
    const callStatus = useCallStore.getState().callStatus;

    let status: 'COMPLETED' | 'MISSED' | 'DECLINED' = 'COMPLETED';
    if (callStatus === 'calling') {
      status = 'MISSED';
    }

    socketClient.getSocket()?.emit('call:log_history', {
      targetUserId,
      callType,
      duration,
      status,
    });

    socketClient.getSocket()?.emit('call:end', { targetUserId });
    cleanup();
    endCall();
  }, [cleanup, endCall]);

  // ─── Socket Signal Handlers ──────────────────────────────────────────────
  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    // Handle call accepted by remote user
    const onCallAccepted = () => {
      console.log('✅ Remote user accepted the call!');
      setActive();
    };

    // Handle call rejected by remote user
    const onCallRejected = () => {
      console.log('❌ Remote user rejected the call.');
      cleanup();
      endCall();
    };

    // Handle call ended by remote user
    const onCallEnded = () => {
      console.log('📵 Call ended by remote user.');
      cleanup();
      endCall();
    };

    const onAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = peerRef.current;
      if (!pc || pc.signalingState === 'closed') return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('✅ Remote description (answer) set successfully');
        setActive();
      } catch (err) {
        console.error('❌ setRemoteDescription (answer) failed:', err);
      }
    };

    const onIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = peerRef.current;
      if (!pc || pc.signalingState === 'closed') return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('❌ addIceCandidate failed:', err);
      }
    };

    socket.on('call:accepted', onCallAccepted);
    socket.on('call:rejected', onCallRejected);
    socket.on('call:ended', onCallEnded);
    socket.on('call:webrtc-answer', onAnswer);
    socket.on('call:ice-candidate', onIceCandidate);

    return () => {
      socket.off('call:accepted', onCallAccepted);
      socket.off('call:rejected', onCallRejected);
      socket.off('call:ended', onCallEnded);
      socket.off('call:webrtc-answer', onAnswer);
      socket.off('call:ice-candidate', onIceCandidate);
    };
  }, [setActive, cleanup, endCall]);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), [cleanup]);

  return (
    <WebRTCContext.Provider value={{
      localVideoRef,
      remoteVideoRef,
      localStream,
      remoteStream,
      startCall,
      answerCall,
      hangUp,
    }}>
      {children}
    </WebRTCContext.Provider>
  );
};
