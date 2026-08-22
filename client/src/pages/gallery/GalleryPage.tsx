import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  ChevronDown,
  Film,
  Grid,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { MediaCard } from '../../components/media/MediaCard.js';
import { MediaUploadModal } from '../../components/media/MediaUploadModal.js';
import { MediaViewerModal } from '../../components/media/MediaViewerModal.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { MemoryMuseum3D } from '../../components/museum/MemoryMuseum3D.js';
import { useAuthStore } from '../../store/authStore.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { ApiResponse, MediaItem } from '../../types/index.js';

type GallerySectionTab = 'photos' | 'videos';

export const GalleryPage: React.FC = () => {
  const { user } = useAuthStore();
  const isPlatformOwner = user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER';
  const isInvitedUser = !isPlatformOwner;

  const {
    viewMode,
    setViewMode,
    setMediaList,
    setUploadModalOpen,
    searchQuery,
    setSearchQuery,
    filterFavorite,
    setFilterFavorite,
    openViewer,
  } = useMediaStore();

  const [activeTab, setActiveTab] = useState<GallerySectionTab>('photos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Fetch All Shared Couple Media Items (backend filters by owner if INVITED_USER)
  const { data: rawMediaList = [], isLoading: isMediaLoading, refetch: refetchMedia, isRefetching } = useQuery<MediaItem[]>({
    queryKey: ['sharedGalleryMedia', searchQuery, filterFavorite],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (filterFavorite) params.isFavorite = 'true';

      const res = await axiosClient.get<ApiResponse<MediaItem[]>>('/media', { params });
      return res.data.data ?? [];
    },
  });

  useEffect(() => {
    const handleUploaded = () => {
      refetchMedia();
    };
    window.addEventListener('media-uploaded', handleUploaded);
    return () => window.removeEventListener('media-uploaded', handleUploaded);
  }, [refetchMedia]);

  // 2. Fetch Albums
  const { data: albumsList = [] } = useQuery<any[]>({
    queryKey: ['sharedGalleryAlbums'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any[]>>('/albums');
      return res.data.data ?? [];
    },
  });

  // Effective Media List filtered strictly by owner for invited users
  const effectiveMediaList = isInvitedUser && (user?._id || user?.id)
    ? rawMediaList.filter((m) => {
        const uId = (user._id || user.id)?.toString();
        const ownerVal = m.owner as any;
        const createdByVal = m.createdBy as any;
        const ownerId = typeof ownerVal === 'object' ? (ownerVal?._id || ownerVal?.id)?.toString() : ownerVal?.toString();
        const createdById = typeof createdByVal === 'object' ? (createdByVal?._id || createdByVal?.id)?.toString() : createdByVal?.toString();
        return ownerId === uId || createdById === uId;
      })
    : rawMediaList;

  // Section Tabs Definition: Photos & Videos ONLY
  const sectionTabs = [
    {
      id: 'photos',
      label: 'All Photos',
      icon: ImageIcon,
      count: effectiveMediaList.filter(
        (m) =>
          !m.mimeType?.startsWith('video') &&
          (m as any).resourceType !== 'video' &&
          !['mp4', 'mov', 'webm', 'mkv', 'avi'].includes((m as any).format || '') &&
          !m.secureUrl?.match(/\.(mp4|mov|webm|mkv|avi)(\?|$)/i)
      ).length,
    },
    {
      id: 'videos',
      label: 'All Videos',
      icon: Film,
      count: effectiveMediaList.filter(
        (m) =>
          m.mimeType?.startsWith('video') ||
          (m as any).resourceType === 'video' ||
          ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes((m as any).format || '') ||
          m.secureUrl?.match(/\.(mp4|mov|webm|mkv|avi)(\?|$)/i)
      ).length,
    },
  ] as const;

  const activeTabObj = sectionTabs.find((t) => t.id === activeTab) || sectionTabs[0];
  const ActiveIcon = activeTabObj.icon;

  // Filter Items Based on Active Tab (Photos vs Videos)
  const getFilteredItems = (): MediaItem[] => {
    if (activeTab === 'videos') {
      return effectiveMediaList.filter(
        (m) =>
          m.mimeType?.startsWith('video') ||
          (m as any).resourceType === 'video' ||
          ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes((m as any).format || '') ||
          m.secureUrl?.match(/\.(mp4|mov|webm|mkv|avi)(\?|$)/i)
      );
    }

    return effectiveMediaList.filter(
      (m) =>
        !m.mimeType?.startsWith('video') &&
        (m as any).resourceType !== 'video' &&
        !['mp4', 'mov', 'webm', 'mkv', 'avi'].includes((m as any).format || '') &&
        !m.secureUrl?.match(/\.(mp4|mov|webm|mkv|avi)(\?|$)/i)
    );
  };

  const displayItems = getFilteredItems();

  useEffect(() => {
    if (displayItems.length > 0) {
      setMediaList(displayItems);
    }
  }, [activeTab, rawMediaList.length]);

  return (
    <div className="space-y-6 pb-20 select-none w-full">

      {/* 1. Header Banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="cyan" size="sm">
                <Sparkles className="w-3 h-3" /> {isInvitedUser ? 'My Media Vault' : 'Shared Couple Vault'}
              </Badge>
              {!isInvitedUser && (
                <Badge variant="violet" size="sm">
                  Afzal & Amrin
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isInvitedUser ? 'My Gallery' : '3D Gallery'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
              {isInvitedUser
                ? 'All your uploaded photos, videos, posts, and stories in one secure place.'
                : 'All photos, videos, posts, and stories shared between Afzal & Amrin in real-time.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => setUploadModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Upload Photo / Video
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 2. Custom Mobile Mode Filter Dropdown (sm:hidden) */}
      <div className="sm:hidden relative z-30">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className="w-full glass-panel p-3 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-xl bg-white dark:bg-obsidian-950/90 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-gradient-to-tr dark:from-afzal/20 dark:via-amrin/20 dark:to-heart/20 border border-blue-200 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-amrin-glow">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Gallery Category</div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeTabObj.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  {activeTabObj.count}
                </span>
              </div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMobileMenuOpen ? 'rotate-180 text-blue-600 dark:text-amrin' : ''}`} />
        </button>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop overlay */}
              <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />

              {/* Custom Mobile Dropdown Popover */}
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 top-14 z-50 glass-card rounded-2xl p-2 border border-slate-200 dark:border-white/15 shadow-2xl bg-white dark:bg-obsidian-950/95 backdrop-blur-2xl space-y-1"
              >
                {sectionTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id as GallerySectionTab);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                          }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Mode Section Navigation Tabs (hidden sm:flex) */}
      <div className="hidden sm:flex glass-panel p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {sectionTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as GallerySectionTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-500'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Control Bar: Search & View Options */}
      <div className="glass-panel p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 border border-white/10">

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shared gallery..."
            className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amrin"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto justify-between md:justify-end">
          <Button
            variant={filterFavorite ? 'rose' : 'glass'}
            size="sm"
            onClick={() => setFilterFavorite(!filterFavorite)}
            leftIcon={<Heart className={`w-3.5 h-3.5 ${filterFavorite ? 'fill-white' : ''}`} />}
          >
            Favorites
          </Button>

          <Button
            variant="glass"
            size="sm"
            onClick={() => refetchMedia()}
            isLoading={isRefetching}
            className="p-2 rounded-xl"
            title="Refresh Gallery"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* View Mode Controls */}
          <div className="flex items-center glass-card p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-amrin text-white' : 'text-slate-400 hover:text-white'
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'masonry' ? 'bg-amrin text-white' : 'text-slate-400 hover:text-white'
                }`}
              title="Masonry View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-amrin text-white' : 'text-slate-400 hover:text-white'
                }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold px-2 ${viewMode === '3d' ? 'bg-gradient-to-r from-afzal to-amrin text-white' : 'text-slate-400 hover:text-white'
                }`}
              title="3D Memory Museum"
            >
              <Box className="w-4 h-4" />
              <span>3D Museum</span>
            </button>
          </div>

        </div>

      </div>

      {/* 4. Media Display / 3D Museum Display */}
      {viewMode === '3d' ? (
        <MemoryMuseum3D
          mediaItems={effectiveMediaList.filter((i) => {
            const hasUrl = Boolean(i.secureUrl || (i as any).url || i.thumbnailUrl || i.optimizedUrl);
            const isExcluded =
              i.tags?.includes('cover') ||
              i.tags?.includes('profile') ||
              i.tags?.includes('post') ||
              i.tags?.includes('story') ||
              i.cloudinaryPublicId?.includes('covers') ||
              i.cloudinaryPublicId?.includes('profiles') ||
              i.cloudinaryPublicId?.includes('posts') ||
              i.cloudinaryPublicId?.includes('stories') ||
              i.title?.toLowerCase().includes('cover') ||
              i.title?.toLowerCase().includes('profile') ||
              i.title?.toLowerCase().includes('post') ||
              i.title?.toLowerCase().includes('story');
            return hasUrl && !isExcluded;
          })}
          albums={albumsList}
        />
      ) : isMediaLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <Skeleton key={n} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : displayItems.length > 0 ? (
        viewMode === 'list' ? (
          <div className="space-y-2.5">
            {displayItems.map((media) => (
              <div
                key={media._id}
                onClick={() => openViewer(media)}
                className="glass-card p-3 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-amrin/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={media.thumbnailUrl || media.secureUrl}
                    alt={media.title}
                    className="w-14 h-14 object-cover rounded-xl border border-white/10"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{media.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Uploaded by {media.createdBy?.name || 'Partner'} • {new Date(media.memoryDate || media.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Badge variant="violet" size="sm">
                  {media.mimeType?.split('/')[1] || 'media'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 w-full">
            {displayItems.map((media) => (
              <MediaCard key={media._id} media={media} />
            ))}
          </div>
        )
      ) : (
        <Card variant="glass" className="w-full py-16 px-6 sm:px-12 text-center space-y-4 border border-white/5 my-2">
          <div className="w-14 h-14 rounded-2xl bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin-glow mx-auto">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No items in {activeTab} section</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isInvitedUser
              ? 'Photos and videos uploaded by you will automatically show up here!'
              : 'Photos and videos uploaded by either partner will automatically show up here for both of you!'}
          </p>
          <Button
            variant="cyan"
            size="md"
            onClick={() => setUploadModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {isInvitedUser ? 'Upload Photo / Video' : 'Upload to Shared Gallery'}
          </Button>
        </Card>
      )}

      {/* Lightbox & Upload Modals */}
      <MediaViewerModal />
      <MediaUploadModal />

    </div>
  );
};
