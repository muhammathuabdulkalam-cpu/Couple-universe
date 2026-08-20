import { create } from 'zustand';
import { musicApi } from '../api/musicApi';
import { NormalizedSong } from '../types/music.types';
import { getCloudinaryMp3Url, getNormalizedAudioUrl } from '../utils/audioDecoder';
import { useListenTogetherStore } from './listenTogetherStore';
import { useUIStore } from './uiStore';

export type RepeatMode = 'none' | 'all' | 'one';

interface MusicPlayerState {
  currentTrack: NormalizedSong | null;
  isPlaying: boolean;
  isLoading: boolean;
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
  playTrack: (track: NormalizedSong, queueList?: NormalizedSong[], skipSocketSync?: boolean, startTime?: number) => void;
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
  closePlayer: () => void;
}

let globalAudio: HTMLAudioElement | null = null;
const resolvedUrlCache = new Map<string, string>();
let lastRecordedSongId: string | null = null;
let activePlayRequestId = 0;
let loadingTimer: ReturnType<typeof setTimeout> | null = null;

const preloaderAudio = typeof window !== 'undefined' ? new Audio() : null;
if (preloaderAudio) {
  preloaderAudio.preload = 'auto';
}

function clearLoadingTimer() {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
}

function preloadNextTrack(queue: NormalizedSong[], currentIndex: number, isShuffle: boolean) {
  if (!queue || queue.length <= 1) return;
  const nextIdx = isShuffle ? Math.floor(Math.random() * queue.length) : (currentIndex + 1) % queue.length;
  const nextTrack = queue[nextIdx];
  if (!nextTrack) return;

  const songId = nextTrack.providerSongId;
  let nextUrl = resolvedUrlCache.get(songId);
  if (!nextUrl && nextTrack.previewUrl) {
    nextUrl = getNormalizedAudioUrl(nextTrack.previewUrl);
    if (nextUrl) {
      resolvedUrlCache.set(songId, nextUrl);
    }
  }

  if (nextUrl && preloaderAudio && preloaderAudio.src !== nextUrl) {
    preloaderAudio.src = nextUrl;
  }
}

