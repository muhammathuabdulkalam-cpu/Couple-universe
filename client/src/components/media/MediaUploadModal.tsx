import { AnimatePresence, motion } from 'framer-motion';
import { File, Folder, HardDriveUpload, UploadCloud, X } from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useMediaStore } from '../../store/mediaStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

export const MediaUploadModal: React.FC = () => {
  const { isUploadModalOpen, setUploadModalOpen } = useMediaStore();
  const { addToast } = useUIStore();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFolder, setTargetFolder] = useState('afrin-universe/gallery');
  const [visibility, setVisibility] = useState('COUPLE');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isUploadModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      addToast('Validation Error', 'Please select at least one file to upload.', 'warning');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('targetFolder', targetFolder);
    formData.append('visibility', visibility);

    if (selectedFiles.length === 1) {
      formData.append('file', selectedFiles[0]);
    } else {
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
    }

    try {
      const endpoint = selectedFiles.length === 1 ? '/media/upload' : '/media/upload-multiple';
      const res = await axiosClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      const uploadedData = res.data?.data;
      if (uploadedData) {
        const newItems = Array.isArray(uploadedData) ? uploadedData : [uploadedData];
        const currentList = useMediaStore.getState().mediaList;
        useMediaStore.getState().setMediaList([...newItems, ...currentList]);
      }

      // Notify React Query to refetch galleryMedia
      if (typeof window !== 'undefined' && (window as any).__queryClient) {
        (window as any).__queryClient.invalidateQueries({ queryKey: ['galleryMedia'] });
      }

      addToast('Upload Complete!', `Successfully uploaded ${selectedFiles.length} file(s) to ${targetFolder}`, 'success');
      setSelectedFiles([]);
      setUploadModalOpen(false);
      
      // Auto-trigger page window event for instant component update
      window.dispatchEvent(new Event('media-uploaded'));
    } catch (err: any) {
      addToast('Upload Failed', err.message || 'Error uploading media to Cloudinary', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/80 p-4 select-none">
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
          <Card variant="glass" className="p-6 space-y-6 border-white/10 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <UploadCloud className="w-5 h-5 text-afzal" />
                <span>Upload Media to Vault</span>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Cloudinary Folder & Visibility Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Vault Folder</label>
                <div className="relative">
                  <Folder className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={targetFolder}
                    onChange={(e) => setTargetFolder(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-700/80 rounded-xl py-2 pl-10 pr-2 text-xs text-white"
                  >
                    <option value="afrin-universe/gallery">afrin-universe/gallery</option>
                    <option value="afrin-universe/travel">afrin-universe/travel</option>
                    <option value="afrin-universe/marriage">afrin-universe/marriage</option>
                    <option value="afrin-universe/baby">afrin-universe/baby</option>
                    <option value="afrin-universe/family">afrin-universe/family</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full bg-obsidian-950 border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="COUPLE">COUPLE (Afzal & Amrin)</option>
                  <option value="FAMILY">FAMILY (Owners & Family)</option>
                  <option value="PRIVATE">PRIVATE (Only Me)</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-white/20 hover:border-amrin/50 rounded-2xl p-8 text-center space-y-3 bg-obsidian-950/40 transition-colors cursor-pointer"
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block space-y-3">
                <HardDriveUpload className="w-10 h-10 text-amrin-glow mx-auto animate-bounce" />
                <div>
                  <h4 className="text-sm font-bold text-white">Drag & Drop files here, or Click to Browse</h4>
                  <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP, HEIC, MP4, MOV (Up to 100MB)</p>
                </div>
              </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-300">Selected Files ({selectedFiles.length}):</div>
                {selectedFiles.map((file, i) => (
                  <div key={i} className="glass-card px-3 py-2 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <File className="w-4 h-4 text-afzal shrink-0" />
                      <span className="text-white truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Uploading to Cloudinary...</span>
                  <span className="font-mono text-afzal-glow font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-obsidian-900 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-afzal to-amrin transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="glass" size="md" onClick={() => setUploadModalOpen(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button variant="cyan" size="md" onClick={handleUpload} isLoading={isUploading} disabled={selectedFiles.length === 0}>
                Upload Files
              </Button>
            </div>

          </Card>
        </motion.div>

      </div>
    </AnimatePresence>
  );
};
