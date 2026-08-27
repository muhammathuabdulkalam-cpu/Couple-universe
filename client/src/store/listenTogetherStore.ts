import { create } from 'zustand';
import { axiosClient } from '../api/axiosClient';
import { musicApi } from '../api/musicApi';
import { ListenInvitePayload, ListeningSession, NormalizedSong } from '../types/music.types';
import { useAuthStore } from './authStore';
import { useMusicPlayerStore } from './musicPlayerStore';
import { useUIStore } from './uiStore';

interface ListenTogetherState {
  activeSession: ListeningSession | null;
  incomingInvite: ListenInvitePayload | null;
  inviteCountdown: number; // seconds left (max 600)
  isSessionActive: boolean;
  isInviting: boolean;
  partnerConnected: boolean;
  partnerName: string | null;
  partnerAvatar: string | null;
  isDrawerOpen: boolean;

  // Actions
  initListenSocket: (socket: any) => void;
  sendInvite: (targetUserId?: string) => Promise<void>;
  acceptInvite: (sessionId: string) => Promise<void>;
  declineInvite: (sessionId: string) => Promise<void>;
  endSession: () => Promise<void>;
  clearInvite: () => void;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
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
let pollStatusInterval: any = null;

export const fetchPartnerProfile = async (): Promise<{ name: string | null; avatar: string | null }> => {
  try {
    const isSessionActive = useListenTogetherStore.getState().isSessionActive;
    if (!isSessionActive) {
      return { name: null, avatar: null };
    }
    const res = await axiosClient.get<{ success: boolean; data: any }>('/profile');
    const partner = res.data?.data?.partner;
    if (partner) {
      const pName = partner.name || 'Partner';
      // Only use a real custom avatar URL
      const pAvatar = partner.avatar && partner.avatar.trim() !== '' && !partner.avatar.includes('unsplash.com')
        ? partner.avatar
        : null;

      useListenTogetherStore.setState({
        partnerName: pName,
        partnerAvatar: pAvatar,
      });
      return { name: pName, avatar: pAvatar };
    }
  } catch (_err) { }
  return { name: null, avatar: null };
};

const resolvePartner = (session: ListeningSession | null) => {
  if (!session) return { name: null, avatar: null };
  const user = useAuthStore.getState().user;
  const currentUserId = user?._id?.toString() || user?.id?.toString();
  const hostId = typeof session.host === 'object' ? (session.host as any)?._id?.toString() : session.host;

  const isHost = hostId === currentUserId;
  const partnerObj = isHost ? session.participant : session.host;

  if (typeof partnerObj === 'object' && partnerObj && partnerObj !== null) {
    const pName = (partnerObj as any).name || 'Partner';
    // Only use real avatar — no Unsplash or stock photo fallbacks
    const rawAvatar = (partnerObj as any).avatar;
    const pAvatar = rawAvatar && rawAvatar.trim() !== '' && !rawAvatar.includes('unsplash.com')
      ? rawAvatar
      : null;
    return { name: pName, avatar: pAvatar };
  }
  return { name: null, avatar: null };
};

export const useListenTogetherStore = create<ListenTogetherState>((set, get) => ({
  activeSession: null,
  incomingInvite: null,
  inviteCountdown: 0,
  isSessionActive: false,
  isInviting: false,
  partnerConnected: false,
  partnerName: null,
  partnerAvatar: null,
  isDrawerOpen: false,

  setDrawerOpen: (isDrawerOpen: boolean) => set({ isDrawerOpen }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  initListenSocket: (socket: any) => {
    if (!socket) return;
    if (socketInstance === socket) {
      console.log('⚡ [Socket Client] initListenSocket called with identical socket instance. Skipping duplicate registrations.');
      return;
    }

    // Clean up old listeners from previous socket instance to avoid memory leaks
    if (socketInstance) {
      console.log('⚡ [Socket Client] Cleaning up listeners on old socket instance.');
      socketInstance.off('profile_updated');
      socketInstance.off('user:profile_updated');
      socketInstance.off('listen:invite');
      socketInstance.off('listen:accept');
      socketInstance.off('listen:decline');
      socketInstance.off('listen:play');
      socketInstance.off('listen:pause');
      socketInstance.off('listen:seek');
      socketInstance.off('listen:next');
      socketInstance.off('listen:previous');
      socketInstance.off('listen:end');
      socketInstance.off('listen:inactive');
    }

    socketInstance = socket;
    console.log('⚡ [Socket Client] Initializing Listen Together socket listeners.');

    // Fetch initial partner profile in background for real-time state
    fetchPartnerProfile();

    // Session Status Checker & Fallback Sync (Handles both ACTIVE & INVITED sessions)
    const checkSessionStatus = async () => {
      try {
        const session = await musicApi.getListenSessionStatus();
        if (!session) return;

        const currentUser = useAuthStore.getState().user;
        const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();

        if (session.status === 'ACTIVE') {
          if (!get().isSessionActive) {
            console.log('⚡ [Session Sync] ACTIVE session detected:', session.sessionId);
            const partnerInfo = resolvePartner(session);
            const name = partnerInfo.name || get().partnerName;
            const avatar = partnerInfo.avatar || get().partnerAvatar;

            set({
              activeSession: session,
              isSessionActive: true,
              partnerConnected: true,
              partnerName: name,
              partnerAvatar: avatar,
              incomingInvite: null,
            });

            if (!name || name === 'Partner' || !avatar) {
              fetchPartnerProfile();
            }
          }
        } else if (session.status === 'INVITED') {
          const hostObj = session.host as any;
          const partObj = session.participant as any;
          const hostId = typeof hostObj === 'object' ? hostObj?._id?.toString() || hostObj?.id?.toString() : hostObj ? String(hostObj) : undefined;
          const partId = typeof partObj === 'object' ? partObj?._id?.toString() || partObj?.id?.toString() : partObj ? String(partObj) : undefined;

          // Only present invite to recipient participant, not host
          if (partId === currentUserId && hostId !== currentUserId) {
            const expiresAtStr = session.expiresAt ? String(session.expiresAt) : new Date(Date.now() + 10 * 60 * 1000).toISOString();
            const expiresAt = new Date(expiresAtStr).getTime();
            const secondsLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

            if (secondsLeft > 0 && (!get().incomingInvite || get().incomingInvite?.sessionId !== session.sessionId)) {
              console.log('⚡ [Session Sync] Discovered active INVITED session for user:', session.sessionId);
              const partnerInfo = resolvePartner(session);
              const hostName = typeof hostObj === 'object' ? hostObj?.name : partnerInfo.name || 'Partner';
              const hostAvatar = typeof hostObj === 'object' ? hostObj?.avatar : partnerInfo.avatar;

              set({
                incomingInvite: {
                  sessionId: session.sessionId,
                  hostName: hostName || 'Partner',
                  hostAvatar: hostAvatar,
                  expiresAt: expiresAtStr,
                  session,
                },
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
            }
          }
        }
      } catch (_err) {}
    };

    checkSessionStatus();

    // Poll session status every 5 seconds when not active to guarantee invite delivery after hosting
    if (pollStatusInterval) clearInterval(pollStatusInterval);
    pollStatusInterval = setInterval(() => {
      if (!get().isSessionActive) {
        checkSessionStatus();
      }
    }, 5000);

    // Listen to real-time profile update events from socket
    socket.on('profile_updated', (data: { userId: string; name: string; avatar: string }) => {
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();
      if (data.userId && data.userId !== currentUserId) {
        set({
          partnerName: data.name || get().partnerName,
          partnerAvatar: data.avatar || get().partnerAvatar,
        });
      }
    });

    socket.on('user:profile_updated', (data: { userId: string; name: string; avatar: string }) => {
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();
      if (data.userId && data.userId !== currentUserId) {
        set({
          partnerName: data.name || get().partnerName,
          partnerAvatar: data.avatar || get().partnerAvatar,
        });
      }
    });

    // 1. Incoming Invite Notification
    socket.on('listen:invite', (payload: ListenInvitePayload & { session?: ListeningSession }) => {
      console.log('⚡ [Socket Client] Received listen:invite event:', payload);
      const currentUser = useAuthStore.getState().user;
      const rawUserId = currentUser?._id || currentUser?.id;
      const currentUserId = typeof rawUserId === 'object' ? (rawUserId as any)?._id?.toString() || (rawUserId as any)?.toString() : String(rawUserId || '');

      const hostObj = payload.session?.host;
      const hostId = typeof hostObj === 'object' ? (hostObj as any)?._id?.toString() || (hostObj as any)?.id?.toString() : hostObj ? String(hostObj) : undefined;

      // DO NOT display incoming invite modal to the sender host!
      if (hostId && currentUserId && hostId === currentUserId) {
        console.log('⚡ [Socket Client] Ignoring listen:invite event sent by current user as host.');
        return;
      }

      const expiresAt = new Date(payload.expiresAt).getTime();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

      const partnerInfo = resolvePartner(payload.session || null);
      if (partnerInfo.name) {
        set({ partnerName: partnerInfo.name, partnerAvatar: partnerInfo.avatar });
      }

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
    socket.on('listen:accept', (data: { sessionId: string; acceptedBy: string; acceptedByAvatar?: string; session?: ListeningSession }) => {
      console.log('⚡ [Socket Client] Received listen:accept event:', data);
      const now = Date.now();
      const win = window as any;
      if (win.__lastAcceptSessionId === data.sessionId && now - (win.__lastAcceptTime || 0) < 4000) {
        console.log('⚡ [Socket Client] Deduplicated duplicate listen:accept event.');
        return;
      }
      win.__lastAcceptSessionId = data.sessionId;
      win.__lastAcceptTime = now;

      const rawSession = data.session || get().activeSession;
      const active = rawSession ? { ...rawSession, status: 'ACTIVE' as const } : null;
      const partnerInfo = resolvePartner(active);

      const resolvedName = partnerInfo.name || data.acceptedBy || get().partnerName || 'Partner';
      const resolvedAvatar = partnerInfo.avatar || data.acceptedByAvatar || get().partnerAvatar || null;

      set({
        activeSession: active,
        isSessionActive: true,
        isInviting: false,
        partnerConnected: true,
        partnerName: resolvedName,
        partnerAvatar: resolvedAvatar,
        incomingInvite: null,
      });

      if (!resolvedName || resolvedName === 'Partner' || !resolvedAvatar) {
        fetchPartnerProfile();
      }

      if (countdownInterval) clearInterval(countdownInterval);

      useUIStore.getState().addToast('Listen Together Connected! 🎵', `${resolvedName} joined the session`, 'success');
      try {
        window.dispatchEvent(new CustomEvent('navigate-shared-music'));
      } catch (_e) {}

      // Sync current track queue if available without forcing auto-play on connect
      const playerStore = useMusicPlayerStore.getState();
      if (playerStore.queue.length > 0) {
        get().syncQueue(playerStore.queue);
      }

      // Start 10s Heartbeat
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      heartbeatInterval = setInterval(() => {
        socketInstance?.emit('listen:heartbeat');
      }, 10000);
    });

    // 3. Invite Declined
    socket.on('listen:decline', () => {
      console.log('⚡ [Socket Client] Received listen:decline event.');
      set({ incomingInvite: null, isInviting: false });
      if (countdownInterval) clearInterval(countdownInterval);
    });

    // 4. Play Sync Event Handler (0ms Lag Playback)
    socket.on('listen:play', (data: { senderId: string; currentTime?: number; track?: NormalizedSong }) => {
      console.log('⚡ [Socket Client] Received listen:play event:', data);
      const currentUser = useAuthStore.getState().user;
      const rawId = currentUser?._id || currentUser?.id;
      const currentUserId = typeof rawId === 'object' ? (rawId as any)?.toString() : String(rawId || '');

      if (data.senderId && String(data.senderId) !== currentUserId) {
        console.log('⚡ [Socket Client] Applying partner play event.');
        const playerStore = useMusicPlayerStore.getState();
        if (data.track) {
          playerStore.playTrack(data.track, undefined, true, data.currentTime || 0);
        } else {
          if (data.currentTime !== undefined && data.currentTime > 0) {
            playerStore.seekTo(data.currentTime, true);
          }
          playerStore.resume(true);
        }
      }
    });

    // 5. Pause Sync Event Handler
    socket.on('listen:pause', (data: { senderId: string; currentTime?: number }) => {
      console.log('⚡ [Socket Client] Received listen:pause event:', data);
      const currentUser = useAuthStore.getState().user;
      const rawId = currentUser?._id || currentUser?.id;
      const currentUserId = typeof rawId === 'object' ? (rawId as any)?.toString() : String(rawId || '');

      if (data.senderId && String(data.senderId) !== currentUserId) {
        console.log('⚡ [Socket Client] Applying partner pause event.');
        const playerStore = useMusicPlayerStore.getState();
        playerStore.pause(true);
        if (data.currentTime !== undefined) {
          playerStore.seekTo(data.currentTime, true);
        }
      }
    });

    // 6. Seek Sync Event Handler
    socket.on('listen:seek', (data: { senderId: string; currentTime: number }) => {
      console.log('⚡ [Socket Client] Received listen:seek event:', data);
      const currentUser = useAuthStore.getState().user;
      const rawId = currentUser?._id || currentUser?.id;
      const currentUserId = typeof rawId === 'object' ? (rawId as any)?.toString() : String(rawId || '');

      if (data.senderId && String(data.senderId) !== currentUserId) {
        console.log('⚡ [Socket Client] Applying partner seek event to time:', data.currentTime);
        useMusicPlayerStore.getState().seekTo(data.currentTime, true);
      }
    });

    // 7. Next & Prev Track Handlers
    socket.on('listen:next', (data: { senderId: string; track: NormalizedSong }) => {
      console.log('⚡ [Socket Client] Received listen:next event:', data);
      const currentUser = useAuthStore.getState().user;
      const rawId = currentUser?._id || currentUser?.id;
      const currentUserId = typeof rawId === 'object' ? (rawId as any)?.toString() : String(rawId || '');

      if (data.senderId && String(data.senderId) !== currentUserId && data.track) {
        console.log('⚡ [Socket Client] Applying partner next track event.');
        useMusicPlayerStore.getState().playTrack(data.track, undefined, true);
      }
    });

    socket.on('listen:previous', (data: { senderId: string; track: NormalizedSong }) => {
      console.log('⚡ [Socket Client] Received listen:previous event:', data);
      const currentUser = useAuthStore.getState().user;
      const rawId = currentUser?._id || currentUser?.id;
      const currentUserId = typeof rawId === 'object' ? (rawId as any)?.toString() : String(rawId || '');

      if (data.senderId && String(data.senderId) !== currentUserId && data.track) {
        console.log('⚡ [Socket Client] Applying partner previous track event.');
        useMusicPlayerStore.getState().playTrack(data.track, undefined, true);
      }
    });

    // 8. Session Ended / Disconnect
    socket.on('listen:end', (data?: any) => {
      console.log('⚡ [Socket Client] Received listen:end event:', data);
      const now = Date.now();
      const win = window as any;
      if (now - (win.__lastEndTime || 0) < 3000) return;
      win.__lastEndTime = now;

      const wasActive = get().isSessionActive;

      set({
        activeSession: null,
        isSessionActive: false,
        partnerConnected: false,
        incomingInvite: null,
      });
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (countdownInterval) clearInterval(countdownInterval);

      if (wasActive) {
        const reason = data?.reason || 'Listen Together session ended.';
        useUIStore.getState().addToast('Listen Together Ended 💔', reason, 'info');
      }
    });

    // 9. Inactive alert
    socket.on('listen:inactive', (data?: any) => {
      console.log('⚡ [Socket Client] Received listen:inactive event:', data);
      set({ partnerConnected: false });
      const pName = get().partnerName || 'Partner';
      useUIStore.getState().addToast(
        'Partner Offline ⚠️',
        `${pName} has disconnected or closed their browser.`,
        'warning'
      );
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

  sendInvite: async (targetUserId?: string) => {
    try {
      set({ isInviting: true });
      const session = await musicApi.createListenInvite(targetUserId);
      const partnerInfo = resolvePartner(session);
      const name = partnerInfo.name || 'Partner';
      const avatar = partnerInfo.avatar || null;
      set({
        activeSession: session,
        isSessionActive: false,
        partnerConnected: false,
        partnerName: name,
        partnerAvatar: avatar,
        isInviting: false,
      });

      useUIStore.getState().addToast('Invitation Sent 🎵', `Sent Listen Together invite to ${name}`, 'success');
    } catch (err: any) {
      set({ isInviting: false });
      const message = err?.response?.data?.message || err?.message || 'Failed to send invite';
      useUIStore.getState().addToast('Listen Together', message, 'error');
    }
  },

  acceptInvite: async (sessionId: string) => {
    try {
      const rawSession = await musicApi.respondListenInvite(sessionId, 'accept');
      const session = rawSession ? { ...rawSession, status: 'ACTIVE' as const } : null;
      const partnerInfo = resolvePartner(session);
      const name = partnerInfo.name || get().partnerName;
      const avatar = partnerInfo.avatar || get().partnerAvatar;

      set({
        activeSession: session,
        isSessionActive: true,
        isInviting: false,
        partnerConnected: true,
        partnerName: name,
        partnerAvatar: avatar,
        incomingInvite: null,
      });

      if (!name || name === 'Partner' || !avatar) {
        fetchPartnerProfile();
      }
      if (countdownInterval) clearInterval(countdownInterval);

      const pName = name || 'Partner';
      useUIStore.getState().addToast('Listen Together Connected! 🎵', `Connected session with ${pName}`, 'success');
      try {
        window.dispatchEvent(new CustomEvent('navigate-shared-music'));
      } catch (_e) {}

      // Sync current track queue if available without forcing auto-play on connect
      const playerStore = useMusicPlayerStore.getState();
      if (playerStore.queue.length > 0) {
        get().syncQueue(playerStore.queue);
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
        isInviting: false,
        partnerConnected: false,
        incomingInvite: null,
      });
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (countdownInterval) clearInterval(countdownInterval);

      useUIStore.getState().addToast(
        'Listen Together Ended 💔',
        'You disconnected the Listen Together session.',
        'info'
      );
    } catch (_err) {
      // Gracefully handle
    }
  },

  clearInvite: () => {
    set({ incomingInvite: null, isInviting: false, inviteCountdown: 0 });
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
