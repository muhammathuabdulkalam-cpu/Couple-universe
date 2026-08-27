import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  ChevronUp,
  MessageSquare,
  Music,
  Play,
  RotateCcw,
  Search,
  Send,
  Share2,
  ThumbsUp,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useYouTubeListenStore } from '../../store/youtubeListenStore';
import { useListenTogetherStore } from '../../store/listenTogetherStore';
import { YouTubePlayer } from './YouTubePlayer';
import { YouTubeHomeUI } from './YouTubeHomeUI';
import { ListenTogetherUserPickerModal } from './ListenTogetherUserPickerModal';
import { CoupleUniverseLoader } from './CoupleUniverseLoader';

const QUICK_TAGS = [
  'All',
  'Tamil Songs',
  'Hindi Hits',
  'Despacito',
  'Counting Stars',
  'Shape of You',
  'Romantic Melodies',
  'Acoustic Pop',
  'Relaxing Piano',
];

export const YouTubeListenTogetherTab: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTag, setActiveTag] = useState('All');
  const [isLiked, setIsLiked] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const mobileChatBottomRef = useRef<HTMLDivElement>(null);
  const relatedSearchDoneRef = useRef<string | null>(null);

  // --- Store hooks (must be before any useEffect that uses them) ---
  const {
    viewMode,
    setViewMode,
    roomState,
    isJoined,
    controlMode,
    isHost,
    searchResults,
    isSearching,
    chatMessages,
    changeVideo,
    sendChatMessage,
    joinRoom,
    requestSync,
    searchYouTube,
  } = useYouTubeListenStore();

  const {
    isSessionActive,
    activeSession,
  } = useListenTogetherStore();

  const isRealSyncActive = isSessionActive && activeSession?.status === 'ACTIVE';
  const isInvitePending = activeSession?.status === 'INVITED';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
      main.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Force scroll to top whenever view mode or playing video changes
  useEffect(() => {
    scrollToTop();
  }, [viewMode, roomState?.videoId]);

  // Auto-fetch related videos whenever the playing video changes (for sidebar "Up Next")
  useEffect(() => {
    const currentVideoId = roomState?.videoId;
    const videoTitle = roomState?.videoTitle;
    if (currentVideoId && videoTitle && relatedSearchDoneRef.current !== currentVideoId) {
      relatedSearchDoneRef.current = currentVideoId;
      const query = videoTitle.replace(/[|\[\](){}]/g, ' ').trim().split(' ').slice(0, 5).join(' ');
      searchYouTube(query);
    }
  }, [roomState?.videoId, roomState?.videoTitle, searchYouTube]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    mobileChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isMobileChatOpen]);

  const extractYouTubeVideoId = (input: string): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
    return null;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const extractedId = extractYouTubeVideoId(searchInput.trim());
      if (extractedId) {
        // Direct YouTube link → load it immediately and switch to watch
        changeVideo(extractedId, `YouTube Video (${extractedId})`, `https://img.youtube.com/vi/${extractedId}/sddefault.jpg`, 'YouTube Stream');
        scrollToTop();
        useUIStore.getState().addToast('Loaded YouTube Link 🎬', `Playing video ID: ${extractedId}`, 'success');
      } else {
        // Text search → go back to home view and search there
        setViewMode('home');
        searchYouTube(searchInput.trim());
      }
    }
  };

  const handleQuickTagClick = (tag: string) => {
    setActiveTag(tag);
    if (tag === 'All') {
      searchYouTube('Despacito');
    } else {
      setSearchInput(tag);
      searchYouTube(tag);
    }
  };

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      useUIStore.getState().addToast('Room Link Copied 📋', 'Share with your partner to listen together!', 'success');
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const handleLogoClick = () => {
    setViewMode('home');
    useYouTubeListenStore.setState({ searchResults: [], searchQuery: '', isSearching: false, searchError: null });
    scrollToTop();
  };

  // Allow control when: not in a room (solo session) OR host OR collaborative mode
  const canControl = !isJoined || controlMode === 'COLLABORATIVE' || isHost;
  const participants = roomState?.participants || [];

  // If user is on home view mode, render YouTube Home UI
  if (viewMode === 'home') {
    return <YouTubeHomeUI />;
  }

  return (
    <div className="w-full pb-24 select-none">
      {/* ── YouTube-style Top Navigation Bar ── */}
      <div className="sticky top-0 z-40 px-0 py-0">
        <div className="flex items-center gap-2 px-3 md:px-5 py-2.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">

          {/* Left: YouTube Logo — clicking goes Home */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer group shrink-0"
              title="YouTube Hub Home"
            >
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-105 transition shrink-0">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <span className="hidden md:flex flex-col leading-none">
                <span className="text-sm font-black text-white tracking-tight">YouTube Hub</span>
                <span className="text-[9px] font-bold text-rose-400 tracking-wider uppercase">Now Watching</span>
              </span>
            </button>
          </div>

          {/* Center: Search — takes all remaining space */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 flex items-center gap-1 min-w-0"
          >
            <div className="flex-1 flex items-center bg-white/5 border border-white/10 focus-within:border-rose-500/60 focus-within:ring-1 focus-within:ring-rose-500/20 rounded-2xl overflow-hidden transition min-w-0">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search songs..."
                className="flex-1 pl-3 md:pl-4 pr-2 py-2 md:py-2.5 bg-transparent text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none min-w-0"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="w-9 h-9 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-lg shadow-rose-500/25"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right: Actions — icon-only on mobile */}
          <div className="flex items-center gap-1 shrink-0">
            {isRealSyncActive ? (
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center" title="Synced with partner">
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
            ) : isInvitePending ? (
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsUserPickerOpen(true)}
                className="flex items-center gap-1.5 h-9 px-2.5 md:px-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Invite</span>
              </button>
            )}

            <button
              type="button"
              onClick={requestSync}
              className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Resync Player"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Share"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content — padded inner container */}
      <div className="px-3 md:px-6 pt-4 space-y-4 md:space-y-6">
      {/* YouTube Watch Page Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left Column: YouTube Video Theater & Chat */}
        <div className="lg:col-span-7 space-y-3">
          {/* Main Video Theater Container */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
            <YouTubePlayer />
          </div>

          {/* YouTube Video Title & Channel Info */}
          <div className="px-1 space-y-3 text-white">
            {/* Title */}
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Now Playing
              </span>
              <h2 className="text-sm md:text-xl font-black text-white tracking-tight leading-snug mt-1">
                {roomState?.videoTitle || 'Select a YouTube Video to Start Listening'}
              </h2>
            </div>

            {/* Channel + Action Buttons row */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 font-extrabold text-xs shrink-0">
                  {(roomState?.channelTitle || 'YT').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">
                    {roomState?.channelTitle || 'YouTube Channel'}
                    <CheckCircle2 className="w-3 h-3 text-rose-400 fill-rose-400" />
                  </h3>
                  <span className="text-[10px] text-slate-400">Verified Channel</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                    isLiked
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* ── YouTube-style CHAT BAR (replaces comment section on mobile) ── */}
            {/* Visible on mobile only; tapping opens slide-up chat */}
            <div
              onClick={() => setIsMobileChatOpen(true)}
              className="lg:hidden rounded-2xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer active:bg-white/10 transition"
            >
              {/* Bar header — like YouTube Comments "X comments" row */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-black text-white">Chat</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {chatMessages.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <span>{isJoined ? 'Open chat' : 'Tap to connect'}</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Preview of last message — like YouTube shows 1 comment preview */}
              <div className="px-4 py-2.5">
                {chatMessages.length > 0 ? (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 font-bold text-[10px] shrink-0 mt-0.5">
                      {chatMessages[chatMessages.length - 1].userName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-300">
                        {chatMessages[chatMessages.length - 1].userName}
                      </span>
                      <p className="text-xs text-slate-400 truncate">
                        {chatMessages[chatMessages.length - 1].text}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {isJoined ? 'No messages yet — say hi to your partner! 👋' : 'Join a session to chat while watching together'}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Inline Live Room Chat Container (hidden on mobile, visible on lg) */}
            <div className="hidden lg:block p-4 md:p-5 rounded-3xl bg-slate-900/90 dark:bg-obsidian-950/90 backdrop-blur-xl border border-white/10 text-white space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
                    {isJoined ? 'Private Session Chat' : 'Live Room Chat'}
                  </h3>
                </div>
                {isJoined ? (
                  <span className="text-[10px] text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    Session Active ({participants.length} connected)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => joinRoom('default')}
                    className="text-[10px] text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold transition cursor-pointer"
                  >
                    Tap to Join Room Session
                  </button>
                )}
              </div>

              {/* Chat Messages Stream */}
              <div className="h-48 md:h-56 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin scrollbar-thumb-rose-500/20">
                {!isJoined ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2 py-8 text-center px-4">
                    <MessageSquare className="w-8 h-8 text-rose-500/50" />
                    <p className="font-bold text-slate-300">Disconnected from Room Session</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Join a Listen Together session to chat in real-time with your partner while watching.
                    </p>
                    <button
                      type="button"
                      onClick={() => joinRoom('default')}
                      className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                    >
                      Connect & Chat
                    </button>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-1 py-8">
                    <MessageSquare className="w-6 h-6 text-slate-600" />
                    <span>No session messages yet. Say hi to your partner!</span>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 px-1">
                        <span className="text-[10px] font-bold text-slate-400">{msg.userName}</span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed ${
                          msg.isMe
                            ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-tr-none shadow-md shadow-rose-500/20'
                            : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/10'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInputText.trim() && isJoined) {
                    sendChatMessage(chatInputText);
                    setChatInputText('');
                  }
                }}
                className="flex items-center gap-2 pt-2 border-t border-white/10"
              >
                <input
                  type="text"
                  disabled={!isJoined}
                  placeholder={isJoined ? "Type a message to chat with your partner..." : "Join session to send messages"}
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!chatInputText.trim() || !isJoined}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/25 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: YouTube "Up Next" (5 Cols on desktop, full width on mobile) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter tag chips — scrollable horizontally */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                  activeTag === tag
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                    : 'bg-white/8 hover:bg-white/12 border border-white/10 text-slate-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Up Next Header — YouTube style */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Up Next</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{searchResults.length} videos</span>
          </div>

          {/* Video Cards List — YouTube style */}
          <div className="space-y-1">
            {/* Direct Link Card */}
            {(() => {
              const directId = extractYouTubeVideoId(searchInput);
              if (!directId) return null;
              return (
                <div
                  key={`direct-${directId}`}
                  onClick={() => {
                    if (canControl) {
                      changeVideo(directId, `YouTube Video (${directId})`, `https://img.youtube.com/vi/${directId}/sddefault.jpg`, 'Direct Link');
                      scrollToTop();
                    }
                  }}
                  className="group flex gap-3 p-2 rounded-xl hover:bg-white/5 transition cursor-pointer active:bg-white/10"
                >
                  <div className="relative w-40 aspect-video rounded-xl overflow-hidden shrink-0 bg-slate-900">
                    <img
                      src={`https://img.youtube.com/vi/${directId}/sddefault.jpg`}
                      alt="Direct Link"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-[9px] font-bold text-white">LINK</div>
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-xs font-bold text-white line-clamp-2 leading-snug">Video ID: {directId}</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      Direct YouTube Link
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Search Results */}
            {isSearching ? (
              <div className="py-6 text-center">
                <CoupleUniverseLoader message="Loading videos..." size="sm" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Music className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-xs font-bold text-slate-500">No videos found</p>
              </div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.videoId}
                  onClick={() => {
                    if (canControl) {
                      changeVideo(item.videoId, item.title, item.thumbnail, item.channelTitle);
                      scrollToTop();
                    }
                  }}
                  className="group flex gap-3 p-2 rounded-xl hover:bg-white/5 transition cursor-pointer active:bg-white/10"
                >
                  {/* Thumbnail — 16:9 like YouTube */}
                  <div className="relative w-40 aspect-video rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/[0.06]">
                    <img
                      src={item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/sddefault.jpg`}
                      alt={item.title}
                      onError={(e: any) => {
                        const target = e.currentTarget as HTMLImageElement;
                        const id = item.videoId;
                        if (target.src.includes('maxresdefault') || target.src.includes('sddefault')) {
                          target.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                        } else if (target.src.includes('hqdefault')) {
                          target.src = `https://img.youtube.com/vi/${id}/0.jpg`;
                        } else {
                          target.onerror = null;
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <div className="w-9 h-9 rounded-full bg-rose-500/90 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Metadata — title + channel, like YouTube */}
                  <div className="flex-1 min-w-0 py-0.5 space-y-0.5">
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-rose-300 transition">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <span className="truncate">{item.channelTitle}</span>
                      <CheckCircle2 className="w-3 h-3 text-rose-400 fill-rose-400 shrink-0" />
                    </p>
                    <p className="text-[10px] text-slate-500">YouTube Music</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>{/* end padded content */}

      {/* Floating Slide-Up Mobile Live Chat Sheet Modal */}
      <AnimatePresence>
        {isMobileChatOpen && (
          <div
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm lg:hidden flex flex-col justify-end"
            onClick={() => setIsMobileChatOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[82vh] bg-slate-950/95 border-t border-white/15 rounded-t-3xl p-4 shadow-2xl flex flex-col space-y-3"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto shrink-0 mb-0.5" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {isJoined ? 'Private Session Chat' : 'Live Room Chat'}
                  </h3>
                  {isJoined && (
                    <span className="text-[9px] text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 font-bold">
                      {participants.length} connected
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsMobileChatOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[200px] max-h-[48vh]">
                {!isJoined ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2 py-8 text-center px-4">
                    <MessageSquare className="w-8 h-8 text-rose-500/50" />
                    <p className="font-bold text-slate-300">Disconnected from Room Session</p>
                    <button
                      type="button"
                      onClick={() => {
                        joinRoom('default');
                      }}
                      className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs shadow-md"
                    >
                      Connect & Chat
                    </button>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-1 py-8">
                    <MessageSquare className="w-6 h-6 text-slate-600" />
                    <span>No session messages yet. Say hi to your partner!</span>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 px-1">
                        <span className="text-[10px] font-bold text-slate-400">{msg.userName}</span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs font-medium leading-relaxed ${
                          msg.isMe
                            ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-tr-none'
                            : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/10'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={mobileChatBottomRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatInputText.trim() && isJoined) {
                    sendChatMessage(chatInputText);
                    setChatInputText('');
                  }
                }}
                className="flex items-center gap-2 pt-2 border-t border-white/10 shrink-0"
              >
                <input
                  type="text"
                  disabled={!isJoined}
                  placeholder={isJoined ? 'Type a message...' : 'Join session to chat'}
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInputText.trim() || !isJoined}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-lg shadow-rose-500/25 active:scale-95 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ListenTogetherUserPickerModal
        isOpen={isUserPickerOpen}
        onClose={() => setIsUserPickerOpen(false)}
      />
    </div>
  );
};
