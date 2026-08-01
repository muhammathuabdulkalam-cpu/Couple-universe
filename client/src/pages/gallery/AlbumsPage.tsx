import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FolderHeart, Plus, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useUIStore } from '../../store/uiStore.js';
import { AlbumItem, AlbumType, ApiResponse } from '../../types/index.js';

export const AlbumsPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Album creation form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [albumType, setAlbumType] = useState<AlbumType>('CUSTOM');
  const [visibility, setVisibility] = useState('COUPLE');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch Albums
  const { data: albums, isLoading, refetch } = useQuery<AlbumItem[]>({
    queryKey: ['albumsList'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<AlbumItem[]>>('/albums');
      return res.data.data!;
    },
  });

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      addToast('Validation Error', 'Please enter an album name.', 'warning');
      return;
    }

    setIsCreating(true);
    try {
      await axiosClient.post('/albums', {
        name,
        description,
        albumType,
        visibility,
      });

      addToast('Album Created!', `Album "${name}" created successfully.`, 'success');
      setName('');
      setDescription('');
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to create album', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="violet" size="sm">
                <Sparkles className="w-3 h-3" /> Life Chapters
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Albums & Collections
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Organized collections for Travel, Marriage, Family, and Milestones
            </p>
          </div>

          <Button variant="violet" size="md" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create New Album
          </Button>
        </div>
      </motion.div>

      {/* Album Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : albums && albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {albums.map((album) => (
            <motion.div key={album._id} whileHover={{ y: -4 }}>
              <Card hoverEffect className="p-4 space-y-4 border-white/10 flex flex-col justify-between h-full">
                <div className="h-40 bg-obsidian-950/80 rounded-xl overflow-hidden relative flex items-center justify-center border border-white/5">
                  {album.coverImage ? (
                    <img src={album.coverImage} alt={album.name} className="w-full h-full object-cover" />
                  ) : (
                    <FolderHeart className="w-12 h-12 text-amrin/40" />
                  )}
                  <Badge variant="violet" size="sm" className="absolute top-2.5 right-2.5">
                    {album.albumType}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white truncate">{album.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{album.description || 'No description provided.'}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-3">
                  <span>{album.mediaCount} Media Items</span>
                  <Badge variant="cyan" size="sm">{album.visibility}</Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card variant="glass" className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amrin/10 border border-amrin/30 flex items-center justify-center text-amrin mx-auto">
            <FolderHeart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Custom Albums Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Create custom albums to group travel photos, marriage memories, and baby milestones.
          </p>
          <Button variant="violet" size="md" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create First Album
          </Button>
        </Card>
      )}

      {/* Create Album Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/80 backdrop-blur-xl p-4">
          <Card variant="glass" className="p-6 space-y-6 max-w-md w-full border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white">Create New Album</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Album Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Goa Trip 2026 / Wedding Chapter"
                  required
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 px-4 text-sm text-white focus:border-amrin"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of this album..."
                  rows={2}
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2 px-4 text-xs text-white focus:border-amrin"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Album Category</label>
                  <select
                    value={albumType}
                    onChange={(e) => setAlbumType(e.target.value as AlbumType)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white"
                  >
                    <option value="CUSTOM">CUSTOM</option>
                    <option value="TRAVEL">TRAVEL</option>
                    <option value="MARRIAGE">MARRIAGE</option>
                    <option value="BABY">BABY</option>
                    <option value="FAMILY">FAMILY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white"
                  >
                    <option value="COUPLE">COUPLE</option>
                    <option value="FAMILY">FAMILY</option>
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="PUBLIC">PUBLIC</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button variant="glass" size="md" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="violet" size="md" isLoading={isCreating}>
                  Create Album
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};
