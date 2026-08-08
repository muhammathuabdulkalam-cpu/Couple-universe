import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Disc,
  Heart,
  HeartHandshake,
  Loader2,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  X,
} from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { useUIStore } from '../../store/uiStore';
import { NormalizedSong } from '../../types/music.types';
import { ColorPalette, extractDominantColor } from '../../utils/colorExtractor';
import { ListenTogetherBadge } from './ListenTogetherBadge';
import { MusicWaveform } from './MusicWaveform';

interface HomeSectionsTabProps {
  onOpenDedicateModal?: (song: NormalizedSong) => void;
  onOpenUploadModal?: () => void;
  onSelectTab?: (tab: 'home' | 'search' | 'playlists' | 'dedications' | 'favorites' | 'uploads') => void;
}

export const HomeSectionsTab: React.FC<HomeSectionsTabProps> = ({ onOpenDedicateModal, onOpenUploadModal, onSelectTab }) => {
  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const isAudioLoading = useMusicPlayerStore((s) => s.isLoading);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);
  const { addToast } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [recentlyPlayed, setRecentlyPlayed] = useState<NormalizedSong[]>([]);
  const [sectionData, setSectionData] = useState<Record<string, NormalizedSong[]>>({});
  const [heroPalette, setHeroPalette] = useState<ColorPalette>({
    dominant: 'rgb(244, 63, 94)',
    ambientGradient: 'radial-gradient(ellipse at top center, rgba(244,63,94,0.45) 0%, rgba(15,23,42,0.95) 75%)',
    textContrast: 'light',
  });

  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});

  // Inline Search State directly on Home Page
  const [inlineSearchQuery, setInlineSearchQuery] = useState('');
  const [inlineSearchResults, setInlineSearchResults] = useState<NormalizedSong[]>([]);
  const [isInlineSearching, setIsInlineSearching] = useState(false);

  useEffect(() => {
    if (!inlineSearchQuery.trim()) {
      setInlineSearchResults([]);
      setIsInlineSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsInlineSearching(true);
      musicApi
        .searchSongs(inlineSearchQuery.trim(), 0, 10)
        .then((res) => {
          setInlineSearchResults(res.songs || []);
        })
        .catch(() => {})
        .finally(() => setIsInlineSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [inlineSearchQuery]);

  useEffect(() => {
    setIsLoading(true);

    const recentsPromise = musicApi
      .getRecentlyPlayed()
      .then((recents) => {
        const recentSongs = recents.map((r) => r.songId).filter(Boolean);
        setRecentlyPlayed(recentSongs);
      })
      .catch(() => { });

    const favsPromise = musicApi
      .getFavorites()
      .then((favs) => {
        const favMap: Record<string, boolean> = {};
        favs.forEach((f) => (favMap[f.providerSongId] = true));
        setFavoritesMap(favMap);
      })
      .catch(() => { });

    const categoryQueries = [
      { key: 'made_for_us', query: 'Love Duets' },
      { key: 'romantic', query: 'Romantic Hits' },
      { key: 'rain', query: 'Acoustic Rain' },
      { key: 'night', query: 'Midnight Lofi' },
      { key: 'road', query: 'Road Trip Bangers' },
      { key: 'birthday', query: 'Birthday Party' },
      { key: 'wedding', query: 'Wedding Love Songs' },
      { key: 'chill', query: 'Chill Ambient' },
    ];

    const categoryPromises = categoryQueries.map(({ key, query }) =>
      musicApi
        .searchSongs(query, 0, 10)
        .then((res) => {
          setSectionData((prev) => ({ ...prev, [key]: res.songs || [] }));
        })
        .catch(() => { })
    );

    Promise.allSettled([recentsPromise, favsPromise, ...categoryPromises]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Update Hero Gradient color whenever current track changes
  useEffect(() => {
    const target = currentTrack || recentlyPlayed[0];
    if (target?.coverUrl) {
      extractDominantColor(target.coverUrl).then(setHeroPalette);
    }
  }, [currentTrack, recentlyPlayed]);

  const firstCategorySong = (sectionData['made_for_us'] && sectionData['made_for_us'][0]) || (sectionData['romantic'] && sectionData['romantic'][0]);

  const activeHeroTrack = currentTrack || recentlyPlayed[0] || firstCategorySong || {
    provider: 'deezer',
    providerSongId: 'fallback_hero_1',
    title: 'Love Story',
    artist: 'Taylor Swift',
    album: 'Fearless',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    previewUrl: 'https://cdns-preview-d.dzcdn.net/stream/c-d64627d3129528d22384a2754d924ebc-3.mp3',
    duration: 30,
  };

  const handleToggleFav = async (song: NormalizedSong) => {
    try {
      const res = await musicApi.toggleFavorite(song);
      setFavoritesMap((prev) => ({
        ...prev,
        [song.providerSongId]: res.isFavorite,
      }));
      addToast(
        res.isFavorite ? 'Added to Favorites ❤️' : 'Removed from Favorites',
        `"${song.title}"`,
        'success'
      );
    } catch (_err) {
      addToast('Error', 'Failed to toggle favorite', 'error');
    }
  };

  const sectionsConfig = [
    { title: '❤️ Continue Listening', tracks: recentlyPlayed.slice(0, 10) },
    { title: '❤️ Recently Played', tracks: recentlyPlayed },
    { title: '❤️ Made For Afzal & Amrin', tracks: sectionData['made_for_us'] || [] },
    { title: '❤️ Romantic Picks', tracks: sectionData['romantic'] || [] },
    { title: '❤️ Rain Memories', tracks: sectionData['rain'] || [] },
    { title: '❤️ Night Vibes', tracks: sectionData['night'] || [] },
    { title: '❤️ Road Trip', tracks: sectionData['road'] || [] },
    { title: '❤️ Birthday Songs', tracks: sectionData['birthday'] || [] },
    { title: '❤️ Wedding Playlist', tracks: sectionData['wedding'] || [] },
    { title: '❤️ Chill Mix', tracks: sectionData['chill'] || [] },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Hero Banner Skeleton */}
        <div className="h-72 rounded-3xl bg-slate-900/60 border border-white/10 p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-48 rounded-2xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-4 w-full">
            <div className="h-4 bg-white/10 rounded-full w-28" />
            <div className="h-8 bg-white/10 rounded-xl w-3/4" />
            <div className="h-5 bg-white/5 rounded-lg w-1/2" />
            <div className="flex gap-4 pt-2">
              <div className="h-12 w-36 rounded-full bg-rose-500/30 animate-pulse" />
              <div className="h-12 w-12 rounded-full bg-white/10" />
            </div>
          </div>
        </div>

        {/* Category Rows Skeleton */}
        {[1, 2, 3].map((row) => (
          <div key={row} className="space-y-4">
            <div className="h-6 bg-white/10 rounded-lg w-48" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map((card) => (
                <div key={card} className="w-44 md:w-52 h-64 rounded-2xl bg-slate-900/60 border border-white/5 p-4 shrink-0 space-y-3">
                  <div className="w-full aspect-square rounded-xl bg-white/10" />
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10">
      {/* 0. Top Spotify Welcome Header, Search & Action Bar */}
      <div className="space-y-4 pb-2">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Welcome to Muzic</span>
            <span className="text-rose-500 animate-pulse">🎧</span>
          </h1>
        </div>

        {/* Search Bar directly on page without scrolling */}
        <div className="relative w-full max-w-xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={inlineSearchQuery}
              onChange={(e) => setInlineSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inlineSearchQuery.trim() && onSelectTab) {
                  onSelectTab('search');
                }
              }}
              placeholder="Search songs, artists, albums..."
              className="w-full pl-11 pr-24 py-2.5 sm:py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 text-xs sm:text-sm font-medium transition shadow-xl backdrop-blur-xl"
            />
            {inlineSearchQuery ? (
              <button
                onClick={() => {
                  setInlineSearchQuery('');
                  setInlineSearchResults([]);
                }}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (inlineSearchQuery.trim() && onSelectTab) {
                    onSelectTab('search');
                  }
                }}
                className="absolute right-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition"
              >
                Search
              </button>
            )}
          </div>
        </div>

        {/* Action Row: Upload Song & Listen Together */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => onOpenUploadModal && onOpenUploadModal()}
            className="h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Upload Song</span>
          </button>

          <div className="shrink-0">
            <ListenTogetherBadge />
          </div>
        </div>

        {/* Instant Search Results directly on Home page */}
        {inlineSearchQuery.trim().length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                <span>Results for "{inlineSearchQuery}"</span>
              </h3>
              {isInlineSearching && <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />}
            </div>

            {inlineSearchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-1">
                {inlineSearchResults.map((song, sIdx) => {
                  const isCurrent = currentTrack?.providerSongId === song.providerSongId;
                  const isSongPlaying = isCurrent && isPlaying;
                  const isSongLoading = isCurrent && isAudioLoading;

                  return (
                    <div
                      key={`inline-${song.providerSongId}-${sIdx}`}
                      onClick={() => (isCurrent ? togglePlay() : playTrack(song, inlineSearchResults))}
                      className="group bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-rose-500/40 rounded-2xl p-3.5 cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-950">
                        <img
                          src={song.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                          alt={song.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div
                          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity ${
                            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <button className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition">
                            {isSongLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin text-white" />
                            ) : isSongPlaying ? (
                              <Pause className="w-5 h-5 fill-current" />
                            ) : (
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate group-hover:text-rose-300 transition">
                          {song.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{song.artist}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !isInlineSearching && (
                <p className="text-xs text-slate-400 italic px-1">No songs found matching "{inlineSearchQuery}".</p>
              )
            )}
          </div>
        )}
      </div>

      {/* 1. Spotify Premium Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-5 md:p-10 text-white shadow-2xl border border-white/10"
        style={{ background: heroPalette.ambientGradient }}
      >
        {/* Dynamic Blurred Glow */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-60 transition-all duration-1000"
          style={{ background: heroPalette.dominant }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-5 md:gap-8">
          {/* Left: Large Artwork & Disc */}
          <div className="relative group shrink-0">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <img
                src={activeHeroTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
                alt={activeHeroTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'
                  }`}
              />
            </div>
            {/* Spinning Vinyl Accent */}
            <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900 border-2 border-white/20 flex items-center justify-center shadow-xl">
              <Disc className={`w-7 h-7 md:w-10 md:h-10 text-rose-400 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            </div>
          </div>

          {/* Right: Track Info & Actions */}
          <div className="flex-1 min-w-0 space-y-2.5 md:space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-[11px] md:text-xs font-bold text-rose-300">
              <Radio className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose-400 animate-pulse" />
              <span>{currentTrack ? 'Now Playing' : 'Spotlight Feature'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white line-clamp-2 leading-tight">
              {activeHeroTrack.title}
            </h1>

            <p className="text-xs sm:text-sm md:text-xl font-medium text-slate-300 truncate">
              {activeHeroTrack.artist} {activeHeroTrack.album ? `• ${activeHeroTrack.album}` : ''}
            </p>

            {/* Waveform visualizer */}
            {isPlaying && (
              <div className="py-0.5">
                <MusicWaveform isPlaying={isPlaying} barCount={24} height={24} color="bg-rose-400" />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 md:gap-4 pt-1">
              <button
                onClick={() =>
                  currentTrack?.providerSongId === activeHeroTrack.providerSongId
                    ? togglePlay()
                    : playTrack(activeHeroTrack)
                }
                className="px-5 py-2.5 md:px-8 md:py-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs md:text-base flex items-center gap-2 md:gap-3 shadow-xl shadow-rose-500/40 hover:scale-105 active:scale-95 transition"
              >
                {isPlaying && currentTrack?.providerSongId === activeHeroTrack.providerSongId ? (
                  <>
                    <Pause className="w-4 h-4 md:w-6 md:h-6 fill-current" /> Pause Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 md:w-6 md:h-6 fill-current ml-0.5" /> Play Track
                  </>
                )}
              </button>

              <button
                onClick={() => handleToggleFav(activeHeroTrack)}
                className={`p-2.5 md:p-3.5 rounded-full border transition ${favoritesMap[activeHeroTrack.providerSongId]
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                  }`}
                title="Favorite Track"
              >
                <Heart className={`w-4 h-4 md:w-6 md:h-6 ${favoritesMap[activeHeroTrack.providerSongId] ? 'fill-rose-500' : ''}`} />
              </button>

              {onOpenDedicateModal && (
                <button
                  onClick={() => onOpenDedicateModal(activeHeroTrack)}
                  className="px-3.5 py-2.5 md:px-5 md:py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs md:text-sm flex items-center gap-1.5 md:gap-2 transition"
                >
                  <HeartHandshake className="w-4 h-4 md:w-5 md:h-5 text-rose-300" /> Dedicate
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Spotify Premium Category Rows (Horizontal Scrollable) */}
      <div className="space-y-8">
        {/* Recently Played Dedicated Block if empty */}
        {recentlyPlayed.length === 0 && (
          <div className="space-y-3">
            <h3 className="font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
              <span>❤️ Recently Played</span>
            </h3>
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-300">Nothing played yet.</p>
              <p className="text-xs text-slate-500 mt-1">Play any track preview above to build your history!</p>
            </div>
          </div>
        )}

        {sectionsConfig.map((sec, idx) => {
          if (!sec.tracks || sec.tracks.length === 0) return null;

          return (
            <div key={`${sec.title}-${idx}`} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
                  <span>{sec.title}</span>
                </h3>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-0.5 hover:text-rose-400 cursor-pointer">
                  See all <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Horizontal Scroll Track Cards */}
              <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x">
                {sec.tracks.map((song, sIdx) => {
                  const isCurrent = currentTrack?.providerSongId === song.providerSongId;
                  const isSongPlaying = isCurrent && isPlaying;
                  const isFav = favoritesMap[song.providerSongId];

                  return (
                    <div
                      key={`${song.providerSongId}-${sIdx}`}
                      onClick={() => (isCurrent ? togglePlay() : playTrack(song, sec.tracks))}
                      className="group shrink-0 w-44 md:w-52 bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-rose-500/40 rounded-2xl p-3.5 cursor-pointer transition-all duration-300 shadow-xl snap-start flex flex-col justify-between"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-950">
                        <img
                          src={song.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                          alt={song.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div
                          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                        >
                          <button className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition">
                            {isSongPlaying ? (
                              <Pause className="w-5 h-5 fill-current" />
                            ) : (
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate group-hover:text-rose-300 transition">
                          {song.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{song.artist}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFav(song);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        {onOpenDedicateModal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDedicateModal(song);
                            }}
                            className="text-[11px] font-semibold text-rose-300 hover:text-rose-200 flex items-center gap-1"
                          >
                            <HeartHandshake className="w-3.5 h-3.5" /> Dedicate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
