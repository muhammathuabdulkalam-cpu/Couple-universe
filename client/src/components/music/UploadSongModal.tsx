import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Music,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Loader2,
  Play,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
// @ts-ignore
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
import { musicApi } from '../../api/musicApi';
import { useUIStore } from '../../store/uiStore';
import { useMusicPlayerStore } from '../../store/musicPlayerStore';
import { NormalizedSong } from '../../types/music.types';

export const cleanMetadataString = (input: any): string => {
  if (!input) return '';
  const str = typeof input === 'string' ? input : typeof input === 'object' && input.data ? String(input.data) : String(input);
  if (!str || str === '[object Object]') return '';
  return str
    .replace(/(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.(com|dev|in|co|net|org|info|mobi|vip|site|cc|cz|fm|is|ws)/gi, '')
    .replace(/(MassTamilan|Starmusiq|PagalWorld|Sensongs|Isaimini|TamilMp3|Mp3Paw|Pendujatt|DjPunjab|NaaSongs|SongsLover|Kuttyweb|5starmusiq|VipTamilan)/gi, '')
    .replace(/\[\s*\d+\s*kbps\s*\]|\(\s*\d+\s*kbps\s*\)|\b\d+\s*kbps\b/gi, '')
    .replace(/\[\s*320\s*\]|\(\s*320\s*\)|\[\s*128\s*\]|\(\s*128\s*\)/gi, '')
    .replace(/\[\s*\]|\(\s*\)/g, '')
    .replace(/_/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-._]+|[\s\-._]+$/g, '')
    .trim();
};

interface UploadSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: (song: NormalizedSong) => void;
}

