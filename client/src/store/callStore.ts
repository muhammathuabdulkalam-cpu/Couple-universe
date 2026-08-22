import { create } from 'zustand';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'active' | 'ended';
export type CallType = 'audio' | 'video';

export interface CallParticipant {
  userId: string;
  name: string;
  avatar?: string;
}

interface CallState {
  // Call lifecycle
  callStatus: CallStatus;
  callType: CallType | null;

  // Participants
  localUser: CallParticipant | null;
  remoteUser: CallParticipant | null;

  // Media streams (stored as ref-like ids; actual streams held in useWebRTC hook)
  localStreamActive: boolean;
  remoteStreamActive: boolean;

  // Controls
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOff: boolean;

  // Call duration (seconds, updated every second while active)
  callDuration: number;

  // Actions
  initiateCall: (callType: CallType, remoteUser: CallParticipant, localUser: CallParticipant) => void;
  setRinging: (remoteUser: CallParticipant, callType: CallType) => void;
  setActive: () => void;
  endCall: () => void;
  setLocalStreamActive: (active: boolean) => void;
  setRemoteStreamActive: (active: boolean) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  tickDuration: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  callStatus: 'idle',
  callType: null,
  localUser: null,
  remoteUser: null,
  localStreamActive: false,
  remoteStreamActive: false,
  isMuted: false,
  isCameraOff: false,
  isSpeakerOff: false,
  callDuration: 0,

  initiateCall: (callType, remoteUser, localUser) =>
    set({
      callStatus: 'calling',
      callType,
      remoteUser,
      localUser,
      callDuration: 0,
      isMuted: false,
      isCameraOff: false,
    }),

  setRinging: (remoteUser, callType) =>
    set({
      callStatus: 'ringing',
      callType,
      remoteUser,
      callDuration: 0,
      isMuted: false,
      isCameraOff: false,
    }),

  setActive: () => set({ callStatus: 'active', callDuration: 0 }),

  endCall: () =>
    set({
      callStatus: 'idle',
      callType: null,
      localUser: null,
      remoteUser: null,
      localStreamActive: false,
      remoteStreamActive: false,
      isMuted: false,
      isCameraOff: false,
      callDuration: 0,
    }),

  setLocalStreamActive: (active) => set({ localStreamActive: active }),
  setRemoteStreamActive: (active) => set({ remoteStreamActive: active }),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCamera: () => set((s) => ({ isCameraOff: !s.isCameraOff })),
  toggleSpeaker: () => set((s) => ({ isSpeakerOff: !s.isSpeakerOff })),

  tickDuration: () => set((s) => ({ callDuration: s.callDuration + 1 })),
}));
