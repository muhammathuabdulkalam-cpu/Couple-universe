import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Music, X, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useUIStore } from '../../store/uiStore';
import { NormalizedSong } from '../../types/music.types';

interface UploadSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: (song: NormalizedSong) => void;
}

export const UploadSongModal: React.FC<UploadSongModalProps> = ({
  isOpen,
  onClose,
  onUploaded,
}) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setErrorMsg('');

      // Auto-extract title from filename
      if (!title) {
        const rawName = file.name.replace(/\.[^/.]+$/, '');
        const parts = rawName.split('-');
        if (parts.length > 1) {
          setArtist(parts[0].trim());
          setTitle(parts.slice(1).join('-').trim());
        } else {
          setTitle(rawName.trim());
        }
      }
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setErrorMsg('Please select an audio file (MP3, M4A, AAC, WAV, FLAC)');
      return;
    }
    if (!title.trim() || !artist.trim()) {
      setErrorMsg('Song title and artist name are required');
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
      setAudioFile(null);
      setCoverFile(null);
      setTitle('');
      setArtist('');
      setAlbum('');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to upload song file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg text-white shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <Upload className="w-5 h-5 text-rose-400" />
            <span>Upload Personal Song</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Audio Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              Audio File * (MP3, M4A, AAC, WAV, FLAC)
            </label>
            <div className="relative border-2 border-dashed border-white/15 hover:border-rose-500/50 rounded-2xl p-4 text-center cursor-pointer transition bg-white/5">
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.aac,.wav,.flac"
                onChange={handleAudioChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Music className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              {audioFile ? (
                <div className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="truncate max-w-xs">{audioFile.name}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Click or drag audio file here to upload
                </p>
              )}
            </div>
          </div>

          {/* Cover Art Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              Cover Artwork (Optional)
            </label>
            <div className="relative border border-white/10 hover:border-rose-500/40 rounded-xl p-3 text-center cursor-pointer transition bg-white/5 flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <ImageIcon className="w-5 h-5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 truncate">
                {coverFile ? coverFile.name : 'Select custom album cover image'}
              </span>
            </div>
          </div>

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Song Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Perfect"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Artist Name *</label>
              <input
                type="text"
                required
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Ed Sheeran"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Album (Optional)</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="e.g. Divide"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg shadow-rose-950/40 flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading to Cloud...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Full Song</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
