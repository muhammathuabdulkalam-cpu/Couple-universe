import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, UserPlus, UserCircle2, Headphones, Radio, Sparkles } from 'lucide-react';
import { musicApi } from '../../api/musicApi';
import { useListenTogetherStore } from '../../store/listenTogetherStore';

interface ListenTogetherUserPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ListenTogetherUserPickerModal: React.FC<ListenTogetherUserPickerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [targets, setTargets] = useState<Array<{ id: string; name: string; avatar: string; role: string; email?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const { sendInvite } = useListenTogetherStore();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      musicApi
        .getListenTargets()
        .then((res) => setTargets(res || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendInviteToUser = async (targetId: string) => {
    setInvitingId(targetId);
    try {
      await sendInvite(targetId);
      onClose();
    } catch (_err) {
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-5 shadow-2xl text-white space-y-4 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  Select User to Invite
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-slate-400">Send an individual Listen Together invitation</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-6 text-slate-400 text-xs flex items-center justify-center gap-2">
                <Radio className="w-4 h-4 text-rose-400 animate-spin" />
                <span>Loading available users...</span>
              </div>
            ) : targets.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-400">No active users available to invite right now.</p>
              </div>
            ) : (
              targets.map((user) => {
                const hasAvatar = Boolean(user.avatar && user.avatar.trim() !== '' && !user.avatar.includes('unsplash.com'));
                const isInvitingThis = invitingId === user.id;

                return (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {hasAvatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0 shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center shrink-0">
                          <UserCircle2 className="w-5 h-5 text-slate-400" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {user.role === 'SUPER_OWNER' ? 'Super Owner' : user.role === 'CO_OWNER' ? 'Co-Owner' : 'Invited User'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isInvitingThis}
                      onClick={() => handleSendInviteToUser(user.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isInvitingThis ? 'Inviting...' : 'Invite 🎵'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
