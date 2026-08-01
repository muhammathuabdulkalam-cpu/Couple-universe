import { useMutation, useQuery } from '@tanstack/react-query';
import { Camera, Image, Upload, Volume2, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { ApiResponse, MediaItem } from '../../types/index.js';

interface Props {
  onSelectMedia: (media: MediaItem) => void;
  onClose?: () => void;
  allowedTypes?: 'IMAGE' | 'VIDEO' | 'ALL';
  title?: string;
}

export const MediaPicker: React.FC<Props> = ({
  onSelectMedia,
  onClose,
  allowedTypes = 'ALL',
  title = 'Select or Upload Media',
}) => {
  const [tab, setTab] = useState<'DEVICE' | 'VAULT' | 'CAMERA'>('DEVICE');
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Vault media query
  const { data: vaultMedia = [], isLoading: vaultLoading } = useQuery<MediaItem[]>({
    queryKey: ['mediaVaultForPicker'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<MediaItem[]>>('/media?limit=40');
      return res.data.data ?? [];
    },
    enabled: tab === 'VAULT',
  });

  // Direct upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      if (caption) formData.append('caption', caption);
      formData.append('visibility', 'COUPLE');

      const res = await axiosClient.post<ApiResponse<MediaItem>>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data!;
    },
    onSuccess: (newMedia) => {
      onSelectMedia(newMedia);
      stopCamera();
      if (onClose) onClose();
    },
  });

  const handleFileChange = (file: File) => {
    if (!file) return;
    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          handleFileChange(file);
          stopCamera();
          setTab('DEVICE');
        }
      }, 'image/jpeg');
    }
  };

  const filteredVault = vaultMedia.filter((m) => {
    if (allowedTypes === 'IMAGE') return m.mimeType.startsWith('image');
    if (allowedTypes === 'VIDEO') return m.mimeType.startsWith('video');
    return true;
  });

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 border border-white/10 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-base font-bold text-white">{title}</h3>
          {onClose && (
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 p-1 glass-panel rounded-2xl">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setTab('DEVICE');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === 'DEVICE' ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Device</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setTab('VAULT');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === 'VAULT' ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Media Vault</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('CAMERA');
              startCamera();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === 'CAMERA' ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </button>
        </div>

        {/* Tab 1: Device Upload */}
        {tab === 'DEVICE' && (
          <div className="space-y-4 flex-1 overflow-y-auto">
            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
                  {previewFile?.type.startsWith('video') ? (
                    <video src={previewUrl} className="w-full h-full object-contain" controls />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full bg-obsidian-900/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                />

                <button
                  type="button"
                  disabled={uploadMutation.isPending}
                  onClick={() => previewFile && uploadMutation.mutate(previewFile)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-afzal to-amrin text-white text-xs font-semibold disabled:opacity-50 hover:brightness-110 shadow-lg"
                >
                  {uploadMutation.isPending ? 'Uploading & Processing...' : 'Confirm Upload & Select'}
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  dragActive ? 'border-afzal bg-afzal/10' : 'border-white/10 glass-panel hover:border-white/30'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-afzal/20 border border-afzal/30 flex items-center justify-center text-afzal">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Drag and drop photo or video here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse from device</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={allowedTypes === 'IMAGE' ? 'image/*' : allowedTypes === 'VIDEO' ? 'video/*' : 'image/*,video/*'}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Vault Selection */}
        {tab === 'VAULT' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            {vaultLoading ? (
              <p className="text-center text-xs text-slate-500 py-8">Loading vault items...</p>
            ) : filteredVault.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">No matching items in Media Vault.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filteredVault.map((m) => (
                  <div
                    key={m._id}
                    onClick={() => {
                      onSelectMedia(m);
                      if (onClose) onClose();
                    }}
                    className="aspect-square rounded-2xl overflow-hidden glass-card border border-white/10 cursor-pointer hover:border-afzal hover:scale-105 transition-all relative group"
                  >
                    <img src={m.thumbnailUrl || m.secureUrl} alt="" className="w-full h-full object-cover" />
                    {m.mimeType.startsWith('video') && (
                      <div className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white">
                        <Volume2 className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Camera Capture */}
        {tab === 'CAMERA' && (
          <div className="space-y-4 flex-1 overflow-y-auto flex flex-col items-center justify-center">
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative border border-white/10">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={captureCamera}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-afzal to-amrin text-white font-semibold text-xs shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Snapshot</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
