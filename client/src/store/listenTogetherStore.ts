import { create } from 'zustand';
import { musicApi } from '../api/musicApi';
import { ListenInvitePayload, ListeningSession, NormalizedSong } from '../types/music.types';
import { useAuthStore } from './authStore';
import { useMusicPlayerStore } from './musicPlayerStore';

interface ListenTogetherState {
  activeSession: ListeningSession | null;
  incomingInvite: ListenInvitePayload | null;
  inviteCountdown: number; // seconds left (max 600)
  isSessionActive: boolean;
  partnerConnected: boolean;
  partnerName: string | null;
  partnerAvatar: string | null;

  // Actions
  initListenSocket: (socket: any) => void;
  sendInvite: () => Promise<void>;
  acceptInvite: (sessionId: string) => Promise<void>;
  declineInvite: (sessionId: string) => Promise<void>;
  endSession: () => Promise<void>;
  clearInvite: () => void;
  syncPlay: (track?: NormalizedSong, currentTime?: number) => void;
  syncPause: (currentTime?: number) => void;
  syncSeek: (currentTime: number) => void;
  syncNext: (track: NormalizedSong) => void;
  syncPrev: (track: NormalizedSong) => void;
  syncQueue: (queue: NormalizedSong[]) => void;
  syncShuffle: (shuffle: boolean) => void;
  syncRepeat: (repeat: string) => void;
}

let socketInstance: any = null;
let heartbeatInterval: any = null;
let countdownInterval: any = null;

const resolvePartner = (session: ListeningSession | null) => {
  if (!session) return { name: null, avatar: null };
  const user = useAuthStore.getState().user;
  const currentUserId = user?._id?.toString() || user?.id?.toString();
  const hostId = typeof session.host === 'object' ? session.host?._id?.toString() : session.host;

  const isHost = hostId === currentUserId;
  const partnerObj = isHost ? session.participant : session.host;

  if (typeof partnerObj === 'object' && partnerObj) {
    return { name: partnerObj.name || 'Partner', avatar: partnerObj.avatar || null };
  }
  return { name: 'Partner', avatar: null };
};