export const UploadSongModal: React.FC<UploadSongModalProps> = React.memo(({
  isOpen,
  onClose,
  onUploaded,
}) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  const playTrack = useMusicPlayerStore((s) => s.playTrack);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Progressive Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasExtractedTags, setHasExtractedTags] = useState(false);

  // Success Popup State
  const [uploadedSong, setUploadedSong] = useState<NormalizedSong | null>(null);

  if (!isOpen) return null;

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setErrorMsg('');
      setIsExtracting(true);
      setHasExtractedTags(false);

      // Default fallback filename parsing
      const rawFilename = file.name.replace(/\.[^/.]+$/, '');
      const cleanedFilename = cleanMetadataString(rawFilename);
      let fallbackArtist = '';
      let fallbackTitle = cleanedFilename;

      const hyphenParts = cleanedFilename.split(' - ');
      if (hyphenParts.length > 1) {
        fallbackArtist = hyphenParts[0].trim();
        fallbackTitle = hyphenParts.slice(1).join(' - ').trim();
      }

      jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          setIsExtracting(false);
          const tags = tag.tags;

          const extractedTitle = cleanMetadataString(tags.title || '');
          const extractedArtist = cleanMetadataString(tags.artist || tags.albumartist || '');
          const extractedAlbum = cleanMetadataString(tags.album || '');

          const finalTitle = extractedTitle || fallbackTitle;
          const finalArtist = extractedArtist || fallbackArtist;
          const finalAlbum = extractedAlbum;

          setTitle(finalTitle);
          setArtist(finalArtist);
          setAlbum(finalAlbum);

          // Extract embedded artwork if present
          if (tags.picture) {
            try {
              const { data, format } = tags.picture;
              const byteArray = new Uint8Array(data);
              let binary = '';
              const len = byteArray.byteLength;
              for (let i = 0; i < len; i += 1024) {
                binary += String.fromCharCode.apply(
                  null,
                  Array.from(byteArray.subarray(i, Math.min(i + 1024, len)))
                );
              }
              const mime = format || 'image/jpeg';
              const base64Url = `data:${mime};base64,${window.btoa(binary)}`;
              setCoverPreviewUrl(base64Url);

              fetch(base64Url)
                .then((res) => res.blob())
                .then((blob) => {
                  const coverFileFromId3 = new File([blob], 'embedded_cover.jpg', { type: mime });
                  setCoverFile(coverFileFromId3);
                })
                .catch((err) => console.warn('Blob conversion error:', err));
            } catch (picErr) {
              console.warn('Embedded artwork processing error:', picErr);
            }
          }

          setHasExtractedTags(true);
        },
        onError: (err: any) => {
          setIsExtracting(false);
          console.warn('ID3 metadata extraction warning:', err);
          setTitle(fallbackTitle);
          setArtist(fallbackArtist);
        },
      });
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleResetModal = () => {
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreviewUrl('');
    setTitle('');
    setArtist('');
    setAlbum('');
    setHasExtractedTags(false);
    setErrorMsg('');
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStage('idle');
    setUploadedSong(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setErrorMsg('Please select an audio file (MP3, M4A, AAC, WAV, FLAC)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStage('uploading');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (coverFile) {
        formData.append('cover', coverFile);
      }
      formData.append('title', title.trim());
      formData.append('artist', artist.trim());
      formData.append('album', album.trim());

      const song = await musicApi.uploadSong(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Scale upload phase to 85% to reserve last 15% for cloud stream processing
          const scaledPercent = Math.min(85, Math.max(5, Math.round(percent * 0.85)));
          setUploadProgress(scaledPercent);

          if (percent >= 100) {
            setUploadStage('processing');
            setUploadProgress(92);
          }
        }
      });

      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: ['uploadedSongs'] });
      addToast('Song Uploaded Successfully! 🎵', `"${song.title}" is ready in your library`, 'success');

      if (onUploaded) onUploaded(song);

      // Trigger Successfully Uploaded Popup state
      setUploadedSong(song);
    } catch (err: any) {
      console.error('Song upload error:', err);
      const message = err?.response?.data?.message || err?.message || 'Failed to upload song file. Please check connection.';
      setErrorMsg(message);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      {/* SUCCESS POPUP MODAL */}
      {uploadedSong ? (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-8 w-full max-w-[92vw] sm:max-w-md text-white shadow-2xl space-y-4 sm:space-y-6 text-center animate-scaleUp my-auto relative overflow-hidden">
          {/* Top-Right Dismiss Button */}
          <button
            onClick={() => {
              onClose();
              handleResetModal();
            }}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Success Animated Badge */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-950/50 transform rotate-3">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upload Successful</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Song Added to Library!
            </h3>
            <p className="text-xs text-slate-400">
              Your personal song file is transcoded & ready for instant playback.
            </p>
          </div>

          {/* Uploaded Song Card */}
          <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left shadow-inner">
            <img
              src={uploadedSong.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
              alt={uploadedSong.title}
              className="w-16 h-16 rounded-xl object-cover border border-white/15 shadow-md shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-base text-white truncate">
                {uploadedSong.title}
              </h4>
              <p className="text-xs text-rose-300 font-medium truncate mt-0.5">
                {uploadedSong.artist}
              </p>
              {uploadedSong.album && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {uploadedSong.album}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => playTrack(uploadedSong)}
              className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transform active:scale-95 transition min-w-0"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
              <span className="truncate min-w-0 max-w-full">
                Play "{uploadedSong.title}" Now
              </span>
            </button>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
              <button
                onClick={handleResetModal}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">Upload Another</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  handleResetModal();
                }}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-white/10 text-white font-bold text-xs flex items-center justify-center transition"
              >
                <span className="truncate">Done / View Library</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* UPLOAD FORM MODAL */
        <div className="bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md sm:max-w-lg text-white shadow-2xl space-y-3 sm:space-y-5 max-h-[92vh] overflow-y-auto no-scrollbar my-auto relative">
          {/* Modal Title Bar */}
          <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-white/10">
            <h3 className="font-bold text-base sm:text-xl flex items-center gap-2">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
              <span>Upload Personal Song</span>
            </h3>
            <button
              disabled={isUploading}
              onClick={() => {
                onClose();
                handleResetModal();
              }}
              className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Auto Metadata Extraction Banner */}
          {hasExtractedTags ? (
            <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0 animate-pulse" />
              <span>Successfully extracted ID3 metadata & artwork!</span>
            </div>
          ) : (
            <div className="p-2 sm:p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
              <span className="hidden sm:inline">Song title, artist, album & cover artwork are automatically extracted from your audio file!</span>
              <span className="sm:hidden">Metadata & cover artwork are auto-extracted from your file!</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Audio File Selection */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">
                Audio File * (MP3, M4A, AAC, WAV, FLAC)
              </label>
              <div className="relative border-2 border-dashed border-white/15 hover:border-rose-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center cursor-pointer transition bg-white/5">
                <input
                  type="file"
                  disabled={isUploading}
                  accept="audio/*,.mp3,.m4a,.aac,.wav,.flac"
                  onChange={handleAudioChange}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400 mx-auto mb-1 sm:mb-2" />
                {isExtracting ? (
                  <div className="text-[11px] sm:text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 animate-spin" />
                    <span>Extracting Metadata...</span>
                  </div>
                ) : audioFile ? (
                  <div className="text-[11px] sm:text-xs font-bold text-rose-300 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    <span className="truncate max-w-xs">{audioFile.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Click or drag audio file here to upload
                  </p>
                )}
              </div>
            </div>

            {/* Cover Art Dropzone / Preview */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">
                Cover Artwork (Optional)
              </label>

              {coverPreviewUrl ? (
                <div className="flex items-center gap-2.5 sm:gap-3.5 p-2 sm:p-2.5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl">
                  <img
                    src={coverPreviewUrl}
                    alt="Cover Preview"
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-cover border border-white/15 shadow-md shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-200 truncate">
                      {coverFile?.name || 'Embedded ID3 Artwork'}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3" />
                      <span>Artwork ready</span>
                    </p>
                  </div>
                  <label className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 text-[11px] sm:text-xs text-white font-semibold cursor-pointer shrink-0 transition">
                    Change
                    <input
                      type="file"
                      disabled={isUploading}
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="relative border border-white/10 hover:border-rose-500/40 rounded-xl p-2.5 text-center cursor-pointer transition bg-white/5 flex items-center gap-2.5">
                  <input
                    type="file"
                    disabled={isUploading}
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-[11px] sm:text-xs text-slate-400 truncate">
                    Select custom cover image
                  </span>
                </div>
              )}
            </div>

            {/* Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-400 mb-0.5 sm:mb-1">Song Title</label>
                <input
                  type="text"
                  disabled={isUploading}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Auto-extracted from file"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl px-3 py-1.5 sm:py-2 text-white placeholder-slate-500 text-[11px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-400 mb-0.5 sm:mb-1">Artist Name</label>
                <input
                  type="text"
                  disabled={isUploading}
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Auto-extracted from file"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl px-3 py-1.5 sm:py-2 text-white placeholder-slate-500 text-[11px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-400 mb-0.5 sm:mb-1">Album Name</label>
              <input
                type="text"
                disabled={isUploading}
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="e.g. Podhuvaga Emmanasu Thangam"
                className="w-full bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl px-3 py-1.5 sm:py-2 text-white placeholder-slate-500 text-[11px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
              />
            </div>

            {/* PROGRESSIVE LOADER BAR */}
            {isUploading && (
              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-rose-500/30 space-y-2.5 animate-fadeIn shadow-lg">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
                    <span>
                      {uploadStage === 'processing'
                        ? 'Finalizing cloud stream & database record...'
                        : `Uploading song file...`}
                    </span>
                  </span>
                  <span className="font-mono text-rose-400 text-sm font-black">
                    {uploadProgress}%
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 rounded-full transition-all duration-300 ease-out shadow-lg shadow-rose-500/50"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <p className="text-[10px] text-slate-400 text-center font-medium">
                  {uploadStage === 'processing'
                    ? 'Transcoding audio to universal format...'
                    : 'Please stay on this screen while your song uploads.'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 sm:gap-3 pt-2.5 sm:pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  onClose();
                  handleResetModal();
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold disabled:opacity-30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || isExtracting || !audioFile}
                className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg shadow-rose-950/40 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 transition transform active:scale-95"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span>Uploading ({uploadProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Upload Full Song</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
});
