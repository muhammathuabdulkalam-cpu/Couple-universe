import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, User, Calendar, FileText, Camera, ArrowRight, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { onboardingApi } from '../../api/onboardingApi';
import { ALL_FEATURES_CONFIG } from '../../config/features';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    onboardingApi
      .getOnboardingState()
      .then((data) => {
        if (data.user) {
          setName(data.user.name || '');
          setAvatar(data.user.avatar || '');
          setBio(data.user.bio || '');
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
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Your Display Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Afzal"
                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Avatar Image URL (Optional)
            </label>
            <div className="relative">
              <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
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
              Birthday (Optional)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
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
    </div>
  );
};
