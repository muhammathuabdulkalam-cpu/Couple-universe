import React, { useEffect, useState } from 'react';
import { FileText, Music, Sparkles, X } from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';

export const LyricsModal: React.FC = () => {
  const { currentTrack, isLyricsModalOpen, toggleLyricsModal } = useMusicPlayerStore();
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLyricsModalOpen && currentTrack) {
      setIsLoading(true);
      setLyrics(null);
      setMessage(null);

      musicApi
        .getLyrics(currentTrack.artist, currentTrack.title)
        .then((res) => {
          setLyrics(res.lyrics);
          setMessage(res.message || 'Lyrics are currently unavailable.');
        })
        .catch(() => {
          setMessage('Lyrics are currently unavailable.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isLyricsModalOpen, currentTrack]);

  if (!isLyricsModalOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-slate-900/95 border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-2xl text-white shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Song Lyrics</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs md:max-w-md">
                {currentTrack.title} • {currentTrack.artist}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleLyricsModal(false)}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Lyrics Content Container */}
        <div className="my-6 flex-1 overflow-y-auto pr-2 z-10 font-sans leading-relaxed text-center md:text-left space-y-4">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-rose-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-400">Fetching lyrics from catalog...</p>
            </div>
          ) : lyrics ? (
            <div className="whitespace-pre-line text-slate-200 text-base md:text-lg font-medium space-y-2">
              {lyrics}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 bg-white/5 rounded-2xl border border-white/5 p-6">
              <Music className="w-12 h-12 text-slate-500 mx-auto" />
              <h4 className="font-bold text-white text-base">{message || 'Lyrics are currently unavailable.'}</h4>
              <p className="text-xs text-slate-400">
                Official synced lyrics could not be found for this preview track.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 z-10">
          <span>Lyrics powered by Lyrics.ovh Proxy</span>
          <span>Deezer HQ Audio</span>
        </div>
      </div>
    </div>
  );
};