export const useMusicPlayerStore = create<MusicPlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
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

    // Attach to DOM body to bypass strict browser sandboxing on detached audio nodes
    if (typeof document !== 'undefined' && !document.getElementById('global-music-player-element')) {
      globalAudio.id = 'global-music-player-element';
      globalAudio.style.display = 'none';
      document.body.appendChild(globalAudio);
    }

    // Track whether audio context is unlocked (browsers require a user gesture before play)
    // We do NOT play a silent WAV here because that would race with the first playTrack() call
    // and overwrite the real song src. Instead, playTrack() itself is always called inside a
    // click handler, which already satisfies the user-gesture requirement.
    let audioUnlocked = false;
    const unlock = () => {
      if (!audioUnlocked && globalAudio && !globalAudio.src) {
        // Only unlock if no real song is already loading
        audioUnlocked = true;
      }
      audioUnlocked = true;
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    }


    globalAudio.addEventListener('timeupdate', () => {
      if (globalAudio) {
        const newTime = globalAudio.currentTime || 0;
        if (Math.abs(get().currentTime - newTime) >= 0.25) {
          set({ currentTime: newTime });
        }
        if (get().isLoading) {
          clearLoadingTimer();
          set({ isLoading: false });
        }
      }
    });

    globalAudio.addEventListener('loadedmetadata', () => {
      if (globalAudio) {
        const rawDur = globalAudio.duration;
        if (rawDur && isFinite(rawDur) && !isNaN(rawDur) && rawDur > 0) {
          set({ duration: rawDur });
        } else if (get().currentTrack?.duration && isFinite(get().currentTrack!.duration) && get().currentTrack!.duration > 0) {
          set({ duration: get().currentTrack!.duration });
        } else {
          set({ duration: 180 });
        }
      }
    });

    globalAudio.addEventListener('playing', () => {
      clearLoadingTimer();
      set({ isPlaying: true, isLoading: false });
    });

    globalAudio.addEventListener('pause', () => {
      clearLoadingTimer();
      if (!get().isLoading) {
        set({ isPlaying: false });
      }
    });

    globalAudio.addEventListener('waiting', () => {
      if (globalAudio && globalAudio.currentTime === 0 && globalAudio.paused) {
        clearLoadingTimer();
        loadingTimer = setTimeout(() => {
          if (globalAudio && globalAudio.paused) {
            set({ isLoading: true });
          }
        }, 600);
      }
    });

    globalAudio.addEventListener('canplay', () => {
      clearLoadingTimer();
      set({ isLoading: false });
    });

    globalAudio.addEventListener('canplaythrough', () => {
      clearLoadingTimer();
      set({ isLoading: false });
    });

    globalAudio.addEventListener('ended', () => {
      clearLoadingTimer();
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
      clearLoadingTimer();
      set({ isPlaying: false, isLoading: false });
    });

    set({ audioElement: globalAudio });
  },

  playTrack: (track: NormalizedSong, queueList?: NormalizedSong[], skipSocketSync?: boolean, startTime?: number) => {
    let { audioElement, currentTrack } = get();
    if (!audioElement) {
      get().initAudio();
      audioElement = globalAudio;
    }

    if (!audioElement) return;

    const currentRequestId = ++activePlayRequestId;
    const songId = track.providerSongId;

    clearLoadingTimer();

    // 1. Instant Playback optimization: If clicking play on currently loaded song, play without re-setting src
    if (currentTrack?.providerSongId === songId && audioElement.src) {
      if (startTime !== undefined && startTime > 0) {
        try { audioElement.currentTime = startTime; } catch (_e) {}
      }
      audioElement
        .play()
        .then(() => {
          if (currentRequestId === activePlayRequestId) {
            clearLoadingTimer();
            set({ isPlaying: true, isLoading: false });
            if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
              useListenTogetherStore.getState().syncPlay(currentTrack, audioElement?.currentTime || 0);
            }
          }
        })
        .catch((err) => {
          console.warn('Playback error on currently loaded track:', err);
          if (currentRequestId === activePlayRequestId) {
            clearLoadingTimer();
            set({ isPlaying: false, isLoading: false });
          }
        });
      return;
    }

    // Determine target queue & queue index synchronously
    const newQueue = queueList && queueList.length > 0 ? queueList : get().queue.length > 0 ? get().queue : [track];
    const existingIdx = newQueue.findIndex((t) => t.providerSongId === songId);
    const queueIndex = existingIdx >= 0 ? existingIdx : 0;

    // 2. Cache check: Retrieve pre-cached playable URL or normalize input previewUrl
    let targetUrl = resolvedUrlCache.get(songId) || getNormalizedAudioUrl(track.previewUrl || '');
    let resolvedTrack: NormalizedSong = { ...track, previewUrl: targetUrl };

    // 3. INSTANT ZUSTAND STORE UPDATE - 0ms UI response
    set({
      currentTrack: resolvedTrack,
      isPlaying: true,
      isLoading: false,
      queue: newQueue,
      queueIndex: queueIndex >= 0 ? queueIndex : 0,
      currentTime: startTime !== undefined ? startTime : 0,
      duration: track.duration || 30,
    });

    loadingTimer = setTimeout(() => {
      if (currentRequestId === activePlayRequestId) {
        const state = get();
        if (state.currentTrack?.providerSongId === songId && globalAudio && (globalAudio.paused || globalAudio.readyState < 2)) {
          set({ isLoading: true });
        }
      }
    }, 600);

    // Preload next track in background for instant transition
    preloadNextTrack(newQueue, queueIndex, get().isShuffle);

    // Helper to broadcast socket play event after local playback succeeds
    const triggerPartnerSync = (trackToSync: NormalizedSong, timeToSync: number) => {
      if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
        useListenTogetherStore.getState().syncPlay(trackToSync, timeToSync);
      }
    };

    // 4. INSTANT NATIVE AUDIO PLAYBACK
    if (targetUrl && targetUrl.trim() !== '' && !targetUrl.includes('cloudinary.com/demo/')) {
      const absoluteTargetUrl = new URL(targetUrl, window.location.origin).href;
      if (audioElement.src !== absoluteTargetUrl && audioElement.src !== targetUrl) {
        audioElement.src = targetUrl;
      }
      if (startTime !== undefined && startTime > 0) {
        try { audioElement.currentTime = startTime; } catch (_e) {}
      }
      audioElement.volume = get().isMuted ? 0 : get().volume;

      audioElement
        .play()
        .then(() => {
          if (currentRequestId === activePlayRequestId) {
            clearLoadingTimer();
            resolvedUrlCache.set(songId, targetUrl);
            set({ isPlaying: true, isLoading: false });
            triggerPartnerSync(resolvedTrack, audioElement?.currentTime || startTime || 0);
          }
        })
        .catch((err: any) => {
          if (currentRequestId !== activePlayRequestId) return;
          console.warn('Native play failed or blocked:', err);

          // Fast Cloudinary MP3 transcode fallback
          if (targetUrl.includes('cloudinary.com')) {
            const mp3Url = getCloudinaryMp3Url(targetUrl);
            if (mp3Url && mp3Url !== targetUrl && audioElement) {
              audioElement.src = mp3Url;
              audioElement
                .play()
                .then(() => {
                  if (currentRequestId === activePlayRequestId) {
                    clearLoadingTimer();
                    resolvedUrlCache.set(songId, mp3Url);
                    set({ isPlaying: true, isLoading: false });
                    triggerPartnerSync(resolvedTrack, audioElement?.currentTime || startTime || 0);
                  }
                })
                .catch(() => {
                  if (currentRequestId === activePlayRequestId) {
                    clearLoadingTimer();
                    set({ isPlaying: false, isLoading: false });
                  }
                });
              return;
            }
          }

          clearLoadingTimer();
          set({ isPlaying: false, isLoading: false });
        });
    } else {
      // Async fallback search ONLY if previewUrl is missing or demo link
      musicApi
        .searchSongs(`${track.title} ${track.artist}`, 0, 5)
        .then((searchRes) => {
          if (currentRequestId !== activePlayRequestId) return;
          const liveMatch = searchRes?.songs?.find(
            (s) => Boolean(s.previewUrl) && !s.previewUrl.includes('cloudinary.com/demo/')
          );
          if (liveMatch) {
            const fallbackUrl = getNormalizedAudioUrl(liveMatch.previewUrl);
            resolvedTrack.previewUrl = fallbackUrl;
            resolvedUrlCache.set(songId, fallbackUrl);
            set({ currentTrack: resolvedTrack });

            if (audioElement) {
              audioElement.src = fallbackUrl;
              audioElement
                .play()
                .then(() => {
                  if (currentRequestId === activePlayRequestId) {
                    clearLoadingTimer();
                    set({ isPlaying: true, isLoading: false });
                    triggerPartnerSync(resolvedTrack, audioElement?.currentTime || 0);
                  }
                })
                .catch(() => {
                  if (currentRequestId === activePlayRequestId) {
                    clearLoadingTimer();
                    set({ isPlaying: false, isLoading: false });
                  }
                });
            }
          } else {
            clearLoadingTimer();
            useUIStore
              .getState()
              .addToast(
                'Preview Unavailable',
                `Audio stream for "${track.title}" is currently unavailable.`,
                'warning'
              );
            set({ isPlaying: false, isLoading: false });
          }
        })
        .catch(() => {
          if (currentRequestId === activePlayRequestId) {
            clearLoadingTimer();
            set({ isPlaying: false, isLoading: false });
          }
        });
    }

    // Record recently played API ONLY ONCE per song
    if (lastRecordedSongId !== songId) {
      lastRecordedSongId = songId;
      musicApi.recordRecentlyPlayed(resolvedTrack).catch(() => { });
    }
  },

  togglePlay: (skipSocketSync?: boolean) => {
    const audio = get().audioElement || globalAudio;
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;
    if (!audio) {
      get().initAudio();
      return;
    }

    if (isPlaying) {
      try { audio.pause(); } catch (_e) {}
      set({ isPlaying: false, isLoading: false });
      if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
        useListenTogetherStore.getState().syncPause(audio.currentTime || 0);
      }
    } else {
      audio
        .play()
        .then(() => {
          set({ isPlaying: true, isLoading: false });
          if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
            useListenTogetherStore.getState().syncPlay(currentTrack, audio.currentTime || 0);
          }
        })
        .catch(() => {
          set({ isPlaying: false, isLoading: false });
        });
    }
  },

  pause: (skipSocketSync?: boolean) => {
    const audio = get().audioElement || globalAudio;
    if (audio) {
      try { audio.pause(); } catch (_e) {}
      set({ isPlaying: false, isLoading: false });
      if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
        useListenTogetherStore.getState().syncPause(audio.currentTime || 0);
      }
    } else {
      set({ isPlaying: false, isLoading: false });
    }
  },

  resume: (skipSocketSync?: boolean) => {
    const audio = get().audioElement || globalAudio;
    const { currentTrack } = get();
    if (audio && currentTrack) {
      audio
        .play()
        .then(() => {
          set({ isPlaying: true, isLoading: false });
          if (!skipSocketSync && useListenTogetherStore.getState().isSessionActive) {
            useListenTogetherStore.getState().syncPlay(currentTrack, audio.currentTime || 0);
          }
        })
        .catch(() => {
          set({ isPlaying: false, isLoading: false });
        });
    }
  },

  nextTrack: (skipSocketSync?: boolean) => {
    let { queue, currentTrack, isShuffle, repeatMode } = get();

    // Auto-fetch library queue if current queue has <= 1 track
    if (!queue || queue.length <= 1) {
      musicApi.getUploadedSongs(1, 100).then((res) => {
        if (res?.songs && res.songs.length > 0) {
          set({ queue: res.songs });
          const currId = get().currentTrack?.providerSongId;
          const idx = res.songs.findIndex((t) => t.providerSongId === currId);
          const nextIndex = idx >= 0 ? (idx + 1) % res.songs.length : 0;
          const target = res.songs[nextIndex];
          if (target) get().playTrack(target, res.songs, skipSocketSync);
        }
      }).catch(() => {});
      if (!queue || queue.length === 0) return;
    }

    const currentIdx = queue.findIndex((t) => t.providerSongId === currentTrack?.providerSongId);
    const baseIdx = currentIdx >= 0 ? currentIdx : 0;

    let nextIdx = baseIdx + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeatMode === 'all' || repeatMode === 'none' || queue.length > 1) {
        nextIdx = 0; // Wrap around for continuous library playback
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
    let { queue, currentTrack, currentTime } = get();

    if (currentTime > 3) {
      get().seekTo(0, skipSocketSync);
      return;
    }

    // Auto-fetch library queue if current queue has <= 1 track
    if (!queue || queue.length <= 1) {
      musicApi.getUploadedSongs(1, 100).then((res) => {
        if (res?.songs && res.songs.length > 0) {
          set({ queue: res.songs });
          const currId = get().currentTrack?.providerSongId;
          const idx = res.songs.findIndex((t) => t.providerSongId === currId);
          const prevIndex = idx > 0 ? idx - 1 : res.songs.length - 1;
          const target = res.songs[prevIndex];
          if (target) get().playTrack(target, res.songs, skipSocketSync);
        }
      }).catch(() => {});
      if (!queue || queue.length === 0) return;
    }

    const currentIdx = queue.findIndex((t) => t.providerSongId === currentTrack?.providerSongId);
    const baseIdx = currentIdx >= 0 ? currentIdx : 0;

    const prevIdx = baseIdx > 0 ? baseIdx - 1 : queue.length - 1;
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

  closePlayer: () => {
    const { audioElement } = get();
    if (audioElement) {
      try {
        audioElement.pause();
        audioElement.currentTime = 0;
      } catch (_err) { }
    }
    set({
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      isQueueDrawerOpen: false,
      isLyricsModalOpen: false,
      isMobileFullPlayerOpen: false,
    });
  },
}));
