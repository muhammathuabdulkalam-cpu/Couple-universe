import { AnimatePresence, motion } from 'framer-motion';
import { Cake, Camera, Image, Upload, User as UserIcon, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse } from '../../types/index.js';
import { MediaPicker } from '../media/MediaPicker.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || 'Living our dream journey together in Afrin Verse ❤️');
  const [birthday, setBirthday] = useState(
    (user as any)?.birthday ? new Date((user as any).birthday).toISOString().split('T')[0] : ''
  );
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(user?.avatar || '');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isUploadingDeviceImg, setIsUploadingDeviceImg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDeviceUpload = async (file: File) => {
    setIsUploadingDeviceImg(true);
    try {
      const formData = new FormData();
      formData.append('file', file, 'profile_avatar.jpg');
      formData.append('title', 'Profile Picture');
      formData.append('visibility', 'PUBLIC');
      formData.append('tags', 'profile');

      const res = await axiosClient.post<ApiResponse<any>>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const media = res.data.data;
      const avatarUrl = media.secureUrl || media.optimizedUrl;
      setSelectedAvatarUrl(avatarUrl);
      addToast('Image Uploaded!', 'Device image uploaded as avatar preview.', 'success');
    } catch (err: any) {
      addToast('Upload Failed', err?.response?.data?.message || 'Failed to upload device image', 'error');
    } finally {
      setIsUploadingDeviceImg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await axiosClient.patch<ApiResponse>('/profile', {
        name,
        bio,
        avatar: selectedAvatarUrl,
        birthday: birthday || null,
      });

      if (res.data.data) {
        updateUser(res.data.data);
      }

      addToast('Profile Updated!', 'Your relationship profile details have been saved.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/80 backdrop-blur-xl p-4 select-none overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg my-auto">
            <Card variant="glass" className="p-6 space-y-6 border-white/10 shadow-2xl">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2 text-base font-bold text-white">
                  <UserIcon className="w-5 h-5 text-amrin" />
                  <span>Edit Relationship Profile</span>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Avatar Preview & Multi-Source Selector */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-1 shadow-2xl">
                      <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center font-extrabold text-white text-3xl overflow-hidden border border-white/20">
                        {selectedAvatarUrl ? (
                          <img src={selectedAvatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          user?.name?.charAt(0) || 'U'
                        )}
                      </div>
                    </div>

                    {isUploadingDeviceImg && (
                      <div className="absolute inset-0 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold">
                        Uploading...
                      </div>
                    )}
                  </div>

                  {/* Avatar Source Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="violet"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      Upload From Device
                    </Button>

                    <Button
                      type="button"
                      variant="cyan"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                      leftIcon={<Camera className="w-3.5 h-3.5" />}
                    >
                      Camera
                    </Button>

                    <Button
                      type="button"
                      variant="glass"
                      size="sm"
                      onClick={() => setIsMediaPickerOpen(true)}
                      leftIcon={<Image className="w-3.5 h-3.5 text-afzal" />}
                    >
                      Media Vault
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDeviceUpload(file);
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
                      if (file) handleDeviceUpload(file);
                    }}
                  />
                </div>

                {/* Name, Birthday & Bio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2.5 px-4 text-xs text-white focus:border-amrin focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Cake className="w-3.5 h-3.5 text-amber-400" /> Birthday Date
                    </label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2.5 px-4 text-xs text-white focus:border-amrin focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Relationship Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2.5 px-4 text-xs text-white focus:border-amrin focus:outline-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <Button type="button" variant="glass" size="md" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="violet" size="md" isLoading={isSubmitting}>
                    Save Profile
                  </Button>
                </div>

              </form>
            </Card>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Universal Media Vault Picker */}
      {isMediaPickerOpen && (
        <MediaPicker
          title="Select Profile Avatar from Vault"
          onSelectMedia={(media) => {
            setSelectedAvatarUrl(media.secureUrl || media.optimizedUrl);
            setIsMediaPickerOpen(false);
          }}
          onClose={() => setIsMediaPickerOpen(false)}
        />
      )}
    </>
  );
};
