import { Calendar, Clock, Edit3, Grid, LogOut, Settings, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';
import { ProfileEditModal } from './ProfileEditModal.js';

interface ProfileHeaderProps {
  stats: {
    postsCount: number;
    memoriesCount: number;
    eventsCount: number;
  };
  onRefresh?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ stats, onRefresh }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
  };

  const isCoOwner = user?.role === 'CO_OWNER' || user?.name?.toLowerCase().includes('amrin');

  return (
    <>
      <Card variant="glass" className="p-6 border-white/10 shadow-2xl relative overflow-hidden select-none">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          
          {/* Instagram Style Large Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-2xl">
              <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center font-extrabold text-white text-3xl overflow-hidden p-0.5">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
            </div>
            <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-obsidian-950 absolute bottom-1 right-2" />
          </div>

          {/* User & Relationship Details */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{user?.name}</h2>
                  {isCoOwner && (
                    <Badge variant="cyan" size="sm">
                      <Shield className="w-3 h-3" /> Princess 👸
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              </div>

              {/* Instagram Style Profile Action Buttons (Edit, Settings, Logout) */}
              <div className="flex items-center gap-2">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  leftIcon={<Edit3 className="w-3.5 h-3.5 text-amrin" />}
                >
                  Edit Profile
                </Button>

                {user?.role === 'SUPER_OWNER' && (
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-2 rounded-xl glass-panel text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    title="Settings & Security"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl glass-panel text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Instagram Style Counts (Posts, Memories, Events) */}
            <div className="flex items-center justify-center md:justify-start gap-8 py-2 border-y border-white/5">
              <div className="text-center md:text-left">
                <span className="text-base font-extrabold text-white font-mono">{stats.postsCount}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Grid className="w-3 h-3 text-amrin" /> Posts
                </span>
              </div>

              <div className="text-center md:text-left">
                <span className="text-base font-extrabold text-white font-mono">{stats.memoriesCount}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-afzal" /> Memories
                </span>
              </div>

              <div className="text-center md:text-left">
                <span className="text-base font-extrabold text-white font-mono">{stats.eventsCount}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-heart" /> Scheduled
                </span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs text-slate-300 leading-relaxed italic max-w-xl">
              "{user?.bio || 'Living our dream journey together in Afrin Verse ❤️'}"
            </p>
          </div>

        </div>
      </Card>

      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};
