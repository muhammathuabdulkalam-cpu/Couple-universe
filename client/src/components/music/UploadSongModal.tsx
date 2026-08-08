import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Music, X, Image as ImageIcon, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
// @ts-ignore
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
import { musicApi } from '../../api/musicApi';
import { useUIStore } from '../../store/uiStore';
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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasExtractedTags, setHasExtractedTags] = useState(false);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setErrorMsg('Please select an audio file (MP3, M4A, AAC, WAV, FLAC)');
      return;
    }

    setIsUploading(true);
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

      const song = await musicApi.uploadSong(formData);

      queryClient.invalidateQueries({ queryKey: ['uploadedSongs'] });
      addToast('Song Uploaded! 🎵', `"${song.title}" added to your personal library`, 'success');

      if (onUploaded) onUploaded(song);
      onClose();
      handleResetModal();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to upload song file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md sm:max-w-lg text-white shadow-2xl space-y-3 sm:space-y-5 max-h-[92vh] overflow-y-auto no-scrollbar my-auto">
        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-white/10">
          <h3 className="font-bold text-base sm:text-xl flex items-center gap-2">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
            <span>Upload Personal Song</span>
          </h3>
          <button
            onClick={() => {
              onClose();
              handleResetModal();
            }}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
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
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Audio File Selection */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">
              Audio File * (MP3, M4A, AAC, WAV, FLAC)
            </label>
            <div className="relative border-2 border-dashed border-white/15 hover:border-rose-500/50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center cursor-pointer transition bg-white/5">
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.aac,.wav,.flac"
                onChange={handleAudioChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Music className="w-5 h-5 sm:w-8 sm:h-8 text-rose-400 mx-auto mb-1 sm:mb-2" />
              {isExtracting ? (
                <div className="text-[11px] sm:text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 animate-spin" />
                  <span>Extracting Metadata...</span>
                </div>
              ) : audioFile ? (
                <div className="text-[11px] sm:text-xs font-bold text-rose-300 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                  <span className="truncate max-w-xs">{audioFile.name}</span>
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
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto-extracted from file"
                className="w-full bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl px-3 py-1.5 sm:py-2 text-white placeholder-slate-500 text-[11px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-400 mb-0.5 sm:mb-1">Artist Name</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Auto-extracted from file"
                className="w-full bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl px-3 py-1.5 sm:py-2 text-white placeholder-slate-500 text-[11px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-400 mb-0.5 sm:mb-1">Album Name</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="e.g. Podhuvaga Emmanasu Thangam"
              className="w-full bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl px-3 py-1.5 sm:py-2 text-white placeholder-slate-500 text-[11px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 pt-2.5 sm:pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onClose();
                handleResetModal();
              }}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || isExtracting}
              className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg shadow-rose-950/40 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
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
    </div>
  );

});
