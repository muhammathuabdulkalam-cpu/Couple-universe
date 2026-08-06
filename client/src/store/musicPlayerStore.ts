import { create } from 'zustand';
import { musicApi } from '../api/musicApi';
import { NormalizedSong } from '../types/music.types';
import { useListenTogetherStore } from './listenTogetherStore';

export type RepeatMode = 'none' | 'all' | 'one';

interface MusicPlayerState {
  currentTrack: NormalizedSong | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: NormalizedSong[];
  queueIndex: number;
  isMiniPlayerOpen: boolean;
  isQueueDrawerOpen: boolean;
  isLyricsModalOpen: boolean;
  isMobileFullPlayerOpen: boolean;
  audioElement: HTMLAudioElement | null;

  // Actions
  initAudio: () => void;
  playTrack: (track: NormalizedSong, queueList?: NormalizedSong[], skipSocketSync?: boolean) => void;
  togglePlay: (skipSocketSync?: boolean) => void;
  pause: (skipSocketSync?: boolean) => void;
  resume: (skipSocketSync?: boolean) => void;
  nextTrack: (skipSocketSync?: boolean) => void;
  prevTrack: (skipSocketSync?: boolean) => void;
  seekTo: (time: number, skipSocketSync?: boolean) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  toggleShuffle: (skipSocketSync?: boolean) => void;
  cycleRepeatMode: (skipSocketSync?: boolean) => void;
  setQueue: (tracks: NormalizedSong[], skipSocketSync?: boolean) => void;
  toggleMiniPlayer: (open?: boolean) => void;
  toggleQueueDrawer: (open?: boolean) => void;
  toggleLyricsModal: (open?: boolean) => void;
  toggleMobileFullPlayer: (open?: boolean) => void;
}

let globalAudio: HTMLAudioElement | null = null;

