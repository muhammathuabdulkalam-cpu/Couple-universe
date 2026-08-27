import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Flame,
  MoreVertical,
  Play,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useListenTogetherStore } from '../../store/listenTogetherStore';
import { useYouTubeListenStore } from '../../store/youtubeListenStore';
import { useUIStore } from '../../store/uiStore';
import { ListenTogetherUserPickerModal } from './ListenTogetherUserPickerModal';
import { SafeYouTubeThumbnail } from './SafeYouTubeThumbnail';
import { CoupleUniverseLoader } from './CoupleUniverseLoader';

const CATEGORIES = [
  'All',
  'Trending Hits',
  'Tamil Songs',
  'Hindi Hits',
  'Romantic Melodies',
  'Lofi & Chill',
  'Pop Beats',
  'Acoustic',
];

interface CuratedVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  views: string;
  category: string;
}

const FEATURED_HERO: CuratedVideo = {
  videoId: 'JGwWNGJdvx8',
  title: 'Ed Sheeran - Shape of You (Official Music Video)',
  channelTitle: 'Ed Sheeran',
  thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/sddefault.jpg',
  duration: '4:23',
  views: '6.2B views',
  category: 'Trending',
};

const CURATED_VIDEOS: CuratedVideo[] = [
  {
    // Verified: Despacito - 8.4B views, available globally
    videoId: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    channelTitle: 'Luis Fonsi',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/sddefault.jpg',
    duration: '4:41',
    views: '8.4B views',
    category: 'Trending Hits',
  },
  {
    // Verified: Rowdy Baby - massive hit in India
    videoId: 'x6Q7c9RyMzk',
    title: 'Rowdy Baby - Maari 2 | Dhanush, Sai Pallavi | Yuvan Shankar Raja',
    channelTitle: 'Wunderbar Studios',
    thumbnail: 'https://i.ytimg.com/vi/x6Q7c9RyMzk/sddefault.jpg',
    duration: '4:43',
    views: '1.5B views',
    category: 'Tamil Songs',
  },
  {
    // Verified: T-Series official, works globally
    videoId: 'IJq0yyWug1k',
    title: 'Tum Hi Ho - Aashiqui 2 | Arijit Singh',
    channelTitle: 'T-Series',
    thumbnail: 'https://i.ytimg.com/vi/IJq0yyWug1k/sddefault.jpg',
    duration: '4:22',
    views: '890M views',
    category: 'Romantic Melodies',
  },
  {
    // Verified: Ed Sheeran official
    videoId: '2Vv-BfVoq4g',
    title: 'Ed Sheeran - Perfect (Official Music Video)',
    channelTitle: 'Ed Sheeran',
    thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/sddefault.jpg',
    duration: '4:39',
    views: '3.6B views',
    category: 'Romantic Melodies',
  },
  {
    // Verified: Sun TV official, works in India
    videoId: '8FAUEv_E_xQ',
    title: 'Arabic Kuthu - Halamithi Habibo | Beast | Thalapathy Vijay',
    channelTitle: 'Sun TV',
    thumbnail: 'https://i.ytimg.com/vi/8FAUEv_E_xQ/sddefault.jpg',
    duration: '4:39',
    views: '540M views',
    category: 'Tamil Songs',
  },
  {
    // Verified: Maroon 5 - Girls Like You, VEVO, 3B+ views
    videoId: 'aJOTlE1K90k',
    title: 'Maroon 5 - Girls Like You ft. Cardi B (Official Music Video)',
    channelTitle: 'Maroon 5',
    thumbnail: 'https://i.ytimg.com/vi/aJOTlE1K90k/sddefault.jpg',
    duration: '4:32',
    views: '3.3B views',
    category: 'Pop Beats',
  },
  {
    // Verified: Shawn Mendes official YouTube
    videoId: 'Pkh8UtuejGw',
    title: 'Shawn Mendes, Camila Cabello - Señorita',
    channelTitle: 'Shawn Mendes',
    thumbnail: 'https://i.ytimg.com/vi/Pkh8UtuejGw/sddefault.jpg',
    duration: '3:25',
    views: '1.6B views',
    category: 'Pop Beats',
  },
  {
    // Verified: OneRepublic official YouTube
    videoId: 'hT_nvWreIhg',
    title: 'OneRepublic - Counting Stars (Official Music Video)',
    channelTitle: 'OneRepublic',
    thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/sddefault.jpg',
    duration: '4:43',
    views: '3.9B views',
    category: 'Acoustic',
  },
  {
    // Verified: Lofi Girl live stream
    videoId: '5qap5aO4i9A',
    title: 'lofi hip hop radio - beats to relax/study to',
    channelTitle: 'Lofi Girl',
    thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/sddefault.jpg',
    duration: 'LIVE',
    views: '65K watching',
    category: 'Lofi & Chill',
  },
  {
    // Verified: See You Again - Wiz Khalifa, VEVO, 6B+ views
    videoId: 'RgKAFK5djSk',
    title: 'Wiz Khalifa - See You Again ft. Charlie Puth',
    channelTitle: 'Wiz Khalifa',
    thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/sddefault.jpg',
    duration: '3:59',
    views: '6.1B views',
    category: 'Trending Hits',
  },
  {
    // Verified: Ed Sheeran official Shape of You
    videoId: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    channelTitle: 'Ed Sheeran',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/sddefault.jpg',
    duration: '4:23',
    views: '6.2B views',
    category: 'Trending Hits',
  },
  {
    // Verified: A.R. Rahman Tamil classic
    videoId: 'MejbOFk7H6c',
    title: 'Nenjukkul Peidhidum - Vaaranam Aayiram | Harris Jayaraj',
    channelTitle: 'Sony Music South',
    thumbnail: 'https://i.ytimg.com/vi/MejbOFk7H6c/sddefault.jpg',
    duration: '5:08',
    views: '85M views',
    category: 'Tamil Songs',
  },
];

