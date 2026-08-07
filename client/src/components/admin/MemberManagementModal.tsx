import React, { useEffect, useState } from 'react';
import { Search, UserPlus, Trash2, ArrowRightLeft, ShieldAlert, X } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { AdminUserListItem } from '../../types/admin.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  relationship: {
    id: string;
    name: string;
    members: Array<{ id: string; name: string; email?: string; role: string; avatar?: string }>;
  } | null;
  allUsers?: Array<{ id: string; name: string; email: string; avatar?: string }>;
}

const MemberManagementModal: React.FC<Props> = ({ isOpen, onClose, relationship }) => {
  // Member Search State (Server-Side)
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AdminUserListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedAddUserId, setSelectedAddUserId] = useState('');
  const [selectedAddRole, setSelectedAddRole] = useState('MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  // Replace Member State
  const [replacingOldUserId, setReplacingOldUserId] = useState<string | null>(null);
  const [selectedReplaceUserId, setSelectedReplaceUserId] = useState('');
  const [replacingMember, setReplacingMember] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Debounced server-side member search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await adminApi.getUsers({ search: memberSearchQuery, limit: 10 });
        setSearchResults(res.users);
      } catch (err) {
        console.error('Member search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [memberSearchQuery, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setSelectedAddUserId('');
      setReplacingOldUserId(null);
    }
  }, [isOpen]);

  if (!isOpen || !relationship) return null;

  const handleRemoveMember = async (userId: string) => {
    setActionLoading(userId);
    setError('');
    try {
      await adminApi.removeMember(relationship.id, userId);
      setSuccessMsg('Member removed successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove member.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddMember = async () => {
    if (!selectedAddUserId) return;
    setAddingMember(true);
    setError('');
    try {
      await adminApi.addMember(relationship.id, selectedAddUserId, selectedAddRole);
      setSuccessMsg('Member added successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setSelectedAddUserId('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleReplaceMember = async () => {
    if (!replacingOldUserId || !selectedReplaceUserId) return;
    setReplacingMember(true);
    setError('');
    try {
      await adminApi.replaceMember(relationship.id, replacingOldUserId, selectedReplaceUserId);
      setSuccessMsg('Member replaced successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setReplacingOldUserId(null);
      setSelectedReplaceUserId('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to replace member.');
    } finally {
      setReplacingMember(false);
    }
  };

  const currentMemberIds = relationship.members.map((m) => m.id);
  const availableUsersForAdd = searchResults.filter((u) => !currentMemberIds.includes(u.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl text-white overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="font-extrabold text-base text-white">Member Management</h3>
              <p className="text-xs text-slate-400">{relationship.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">{error}</div>}
          {successMsg && <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs">{successMsg}</div>}

          {/* Current Members List */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Current Relationship Members</h4>
            <div className="space-y-2">
              {relationship.members.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                      alt={m.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <p className="font-bold text-white">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.email || 'No email specified'} • Role: <strong className="text-rose-300">{m.role}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setReplacingOldUserId(replacingOldUserId === m.id ? null : m.id)}
                      className="px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <ArrowRightLeft className="w-3 h-3" /> Replace
                    </button>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={actionLoading === m.id}
                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Replace Member Interface */}
          {replacingOldUserId && (
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3">
              <h4 className="font-bold text-xs text-blue-300 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4" /> Replace Member
              </h4>
              <p className="text-[11px] text-slate-400">Search for a replacement user below:</p>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search replacement user by name/email..."
                    className="w-full bg-slate-800 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <select
                  value={selectedReplaceUserId}
                  onChange={(e) => setSelectedReplaceUserId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">Select replacement user...</option>
                  {availableUsersForAdd.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setReplacingOldUserId(null)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReplaceMember}
                    disabled={!selectedReplaceUserId || replacingMember}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition disabled:opacity-50"
                  >
                    {replacingMember ? 'Replacing...' : 'Confirm Replacement'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Member Interface (Server-Side Search) */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Add Member to Relationship
            </h4>

            {/* Server-side Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Server-side search users (supports thousands)..."
                className="w-full bg-slate-800 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={selectedAddUserId}
                onChange={(e) => setSelectedAddUserId(e.target.value)}
                className="sm:col-span-2 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">Select candidate user...</option>
                {availableUsersForAdd.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>

              <select
                value={selectedAddRole}
                onChange={(e) => setSelectedAddRole(e.target.value)}
                className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="CO_OWNER">CO_OWNER</option>
                <option value="SUPER_OWNER">SUPER_OWNER</option>
              </select>
            </div>

            <button
              onClick={handleAddMember}
              disabled={!selectedAddUserId || addingMember}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {addingMember ? 'Adding Member...' : 'Add Member to Relationship'}
            </button>
          </div>

          {/* Ownership Transfer ("Coming Soon") Button */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <div>
                <strong className="text-amber-200 block">Ownership Transfer</strong>
                <span className="text-[10px] text-amber-400/80">Transfer primary ownership to another member.</span>
              </div>
            </div>
            <button
              disabled
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs cursor-not-allowed border border-amber-500/30 opacity-70 flex items-center gap-1"
            >
              <span>Coming Soon</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-800/50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberManagementModal;