export const useMusicPlayerStore = create<MusicPlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 30,
  volume: 0.8,
  isMuted: false,
  isShuffle: false,
  repeatMode: 'none',
  queue: [],
  queueIndex: -1,
  isMiniPlayerOpen: true,
  isQueueDrawerOpen: false,
  isLyricsModalOpen: false,
  isMobileFullPlayerOpen: false,
  audioElement: null,

  initAudio: () => {
    if (globalAudio) return;

    globalAudio = new Audio();
    globalAudio.volume = get().volume;

    globalAudio.addEventListener('timeupdate', () => {
      if (globalAudio) {
        set({ currentTime: globalAudio.currentTime || 0 });
      }
    });

    globalAudio.addEventListener('loadedmetadata', () => {
      if (globalAudio) {
        set({ duration: globalAudio.duration || 30 });
      }
    });

    globalAudio.addEventListener('ended', () => {
      const { repeatMode } = get();
      if (repeatMode === 'one' && globalAudio) {
        globalAudio.currentTime = 0;
        globalAudio.play().catch(console.error);
      } else {
        get().nextTrack();
      }
    });

    set({ audioElement: globalAudio });
  },

  playTrack: (track: NormalizedSong, queueList?: NormalizedSong[], skipSocketSync?: boolean) => {
    let { audioElement } = get();
    if (!audioElement) {
      get().initAudio();
      audioElement = globalAudio;
    }

    if (!audioElement) return;

    const newQueue = queueList && queueList.length > 0 ? queueList : get().queue;
    const existingIdx = newQueue.findIndex((t) => t.providerSongId === track.providerSongId);
    const queueIndex = existingIdx >= 0 ? existingIdx : 0;

    audioElement.src = track.previewUrl;
    audioElement.volume = get().isMuted ? 0 : get().volume;
    audioElement
      .play()
      .then(() => set({ isPlaying: true }))
      .catch((err) => {
        console.warn('Audio playback prevented/failed:', err);
        set({ isPlaying: false });
      });

    set({
      currentTrack: track,
      queue: newQueue.length > 0 ? newQueue : [track],
      queueIndex: queueIndex >= 0 ? queueIndex : 0,
      currentTime: 0,
      duration: track.duration || 30,
    });

    // Broadcast Listen Together Socket Sync
    if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
      useListenTogetherStore.getState().syncPlay(track, 0);
    }

    // Silently record recent play
    musicApi.recordRecentlyPlayed(track).catch(() => {});
  },

  togglePlay: (skipSocketSync?: boolean) => {
    const { audioElement, isPlaying, currentTrack } = get();
    if (!currentTrack) return;
    if (!audioElement) {
      get().initAudio();
      return;
    }

    if (isPlaying) {
      audioElement.pause();
      set({ isPlaying: false });
      if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
        useListenTogetherStore.getState().syncPause(audioElement.currentTime);
      }
    } else {
      audioElement
        .play()
        .then(() => {
          set({ isPlaying: true });
          if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
            useListenTogetherStore.getState().syncPlay(currentTrack, audioElement?.currentTime || 0);
          }
        })
        .catch(console.error);
    }
  },

  pause: (skipSocketSync?: boolean) => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.pause();
      set({ isPlaying: false });
      if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
        useListenTogetherStore.getState().syncPause(audioElement.currentTime);
      }
    }
  },

  resume: (skipSocketSync?: boolean) => {
    const { audioElement, currentTrack } = get();
    if (audioElement && currentTrack) {
      audioElement
        .play()
        .then(() => {
          set({ isPlaying: true });
          if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
            useListenTogetherStore.getState().syncPlay(currentTrack, audioElement.currentTime);
          }
        })
        .catch(console.error);
    }
  },

  nextTrack: (skipSocketSync?: boolean) => {
    const { queue, queueIndex, isShuffle, repeatMode } = get();
    if (queue.length === 0) return;

    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }

    const nextTrackItem = queue[nextIdx];
    if (nextTrackItem) {
      get().playTrack(nextTrackItem, queue, skipSocketSync);
      set({ queueIndex: nextIdx });
      if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
        useListenTogetherStore.getState().syncNext(nextTrackItem);
      }
    }
  },

  prevTrack: (skipSocketSync?: boolean) => {
    const { queue, queueIndex, currentTime } = get();
    if (currentTime > 3) {
      get().seekTo(0, skipSocketSync);
      return;
    }

    if (queue.length === 0) return;
    const prevIdx = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    const prevTrackItem = queue[prevIdx];
    if (prevTrackItem) {
      get().playTrack(prevTrackItem, queue, skipSocketSync);
      set({ queueIndex: prevIdx });
      if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
        useListenTogetherStore.getState().syncPrev(prevTrackItem);
      }
    }
  },

  seekTo: (time: number, skipSocketSync?: boolean) => {
    const { audioElement } = get();
    if (audioElement) {
      audioElement.currentTime = time;
      set({ currentTime: time });
      if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
        useListenTogetherStore.getState().syncSeek(time);
      }
    }
  },

  setVolume: (val: number) => {
    const { audioElement } = get();
    const clamped = Math.max(0, Math.min(1, val));
    if (audioElement) {
      audioElement.volume = clamped;
    }
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => {
    const { audioElement, isMuted, volume } = get();
    const nextMuted = !isMuted;
    if (audioElement) {
      audioElement.volume = nextMuted ? 0 : volume;
    }
    set({ isMuted: nextMuted });
  },

  toggleShuffle: (skipSocketSync?: boolean) => {
    const nextShuffle = !get().isShuffle;
    set({ isShuffle: nextShuffle });
    if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
      useListenTogetherStore.getState().syncShuffle(nextShuffle);
    }
  },

  cycleRepeatMode: (skipSocketSync?: boolean) => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const current = get().repeatMode;
    const nextMode = modes[(modes.indexOf(current) + 1) % modes.length];
    set({ repeatMode: nextMode });
    if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
      useListenTogetherStore.getState().syncRepeat(nextMode);
    }
  },

  setQueue: (tracks: NormalizedSong[], skipSocketSync?: boolean) => {
    set({ queue: tracks });
    if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
      useListenTogetherStore.getState().syncQueue(tracks);
    }
  },

  toggleMiniPlayer: (open?: boolean) => {
    set((state) => ({ isMiniPlayerOpen: open !== undefined ? open : !state.isMiniPlayerOpen }));
  },

  toggleQueueDrawer: (open?: boolean) => {
    set((state) => ({ isQueueDrawerOpen: open !== undefined ? open : !state.isQueueDrawerOpen }));
  },

  toggleLyricsModal: (open?: boolean) => {
    set((state) => ({ isLyricsModalOpen: open !== undefined ? open : !state.isLyricsModalOpen }));
  },

  toggleMobileFullPlayer: (open?: boolean) => {
    set((state) => ({ isMobileFullPlayerOpen: open !== undefined ? open : !state.isMobileFullPlayerOpen }));
  },
}));
