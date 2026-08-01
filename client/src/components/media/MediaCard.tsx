import { motion } from 'framer-motion';
import { Eye, Heart, Play, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { MediaItem } from '../../types/index.js';

interface MediaCardProps {
  media: MediaItem;
}

export const MediaCard: React.FC<MediaCardProps> = ({ media }) => {
  const { openViewer } = useMediaStore();
  const { addToast } = useUIStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFav, setIsFav] = useState(media.isFavorite);

  const isVideo = media.mimeType?.startsWith('video');
  const uploaderName = media.createdBy?.name || (media.owner as any)?.name || 'Afzal / Amrin';
  const uploaderAvatar = media.createdBy?.avatar || (media.owner as any)?.avatar;

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axiosClient.patch(`/media/${media._id}/favorite`);
      setIsFav(!isFav);
      addToast('Favorite Updated', `Media favorite set to ${!isFav}`, 'info');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update favorite status', 'error');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="group relative aspect-square w-full rounded-2xl overflow-hidden glass-card border border-white/10 bg-obsidian-950/90 cursor-pointer shadow-lg select-none flex items-center justify-center p-1.5"
      onClick={() => openViewer(media)}
    >
      {/* Placeholder Glow Skeleton before image load */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-obsidian-900 animate-pulse flex items-center justify-center text-slate-700 rounded-xl">
          <Sparkles className="w-6 h-6" />
        </div>
      )}

      {/* Google Photos Uncropped Image inside Fixed Square */}
      <img
        src={media.optimizedUrl || media.thumbnailUrl || media.secureUrl}
        alt={media.title}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.04] ${
          isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'
        }`}
        loading="lazy"
      />

      {/* Video Overlay Badge */}
      {isVideo && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Top Media Type Badge */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <span className="px-2 py-0.5 rounded-full glass-card text-[9px] font-mono font-bold text-slate-200 uppercase border border-white/10">
          {media.mimeType?.split('/')[1] || 'media'}
        </span>
      </div>

      {/* Favorite Heart Button */}
      <button
        onClick={handleFavoriteToggle}
        className={`absolute top-2.5 right-2.5 p-2 rounded-full glass-card transition-all border border-white/10 z-10 ${
          isFav ? 'text-heart fill-heart opacity-100 bg-heart/20' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-heart'
        }`}
        aria-label="Toggle Favorite"
      >
        <Heart className={`w-4 h-4 ${isFav ? 'fill-heart text-heart' : ''}`} />
      </button>

      {/* Uploader Avatar & Name Badge Overlay (Bottom Left) */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-md">
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-afzal to-amrin overflow-hidden flex items-center justify-center text-[9px] font-bold text-white shrink-0">
          {uploaderAvatar ? (
            <img src={uploaderAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            uploaderName[0]
          )}
        </div>
        <span className="text-[10px] font-semibold text-slate-200 truncate max-w-[80px]">
          {uploaderName.split(' ')[0]}
        </span>
      </div>

      {/* Bottom Overlay Info (Hover) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/70 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between z-10">
        <div className="overflow-hidden pr-2">
          <h4 className="text-xs font-semibold text-white truncate">{media.title}</h4>
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(media.memoryDate || media.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="p-1.5 rounded-lg glass-card text-white shrink-0">
          <Eye className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
};
