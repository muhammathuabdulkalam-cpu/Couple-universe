import { create } from 'zustand';
import { axiosClient } from '../api/axiosClient';
import { useAuthStore } from './authStore';
import { useUIStore } from './uiStore';

export interface YouTubeParticipant {
  userId: string;
  name: string;
  avatar?: string;
  socketId: string;
  isHost: boolean;
}

export interface YouTubeRoomState {
  roomId: string;
  videoId: string;
  videoTitle: string;
  thumbnail: string;
  channelTitle: string;
  isPlaying: boolean;
  currentTime: number;
  playbackUpdatedAt: number; // timestamp in ms (Date.now())
  controlMode: 'HOST' | 'COLLABORATIVE';
  hostId: string;
  participants: YouTubeParticipant[];
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export interface YouTubeChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isMe?: boolean;
}

interface YouTubeListenState {
  roomId: string | null;
  roomState: YouTubeRoomState | null;
  isJoined: boolean;
  isHost: boolean;
  controlMode: 'HOST' | 'COLLABORATIVE';
  isAutoplayBlocked: boolean;
  syncStatus: 'CONNECTED' | 'SYNCING' | 'DISCONNECTED';
  searchQuery: string;
  searchResults: YouTubeSearchResult[];
  isSearching: boolean;
  searchError: string | null;
  isRemoteAction: boolean;

  lastRemoteEvent: {
    type: 'play' | 'pause' | 'seek' | 'video-change' | 'state';
    currentTime?: number;
    videoId?: string;
    timestamp: number;
  } | null;

  chatMessages: YouTubeChatMessage[];

  initYouTubeSocket: (socket: any) => void;
  joinRoom: (roomId?: string, controlMode?: 'HOST' | 'COLLABORATIVE') => void;
  leaveRoom: () => void;
  changeVideo: (videoId: string, videoTitle: string, thumbnail: string, channelTitle?: string) => void;
  sendPlay: (currentTime: number) => void;
  sendPause: (currentTime: number) => void;
  sendSeek: (currentTime: number) => void;
  sendModeChange: (controlMode: 'HOST' | 'COLLABORATIVE') => void;
  sendChatMessage: (text: string) => void;
  requestSync: () => void;
  searchYouTube: (query: string) => Promise<void>;
  calculateExpectedTime: () => number;
  setAutoplayBlocked: (blocked: boolean) => void;
  setRemoteAction: (remote: boolean) => void;
}

let socketInstance: any = null;

