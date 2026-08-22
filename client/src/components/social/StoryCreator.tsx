import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Image as ImageIcon, Sparkles, Type, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { useUIStore } from '../../store/uiStore.js';
import { MediaPicker } from '../media/MediaPicker.js';

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoryCreator: React.FC<StoryCreatorProps> = ({ isOpen, onClose }) => {
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  const [step, setStep] = useState<'SELECT' | 'PREVIEW'>('SELECT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [showVaultPicker, setShowVaultPicker] = useState(false);

  // Story overlay state
  const [textOverlay, setTextOverlay] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('❤️');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const emojis = ['❤️', '😊', '🔥', '✨', '🎉', '💖', '😍', '🌹', '👑'];

  const resetState = () => {
    setStep('SELECT');
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedMediaId(null);
    setTextOverlay('');
    setSelectedEmoji('❤️');
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedMediaId(null);
    setStep('PREVIEW');
  };

  const createStoryMutation = useMutation({
    mutationFn: async () => {
      let mediaId = selectedMediaId;

      // Upload file to Media Engine if selected from device/camera
      if (selectedFile || (previewUrl && !selectedMediaId)) {
        const formData = new FormData();
        formData.append('file', selectedFile || (await (await fetch(previewUrl!)).blob()), 'story.jpg');
        formData.append('title', textOverlay.slice(0, 30) || 'Story Upload');
        formData.append('caption', `${selectedEmoji} ${textOverlay}`);
        formData.append('visibility', 'COUPLE');
        formData.append('tags', 'story');

        const res = await axiosClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        mediaId = res.data.data._id;
      }

      if (!mediaId) throw new Error('No media available for story');

      const res = await axiosClient.post('/stories', {
        mediaId,
        caption: `${selectedEmoji} ${textOverlay}`.trim(),
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['profileGridContent'] });
      addToast('Story Published!', 'Your story was uploaded and will expire in 24 hours.', 'success');
      resetState();
      onClose();
    },
    onError: (err: any) => {
      addToast('Story Error', err?.response?.data?.message || 'Failed to publish story', 'error');
    },
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 animate-fade-in select-none">
      <div className="w-full max-w-sm glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-obsidian-950/80">
          {step === 'PREVIEW' ? (
            <button onClick={() => setStep('SELECT')} className="text-xs text-amrin-glow font-semibold hover:underline">
              Back
            </button>
          ) : (
            <span className="w-8" />
          )}

          <h3 className="text-sm font-bold text-white">Create Story</h3>

          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: SELECTION */}
        {step === 'SELECT' && (
          <div className="p-6 space-y-4 text-center">
            <p className="text-xs text-slate-400">Share a 24-hour memory story with your partner</p>

            <div className="grid grid-cols-1 gap-3">
              {/* Option A: Device File Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-4 glass-panel rounded-2xl border border-white/10 hover:border-amrin/40 transition-all flex items-center gap-3 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-amrin/20 text-amrin-glow flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Upload from Device</h4>
                  <p className="text-[10px] text-slate-400">Select photo/video from files or gallery</p>
                </div>
              </button>

              {/* Option B: Camera Capture */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="p-4 glass-panel rounded-2xl border border-white/10 hover:border-afzal/40 transition-all flex items-center gap-3 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-afzal/20 text-afzal-glow flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Take Photo / Video</h4>
                  <p className="text-[10px] text-slate-400">Capture a new memory using camera</p>
                </div>
              </button>

              {/* Option C: Media Vault Picker */}
              <button
                onClick={() => setShowVaultPicker(true)}
                className="p-4 glass-panel rounded-2xl border border-white/10 hover:border-heart/40 transition-all flex items-center gap-3 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-heart/20 text-heart-glow flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Select from Media Vault</h4>
                  <p className="text-[10px] text-slate-400">Choose from uploaded couple photos</p>
                </div>
              </button>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*,video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />
          </div>
        )}

        {/* STEP 2: PREVIEW & CUSTOMIZATION */}
        {step === 'PREVIEW' && previewUrl && (
          <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
            {/* Story Media Preview */}
            <div className="relative aspect-[9/16] max-h-72 w-full rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center shadow-inner">
              <img src={previewUrl} alt="Story preview" className="w-full h-full object-cover" />

              {/* Text & Emoji Overlay Preview */}
              <div className="absolute bottom-4 inset-x-4 text-center pointer-events-none">
                <span className="inline-block text-xs font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 drop-shadow-md">
                  {selectedEmoji} {textOverlay}
                </span>
              </div>
            </div>

            {/* Text Overlay Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Type className="w-3 h-3 text-amrin-glow" /> Story Caption
              </label>
              <input
                type="text"
                maxLength={80}
                placeholder="Write a sweet caption..."
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amrin/50"
              />
            </div>

            {/* Emoji Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-afzal-glow" /> React Emoji
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-transform ${
                      selectedEmoji === emoji ? 'bg-amrin/30 border border-amrin/60 scale-110' : 'hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => createStoryMutation.mutate()}
              disabled={createStoryMutation.isPending}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-afzal via-amrin to-heart text-white text-xs font-bold shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50 mt-auto"
            >
              {createStoryMutation.isPending ? 'Publishing Story...' : 'Publish Story ❤️'}
            </button>
          </div>
        )}
      </div>

      {/* Media Vault Selector Modal */}
      {showVaultPicker && (
        <MediaPicker
          onClose={() => setShowVaultPicker(false)}
          onSelectMedia={(media: any) => {
            setSelectedMediaId(media._id);
            setPreviewUrl(media.secureUrl || media.optimizedUrl);
            setShowVaultPicker(false);
            setStep('PREVIEW');
          }}
        />
      )}
    </div>,
    document.body
  );
};
