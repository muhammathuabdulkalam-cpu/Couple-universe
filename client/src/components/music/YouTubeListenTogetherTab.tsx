import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  Heart,
  MessageSquare,
  Music,
  Play,
  Radio,
  RotateCcw,
  Search,
  Send,
  Share2,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useYouTubeListenStore } from '../../store/youtubeListenStore';
import { YouTubePlayer } from './YouTubePlayer';

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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const {
    roomState,
    isJoined,
    controlMode,
    isHost,
    syncStatus,
    searchResults,
    isSearching,
    chatMessages,
    changeVideo,
    sendChatMessage,
    joinRoom,
    leaveRoom,
    requestSync,
    searchYouTube,
  } = useYouTubeListenStore();

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  // Auto load popular suggestions on mount if empty
  React.useEffect(() => {
    if (searchResults.length === 0) {
      searchYouTube('Despacito');
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const extractedId = extractYouTubeVideoId(searchInput.trim());
      if (extractedId) {
        changeVideo(extractedId, `YouTube Video (${extractedId})`, `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`, 'YouTube Stream');
        useUIStore.getState().addToast('Loaded YouTube Link 🎬', `Playing video ID: ${extractedId}`, 'success');
      } else {
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

  // Allow control when: not in a room (solo session) OR host OR collaborative mode
  const canControl = !isJoined || controlMode === 'COLLABORATIVE' || isHost;
  const participants = roomState?.participants || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 select-none">
      {/* 1. Header Bar: Room Info & YouTube Search Bar (Mobile & Desktop Responsive) */}
      <div className="p-4 md:p-5 rounded-3xl bg-slate-900/90 dark:bg-obsidian-950/90 backdrop-blur-2xl border border-slate-200/20 dark:border-white/10 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 md:gap-4">
          {/* Top Row on Mobile / Left Section on Desktop */}
          <div className="flex items-center justify-between lg:justify-start gap-3 w-full lg:w-auto shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
                <Radio className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-sm md:text-lg font-black tracking-tight text-white flex items-center gap-1">
                    YouTube Listen Together
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-ping" />
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                      syncStatus === 'CONNECTED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {syncStatus}
                  </span>
                </div>
                <p className="text-[11px] md:text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span>Room: <strong className="text-rose-400 font-mono">{roomState?.roomId || 'default'}</strong></span>
                  <span>•</span>
                  <span>{participants.length} Synced</span>
                </p>
              </div>
            </div>

            {/* Mobile Actions: Disconnect / Join + Share */}
            <div className="flex lg:hidden items-center gap-1.5">
              {isJoined ? (
                <button
                  type="button"
                  onClick={leaveRoom}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-[10px] flex items-center gap-1 transition active:scale-95 cursor-pointer"
                >
                  <X className="w-3 h-3 text-rose-400" />
                  <span>Leave</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => joinRoom('default')}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center gap-1 transition active:scale-95 cursor-pointer"
                >
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Join</span>
                </button>
              )}
            </div>
          </div>

          {/* YouTube Search Bar (Full Width on Mobile, Flexible on Desktop) */}
          <form onSubmit={handleSearchSubmit} className="w-full lg:flex-1 lg:max-w-xl relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search Tamil, Hindi, English songs..."
              className="w-full pl-9 pr-11 py-2 md:py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-rose-500 text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="p-1 text-slate-400 hover:text-white absolute right-9 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="p-2 md:p-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs absolute right-1 shadow-md transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={requestSync}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition active:scale-95 cursor-pointer"
              title="Resync Player"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
            </button>

            {isJoined ? (
              <button
                type="button"
                onClick={leaveRoom}
                className="px-3.5 py-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
                title="Disconnect from Room Session"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => joinRoom('default')}
                className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
                title="Join Session"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Join Session</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/25 transition active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied' : 'Share Room'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main YouTube Watch Page Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Left Column: YouTube Video Theater & Chat */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Video Theater Container */}
          <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 group">
            <YouTubePlayer />
          </div>

          {/* YouTube Video Details & Channel Info Box */}
          <div className="p-4 md:p-5 rounded-3xl bg-slate-900/90 dark:bg-obsidian-950/90 backdrop-blur-xl border border-white/10 text-white space-y-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  YouTube Now Playing
                </span>
              </div>
              <h2 className="text-base md:text-xl font-black text-white tracking-tight leading-snug">
                {roomState?.videoTitle || 'Select a YouTube Video to Start Listening'}
              </h2>
            </div>

            {/* Channel Bar & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 font-extrabold text-xs shrink-0">
                  {(roomState?.channelTitle || 'YT').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-1">
                    {roomState?.channelTitle || 'YouTube Channel'}
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Verified Channel</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
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
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Session-Scoped Private Live Room Chat Container */}
            <div className="p-4 md:p-5 rounded-3xl bg-slate-900/90 dark:bg-obsidian-950/90 backdrop-blur-xl border border-white/10 text-white space-y-3 shadow-xl">
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

        {/* Right Column: YouTube "Up Next" Video Sidebar (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Suggestion Tag Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTag === tag
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 font-extrabold'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Up Next & Search Results Container */}
          <div className="p-4 rounded-3xl bg-slate-900/90 dark:bg-obsidian-950/90 backdrop-blur-xl border border-white/10 text-white space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Music className="w-4 h-4 text-rose-400" />
                Up Next & Search Results
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{searchResults.length} Videos</span>
            </div>

            {/* Video Cards List */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {/* Direct Link Detection Card */}
              {(() => {
                const directId = extractYouTubeVideoId(searchInput);
                if (!directId) return null;
                return (
                  <div
                    key={`direct-${directId}`}
                    className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 group shadow-xl mb-3"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${directId}/hqdefault.jpg`}
                      alt="Direct YouTube Link"
                      className="w-32 aspect-video rounded-xl object-cover shadow-md shrink-0 border border-rose-500/30"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-rose-500 text-white uppercase tracking-wider">
                        Direct Link
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">Video ID: {directId}</h4>
                      <button
                        type="button"
                        disabled={!canControl}
                        onClick={() => changeVideo(directId, `YouTube Video (${directId})`, `https://img.youtube.com/vi/${directId}/hqdefault.jpg`, 'Direct Link')}
                        className="px-3 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <Play className="w-3 h-3 fill-current ml-0.5" /> Play
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Search Results List */}
              {isSearching ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Loading YouTube videos...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Music className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-300">No Videos Found</h4>
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.videoId}
                    className="group p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-start gap-3 cursor-pointer"
                    onClick={() => canControl && changeVideo(item.videoId, item.title, item.thumbnail, item.channelTitle)}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-32 aspect-video rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 bg-slate-900">
                      <img
                        src={item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                        alt={item.title}
                        onError={(e: any) => {
                          const target = e.currentTarget as HTMLImageElement;
                          const id = item.videoId;
                          if (target.src.includes('hqdefault')) {
                            target.src = `https://img.youtube.com/vi/${id}/sddefault.jpg`;
                          } else if (target.src.includes('sddefault')) {
                            target.src = `https://img.youtube.com/vi/${id}/0.jpg`;
                          } else {
                            target.onerror = null; // stop further retries
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-rose-300 transition">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                        {item.channelTitle}
                        <CheckCircle2 className="w-3 h-3 text-rose-400 fill-rose-400" />
                      </p>
                      <button
                        type="button"
                        disabled={!canControl}
                        onClick={(e) => {
                          e.stopPropagation();
                          changeVideo(item.videoId, item.title, item.thumbnail, item.channelTitle);
                        }}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current ml-0.5" /> Play
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