export const useYouTubeListenStore = create<YouTubeListenState>((set, get) => ({
  roomId: null,
  roomState: null,
  isJoined: false,
  isHost: false,
  controlMode: 'HOST',
  isAutoplayBlocked: false,
  syncStatus: 'DISCONNECTED',
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  searchError: null,
  isRemoteAction: false,
  lastRemoteEvent: null,
  chatMessages: [],

  setAutoplayBlocked: (isAutoplayBlocked: boolean) => set({ isAutoplayBlocked }),
  setRemoteAction: (isRemoteAction: boolean) => set({ isRemoteAction }),

  initYouTubeSocket: (socket: any) => {
    if (!socket) return;
    if (socketInstance === socket) return;

    if (socketInstance) {
      socketInstance.off('listen-together:state');
      socketInstance.off('listen-together:video-change');
      socketInstance.off('listen-together:play');
      socketInstance.off('listen-together:pause');
      socketInstance.off('listen-together:seek');
      socketInstance.off('listen-together:error');
      socketInstance.off('connect');
      socketInstance.off('disconnect');
    }

    socketInstance = socket;

    // Handle Socket Reconnection Auto-Resync
    socket.on('connect', () => {
      console.log('⚡ [YouTube Listen Store] Socket connected/reconnected.');
      set({ syncStatus: 'CONNECTED' });

      const currentRoomId = get().roomId;
      if (currentRoomId) {
        console.log('⚡ [YouTube Listen Store] Auto re-joining room after reconnect:', currentRoomId);
        socketInstance.emit('listen-together:join', { roomId: currentRoomId });
      }
    });

    socket.on('disconnect', () => {
      set({ syncStatus: 'DISCONNECTED' });
    });

    // 1. Full Room State Event
    socket.on('listen-together:state', (statePayload: YouTubeRoomState) => {
      console.log('⚡ [YouTube Socket Client] Received listen-together:state:', statePayload);
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();
      const isHost = statePayload.hostId === currentUserId;

      set({
        roomState: statePayload,
        roomId: statePayload.roomId,
        isJoined: true,
        isHost,
        controlMode: statePayload.controlMode || 'HOST',
        syncStatus: 'CONNECTED',
        lastRemoteEvent: {
          type: 'state',
          currentTime: statePayload.currentTime,
          videoId: statePayload.videoId,
          timestamp: Date.now(),
        },
      });
    });

    // 2. Remote Video Change Event
    socket.on('listen-together:video-change', (data: any) => {
      console.log('⚡ [YouTube Socket Client] Received listen-together:video-change:', data);
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();

      set((state) => ({
        roomState: state.roomState
          ? {
              ...state.roomState,
              videoId: data.videoId,
              videoTitle: data.videoTitle || state.roomState.videoTitle,
              thumbnail: data.thumbnail || state.roomState.thumbnail,
              channelTitle: data.channelTitle || state.roomState.channelTitle,
              isPlaying: true,
              currentTime: 0,
              playbackUpdatedAt: data.playbackUpdatedAt || Date.now(),
            }
          : null,
        lastRemoteEvent: {
          type: 'video-change',
          videoId: data.videoId,
          currentTime: 0,
          timestamp: Date.now(),
        },
      }));

      if (data.senderId && data.senderId !== currentUserId) {
        useUIStore.getState().addToast('Video Change 🎬', `Playing ${data.videoTitle || 'new video'}`, 'info');
      }
    });

    // 3. Remote Play Event
    socket.on('listen-together:play', (data: any) => {
      console.log('⚡ [YouTube Socket Client] Received listen-together:play:', data);
      set((state) => ({
        roomState: state.roomState
          ? {
              ...state.roomState,
              isPlaying: true,
              currentTime: data.currentTime !== undefined ? data.currentTime : state.roomState.currentTime,
              playbackUpdatedAt: data.playbackUpdatedAt || Date.now(),
            }
          : null,
        lastRemoteEvent: {
          type: 'play',
          currentTime: data.currentTime,
          timestamp: Date.now(),
        },
      }));
    });

    // 4. Remote Pause Event
    socket.on('listen-together:pause', (data: any) => {
      console.log('⚡ [YouTube Socket Client] Received listen-together:pause:', data);
      set((state) => ({
        roomState: state.roomState
          ? {
              ...state.roomState,
              isPlaying: false,
              currentTime: data.currentTime !== undefined ? data.currentTime : state.roomState.currentTime,
              playbackUpdatedAt: data.playbackUpdatedAt || Date.now(),
            }
          : null,
        lastRemoteEvent: {
          type: 'pause',
          currentTime: data.currentTime,
          timestamp: Date.now(),
        },
      }));
    });

    // 5. Remote Seek Event
    socket.on('listen-together:seek', (data: any) => {
      console.log('⚡ [YouTube Socket Client] Received listen-together:seek:', data);
      set((state) => ({
        roomState: state.roomState
          ? {
              ...state.roomState,
              currentTime: data.currentTime,
              playbackUpdatedAt: data.playbackUpdatedAt || Date.now(),
            }
          : null,
        lastRemoteEvent: {
          type: 'seek',
          currentTime: data.currentTime,
          timestamp: Date.now(),
        },
      }));
    });

    // 6. Remote Chat Message Event
    socket.on('listen-together:chat', (msg: any) => {
      console.log('⚡ [YouTube Socket Client] Received listen-together:chat:', msg);
      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();
      const isMe = msg.userId === currentUserId;

      const newMsg: YouTubeChatMessage = {
        id: msg.id || Date.now().toString() + Math.random(),
        userId: msg.userId,
        userName: msg.userName || 'Partner',
        avatar: msg.avatar,
        text: msg.text,
        timestamp: msg.timestamp || Date.now(),
        isMe,
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, newMsg],
      }));
    });

    // 7. Error Notice
    socket.on('listen-together:error', (err: { message: string }) => {
      useUIStore.getState().addToast('Listen Together Permission ⚠️', err.message, 'warning');
    });

    // Auto join default room if socket is ready
    if (socket.connected && !get().isJoined) {
      get().joinRoom();
    }
  },

  joinRoom: (targetRoomId?: string, controlMode: 'HOST' | 'COLLABORATIVE' = 'HOST') => {
    if (socketInstance) {
      set({ syncStatus: 'SYNCING', chatMessages: [] });
      socketInstance.emit('listen-together:join', { roomId: targetRoomId, controlMode });
    }
  },

  leaveRoom: () => {
    const rId = get().roomId;
    if (socketInstance && rId) {
      socketInstance.emit('listen-together:leave', { roomId: rId });
    }
    set({
      roomId: null,
      roomState: null,
      isJoined: false,
      isHost: false,
      syncStatus: 'DISCONNECTED',
      chatMessages: [],
    });
  },

  changeVideo: (videoId: string, videoTitle: string, thumbnail: string, channelTitle = '') => {
    const rId = get().roomId || 'default';

    console.log('⚡ changeVideo called with videoId:', videoId);

    // Always create/update roomState immediately so the player reacts
    const now = Date.now();
    set((state) => ({
      roomState: state.roomState
        ? {
            ...state.roomState,
            videoId,
            videoTitle: videoTitle || state.roomState.videoTitle,
            thumbnail: thumbnail || state.roomState.thumbnail,
            channelTitle: channelTitle || state.roomState.channelTitle,
            isPlaying: true,
            currentTime: 0,
            playbackUpdatedAt: now,
          }
        : {
            roomId: rId,
            videoId,
            videoTitle,
            thumbnail,
            channelTitle,
            isPlaying: true,
            currentTime: 0,
            playbackUpdatedAt: now,
            controlMode: 'HOST',
            hostId: 'local',
            participants: [],
          },
      lastRemoteEvent: {
        type: 'video-change',
        videoId,
        currentTime: 0,
        timestamp: now,
      },
    }));

    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('listen-together:video-change', {
        roomId: rId,
        videoId,
        videoTitle,
        thumbnail,
        channelTitle,
      });
    }
  },

  sendPlay: (currentTime: number) => {
    const rId = get().roomId || 'default';
    if (socketInstance && socketInstance.connected && !get().isRemoteAction) {
      socketInstance.emit('listen-together:play', { roomId: rId, currentTime });
    }
  },

  sendPause: (currentTime: number) => {
    const rId = get().roomId || 'default';
    if (socketInstance && socketInstance.connected && !get().isRemoteAction) {
      socketInstance.emit('listen-together:pause', { roomId: rId, currentTime });
    }
  },

  sendSeek: (currentTime: number) => {
    const rId = get().roomId || 'default';
    if (socketInstance && socketInstance.connected && !get().isRemoteAction) {
      socketInstance.emit('listen-together:seek', { roomId: rId, currentTime });
    }
  },

  sendModeChange: (controlMode: 'HOST' | 'COLLABORATIVE') => {
    const rId = get().roomId || 'default';
    if (socketInstance && socketInstance.connected && get().isHost) {
      socketInstance.emit('listen-together:mode-change', { roomId: rId, controlMode });
    }
  },

  sendChatMessage: (text: string) => {
    if (!text.trim()) return;
    const currentUser = useAuthStore.getState().user;
    const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString() || 'me';
    const currentUserName = currentUser?.name || 'Me';
    const avatar = currentUser?.avatar;

    const msgObj: YouTubeChatMessage = {
      id: Date.now().toString() + Math.random(),
      userId: currentUserId,
      userName: currentUserName,
      avatar,
      text: text.trim(),
      timestamp: Date.now(),
      isMe: true,
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, msgObj],
    }));

    const rId = get().roomId || 'default';
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit('listen-together:chat', {
        roomId: rId,
        ...msgObj,
      });
    }
  },

  requestSync: () => {
    const rId = get().roomId || 'default';
    if (socketInstance && socketInstance.connected) {
      set({ syncStatus: 'SYNCING' });
      socketInstance.emit('listen-together:sync', { roomId: rId });
    }
  },

  calculateExpectedTime: (): number => {
    const state = get().roomState;
    if (!state) return 0;
    if (!state.isPlaying) return state.currentTime || 0;

    const elapsedSeconds = (Date.now() - (state.playbackUpdatedAt || Date.now())) / 1000;
    return Math.max(0, (state.currentTime || 0) + elapsedSeconds);
  },

  searchYouTube: async (query: string) => {
    if (!query.trim()) {
      set({ searchQuery: '', searchResults: [], searchError: null });
      return;
    }

    try {
      set({ searchQuery: query, isSearching: true, searchError: null });
      const response = await axiosClient.get(
        `/music/youtube/search?q=${encodeURIComponent(query)}`
      );

      const raw = response.data as any;
      // Try all possible response shapes from the backend
      let results: YouTubeSearchResult[] = [];
      if (Array.isArray(raw?.data?.results)) {
        results = raw.data.results;
      } else if (Array.isArray(raw?.results)) {
        results = raw.results;
      } else if (Array.isArray(raw?.data)) {
        results = raw.data;
      } else if (Array.isArray(raw)) {
        results = raw;
      }

      console.log(`⚡ YouTube search "${query}" returned ${results.length} results`, results);
      set({ searchResults: results, isSearching: false, searchError: null });
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'YouTube search failed.';
      console.error('YouTube search error:', errMsg);
      set({ searchResults: [], isSearching: false, searchError: errMsg });
    }
  },
}));
