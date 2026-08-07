import { create } from 'zustand';
import { musicApi } from '../api/musicApi';
import { NormalizedSong } from '../types/music.types';
import { decodeAudioToWavUrl, getCloudinaryMp3Url, getNormalizedAudioUrl } from '../utils/audioDecoder';
import { useListenTogetherStore } from './listenTogetherStore';
import { useUIStore } from './uiStore';

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
const resolvedUrlCache = new Map<string, string>();
let lastRecordedSongId: string | null = null;
let activePlayRequestId = 0;

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
    globalAudio.preload = 'auto';
    globalAudio.volume = get().volume;

    globalAudio.addEventListener('timeupdate', () => {
      if (globalAudio) {
        const newTime = globalAudio.currentTime || 0;
        if (Math.abs(get().currentTime - newTime) >= 0.25) {
          set({ currentTime: newTime });
        }
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

    globalAudio.addEventListener('error', (e) => {
      console.warn('Audio playback error event captured:', e, globalAudio?.error);
      set({ isPlaying: false });
    });

    set({ audioElement: globalAudio });
  },

  playTrack: async (track: NormalizedSong, queueList?: NormalizedSong[], skipSocketSync?: boolean) => {
    let { audioElement, currentTrack, isPlaying } = get();
    if (!audioElement) {
      get().initAudio();
      audioElement = globalAudio;
    }

    if (!audioElement) return;

    const currentRequestId = ++activePlayRequestId;
    const songId = track.providerSongId;

    // 1. Instant Playback optimization: If clicking play on currently loaded song, toggle without changing src
    if (currentTrack?.providerSongId === songId && audioElement.src) {
      if (!isPlaying) {
        try {
          await audioElement.play();
          set({ isPlaying: true });
        } catch (_err) {}
      }
      return;
    }

    // 2. Cache check: Retrieve pre-cached playable URL or normalize input previewUrl
    let targetUrl = resolvedUrlCache.get(songId) || getNormalizedAudioUrl(track.previewUrl || '');
    let resolvedTrack: NormalizedSong = { ...track, previewUrl: targetUrl };

    // 3. Fallback search only if previewUrl is missing or points to demo link
    if (!targetUrl || targetUrl.includes('cloudinary.com/demo/')) {
      try {
        const searchRes = await musicApi.searchSongs(`${track.title} ${track.artist}`, 0, 5);
        if (currentRequestId !== activePlayRequestId) return;
        const liveMatch = searchRes?.songs?.find((s) => Boolean(s.previewUrl) && !s.previewUrl.includes('cloudinary.com/demo/'));
        if (liveMatch) {
          targetUrl = getNormalizedAudioUrl(liveMatch.previewUrl);
          resolvedTrack.previewUrl = targetUrl;
        }
      } catch (_err) { }
    }

    if (currentRequestId !== activePlayRequestId) return;

    // STRICT GUARD: If targetUrl is empty or invalid, abort setting src to prevent browser loading HTML page as audio
    if (!targetUrl || targetUrl.trim() === '') {
      console.warn('Audio stream URL is unavailable for track:', track.title);
      useUIStore.getState().addToast('Preview Unavailable', `Audio stream for "${track.title}" is currently unavailable.`, 'warning');
      set({ isPlaying: false });
      return;
    }

    const newQueue = queueList && queueList.length > 0 ? queueList : get().queue;
    const existingIdx = newQueue.findIndex((t) => t.providerSongId === songId);
    const queueIndex = existingIdx >= 0 ? existingIdx : 0;

    // Safely pause audio before setting new source to prevent pending play promise interruptions
    if (!audioElement.paused && audioElement.src !== targetUrl) {
      audioElement.pause();
    }

    // Update src only if target URL has changed (prevents discarding buffered data & duplicate network requests)
    if (audioElement.src !== targetUrl) {
      audioElement.src = targetUrl;
    }
    audioElement.volume = get().isMuted ? 0 : get().volume;

    let playSuccess = false;

    // Stage 1: Native HTML5 audio play
    try {
      if (targetUrl) {
        await audioElement.play();
        if (currentRequestId !== activePlayRequestId) return;
        playSuccess = true;
        resolvedUrlCache.set(songId, targetUrl);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || currentRequestId !== activePlayRequestId) {
        // Interrupted by a newer play request - exit cleanly without triggering fallbacks
        return;
      }
      console.warn('Native HTMLAudioElement play failed for format/source, initializing fallback recovery chain:', err);
    }

    // Stage 2: Cloudinary MP3 transcode fallback
    if (!playSuccess && targetUrl && targetUrl.includes('cloudinary.com')) {
      try {
        const mp3Url = getCloudinaryMp3Url(targetUrl);
        if (mp3Url && mp3Url !== targetUrl) {
          audioElement.src = mp3Url;
          await audioElement.play();
          if (currentRequestId !== activePlayRequestId) return;
          resolvedTrack.previewUrl = mp3Url;
          playSuccess = true;
          resolvedUrlCache.set(songId, mp3Url);
        }
      } catch (cErr: any) {
        if (cErr?.name === 'AbortError' || currentRequestId !== activePlayRequestId) return;
        console.warn('Cloudinary MP3 transcode fallback warning:', cErr);
      }
    }

    // Stage 3: Web Audio API PCM decoder fallback (Transcode any unsupported container/codec to universal WAV Blob URL)
    if (!playSuccess && targetUrl) {
      try {
        const wavBlobUrl = await decodeAudioToWavUrl(targetUrl);
        if (currentRequestId !== activePlayRequestId) return;
        audioElement.src = wavBlobUrl;
        await audioElement.play();
        if (currentRequestId !== activePlayRequestId) return;
        playSuccess = true;
        resolvedUrlCache.set(songId, wavBlobUrl);
      } catch (transcodeErr: any) {
        if (transcodeErr?.name === 'AbortError' || currentRequestId !== activePlayRequestId) return;
        console.warn('Web Audio API PCM decoding fallback warning:', transcodeErr);
      }
    }

    // Stage 4: Deezer / provider search fallback
    if (!playSuccess && track.provider !== 'local') {
      try {
        const searchRes = await musicApi.searchSongs(`${track.title} ${track.artist}`, 0, 5);
        if (currentRequestId !== activePlayRequestId) return;
        const liveMatch = searchRes?.songs?.find((s) => Boolean(s.previewUrl) && s.previewUrl !== targetUrl);
        if (liveMatch) {
          const fallbackUrl = getNormalizedAudioUrl(liveMatch.previewUrl);
          resolvedTrack.previewUrl = fallbackUrl;
          audioElement.src = fallbackUrl;
          await audioElement.play();
          if (currentRequestId !== activePlayRequestId) return;
          playSuccess = true;
          resolvedUrlCache.set(songId, fallbackUrl);
        }
      } catch (_fallbackErr) { }
    }

    if (currentRequestId !== activePlayRequestId) return;

    set({
      currentTrack: resolvedTrack,
      isPlaying: playSuccess,
      queue: newQueue.length > 0 ? newQueue : [resolvedTrack],
      queueIndex: queueIndex >= 0 ? queueIndex : 0,
      currentTime: 0,
      duration: resolvedTrack.duration || 30,
    });

    // Broadcast Listen Together Socket Sync
    if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
      useListenTogetherStore.getState().syncPlay(resolvedTrack, 0);
    }

    // Record recently played API ONLY ONCE per song
    if (lastRecordedSongId !== songId) {
      lastRecordedSongId = songId;
      musicApi.recordRecentlyPlayed(resolvedTrack).catch(() => {});
    }
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
