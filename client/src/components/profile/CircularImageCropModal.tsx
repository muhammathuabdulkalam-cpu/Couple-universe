import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface CircularImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob, croppedDataUrl: string) => void;
  isUploading?: boolean;
}

export const CircularImageCropModal: React.FC<CircularImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isUploading = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const CROP_SIZE = 280; // Diameter of circular crop frame in px

  // Reset controls when a new image is loaded
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageSize({ width: naturalWidth, height: naturalHeight });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse / Touch Dragging Logic
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

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(Math.max(1, prev + zoomDelta), 3.5));
  };

  // Perform Exact Circular Crop on HTML5 Canvas
  const handleCrop = () => {
    if (!imageRef.current || !imageSize.width || !imageSize.height) return;

    const img = imageRef.current;
    const OUTPUT_SIZE = 600; // Output high-resolution square canvas
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Create circular clip path
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Calculate scaling ratio from UI container to natural image dimensions
    const scaleRatio = CROP_SIZE / Math.min(imageSize.width, imageSize.height);
    const displayedWidth = imageSize.width * scaleRatio * zoom;
    const displayedHeight = imageSize.height * scaleRatio * zoom;

    // Scale to output canvas
    const canvasScale = OUTPUT_SIZE / CROP_SIZE;

    const drawX = (OUTPUT_SIZE - displayedWidth * canvasScale) / 2 + pan.x * canvasScale;
    const drawY = (OUTPUT_SIZE - displayedHeight * canvasScale) / 2 + pan.y * canvasScale;

    ctx.drawImage(img, drawX, drawY, displayedWidth * canvasScale, displayedHeight * canvasScale);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob, croppedDataUrl);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-obsidian-950/90 backdrop-blur-2xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">Adjust Profile Picture</h3>
                <p className="text-[11px] text-slate-400">Position photo within Instagram circular frame</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Crop Viewport with Circular Mask & Ring */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="relative w-[280px] h-[280px] rounded-full overflow-hidden cursor-grab active:cursor-grabbing border-4 border-slate-950 shadow-2xl bg-black shrink-0"
            style={{ touchAction: 'none' }}
          >
            {/* Draggable & Scalable Image */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoad}
                className="max-w-none max-h-none min-w-full min-h-full object-cover"
                draggable={false}
              />
            </div>

            {/* Instagram Style Gradient Ring Overlay */}
            <div className="absolute inset-0 rounded-full border-2 border-gradient-to-tr border-rose-500/80 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]" />

            {/* Drag Hint Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 pointer-events-none shadow-md border border-white/10">
              <Move className="w-3 h-3 text-rose-400" />
              <span>Drag to Align</span>
            </div>
          </div>

          {/* Zoom Slider Controls */}
          <div className="w-full space-y-2 px-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <ZoomOut className="w-3.5 h-3.5 text-slate-400" /> Zoom Out
              </span>
              <span className="text-white font-mono font-bold text-[11px]">{Math.round(zoom * 100)}%</span>
              <span className="flex items-center gap-1">
                Zoom In <ZoomIn className="w-3.5 h-3.5 text-rose-400" />
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-rose-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition shrink-0"
                title="Reset Position"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="rose"
              size="sm"
              onClick={handleCrop}
              isLoading={isUploading}
              leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
            >
              {isUploading ? 'Uploading...' : 'Crop & Set Profile Picture'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
