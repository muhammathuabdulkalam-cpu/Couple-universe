import { create } from 'zustand';
import { AlbumItem, MediaItem } from '../types/index.js';

interface MediaState {
  mediaList: MediaItem[];
  albumsList: AlbumItem[];
  activeAlbum: AlbumItem | null;
  viewMode: 'grid' | 'masonry' | 'list';
  selectedMedia: MediaItem | null;
  isViewerOpen: boolean;
  isUploadModalOpen: boolean;
  isCreateAlbumModalOpen: boolean;
  searchQuery: string;
  filterOrientation: string;
  filterFavorite: boolean;

  setMediaList: (list: MediaItem[]) => void;
  setAlbumsList: (albums: AlbumItem[]) => void;
  setActiveAlbum: (album: AlbumItem | null) => void;
  setViewMode: (mode: 'grid' | 'masonry' | 'list') => void;
  openViewer: (media: MediaItem) => void;
  closeViewer: () => void;
  nextMedia: () => void;
  prevMedia: () => void;
  setUploadModalOpen: (open: boolean) => void;
  setCreateAlbumModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterOrientation: (orientation: string) => void;
  setFilterFavorite: (fav: boolean) => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  mediaList: [],
  albumsList: [],
  activeAlbum: null,
  viewMode: 'grid',
  selectedMedia: null,
  isViewerOpen: false,
  isUploadModalOpen: false,
  isCreateAlbumModalOpen: false,
  searchQuery: '',
  filterOrientation: '',
  filterFavorite: false,

  setMediaList: (mediaList) => set({ mediaList }),
  setAlbumsList: (albumsList) => set({ albumsList }),
  setActiveAlbum: (activeAlbum) => set({ activeAlbum }),
  setViewMode: (viewMode) => set({ viewMode }),

  openViewer: (selectedMedia) => set({ selectedMedia, isViewerOpen: true }),
  closeViewer: () => set({ selectedMedia: null, isViewerOpen: false }),

  nextMedia: () => {
    const { mediaList, selectedMedia } = get();
    if (!selectedMedia || mediaList.length === 0) return;
    const currentIndex = mediaList.findIndex((m) => m._id === selectedMedia._id);
    if (currentIndex < mediaList.length - 1) {
      set({ selectedMedia: mediaList[currentIndex + 1] });
    }
  },

  prevMedia: () => {
    const { mediaList, selectedMedia } = get();
    if (!selectedMedia || mediaList.length === 0) return;
    const currentIndex = mediaList.findIndex((m) => m._id === selectedMedia._id);
    if (currentIndex > 0) {
      set({ selectedMedia: mediaList[currentIndex - 1] });
    }
  },

  setUploadModalOpen: (isUploadModalOpen) => set({ isUploadModalOpen }),
  setCreateAlbumModalOpen: (isCreateAlbumModalOpen) => set({ isCreateAlbumModalOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterOrientation: (filterOrientation) => set({ filterOrientation }),
  setFilterFavorite: (filterFavorite) => set({ filterFavorite }),
}));
