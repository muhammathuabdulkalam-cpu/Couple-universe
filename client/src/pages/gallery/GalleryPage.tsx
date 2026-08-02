import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Box,
  ChevronDown,
  Film,
  Grid,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
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
import { useMediaStore } from '../../store/mediaStore.js';
import { ActivityItem, ApiResponse, MediaItem, StoryItem } from '../../types/index.js';

type GallerySectionTab = 'photos' | 'videos' | 'posts' | 'stories' | 'afzal' | 'amrin';

export const GalleryPage: React.FC = () => {
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

  // 1. Fetch All Shared Couple Media Items
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

  // 2. Fetch Shared Social Feed Posts
  const { data: postsList = [] } = useQuery<ActivityItem[]>({
    queryKey: ['sharedGalleryPosts'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<ActivityItem[]>>('/feed');
      return (res.data.data ?? []).filter((p) => p.imageUrl || p.referenceId);
    },
  });

  // 3. Fetch Shared Stories
  const { data: storiesList = [] } = useQuery<StoryItem[]>({
    queryKey: ['sharedGalleryStories'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<StoryItem[]>>('/stories');
      return res.data.data ?? [];
    },
  });

  // 4. Fetch Albums
  const { data: albumsList = [] } = useQuery<any[]>({
    queryKey: ['sharedGalleryAlbums'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any[]>>('/albums');
      return res.data.data ?? [];
    },
  });

  // Section Tabs Definition
  const sectionTabs = [
    { id: 'photos', label: 'All Photos', icon: ImageIcon, count: rawMediaList.filter((m) => !m.mimeType?.startsWith('video')).length },
    { id: 'videos', label: 'All Videos', icon: Film, count: rawMediaList.filter((m) => m.mimeType?.startsWith('video')).length },
    { id: 'posts', label: 'Posts', icon: MessageSquare, count: postsList.length },
    { id: 'stories', label: 'Stories', icon: BookOpen, count: storiesList.length },
    { id: 'afzal', label: 'Afzal Uploads', icon: User, count: rawMediaList.filter((m) => (m.createdBy?.name || (m.owner as any)?.name)?.toLowerCase().includes('afzal')).length },
    { id: 'amrin', label: 'Amrin Uploads', icon: Heart, count: rawMediaList.filter((m) => (m.createdBy?.name || (m.owner as any)?.name)?.toLowerCase().includes('amrin')).length },
  ] as const;

  const activeTabObj = sectionTabs.find((t) => t.id === activeTab) || sectionTabs[0];
  const ActiveIcon = activeTabObj.icon;

  // Filter Items Based on Active Tab
  const getFilteredItems = (): MediaItem[] => {
    if (activeTab === 'photos') {
      return rawMediaList.filter((m) => !m.mimeType?.startsWith('video'));
    }

    if (activeTab === 'videos') {
      return rawMediaList.filter((m) => m.mimeType?.startsWith('video'));
    }

    if (activeTab === 'afzal') {
      return rawMediaList.filter((m) => {
        const ownerName = m.createdBy?.name || (m.owner as any)?.name || '';
        const ownerRole = (m.createdBy as any)?.role || (m.owner as any)?.role || '';
        return ownerRole === 'SUPER_OWNER' || ownerName.toLowerCase().includes('afzal');
      });
    }

    if (activeTab === 'amrin') {
      return rawMediaList.filter((m) => {
        const ownerName = m.createdBy?.name || (m.owner as any)?.name || '';
        const ownerRole = (m.createdBy as any)?.role || (m.owner as any)?.role || '';
        return ownerRole === 'CO_OWNER' || ownerName.toLowerCase().includes('amrin');
      });
    }

    if (activeTab === 'posts') {
      return postsList.map((post) => {
        const imageUrl = post.imageUrl || (post.referenceId as any)?.secureUrl || (post.referenceId as any)?.url || '';
        return {
          _id: post._id,
          owner: post.userId._id,
          createdBy: { _id: post.userId._id, name: post.userId.name, email: post.userId.email, avatar: post.userId.avatar },
          title: post.title || 'Social Post',
          caption: post.description,
          tags: ['post'],
          peopleTagged: [],
          visibility: 'COUPLE',
          memoryDate: post.createdAt,
          cloudinaryPublicId: post._id,
          secureUrl: imageUrl,
          optimizedUrl: imageUrl,
          thumbnailUrl: imageUrl,
          width: 1080,
          height: 1080,
          aspectRatio: 1,
          orientation: 'SQUARE',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          isFavorite: false,
          isArchived: false,
          isDeleted: false,
          viewCount: 1,
          createdAt: post.createdAt,
          updatedAt: post.createdAt,
        };
      });
    }

    if (activeTab === 'stories') {
      return storiesList.map((story) => {
        const imageUrl = story.mediaId?.secureUrl || story.mediaId?.optimizedUrl || (story as any).mediaUrl || '';
        const isVideo = story.mediaId?.mimeType?.startsWith('video');
        return {
          _id: story._id,
          owner: story.userId._id,
          createdBy: { _id: story.userId._id, name: story.userId.name, email: story.userId.email, avatar: story.userId.avatar },
          title: story.caption || '24h Story',
          caption: story.caption,
          tags: ['story'],
          peopleTagged: [],
          visibility: 'COUPLE',
          memoryDate: story.createdAt,
          cloudinaryPublicId: story._id,
          secureUrl: imageUrl,
          optimizedUrl: imageUrl,
          thumbnailUrl: imageUrl,
          width: 1080,
          height: 1080,
          aspectRatio: 1,
          orientation: 'SQUARE',
          mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
          fileSize: 1024,
          isFavorite: false,
          isArchived: false,
          isDeleted: false,
          viewCount: 1,
          createdAt: story.createdAt,
          updatedAt: story.createdAt,
        };
      });
    }

    return rawMediaList;
  };

  const displayItems = getFilteredItems();

  useEffect(() => {
    if (displayItems.length > 0) {
      setMediaList(displayItems);
    }
  }, [activeTab, rawMediaList.length, postsList.length, storiesList.length]);

  return (
    <div className="space-y-6 pb-20 select-none max-w-7xl mx-auto">

      {/* 1. Header Banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="cyan" size="sm">
                <Sparkles className="w-3 h-3" /> Shared Couple Vault
              </Badge>
              <Badge variant="violet" size="sm">
                Afzal & Amrin
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              3D Gallery
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              All photos, videos, posts, and stories shared between Afzal & Amrin in real-time.
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
          className="w-full glass-panel p-3 rounded-2xl border border-white/10 flex items-center justify-between shadow-xl bg-obsidian-950/90 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-afzal/20 via-amrin/20 to-heart/20 border border-white/10 flex items-center justify-center text-amrin-glow">
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gallery Category</div>
              <div className="text-xs font-extrabold text-white flex items-center gap-2">
                <span>{activeTabObj.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10 text-slate-300">
                  {activeTabObj.count}
                </span>
              </div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMobileMenuOpen ? 'rotate-180 text-amrin' : ''}`} />
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
                className="absolute left-0 right-0 top-14 z-50 glass-card rounded-2xl p-2 border border-white/15 shadow-2xl bg-obsidian-950/95 backdrop-blur-2xl space-y-1"
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
                          ? 'bg-gradient-to-r from-afzal/30 via-amrin/30 to-heart/30 text-white border border-white/20 shadow-lg'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amrin-glow' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white font-bold' : 'bg-white/5 text-slate-400'
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
      <div className="hidden sm:flex glass-panel p-1.5 rounded-2xl border border-white/10 items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {sectionTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as GallerySectionTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${isActive
                  ? 'bg-gradient-to-r from-afzal/20 via-amrin/20 to-heart/20 text-white border border-white/20 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amrin-glow' : ''}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
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
          mediaItems={displayItems.filter((i) => Boolean(i.secureUrl || (i as any).url || i.thumbnailUrl || i.optimizedUrl))}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {displayItems.map((media) => (
              <MediaCard key={media._id} media={media} />
            ))}
          </div>
        )
      ) : (
        <Card variant="glass" className="p-12 text-center space-y-4 max-w-md mx-auto my-6 border border-white/5">
          <div className="w-14 h-14 rounded-2xl bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin-glow mx-auto">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No items in {activeTab} section</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Photos and videos uploaded by either partner will automatically show up here for both of you!
          </p>
          <Button
            variant="cyan"
            size="md"
            onClick={() => setUploadModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Upload to Shared Gallery
          </Button>
        </Card>
      )}

      {/* Lightbox & Upload Modals */}
      <MediaViewerModal />
      <MediaUploadModal />

    </div>
  );
};
