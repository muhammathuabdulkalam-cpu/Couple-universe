import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Crop,
  Grid,
  Image as ImageIcon,
  MapPin,
  Move,
  RotateCw,
  Tag,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useUIStore } from '../../store/uiStore.js';
import { MediaPicker } from '../media/MediaPicker.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'SELECT' | 'CROP' | 'DETAILS';
type AspectRatio = '1:1' | '4:5' | '16:9' | 'ORIGINAL';

export const CreatePostModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  const [step, setStep] = useState<Step>('SELECT');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

  // Create mode state: POST or STORY
  const [createType, setCreateType] = useState<'POST' | 'STORY'>('POST');

  // Crop & Transform state
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Cropped result state
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState<boolean>(false);

  // Post details state
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<'COUPLE' | 'PUBLIC' | 'FRIENDS'>('COUPLE');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const resetState = () => {
    setStep('SELECT');
    setCreateType('POST');
    setSelectedFile(null);
    setPreviewUrl(null);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
    setSelectedMediaId(null);
    setAspectRatio('1:1');
    setRotation(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCaption('');
    setLocation('');
    setTags('');
    setVisibility('COUPLE');
  };

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
  }, [previewUrl, aspectRatio]);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
    setSelectedMediaId(null);
    setStep('CROP');
  };

  const handleImageLoad = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((prev) => Math.min(Math.max(0.5, prev + zoomDelta), 3.5));
  };

  // Canvas Crop Export Helper (Executes while CROP viewport is active)
  const generateCroppedImage = (): Promise<{ blob: Blob; url: string }> => {
    return new Promise((resolve, reject) => {
      if (!previewUrl) return reject('No preview image');

      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = previewUrl;

      image.onload = () => {
        const naturalW = image.naturalWidth;
        const naturalH = image.naturalHeight;

        let targetW = 1080;
        let targetH = 1080;

        if (aspectRatio === '1:1') {
          targetW = 1080;
          targetH = 1080;
        } else if (aspectRatio === '4:5') {
          targetW = 1080;
          targetH = 1350;
        } else if (aspectRatio === '16:9') {
          targetW = 1920;
          targetH = 1080;
        } else {
          targetW = naturalW;
          targetH = naturalH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context missing');

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetW, targetH);

        // Base dimension of rendered image in viewport (bounded box max 340px)
        const baseScale = Math.min(340 / naturalW, 340 / naturalH);
        const baseW = naturalW * baseScale;
        const baseH = naturalH * baseScale;

        const frameW = cropContainerRef.current?.clientWidth || (aspectRatio === '4:5' ? 280 : aspectRatio === '16:9' ? 400 : 320);

        const scale = targetW / frameW;

        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        ctx.translate(pan.x * scale, pan.y * scale);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const drawW = baseW * scale;
        const drawH = baseH * scale;

        ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ blob, url: dataUrl });
            else reject('Blob generation failed');
          },
          'image/jpeg',
          0.95
        );
      };

      image.onerror = (err) => reject(err);
    });
  };

  const handleNextFromCrop = async () => {
    setIsApplyingCrop(true);
    try {
      const res = await generateCroppedImage();
      setCroppedBlob(res.blob);
      setCroppedPreviewUrl(res.url);
      setStep('DETAILS');
    } catch (_err) {
      addToast('Crop Warning', 'Using default framing', 'warning');
      setStep('DETAILS');
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      let finalMediaId = selectedMediaId;
      let finalImageUrl = croppedPreviewUrl || previewUrl;

      // Upload file if new image or cropped blob exists
      if (croppedBlob || selectedFile || (previewUrl && !selectedMediaId)) {
        const uploadBlob = croppedBlob || selectedFile!;
        const formData = new FormData();
        formData.append('file', uploadBlob, createType === 'STORY' ? 'story_media.jpg' : 'instagram_post.jpg');
        formData.append('title', caption.slice(0, 40) || (createType === 'STORY' ? '24h Story' : 'Instagram Post'));
        formData.append('caption', caption);
        formData.append('visibility', visibility);
        formData.append('targetFolder', createType === 'STORY' ? 'afrin-universe/stories' : 'afrin-universe/posts');
        if (tags) formData.append('tags', tags);

        const mediaRes = await axiosClient.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const mediaData = mediaRes.data.data;
        finalMediaId = mediaData._id;
        finalImageUrl = mediaData.secureUrl || mediaData.optimizedUrl;
      }

      if (!finalImageUrl) throw new Error('No media selected');

      // 2. Publish as 24h Story or Feed Post
      if (createType === 'STORY') {
        const res = await axiosClient.post('/stories', {
          mediaId: finalMediaId,
          caption: caption.trim() || undefined,
          visibility: visibility === 'COUPLE' ? 'PARTNER' : visibility,
        });
        return res.data;
      } else {
        const res = await axiosClient.post('/feed', {
          type: 'MEMORY_CREATED',
          referenceId: finalMediaId || undefined,
          refModel: 'Media',
          title: caption.trim() || 'Shared a post ❤️',
          description: location ? `📍 ${location}` : undefined,
          imageUrl: finalImageUrl,
          aspectRatio: aspectRatio,
        });
        return res.data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['profileGridContent'] });
      qc.invalidateQueries({ queryKey: ['media'] });
      addToast(
        createType === 'STORY' ? 'Story Shared! ❤️' : 'Post Shared! 📸',
        createType === 'STORY' ? 'Your 24h story has been published.' : 'Your post has been published to the feed.',
        'success'
      );
      resetState();
      onClose();
    },
    onError: (err: any) => {
      addToast('Post Failed', err?.response?.data?.message || 'Failed to share post', 'error');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-obsidian-950/80">
          {step !== 'SELECT' ? (
            <button
              onClick={() => setStep(step === 'DETAILS' ? 'CROP' : 'SELECT')}
              className="text-xs font-semibold text-amrin-glow hover:underline"
            >
              Back
            </button>
          ) : (
            <span className="w-8" />
          )}

          <h3 className="text-sm font-bold text-white tracking-tight">
            {step === 'SELECT' ? 'Create New Post' : step === 'CROP' ? 'Crop & Edit' : 'New Post Details'}
          </h3>

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

        {/* STEP 1: MEDIA SELECTION */}
        {step === 'SELECT' && (
          <div className="p-6 sm:p-8 space-y-5 text-center flex-1 flex flex-col items-center justify-center">
            {/* Mode Switcher: Post vs Story */}
            <div className="flex items-center justify-center p-1 rounded-2xl bg-white/5 border border-white/10 w-full max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setCreateType('POST')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  createType === 'POST'
                    ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Post
              </button>
              <button
                type="button"
                onClick={() => setCreateType('STORY')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  createType === 'STORY'
                    ? 'bg-gradient-to-r from-afzal via-amrin to-heart text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> 24h Story
              </button>
            </div>

            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-[2px] shadow-2xl">
              <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center text-amrin-glow">
                <ImageIcon className="w-9 h-9" />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">
                {createType === 'STORY' ? 'Create a 24h Story' : 'Create a New Post'}
              </h4>
              <p className="text-xs text-slate-400">
                {createType === 'STORY'
                  ? 'Share an instant moment that expires in 24 hours'
                  : 'Share your favorite photos and videos with partner and family'}
              </p>
            </div>

            <div className="w-full max-w-xs space-y-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-afzal to-amrin text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Select From Device
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-2xl glass-panel border border-white/10 text-white font-semibold text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-amrin" /> Take Photo with Camera
              </button>

              <button
                type="button"
                onClick={() => setShowMediaPicker(true)}
                className="w-full py-2.5 px-4 rounded-2xl glass-panel border border-white/10 text-slate-300 font-semibold text-xs hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <Grid className="w-4 h-4 text-afzal" /> Choose From Media Vault
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />
          </div>
        )}

        {/* STEP 2: CROP EDITOR */}
        {step === 'CROP' && previewUrl && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
            {/* Interactive Viewport with Aspect Ratio Overlay Frame */}
            <div
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="w-full flex items-center justify-center flex-1 bg-obsidian-950 p-2 rounded-2xl border border-white/10 h-[380px] relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: 'none' }}
            >
              {/* Full Image Layer (Visible underneath overlay mask) */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Crop preview"
                  onLoad={handleImageLoad}
                  className="max-h-[340px] max-w-[340px] w-auto h-auto object-contain select-none pointer-events-none"
                  draggable={false}
                />
              </div>

              {/* Aspect Ratio Layout Overlay Box Frame (Masks surrounding area & displays crop boundary) */}
              <div
                ref={cropContainerRef}
                className={`pointer-events-none border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] rounded-xl relative transition-all duration-300 flex items-center justify-center ${
                  aspectRatio === '1:1'
                    ? 'w-[320px] h-[320px]'
                    : aspectRatio === '4:5'
                    ? 'w-[280px] h-[350px]'
                    : aspectRatio === '16:9'
                    ? 'w-[400px] h-[225px]'
                    : 'w-[320px] h-[320px]'
                }`}
              >
                {/* Instagram 3x3 Rule of Thirds Grid Overlay */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white/40" />
                  <div className="border-r border-b border-white/40" />
                  <div className="border-b border-white/40" />
                  <div className="border-r border-b border-white/40" />
                  <div className="border-r border-b border-white/40" />
                  <div className="border-b border-white/40" />
                  <div className="border-r border-white/40" />
                  <div className="border-r border-white/40" />
                  <div className="" />
                </div>

                {/* Drag Hint Badge */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 pointer-events-none shadow-md border border-white/10 shrink-0">
                  <Move className="w-3 h-3 text-amrin" />
                  <span>Drag & Zoom to Align</span>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="glass-panel p-3 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1">
                  <Crop className="w-3.5 h-3.5 text-amrin" /> Aspect Ratio:
                </span>
                <div className="flex gap-1.5">
                  {(['1:1', '4:5', '16:9', 'ORIGINAL'] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        aspectRatio === ratio
                          ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-md'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/5">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.15))}
                    className="p-1.5 rounded-lg glass-panel text-slate-300 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="3.5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-amrin bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom(Math.min(3.5, zoom + 0.15))}
                    className="p-1.5 rounded-lg glass-panel text-slate-300 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="px-3 py-1.5 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <RotateCw className="w-3.5 h-3.5 text-afzal" /> Rotate ({rotation}°)
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={isApplyingCrop}
                onClick={handleNextFromCrop}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-afzal to-amrin text-white text-xs font-bold shadow-lg hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
              >
                {isApplyingCrop ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Applying Crop...
                  </>
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: POST DETAILS & CAPTION */}
        {step === 'DETAILS' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div
                className={`w-20 rounded-xl bg-black overflow-hidden border border-white/10 shrink-0 flex items-center justify-center shadow-md ${
                  aspectRatio === '1:1'
                    ? 'h-20 aspect-square'
                    : aspectRatio === '4:5'
                    ? 'h-24 aspect-[4/5]'
                    : aspectRatio === '16:9'
                    ? 'w-28 h-16 aspect-[16/9]'
                    : 'h-20'
                }`}
              >
                <img
                  src={croppedPreviewUrl || previewUrl!}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-slate-300">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your post..."
                  rows={3}
                  className="w-full bg-obsidian-900/90 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amrin"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location..."
                  className="w-full bg-obsidian-900/90 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags (comma separated)..."
                  className="w-full bg-obsidian-900/90 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Visibility</label>
              <select
                value={visibility}
                onChange={(e: any) => setVisibility(e.target.value)}
                className="w-full bg-obsidian-900/90 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              >
                <option value="COUPLE">Partner Only ❤️</option>
                <option value="FRIENDS">Friends & Family 👥</option>
                <option value="PUBLIC">Public 🌐</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep('CROP')}
                className="px-4 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={createPostMutation.isPending}
                onClick={() => createPostMutation.mutate()}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-afzal via-amrin to-heart text-white text-xs font-bold disabled:opacity-40 hover:brightness-110 shadow-xl"
              >
                {createPostMutation.isPending ? 'Sharing Post...' : 'Share Post'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Universal Media Vault Picker */}
      {showMediaPicker && (
        <MediaPicker
          title="Select Photo or Video from Vault"
          onSelectMedia={(media) => {
            setSelectedMediaId(media._id);
            setPreviewUrl(media.secureUrl || media.optimizedUrl);
            setShowMediaPicker(false);
            setStep('CROP');
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
};
