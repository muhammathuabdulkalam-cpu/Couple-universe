import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Heart,
  Info,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { Badge } from '../ui/Badge.js';

export const MediaViewerModal: React.FC = () => {
  const { user } = useAuthStore();
  const { selectedMedia, isViewerOpen, closeViewer, nextMedia, prevMedia } = useMediaStore();
  const { addToast } = useUIStore();

  const [showInfo, setShowInfo] = useState(() => window.innerWidth >= 640);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (selectedMedia) {
      setIsFav(selectedMedia.isFavorite);
      setZoomLevel(1);
    }
  }, [selectedMedia]);

  // Keyboard navigation bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isViewerOpen) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowRight') nextMedia();
      if (e.key === 'ArrowLeft') prevMedia();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, closeViewer, nextMedia, prevMedia]);

  if (!isViewerOpen || !selectedMedia) return null;

  const isVideo = selectedMedia.mimeType?.startsWith('video');

  const handleFavoriteToggle = async () => {
    try {
      await axiosClient.patch(`/media/${selectedMedia._id}/favorite`);
      setIsFav(!isFav);
      addToast('Favorite Updated', `Media favorite set to ${!isFav}`, 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update favorite', 'error');
    }
  };

  const handleSoftDelete = async () => {
    try {
      await axiosClient.delete(`/media/${selectedMedia._id}`);
      addToast('Moved to Trash', 'Media moved to Soft Delete trash.', 'info');
      closeViewer();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to delete media', 'error');
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex flex-col sm:flex-row items-center justify-center bg-obsidian-950/95 backdrop-blur-2xl overflow-hidden select-none">
        
        {/* Top Floating Toolbar */}
        <div className="absolute top-0 inset-x-0 h-14 sm:h-16 glass-panel border-b border-white/10 px-3 sm:px-6 flex items-center justify-between z-50 bg-obsidian-950/90">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white max-w-[140px] sm:max-w-xs truncate">{selectedMedia.title}</h3>
            <Badge variant="violet" size="sm" className="hidden sm:inline-flex">{selectedMedia.visibility}</Badge>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {!isVideo && (
              <>
                <button
                  onClick={() => setZoomLevel(Math.min(zoomLevel + 0.25, 3))}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(Math.max(zoomLevel - 0.25, 1))}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={handleFavoriteToggle}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                isFav ? 'text-heart fill-heart bg-heart/20' : 'text-slate-400 hover:text-heart hover:bg-white/10'
              }`}
              title="Favorite"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-heart text-heart' : ''}`} />
            </button>

            <a
              href={selectedMedia.secureUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              title="Download Original"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                showInfo ? 'text-afzal-glow bg-afzal/20' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Information"
            >
              <Info className="w-4 h-4" />
            </button>

            {(user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER') && (
              <button
                onClick={handleSoftDelete}
                className="p-1.5 sm:p-2 rounded-xl text-rose-400 hover:bg-rose-950/40"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={closeViewer}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Previous Button */}
        <button
          onClick={prevMedia}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full glass-card text-white hover:scale-110 transition-transform z-40"
          aria-label="Previous Media"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Next Button */}
        <button
          onClick={nextMedia}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full glass-card text-white hover:scale-110 transition-transform z-40"
          aria-label="Next Media"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Main Display Area (Full screen on mobile) */}
        <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-8 pt-16 pb-16 sm:pb-8 overflow-hidden">
          {isVideo ? (
            <video
              src={selectedMedia.secureUrl}
              controls
              autoPlay
              className="max-h-[80vh] max-w-[95vw] sm:max-w-[80vw] rounded-2xl shadow-2xl border border-white/10 object-contain"
            />
          ) : (
            <motion.img
              key={selectedMedia._id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: zoomLevel, opacity: 1 }}
              transition={{ duration: 0.2 }}
              src={selectedMedia.optimizedUrl || selectedMedia.secureUrl}
              alt={selectedMedia.title}
              className="max-h-[80vh] max-w-[95vw] sm:max-w-[80vw] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          )}
        </div>

        {/* Responsive Metadata Drawer (Bottom sheet on mobile, right panel on desktop) */}
        <AnimatePresence>
          {showInfo && (
            <motion.aside
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 inset-x-0 max-h-[60vh] sm:static sm:w-80 sm:h-full border-t sm:border-t-0 sm:border-l border-white/10 glass-panel p-5 space-y-4 sm:space-y-6 pt-4 sm:pt-20 z-50 overflow-y-auto rounded-t-3xl sm:rounded-none bg-obsidian-950/95"
            >
              <div className="flex items-center justify-between sm:block">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Metadata Details</span>
                <button onClick={() => setShowInfo(false)} className="sm:hidden text-slate-400 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-white">{selectedMedia.title}</h4>
                <p className="text-xs text-slate-400">{selectedMedia.caption || selectedMedia.description || 'No caption provided.'}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Dimensions:</span>
                  <span className="font-mono text-white">{selectedMedia.width} × {selectedMedia.height} ({selectedMedia.orientation})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Aspect Ratio:</span>
                  <span className="font-mono text-afzal-glow">{selectedMedia.aspectRatio}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">File Size:</span>
                  <span className="font-mono text-slate-200">{(selectedMedia.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">MIME Format:</span>
                  <span className="font-mono text-amrin-glow uppercase">{selectedMedia.mimeType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Date Captured:</span>
                  <span className="font-mono text-white">{new Date(selectedMedia.memoryDate || selectedMedia.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMedia.tags.map((tag, i) => (
                      <Badge key={i} variant="cyan" size="sm">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-white/5">
                <a
                  href={selectedMedia.secureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-afzal-glow hover:underline"
                >
                  Open Original Cloudinary Asset <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
