import { AnimatePresence, motion } from 'framer-motion';
import { Edit3, Grid, LogOut, Settings, Shield, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';
import { ProfileEditModal } from './ProfileEditModal.js';

interface ProfileHeaderProps {
  profileUser?: any;
  stats: {
    postsCount: number;
    memoriesCount: number;
    eventsCount: number;
    followersCount?: number;
    followingCount?: number;
  };
  isSelf?: boolean;
  onRefresh?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileUser, stats, isSelf, onRefresh }) => {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuthStore();
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [activeUserListModal, setActiveUserListModal] = useState<'followers' | 'following' | null>(null);

  const displayUser = profileUser || currentUser;
  const isSelfProfile = isSelf !== undefined ? isSelf : String(displayUser?._id) === String(currentUser?._id);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/welcome');
    }
  };

  const isCoOwner = displayUser?.role === 'CO_OWNER' || displayUser?.name?.toLowerCase().includes('amrin');

  const followers = displayUser?.followers || (displayUser?.partner ? [displayUser.partner] : []);
  const following = displayUser?.following || (displayUser?.partner ? [displayUser.partner] : []);

  return (
    <>
      <Card variant="glass" className="p-6 border-white/10 shadow-2xl relative overflow-hidden select-none">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          
          {/* Instagram Style Large Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-2xl">
              <div className="w-full h-full rounded-full bg-obsidian-950 flex items-center justify-center font-extrabold text-white text-3xl overflow-hidden p-0.5">
                {displayUser?.avatar ? (
                  <img src={displayUser.avatar} alt={displayUser.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  displayUser?.name?.charAt(0) || 'U'
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
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{displayUser?.name}</h2>
                  {isCoOwner && (
                    <Badge variant="cyan" size="sm">
                      <Shield className="w-3 h-3" /> Princess 👸
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{displayUser?.email}</p>
              </div>

              {/* Action Buttons: Show Edit/Logout ONLY on Self Profile */}
              {isSelfProfile ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-amrin" />}
                  >
                    Edit Profile
                  </Button>

                  {currentUser?.role === 'SUPER_OWNER' && (
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
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="violet" size="sm">
                    Read-Only Profile View
                  </Badge>
                </div>
              )}
            </div>

            {/* Instagram Style Counts (Posts, Followers, Following) */}
            <div className="flex items-center justify-center md:justify-start gap-6 sm:gap-8 py-2 border-y border-white/5">
              <div className="text-center md:text-left">
                <span className="text-base font-extrabold text-white font-mono">{stats.postsCount}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Grid className="w-3 h-3 text-amrin" /> Posts
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveUserListModal('followers')}
                className="text-center md:text-left hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="text-base font-extrabold text-white font-mono">
                  {stats.followersCount ?? followers.length}
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-afzal" /> Followers
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveUserListModal('following')}
                className="text-center md:text-left hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="text-base font-extrabold text-white font-mono">
                  {stats.followingCount ?? following.length}
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-heart" /> Following
                </span>
              </button>
            </div>

            {/* Bio */}
            <p className="text-xs text-slate-300 leading-relaxed italic max-w-xl">
              "{displayUser?.bio || 'Living our dream journey together in Afrin Verse ❤️'}"
            </p>
          </div>

        </div>
      </Card>

      {/* Edit Profile Modal (Only for Self Profile) */}
      {isSelfProfile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Followers / Following List Sub-Modal */}
      <AnimatePresence>
        {activeUserListModal && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-obsidian-950 border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Users className="w-4 h-4 text-amrin-glow" />
                  <span>{activeUserListModal === 'followers' ? 'Followers' : 'Following'}</span>
                </div>
                <button
                  onClick={() => setActiveUserListModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(activeUserListModal === 'followers' ? followers : following).length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">No users listed.</p>
                ) : (
                  (activeUserListModal === 'followers' ? followers : following).map((u: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <div className="w-full h-full bg-obsidian-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {u.name?.[0] || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 block">{u.email}</span>
                        </div>
                      </div>
                      <Badge variant="violet" size="sm">Partner</Badge>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
