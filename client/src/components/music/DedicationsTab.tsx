import React, { useEffect, useState } from 'react';
import {
  HeartHandshake,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { useUIStore } from '../../store/uiStore.js';
import { NormalizedSong, SongDedication } from '../../types/music.types';

const REACTION_EMOJIS = ['❤️', '💖', '💕', '✨', '🎵', '💍', '🔥', '👑'];

interface DedicationsTabProps {
  initialDedicatedSong?: NormalizedSong | null;
  onCloseDedicateModal?: () => void;
}

export const DedicationsTab: React.FC<DedicationsTabProps> = ({
  initialDedicatedSong,
  onCloseDedicateModal,
}) => {
  const [dedications, setDedications] = useState<SongDedication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<NormalizedSong | null>(initialDedicatedSong || null);
  const [message, setMessage] = useState('');
  const [reaction, setReaction] = useState('❤️');

  const currentTrack = useMusicPlayerStore((s) => s.currentTrack);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const isAudioLoading = useMusicPlayerStore((s) => s.isLoading);
  const playTrack = useMusicPlayerStore((s) => s.playTrack);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);

  useEffect(() => {
    if (initialDedicatedSong) {
      setSelectedSong(initialDedicatedSong);
    }
  }, [initialDedicatedSong]);

  const fetchDedications = async () => {
    setIsLoading(true);
    try {
      const data = await musicApi.getDedications();
      setDedications(data || []);
    } catch (_err) {
      setDedications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDedications();
  }, []);

  const handleSendDedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSong) return;

    try {
      const created = await musicApi.createDedication({
        songData: selectedSong,
        message: message.trim(),
        reaction,
      });

      setDedications((prev) => [created, ...prev]);
      setSelectedSong(null);
      setMessage('');
      if (onCloseDedicateModal) onCloseDedicateModal();
    } catch (_err) {
      // Handle gracefully
    }
  };

  const theme = useUIStore((s) => s.theme);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`relative overflow-hidden border rounded-2xl p-6 backdrop-blur-xl shadow-xl ${
        theme === 'light'
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-slate-800'
          : 'bg-gradient-to-r from-rose-900/60 via-pink-900/40 to-slate-900/80 border border-rose-500/20 text-white'
      }`}>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              theme === 'light' ? 'text-blue-600' : 'text-rose-400'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-400" /> Romantic Shared Music Feed
            </span>
            <h2 className={`text-2xl md:text-3xl font-extrabold mt-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Song Dedications</h2>
            <p className={`text-sm mt-1 max-w-xl ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              Express your love, feelings, and memories by dedicating songs directly to each other.
            </p>
          </div>
        </div>
      </div>

      {/* Dedications Feed / Empty state */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`border rounded-2xl p-5 animate-pulse h-32 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border border-white/5'
            }`} />
          ))}
        </div>
      ) : dedications.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${
          theme === 'light'
            ? 'bg-slate-50 border-slate-200 text-slate-500'
            : 'bg-slate-900/40 border border-white/5 text-slate-400'
        }`}>
          <HeartHandshake className={`w-12 h-12 mx-auto mb-3 ${theme === 'light' ? 'text-blue-500/50' : 'text-rose-500/50'}`} />
          <h3 className={`font-semibold text-lg ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>No song dedications yet.</h3>
          <p className="text-sm text-slate-500 mt-1">
            Search for a track in the Search tab and click "Dedicate" to send your first song!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dedications.map((item) => {
            const song = item.songId;
            if (!song) return null;

            const isCurrent = currentTrack?.providerSongId === song.providerSongId;
            const isSongPlaying = isCurrent && isPlaying;

            return (
              <div
                key={item._id}
                className={`border rounded-2xl p-5 transition-all shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  theme === 'light'
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-blue-500/30 text-slate-800'
                    : 'bg-slate-900/70 hover:bg-slate-900 border border-white/10 hover:border-rose-500/30 text-white'
                }`}
              >
                {/* Sender & Recipient Metadata */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={song.coverUrl || ''}
                      alt={song.title}
                      className={`w-16 h-16 rounded-xl object-cover shadow-lg border ${
                        theme === 'light' ? 'border-slate-200' : 'border-white/10'
                      }`}
                    />
                    <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-md ${
                      theme === 'light' ? 'bg-blue-600 text-white' : 'bg-rose-500'
                    }`}>
                      {item.reaction || '❤️'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`flex items-center gap-2 text-xs font-semibold mb-1 ${
                      theme === 'light' ? 'text-blue-600' : 'text-rose-300'
                    }`}>
                      <span>{item.sender?.name || 'Afzal'}</span>
                      <span className={theme === 'light' ? 'text-slate-500 font-medium' : ''}>dedicated to</span>
                      <span>{item.recipient?.name || 'Amrin'}</span>
                    </div>

                    <h4 className={`font-bold text-base truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{song.title}</h4>
                    <p className={`text-xs truncate ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{song.artist}</p>

                    {item.message && (
                      <div className={`mt-2.5 p-2.5 rounded-xl border text-xs italic flex items-start gap-2 ${
                        theme === 'light'
                          ? 'bg-blue-50/50 border-blue-100 text-blue-800'
                          : 'bg-white/5 border-white/5 text-rose-200'
                      }`}>
                        <MessageCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${theme === 'light' ? 'text-blue-500' : 'text-rose-400'}`} />
                        <span>"{item.message}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => (isCurrent ? togglePlay() : playTrack(song))}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 border transition shrink-0 ${
                    theme === 'light'
                      ? 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border-blue-200'
                      : 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border-rose-500/30'
                  }`}
                >
                  {isCurrent && isAudioLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-current" /> Loading
                    </>
                  ) : isSongPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Play
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dedicate Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className={`border rounded-2xl p-6 w-full max-w-md shadow-2xl ${
            theme === 'light'
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-slate-900 border border-white/10 text-white'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${
              theme === 'light' ? 'border-slate-250' : 'border-white/10'
            }`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <HeartHandshake className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-rose-400'}`} />
                <span>Dedicate Song</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedSong(null);
                  if (onCloseDedicateModal) onCloseDedicateModal();
                }}
                className={`p-1 rounded-full transition ${
                  theme === 'light' ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendDedication} className="space-y-4 my-4">
              <div className={`flex items-center gap-3 rounded-xl p-3 border ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
              }`}>
                <img
                  src={selectedSong.coverUrl || ''}
                  alt={selectedSong.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className={`font-bold text-sm truncate ${theme === 'light' ? 'text-slate-900' : ''}`}>{selectedSong.title}</p>
                  <p className={`text-xs truncate ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{selectedSong.artist}</p>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Reaction Emoji</label>
                <div className="flex items-center gap-2">
                  {REACTION_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setReaction(e)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition ${
                        reaction === e
                          ? theme === 'light'
                            ? 'bg-blue-105 border-2 border-blue-500 scale-110'
                            : 'bg-rose-500/30 border-2 border-rose-500 scale-110'
                          : theme === 'light'
                            ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                            : 'bg-white/5 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Dedication Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write something special..."
                  rows={3}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition ${
                    theme === 'light'
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-slate-800 border border-white/10 text-white placeholder-slate-550 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSong(null);
                    if (onCloseDedicateModal) onCloseDedicateModal();
                  }}
                  className={`px-4 py-2 rounded-xl text-sm transition ${
                    theme === 'light' ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-semibold text-sm shadow-lg flex items-center gap-1.5 transition ${
                    theme === 'light'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                      : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/30'
                  }`}
                >
                  <Send className="w-4 h-4" /> Dedicate Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
