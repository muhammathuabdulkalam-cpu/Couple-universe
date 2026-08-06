import React, { useEffect, useState } from 'react';
import {
  HeartHandshake,
  MessageCircle,
  Pause,
  Play,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
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

  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusicPlayerStore();

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-900/60 via-pink-900/40 to-slate-900/80 border border-rose-500/20 rounded-2xl p-6 text-white backdrop-blur-xl shadow-xl">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Romantic Shared Music Feed
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">Song Dedications</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Express your love, feelings, and memories by dedicating songs directly to each other.
            </p>
          </div>
        </div>
      </div>

      {/* Dedications Feed / Empty state */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : dedications.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-white/5 text-slate-400">
          <HeartHandshake className="w-12 h-12 text-rose-500/50 mx-auto mb-3" />
          <h3 className="font-semibold text-lg text-white">No song dedications yet.</h3>
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
                className="bg-slate-900/70 hover:bg-slate-900 border border-white/10 hover:border-rose-500/30 rounded-2xl p-5 text-white transition-all shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Sender & Recipient Metadata */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={song.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                      alt={song.title}
                      className="w-16 h-16 rounded-xl object-cover shadow-lg border border-white/10"
                    />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-sm shadow-md">
                      {item.reaction || '❤️'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-rose-300 font-semibold mb-1">
                      <span>{item.sender?.name || 'Afzal'}</span>
                      <span>dedicated to</span>
                      <span>{item.recipient?.name || 'Amrin'}</span>
                    </div>

                    <h4 className="font-bold text-white text-base truncate">{song.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{song.artist}</p>

                    {item.message && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-rose-200 italic flex items-start gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                        <span>"{item.message}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => (isCurrent ? togglePlay() : playTrack(song))}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-semibold text-xs flex items-center gap-2 border border-rose-500/30 transition shrink-0"
                >
                  {isSongPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Play Preview
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
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-rose-400" />
                <span>Dedicate Song</span>
              </h3>
              <button
                onClick={() => {
                  setSelectedSong(null);
                  if (onCloseDedicateModal) onCloseDedicateModal();
                }}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendDedication} className="space-y-4 my-4">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                <img
                  src={selectedSong.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                  alt={selectedSong.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{selectedSong.title}</p>
                  <p className="text-xs text-slate-400 truncate">{selectedSong.artist}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Reaction Emoji</label>
                <div className="flex items-center gap-2">
                  {REACTION_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setReaction(e)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition ${
                        reaction === e
                          ? 'bg-rose-500/30 border-2 border-rose-500 scale-110'
                          : 'bg-white/5 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Dedication Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write something special..."
                  rows={3}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSong(null);
                    if (onCloseDedicateModal) onCloseDedicateModal();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm shadow-lg shadow-rose-500/30 flex items-center gap-1.5"
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