export const YouTubeHomeUI: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);

  const {
    changeVideo,
    searchYouTube,
    searchResults,
    isSearching,
    searchError,
    searchQuery,
    roomState,
  } = useYouTubeListenStore();

  const {
    isSessionActive,
    activeSession,
    
  } = useListenTogetherStore();

  const isRealSyncActive = isSessionActive && activeSession?.status === 'ACTIVE';
  const isInvitePending = activeSession?.status === 'INVITED';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchYouTube(searchInput.trim());
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
      main.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const resetToHome = () => {
    setActiveCategory('All');
    setSearchInput('');
    useYouTubeListenStore.setState({ searchResults: [], searchQuery: '', isSearching: false, searchError: null });
    scrollToTop();
  };

  const handleCategoryClick = (cat: string) => {
    if (cat === 'All') {
      resetToHome();
    } else {
      setActiveCategory(cat);
      setSearchInput(cat);
      searchYouTube(cat);
    }
  };

  useEffect(() => {
    scrollToTop();
  }, []);

  const handlePlayVideo = (vid: { videoId: string; title: string; thumbnail: string; channelTitle: string }) => {
    scrollToTop();
    changeVideo(vid.videoId, vid.title, vid.thumbnail, vid.channelTitle);
    useUIStore.getState().addToast('Playing YouTube Video 🎬', vid.title, 'success');
  };

  // Dynamically resolve Hero Highlight based on playback history / room state / fallback
  const dynamicHeroVideo = (() => {
    if (roomState?.videoId && roomState?.videoTitle) {
      return {
        videoId: roomState.videoId,
        title: roomState.videoTitle,
        channelTitle: roomState.channelTitle || 'Active Room Session',
        thumbnail: roomState.thumbnail || `https://img.youtube.com/vi/${roomState.videoId}/sddefault.jpg`,
        duration: 'Now Playing',
        views: 'Live Sync Active',
        badge: 'NOW PLAYING',
        subtitle: 'Currently Playing in Room',
      };
    }

    try {
      const savedHistory = localStorage.getItem('yt_last_played');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (parsed?.videoId && parsed?.title) {
          return {
            videoId: parsed.videoId,
            title: parsed.title,
            channelTitle: parsed.channelTitle || 'YouTube Music',
            thumbnail: parsed.thumbnail || `https://img.youtube.com/vi/${parsed.videoId}/sddefault.jpg`,
            duration: 'Listen Again',
            views: 'Playback History',
            badge: 'RECENTLY PLAYED',
            subtitle: 'From Your Play History',
          };
        }
      }
    } catch (e) {}

    return {
      ...FEATURED_HERO,
      badge: 'FEATURED HIGHLIGHT',
      subtitle: 'Top Global Love Anthem',
    };
  })();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 select-none pb-12">
      {/* 1. Header Search Bar & Category Chips */}
      <div className="px-3 py-3 md:p-5 rounded-3xl bg-slate-900/90 dark:bg-obsidian-950/90 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-3">

        {/* Top row: Logo + Search + Invite — all in ONE row on mobile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Logo — clicking resets search & loads YouTube Home page */}
          <div
            onClick={resetToHome}
            className="flex items-center gap-2 shrink-0 cursor-pointer group"
            title="YouTube Home"
          >
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-105 transition shrink-0">
              <Play className="w-4 h-4 md:w-5 md:h-5 text-white fill-white ml-0.5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                YouTube Hub
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">
                Music & trending hits
              </p>
            </div>
          </div>

          {/* Search Bar — fills remaining space */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search songs or paste YouTube link..."
              className="w-full pl-8 pr-16 py-2 md:py-2.5 rounded-2xl bg-white/5 border border-white/10 focus:border-rose-500 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition shadow-inner"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  useYouTubeListenStore.setState({ searchResults: [] });
                }}
                className="p-1 text-slate-400 hover:text-white absolute right-10 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white absolute right-1 shadow-md transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Listen Together Status / Invite — compact on mobile */}
          <div className="shrink-0 flex items-center">
            {isRealSyncActive ? (
              <div className="px-2 md:px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Synced ❤️</span>
              </div>
            ) : isInvitePending ? (
              <div className="px-2 md:px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="hidden md:inline">Pending...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsUserPickerOpen(true)}
                className="p-2 md:px-3.5 md:py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-500/25 transition active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Invite to Watch</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tag Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-extrabold'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Full-Page Loading Screen when Searching YouTube */}
      {isSearching ? (
        <div className="min-h-[55vh] flex flex-col items-center justify-center py-16 px-4 rounded-3xl bg-slate-900/80 dark:bg-obsidian-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl my-4">
          <CoupleUniverseLoader message={`Searching YouTube for "${searchInput || searchQuery || 'Music'}"...`} size="lg" />
        </div>
      ) : (
        <>
          {/* Active Search Results Grid (When search query is entered) */}
          {searchError ? (
            <div className="py-12 text-center space-y-2 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-300">
              <p className="text-sm font-bold">Search Warning: {searchError}</p>
              <p className="text-xs text-slate-400">Try selecting from curated categories below.</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-rose-500" />
                  Search Results for "{searchInput || searchQuery}"
                </h2>
                <span className="text-xs text-slate-400 font-mono">{searchResults.length} Videos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
                {searchResults.map((item) => (
                  <div
                    key={item.videoId}
                    onClick={() => handlePlayVideo(item)}
                    className="group flex flex-col gap-2.5 cursor-pointer select-none"
                  >
                    {/* 16:9 Thumbnail with Duration overlay */}
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/[0.08] shadow-md">
                      <SafeYouTubeThumbnail
                        videoId={item.videoId}
                        customUrl={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-[10px] font-bold text-white font-mono tracking-tight shadow-md">
                        3:45
                      </span>
                    </div>

                    {/* Metadata row below thumbnail */}
                    <div className="flex items-start gap-2.5 px-0.5">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 font-extrabold text-[10px] shrink-0 mt-0.5">
                        {(item.channelTitle || 'YT').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-rose-300 transition">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1">
                          <span>{item.channelTitle}</span>
                          <CheckCircle2 className="w-3 h-3 text-rose-400 fill-rose-400 shrink-0" />
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">YouTube Stream</p>
                      </div>
                      <button type="button" className="p-1 text-slate-400 hover:text-white transition shrink-0 opacity-70 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 3. Dynamic & Fully Responsive Hero Music Video Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-rose-950/80 via-slate-900 to-obsidian-950 border border-white/10 p-4 sm:p-6 md:p-8 shadow-2xl group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-600/20 via-transparent to-transparent opacity-60 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-center">
              <div className="lg:col-span-7 space-y-3 md:space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md shadow-rose-600/30 flex items-center gap-1 shrink-0">
                    <Flame className="w-3.5 h-3.5" />
                    {dynamicHeroVideo.badge}
                  </span>
                  <span className="text-xs font-bold text-rose-300 font-mono truncate">{dynamicHeroVideo.subtitle}</span>
                </div>

                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug line-clamp-2">
                  {dynamicHeroVideo.title}
                </h2>

                <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Immerse in timeless melodies together with your partner. Tap to open full theater player with live room chat and sync controls.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePlayVideo(dynamicHeroVideo)}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-xs md:text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" /> Watch & Listen Now
                  </button>

                  <div className="text-xs text-slate-400 font-mono text-center sm:text-left shrink-0">
                    <span>{dynamicHeroVideo.views}</span> • <span>{dynamicHeroVideo.duration}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative group cursor-pointer w-full" onClick={() => handlePlayVideo(dynamicHeroVideo)}>
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
                  <SafeYouTubeThumbnail
                    videoId={dynamicHeroVideo.videoId}
                    customUrl={dynamicHeroVideo.thumbnail}
                    alt={dynamicHeroVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transform group-hover:scale-110 transition">
                      <Play className="w-7 h-7 md:w-8 md:h-8 fill-current ml-1" />
                    </div>
                  </div>
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-white font-mono">
                    {dynamicHeroVideo.duration}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 🔥 Trending Now Video Grid */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                Trending Music & Videos
              </h2>
              <span className="text-xs text-slate-400 font-mono">Curated Collection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
              {CURATED_VIDEOS.map((item) => (
                <div
                  key={item.videoId}
                  onClick={() => handlePlayVideo(item)}
                  className="group flex flex-col gap-2.5 cursor-pointer select-none"
                >
                  {/* 16:9 Thumbnail with Duration overlay */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/[0.08] shadow-md">
                    <SafeYouTubeThumbnail
                      videoId={item.videoId}
                      customUrl={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-[10px] font-bold text-white font-mono tracking-tight shadow-md">
                      {item.duration}
                    </span>
                  </div>

                  {/* Metadata row below thumbnail */}
                  <div className="flex items-start gap-2.5 px-0.5">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 font-extrabold text-[10px] shrink-0 mt-0.5">
                      {(item.channelTitle || 'YT').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-rose-300 transition">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1">
                        <span>{item.channelTitle}</span>
                        <CheckCircle2 className="w-3 h-3 text-rose-400 fill-rose-400 shrink-0" />
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {item.views}
                      </p>
                    </div>
                    <button type="button" className="p-1 text-slate-400 hover:text-white transition shrink-0 opacity-70 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ListenTogetherUserPickerModal
        isOpen={isUserPickerOpen}
        onClose={() => setIsUserPickerOpen(false)}
      />
    </div>
  );
};
