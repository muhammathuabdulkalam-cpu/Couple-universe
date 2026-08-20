import React, { useEffect, useState } from 'react';
import {
  X,
  User as UserIcon,
  Heart,
  Calendar,
  HardDrive,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  Shield,
  Smartphone,
  Globe,
  Tag,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { AdminUserDetail } from '../../types/admin.types';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { Avatar } from '../ui/Avatar';

export const UserDetailDrawer: React.FC = () => {
  const { selectedUserIdForDrawer, setSelectedUserIdForDrawer } = useAdminAuthStore();
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedUserIdForDrawer) {
      setUserDetail(null);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const detail = await adminApi.getUserDetails(selectedUserIdForDrawer);
        setUserDetail(detail);
      } catch (err) {
        console.error('Failed to fetch user drawer details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedUserIdForDrawer]);

  if (!selectedUserIdForDrawer) return null;

  const getVal = (val?: string | number | null) => {
    if (val === undefined || val === null || val === '' || val === 'undefined' || val === 'null') {
      return 'Not Available';
    }
    return val;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn flex justify-end">
      <div className="w-full max-w-lg bg-slate-900 border-l border-white/10 text-white h-full flex flex-col justify-between p-6 overflow-y-auto shadow-2xl space-y-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-rose-400" />
            <h3 className="font-extrabold text-base text-white">Enterprise User Profile</h3>
          </div>
          <button
            onClick={() => setSelectedUserIdForDrawer(null)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Fetching Comprehensive User Record...</p>
          </div>
        ) : !userDetail ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
            User details unavailable.
          </div>
        ) : (
          <div className="space-y-6 flex-1">
            {/* Cover Image & Profile Header */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-800">
              <img
                src={userDetail.coverImage || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800'}
                alt="Cover"
                className="w-full h-24 object-cover opacity-60"
              />
              <div className="p-4 flex items-center gap-4 -mt-8 relative z-10">
                <div className="relative">
                  <Avatar
                    src={userDetail.avatar}
                    name={userDetail.name}
                    size="xl"
                    className="border-2 border-slate-900 shadow-xl"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                      userDetail.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0 pt-6">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base text-white truncate">{getVal(userDetail.displayName || userDetail.name)}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-extrabold">
                      {getVal(userDetail.role)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">@{getVal(userDetail.username)}</p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Account Status: {getVal(userDetail.accountStatus)}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Attributes Grid */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-rose-400" />
                <span>Personal Information</span>
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Display Name</span>
                  <span className="font-bold text-slate-200 block truncate">{getVal(userDetail.displayName || userDetail.name)}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Username</span>
                  <span className="font-bold text-slate-200 block truncate">@{getVal(userDetail.username)}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Email Address</span>
                  <span className="font-bold text-slate-200 block truncate">{getVal(userDetail.email)}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Phone</span>
                  <span className="font-bold text-slate-300 block">{getVal(userDetail.phone)}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Birthday</span>
                  <span className="font-bold text-slate-300 block">{getVal(userDetail.birthday)}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Gender</span>
                  <span className="font-bold text-slate-300 block">{getVal(userDetail.gender)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 font-semibold block">Bio</span>
                <p className="text-slate-300 leading-relaxed">{getVal(userDetail.bio)}</p>
              </div>
            </div>

            {/* Relationship Metadata */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Relationship Metadata</span>
              </h5>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/20 to-slate-800/80 border border-rose-500/20 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Relationship Name:</span>
                  <span className="font-bold text-white">{getVal(userDetail.relationshipName)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Relationship Type:</span>
                  <span className="font-bold text-rose-300">{getVal(userDetail.relationshipType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Relationship Status:</span>
                  <span className="font-bold text-purple-300">{getVal(userDetail.relationshipStatus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Partner Name:</span>
                  <span className="font-bold text-amber-300">{getVal(userDetail.partnerName)}</span>
                </div>
              </div>
            </div>

            {/* Security & System Context */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security & Session Context</span>
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Online Status</span>
                  <span className={`font-bold block ${userDetail.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {userDetail.isOnline ? 'ONLINE NOW' : 'OFFLINE'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Email Verification</span>
                  <span className="font-bold text-emerald-300 block">{getVal(userDetail.emailVerified)}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-purple-400" /> Devices
                  </span>
                  <span className="font-bold text-slate-200 block">{getVal(userDetail.registeredDeviceCount)} active session(s)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block flex items-center gap-1">
                    <Globe className="w-3 h-3 text-blue-400" /> Last Known IP
                  </span>
                  <span className="font-mono text-slate-300 block truncate">{getVal(userDetail.lastKnownIp)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Last Active:
                  </span>
                  <span className="font-mono text-slate-200">{getVal(userDetail.lastActiveAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" /> Last Login:
                  </span>
                  <span className="font-mono text-slate-200">{getVal(userDetail.lastLoginAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Created Date:</span>
                  <span className="font-mono text-slate-200">{getVal(userDetail.createdDate || userDetail.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Updated Date:</span>
                  <span className="font-mono text-slate-200">{getVal(userDetail.updatedDate || userDetail.updatedAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Created By:</span>
                  <span className="font-semibold text-slate-200">{getVal(userDetail.createdBy)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Login Provider:</span>
                  <span className="font-semibold text-slate-200">{getVal(userDetail.loginProvider)}</span>
                </div>
              </div>
            </div>

            {/* Storage Usage Notice */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-white/10 text-slate-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Storage Used</span>
              </div>
              <span className="font-bold text-amber-400">{getVal(userDetail.storageUsed)}</span>
            </div>

            {/* Enabled Features (Read Only Matrix) */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Enabled Features (Read Only)</span>
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {userDetail.enabledFeatures.map((feat) => (
                  <div
                    key={feat.name}
                    className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-between ${
                      feat.enabled
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800/50 border-white/5 text-slate-500'
                    }`}
                  >
                    <span>{feat.name}</span>
                    {feat.enabled ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Close Button */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => setSelectedUserIdForDrawer(null)}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