export const useListenTogetherStore = create<ListenTogetherState>((set, get) => ({
  activeSession: null,
  incomingInvite: null,
  inviteCountdown: 0,
  isSessionActive: false,
  partnerConnected: false,
  partnerName: null,
  partnerAvatar: null,

  initListenSocket: (socket: any) => {
    if (!socket) return;
    socketInstance = socket;

    // Check for existing session status
    musicApi
      .getListenSessionStatus()
      .then((session) => {
        if (session && session.status === 'ACTIVE') {
          const partnerInfo = resolvePartner(session);
          set({
            activeSession: session,
            isSessionActive: true,
            partnerConnected: true,
            partnerName: partnerInfo.name,
            partnerAvatar: partnerInfo.avatar,
          });
        }
      })
      .catch(() => {});

    // 1. Incoming Invite Notification
    socket.on('listen:invite', (payload: ListenInvitePayload) => {
      const expiresAt = new Date(payload.expiresAt).getTime();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

      set({
        incomingInvite: payload,
        inviteCountdown: secondsLeft,
      });

      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        set({ inviteCountdown: left });
        if (left <= 0) {
          clearInterval(countdownInterval);
          get().clearInvite();
        }
      }, 1000);
    });

    // 2. Invite Accepted
    socket.on('listen:accept', (data: { sessionId: string; acceptedBy: string }) => {
      const active = get().activeSession;
      const partnerInfo = resolvePartner(active);

      set({
        isSessionActive: true,
        partnerConnected: true,
        partnerName: partnerInfo.name || data.acceptedBy || 'Partner',
        incomingInvite: null,
      });
      if (countdownInterval) clearInterval(countdownInterval);

      // Trigger instant playback sync if current track is available
      const currentTrack = useMusicPlayerStore.getState().currentTrack;
      const currentTime = useMusicPlayerStore.getState().currentTime;
      if (currentTrack) {
        get().syncPlay(currentTrack, currentTime);
      }

      // Start 10s Heartbeat
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        socketInstance?.emit('listen:heartbeat');
      }, 10000);
    });

    // 3. Invite Declined
    socket.on('listen:decline', () => {
      set({ incomingInvite: null });
      if (countdownInterval) clearInterval(countdownInterval);
    });

    // 4. Play Sync Event Handler
    socket.on('listen:play', (data: { senderId: string; currentTime?: number; track?: NormalizedSong }) => {
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();

      if (data.senderId !== currentUserId) {
        const playerStore = useMusicPlayerStore.getState();
        if (data.track) {
          playerStore.playTrack(data.track, undefined, true);
        } else {
          playerStore.resume(true);
        }
        if (data.currentTime !== undefined && data.currentTime > 0) {
          playerStore.seekTo(data.currentTime, true);
        }
      }
    });

    // 5. Pause Sync Event Handler
    socket.on('listen:pause', (data: { senderId: string; currentTime?: number }) => {
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();

      if (data.senderId !== currentUserId) {
        const playerStore = useMusicPlayerStore.getState();
        playerStore.pause(true);
        if (data.currentTime !== undefined) {
          playerStore.seekTo(data.currentTime, true);
        }
      }
    });

    // 6. Seek Sync Event Handler
    socket.on('listen:seek', (data: { senderId: string; currentTime: number }) => {
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();

      if (data.senderId !== currentUserId) {
        useMusicPlayerStore.getState().seekTo(data.currentTime, true);
      }
    });

    // 7. Next & Prev Track Handlers
    socket.on('listen:next', (data: { senderId: string; track: NormalizedSong }) => {
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();

      if (data.senderId !== currentUserId && data.track) {
        useMusicPlayerStore.getState().playTrack(data.track, undefined, true);
      }
    });

    socket.on('listen:previous', (data: { senderId: string; track: NormalizedSong }) => {
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();

      if (data.senderId !== currentUserId && data.track) {
        useMusicPlayerStore.getState().playTrack(data.track, undefined, true);
      }
    });

    // 8. Session Ended / Disconnect
    socket.on('listen:end', () => {
      set({
        activeSession: null,
        isSessionActive: false,
        partnerConnected: false,
        incomingInvite: null,
      });
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    });

    // 9. Inactive alert
    socket.on('listen:inactive', () => {
      set({ partnerConnected: false });
    });

    // Feature 8: Mobile Background / Visibility Handlers
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      } else {
        if (get().isSessionActive) {
          socketInstance?.emit('listen:heartbeat');
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          heartbeatInterval = setInterval(() => {
            socketInstance?.emit('listen:heartbeat');
          }, 10000);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', () => socketInstance?.emit('listen:end'));
    window.addEventListener('beforeunload', () => socketInstance?.emit('listen:end'));
  },

  sendInvite: async () => {
    try {
      const session = await musicApi.createListenInvite();
      const partnerInfo = resolvePartner(session);
      set({ activeSession: session, partnerName: partnerInfo.name, partnerAvatar: partnerInfo.avatar });
    } catch (_err) {
      // Gracefully handle
    }
  },

  acceptInvite: async (sessionId: string) => {
    try {
      const session = await musicApi.respondListenInvite(sessionId, 'accept');
      const partnerInfo = resolvePartner(session);

      set({
        activeSession: session,
        isSessionActive: true,
        partnerConnected: true,
        partnerName: partnerInfo.name,
        partnerAvatar: partnerInfo.avatar,
        incomingInvite: null,
      });
      if (countdownInterval) clearInterval(countdownInterval);

      // Trigger instant play sync
      const currentTrack = useMusicPlayerStore.getState().currentTrack;
      const currentTime = useMusicPlayerStore.getState().currentTime;
      if (currentTrack) {
        get().syncPlay(currentTrack, currentTime);
      }

      // Start Heartbeat
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        socketInstance?.emit('listen:heartbeat');
      }, 10000);
    } catch (_err) {
      get().clearInvite();
    }
  },

  declineInvite: async (sessionId: string) => {
    try {
      await musicApi.respondListenInvite(sessionId, 'decline');
      get().clearInvite();
    } catch (_err) {
      get().clearInvite();
    }
  },

  endSession: async () => {
    try {
      await musicApi.endListenSession();
      set({
        activeSession: null,
        isSessionActive: false,
        partnerConnected: false,
        incomingInvite: null,
      });
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    } catch (_err) {
      // Gracefully handle
    }
  },

  clearInvite: () => {
    set({ incomingInvite: null, inviteCountdown: 0 });
    if (countdownInterval) clearInterval(countdownInterval);
  },

  syncPlay: (track?: NormalizedSong, currentTime?: number) => {
    const session = get().activeSession;
    if (socketInstance && get().isSessionActive) {
      socketInstance.emit('listen:play', {
        sessionId: session?.sessionId,
        track,
        currentTime: currentTime || 0,
      });
    }
  },

  syncPause: (currentTime?: number) => {
    const session = get().activeSession;
    if (socketInstance && get().isSessionActive) {
      socketInstance.emit('listen:pause', {
        sessionId: session?.sessionId,
        currentTime: currentTime || 0,
      });
    }
  },

  syncSeek: (currentTime: number) => {
    const session = get().activeSession;
    if (socketInstance && get().isSessionActive) {
      socketInstance.emit('listen:seek', {
        sessionId: session?.sessionId,
        currentTime,
      });
    }
  },

  syncNext: (track: NormalizedSong) => {
    const session = get().activeSession;
    if (socketInstance && get().isSessionActive) {
      socketInstance.emit('listen:next', {
        sessionId: session?.sessionId,
        track,
      });
    }
  },

  syncPrev: (track: NormalizedSong) => {
    const session = get().activeSession;
    if (socketInstance && get().isSessionActive) {
      socketInstance.emit('listen:previous', {
        sessionId: session?.sessionId,
        track,
      });
    }
  },

  syncQueue: (queue: NormalizedSong[]) => {
    const session = get().activeSession;
    if (socketInstance && get().isSessionActive) {
      socketInstance.emit('listen:queue:update', {
        sessionId: session?.sessionId,
        queue,
      });
    }
  },

  syncShuffle: (shuffle: boolean) => {
    const session = get().activeSession;
    if (socketInstance && get().isSessionActive) {
      socketInstance.emit('listen:shuffle', {
        sessionId: session?.sessionId,
        shuffle,
      });
    }
  },

  syncRepeat: (repeat: string) => {
    const session = get().activeSession;
    if (socketInstance && get().isSessionActive) {
      socketInstance.emit('listen:repeat', {
        sessionId: session?.sessionId,
        repeat,
      });
    }
  },
}));
