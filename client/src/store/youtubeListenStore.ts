import { create } from 'zustand';
import { axiosClient } from '../api/axiosClient';
import { useAuthStore } from './authStore';
import { useListenTogetherStore } from './listenTogetherStore';
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

async function directBrowserYouTubeSearch(query: string): Promise<YouTubeSearchResult[]> {
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240301.00.00',
            hl: 'en',
            gl: 'IN',
          },
        },
        query,
      }),
    });

    if (!res.ok) return [];

    const data: any = await res.json();
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    const results: YouTubeSearchResult[] = [];

    if (Array.isArray(contents)) {
      for (const sec of contents) {
        const itemSection = sec?.itemSectionRenderer?.contents || [];
        for (const item of itemSection) {
          const video = item?.videoRenderer;
          if (video && video.videoId) {
            const thumbs: any[] = video.thumbnail?.thumbnails || [];
            const bestThumb =
              thumbs.slice(-1)[0]?.url || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

            results.push({
              videoId: video.videoId,
              title: video.title?.runs?.[0]?.text || 'Untitled Video',
              description: '',
              thumbnail: bestThumb,
              channelTitle: video.ownerText?.runs?.[0]?.text || 'YouTube Channel',
              publishedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return results;
  } catch (e) {
    console.warn('⚠️ Direct browser YouTube search error:', e);
    return [];
  }
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
  viewMode: 'home' | 'watch';
  setViewMode: (mode: 'home' | 'watch') => void;
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
  viewMode: 'home',
  setViewMode: (viewMode: 'home' | 'watch') => set({ viewMode }),
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
        viewMode: 'watch',
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

    try {
      localStorage.setItem('yt_last_played', JSON.stringify({
        videoId,
        title: videoTitle,
        thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
        channelTitle: channelTitle || 'YouTube Music',
      }));
    } catch (e) {}

    // Always create/update roomState immediately and switch to watch mode
    const now = Date.now();
    set((state) => ({
      viewMode: 'watch',
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

    const isSessionActive = useListenTogetherStore.getState().isSessionActive;
    if (socketInstance && socketInstance.connected && isSessionActive) {
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
    const isSessionActive = useListenTogetherStore.getState().isSessionActive;
    if (socketInstance && socketInstance.connected && !get().isRemoteAction && isSessionActive) {
      socketInstance.emit('listen-together:play', { roomId: rId, currentTime });
    }
  },

  sendPause: (currentTime: number) => {
    const rId = get().roomId || 'default';
    const isSessionActive = useListenTogetherStore.getState().isSessionActive;
    if (socketInstance && socketInstance.connected && !get().isRemoteAction && isSessionActive) {
      socketInstance.emit('listen-together:pause', { roomId: rId, currentTime });
    }
  },

  sendSeek: (currentTime: number) => {
    const rId = get().roomId || 'default';
    const isSessionActive = useListenTogetherStore.getState().isSessionActive;
    if (socketInstance && socketInstance.connected && !get().isRemoteAction && isSessionActive) {
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
      localStorage.setItem('yt_last_search', query.trim());
    } catch (e) {}

    try {
      set({ searchQuery: query, isSearching: true, searchError: null });
      const response = await axiosClient.get(
        `/music/youtube/search?q=${encodeURIComponent(query)}`
      );

      const raw = response.data as any;
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

      // Check if backend returned static fallback videos when the query wasn't asking for Despacito/Counting Stars
      const isFallbackResult =
        results.length > 0 &&
        results.some((r) => r.videoId === 'kJQP7kiw5Fk') &&
        results.some((r) => r.videoId === 'hT_nvWreIhg') &&
        !query.toLowerCase().includes('despacito');

      if (results.length === 0 || isFallbackResult) {
        console.log(`⚡ Backend returned fallback or 0 items for "${query}". Executing direct browser search...`);
        const directResults = await directBrowserYouTubeSearch(query);
        if (directResults.length > 0) {
          results = directResults;
        }
      }

      console.log(`⚡ YouTube search "${query}" final results: ${results.length}`, results);
      set({ searchResults: results, isSearching: false, searchError: null });
    } catch (err: any) {
      // On backend error, attempt direct browser search
      try {
        console.warn('⚠️ Backend search failed. Executing direct browser search...');
        const directResults = await directBrowserYouTubeSearch(query);
        if (directResults.length > 0) {
          set({ searchResults: directResults, isSearching: false, searchError: null });
          return;
        }
      } catch (_e) {}

      const errMsg = err?.response?.data?.message || err?.message || 'YouTube search failed.';
      console.error('YouTube search error:', errMsg);
      set({ searchResults: [], isSearching: false, searchError: errMsg });
    }
  },
}));
