import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Disc,
  Heart,
  HeartHandshake,
  Pause,
  Play,
  Radio,
} from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { useUIStore } from '../../store/uiStore';
import { NormalizedSong } from '../../types/music.types';
import { ColorPalette, extractDominantColor } from '../../utils/colorExtractor';
import { MusicWaveform } from './MusicWaveform';

interface HomeSectionsTabProps {
  onOpenDedicateModal?: (song: NormalizedSong) => void;
  onSelectTab?: (tab: 'home' | 'search' | 'playlists' | 'uploaded' | 'dedications' | 'favorites') => void;
}

export const HomeSectionsTab: React.FC<HomeSectionsTabProps> = ({ onOpenDedicateModal, onSelectTab }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusicPlayerStore();
  const { addToast } = useUIStore();

  const [recentlyPlayed, setRecentlyPlayed] = useState<NormalizedSong[]>([]);
  const [sectionData, setSectionData] = useState<Record<string, NormalizedSong[]>>({});
  const [heroPalette, setHeroPalette] = useState<ColorPalette>({
    dominant: 'rgb(244, 63, 94)',
    ambientGradient: 'radial-gradient(ellipse at top center, rgba(244,63,94,0.45) 0%, rgba(15,23,42,0.95) 75%)',
    textContrast: 'light',
  });

  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});
  const [uploadedSongs, setUploadedSongs] = useState<NormalizedSong[]>([]);

  useEffect(() => {
    // Fetch initial datasets
    Promise.all([
      musicApi.getRecentlyPlayed().catch(() => []),
      musicApi.getFavorites().catch(() => []),
      musicApi.getUploadedSongs().catch(() => []),
      musicApi.getPlaylists().catch(() => []),
    ]).then(([recents, favs, uploaded]) => {
      const recentSongs = recents.map((r) => r.songId).filter(Boolean);
      setRecentlyPlayed(recentSongs);
      setUploadedSongs(Array.isArray(uploaded) ? uploaded : uploaded?.songs || []);

      const favMap: Record<string, boolean> = {};
      favs.forEach((f) => (favMap[f.providerSongId] = true));
      setFavoritesMap(favMap);
    });

    // Populate curated section tracks via Deezer Proxy
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

    categoryQueries.forEach(({ key, query }) => {
      musicApi.searchSongs(query, 0, 10).then((res) => {
        setSectionData((prev) => ({ ...prev, [key]: res.songs || [] }));
      });
    });
  }, []);

  // Update Hero Gradient color whenever current track changes
  useEffect(() => {
    const target = currentTrack || recentlyPlayed[0];
    if (target?.coverUrl) {
      extractDominantColor(target.coverUrl).then(setHeroPalette);
    }
  }, [currentTrack, recentlyPlayed]);

  const activeHeroTrack = currentTrack || recentlyPlayed[0] || {
    provider: 'deezer',
    providerSongId: '1',
    title: 'Afrin Universe Jukebox',
    artist: 'Afzal & Amrin',
    album: 'Lifetime Platform',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    previewUrl: '',
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
    { title: '📁 Personal Uploaded Library', tracks: uploadedSongs },
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

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Mobile-Only Spotify Header (Reference UI) */}
      <div className="block md:hidden space-y-4 pt-1">
        <h2 className="text-2xl font-black tracking-tight text-white">
          {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
        </h2>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="px-3.5 py-1.5 rounded-full bg-rose-500 text-white text-xs font-extrabold shadow-md shadow-rose-500/30 shrink-0">
            Music
          </span>
          <button
            onClick={() => onSelectTab && onSelectTab('uploaded')}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold shrink-0 transition"
          >
            Uploaded
          </button>
          <button
            onClick={() => onSelectTab && onSelectTab('favorites')}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold shrink-0 transition"
          >
            Favorites
          </button>
          <button
            onClick={() => onSelectTab && onSelectTab('playlists')}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold shrink-0 transition"
          >
            Playlists
          </button>
        </div>

        {/* Favorite Artists Circular Row (Reference UI) */}
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold text-slate-300">Your favorite artists</h3>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
            {[
              { name: 'Arijit Singh', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150' },
              { name: 'Ed Sheeran', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150' },
              { name: 'Sid Sriram', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150' },
              { name: 'Taylor Swift', img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150' },
              { name: 'Anirudh', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150' },
            ].map((art) => (
              <div key={art.name} className="flex flex-col items-center gap-1.5 shrink-0">
                <img src={art.img} alt={art.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10 shadow-lg" />
                <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[70px] text-center">{art.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Spotify Premium Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-10 text-white shadow-2xl border border-white/10"
        style={{ background: heroPalette.ambientGradient }}
      >
        {/* Dynamic Blurred Glow */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-60 transition-all duration-1000"
          style={{ background: heroPalette.dominant }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-8">
          {/* Left: Large Artwork & Disc */}
          <div className="relative group shrink-0">
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <img
                src={activeHeroTrack.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
                alt={activeHeroTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
            </div>
            {/* Spinning Vinyl Accent */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-slate-900 border-2 border-white/20 flex items-center justify-center shadow-xl">
              <Disc className={`w-10 h-10 text-rose-400 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            </div>
          </div>

          {/* Right: Track Info & Actions */}
          <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-xs font-bold text-rose-300">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>{currentTrack ? 'Now Playing' : 'Spotlight Feature'}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white line-clamp-2 leading-tight">
              {activeHeroTrack.title}
            </h1>

            <p className="text-base md:text-xl font-medium text-slate-300 truncate">
              {activeHeroTrack.artist} {activeHeroTrack.album ? `• ${activeHeroTrack.album}` : ''}
            </p>

            {/* Waveform visualizer */}
            {isPlaying && (
              <div className="py-1">
                <MusicWaveform isPlaying={isPlaying} barCount={24} height={28} color="bg-rose-400" />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <button
                onClick={() =>
                  currentTrack?.providerSongId === activeHeroTrack.providerSongId
                    ? togglePlay()
                    : playTrack(activeHeroTrack)
                }
                className="px-8 py-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-base flex items-center gap-3 shadow-xl shadow-rose-500/40 hover:scale-105 active:scale-95 transition"
              >
                {isPlaying && currentTrack?.providerSongId === activeHeroTrack.providerSongId ? (
                  <>
                    <Pause className="w-6 h-6 fill-current" /> Pause Preview
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current ml-0.5" /> Play Track
                  </>
                )}
              </button>

              <button
                onClick={() => handleToggleFav(activeHeroTrack)}
                className={`p-3.5 rounded-full border transition ${
                  favoritesMap[activeHeroTrack.providerSongId]
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                }`}
                title="Favorite Track"
              >
                <Heart className={`w-6 h-6 ${favoritesMap[activeHeroTrack.providerSongId] ? 'fill-rose-500' : ''}`} />
              </button>

              {onOpenDedicateModal && (
                <button
                  onClick={() => onOpenDedicateModal(activeHeroTrack)}
                  className="px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm flex items-center gap-2 transition"
                >
                  <HeartHandshake className="w-5 h-5 text-rose-300" /> Dedicate
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
                          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity ${
                            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
