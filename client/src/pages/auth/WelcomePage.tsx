import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Key, Lock, LogIn, Music, ShieldCheck, Sparkles, Users } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge.js';
import { useAuthStore } from '../../store/authStore.js';

export const WelcomePage: React.FC = () => {
  const { fetchSystemStatus, systemStatus } = useAuthStore();

  const { isLoading } = useQuery({
    queryKey: ['systemAuthStatus'],
    queryFn: fetchSystemStatus,
  });

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-6 select-none">
      {/* Centralized Instagram-Style Mobile Focus Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-obsidian-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 text-center relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-afzal/20 via-amrin/30 to-heart/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Avatar with Instagram Story-Style Gradient Ring */}
        <div className="flex justify-center relative z-10">
          <div className="relative p-1 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart shadow-xl shadow-amrin/25 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-obsidian-950 p-1 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Couple Universe Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amrin to-heart text-white text-[11px] px-2 py-0.5 rounded-full font-black border border-obsidian-950 shadow-md">
              ❤️
            </span>
          </div>
        </div>

        {/* Header Titles */}
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Couple Universe
          </h1>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
            The private, encrypted digital life platform for <strong className="text-slate-200">Afzal & Amrin</strong> and their loved ones.
          </p>
        </div>

        {/* Status Badge Indicator */}
        <div className="flex justify-center">
          {isLoading ? (
            <Badge variant="gray" pulse size="sm">Checking System Status...</Badge>
          ) : systemStatus?.isInitialSetupOpen ? (
            <Badge variant="green" pulse size="md" className="px-3 py-1 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> First Setup Mode: Super Owner Available
            </Badge>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-purple-300 font-medium">
              <Lock className="w-3 h-3 text-purple-400" /> Private Access Only • Code Required
            </div>
          )}
        </div>

        {/* Instagram-Style Primary Action Stack */}
        <div className="space-y-3 pt-2 relative z-10">
          <Link to="/login" className="block w-full">
            <button className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-afzal via-amrin to-heart text-white font-bold text-sm shadow-lg shadow-amrin/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 group">
              <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </Link>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">OR</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <Link to="/register" className="block w-full">
            <button className="w-full py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2">
              <Key className="w-4 h-4 text-amrin-glow" />
              <span>{systemStatus?.isInitialSetupOpen ? 'Setup Super Owner' : 'Enter Invitation Code'}</span>
            </button>
          </Link>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[10px] font-medium text-slate-400">
          <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
            <Sparkles className="w-3 h-3 text-amber-400" /> Private Vault
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
            <Heart className="w-3 h-3 text-rose-400" /> Life Milestones
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
            <Music className="w-3 h-3 text-cyan-400" /> Listen Together
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
            <Users className="w-3 h-3 text-purple-400" /> Friends Line
          </div>
        </div>

      </motion.div>

      {/* Instagram-Style Footer */}
      <div className="mt-6 text-center text-xs text-slate-400">
        Established <span className="text-amrin-glow font-semibold">March 26, 2026</span> • Encrypted & Secure
      </div>
    </div>
  );
};

