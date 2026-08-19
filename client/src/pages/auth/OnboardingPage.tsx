import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, User, Calendar, FileText, Camera, ArrowRight, CheckCircle2, ShieldCheck, Heart, Upload } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { onboardingApi } from '../../api/onboardingApi';
import { axiosClient } from '../../api/axiosClient';
import { ALL_FEATURES_CONFIG } from '../../config/features';
import { CircularImageCropModal } from '../../components/profile/CircularImageCropModal';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { addToast } = useUIStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [birthday, setBirthday] = useState(currentUser?.birthday ? currentUser.birthday.substring(0, 10) : '');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [gender, setGender] = useState(currentUser?.gender || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [rawDeviceImage, setRawDeviceImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const handleDeviceUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setRawDeviceImage(result);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedAvatarComplete = async (croppedBlob: Blob, croppedDataUrl: string) => {
    setIsUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('file', croppedBlob, 'profile_avatar.jpg');
      formData.append('title', 'Profile Picture');
      formData.append('visibility', 'PUBLIC');

      const res = await axiosClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const media = res.data?.data;
      const avatarUrl = media?.secureUrl || media?.optimizedUrl || croppedDataUrl;
      setAvatar(avatarUrl);
      addToast('Profile Picture Set!', 'Instagram-style cropped profile picture applied.', 'success');
    } catch (_err) {
      setAvatar(croppedDataUrl);
      addToast('Profile Picture Set!', 'Cropped profile picture applied.', 'success');
    } finally {
      setIsUploadingImg(false);
      setIsCropModalOpen(false);
      setRawDeviceImage(null);
    }
  };

  useEffect(() => {
    onboardingApi
      .getOnboardingState()
      .then((data) => {
        if (data.user) {
          setName(data.user.name || '');
          setAvatar(data.user.avatar || '');
          setBio(data.user.bio || '');
          if (data.user.phone) setPhone(data.user.phone);
          if (data.user.gender) setGender(data.user.gender);
          if (data.user.birthday) setBirthday(data.user.birthday.substring(0, 10));
        }
      })
      .catch(() => {});
  }, []);

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Update profile details
      await onboardingApi.updateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        bio: bio.trim(),
        phone: phone.trim() || undefined,
        gender: gender || undefined,
        birthday: birthday || undefined,
        username: username.trim() || undefined,
      });

      // 2. Mark onboarding completed
      const completeRes = await onboardingApi.completeOnboarding();

      // 3. Update auth store with onboardingCompleted: true
      const updatedUser = completeRes.user;
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken && updatedUser) {
        setAuth(updatedUser, accessToken);
      }

      addToast('Welcome to Couple Universe! ❤️', 'Your account profile is complete.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      addToast('Error', err?.message || 'Failed to complete onboarding.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const enabledFeatureKeys = currentUser?.enabledFeatures || [];
  const enabledConfigList = ALL_FEATURES_CONFIG.filter(
    (f) => ['SUPER_OWNER', 'CO_OWNER'].includes(currentUser?.role || '') || enabledFeatureKeys.includes(f.key)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 my-auto"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Profile Setup & Onboarding</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>Welcome to Couple Universe</span>
            <Heart className="w-6 h-6 text-rose-500 fill-current animate-bounce" />
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Personalize your profile details to finish setting up your shared relationship space.
          </p>
        </div>

        {/* Enabled Features Badge Box */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-rose-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Your Activated Relationship Features</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold border border-rose-500/30">
              {enabledConfigList.length} Active
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {enabledConfigList.map((f) => (
              <span
                key={f.key}
                className="px-2.5 py-1 rounded-xl bg-slate-800 border border-white/10 text-[11px] font-semibold text-slate-200 flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{f.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Onboarding Form */}
        <form onSubmit={handleCompleteOnboarding} className="space-y-4">

          {/* Profile Picture Upload from Device */}
          <div className="flex flex-col items-center space-y-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
            <label className="block text-xs font-extrabold text-slate-300">
              Profile Picture (Upload from Device)
            </label>

            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-500 shadow-xl overflow-hidden">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-white text-2xl overflow-hidden border border-white/20 relative">
                  {avatar ? (
                    <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    name.charAt(0).toUpperCase() || 'U'
                  )}
                  {isUploadingImg && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center text-[10px] font-bold text-white">
                      Uploading...
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-rose-500 text-white shadow-lg group-hover:scale-110 transition border border-slate-950">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-extrabold border border-rose-500/30 transition flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Image File from Device</span>
            </button>

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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Full Name / Display Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Afzal or Amrin"
                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Username (Optional)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. afzal_official"
                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Personal Bio / Note (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Share a short sweet note about yourself..."
                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Date of Birth (DOB) *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Gender *
              </label>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-Binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer Not to Say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
          </div>

          {/* Action Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transform active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Entering Couple Universe...</span>
              ) : (
                <>
                  <span>ENTER COUPLE UNIVERSE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <CircularImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={rawDeviceImage}
        onClose={() => {
          setIsCropModalOpen(false);
          setRawDeviceImage(null);
        }}
        onCropComplete={handleCroppedAvatarComplete}
        isUploading={isUploadingImg}
      />
    </div>
  );
};
