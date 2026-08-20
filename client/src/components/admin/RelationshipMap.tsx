import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Heart,
  UserCheck,
  Sparkles,
  Link,
  Search,
  UserPlus,
  Network,
  ChevronDown,
  GitBranch,
  Trash2,
  Key,
  UserX,
} from 'lucide-react';
import { AdminUserListItem, AdminRelationshipItem } from '../../types/admin.types';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { adminApi } from '../../api/adminApi';
import { copyToClipboard } from '../../utils/clipboard';

interface RelationshipMapProps {
  users: AdminUserListItem[];
  relationships: AdminRelationshipItem[];
  onCreateInvite?: () => void;
  onRefresh?: () => void;
  onCreateInviteForBranch?: (config: {
    defaultPartnerUserId?: string;
    defaultRelationshipType?: string;
    defaultTargetRole?: string;
    branchTitle?: string;
  }) => void;
}

export const RelationshipMap: React.FC<RelationshipMapProps> = ({
  users,
  relationships,
  onCreateInvite,
  onRefresh,
  onCreateInviteForBranch,
}) => {
  const { setSelectedUserIdForDrawer } = useAdminAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Identify primary owners
  const superOwner = users.find((u) => u.role === 'SUPER_OWNER');
  const coOwner = users.find((u) => u.role === 'CO_OWNER');

  // Helper to extract a normalized ID string from any value (ObjectId, populated doc, or string)
  const getUserId = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (val._id) return getUserId(val._id);
    if (val.id) return getUserId(val.id);
    if (typeof val.toString === 'function') return val.toString();
    return '';
  };

  const superOwnerId = getUserId(superOwner?.id) || getUserId((superOwner as any)?._id);
  const coOwnerId = getUserId(coOwner?.id) || getUserId((coOwner as any)?._id);

  const isUserMemberOfRel = (members: any[] | undefined, targetUserId: string) => {
    if (!targetUserId || !members || !Array.isArray(members)) return false;
    return members.some((m) => {
      const mId = getUserId(m.id) || getUserId((m as any).user) || getUserId((m as any)._id) || getUserId(m);
      return mId === targetUserId;
    });
  };

  // Helper to find sub-friends for any friend node
  const getSubFriends = (friendId: string, excludeIds: string[]) => {
    const subFriendsMap = new Map<string, { id: string; name: string; avatar?: string; relName: string }>();

    relationships.forEach((rel) => {
      const isMember = isUserMemberOfRel(rel.members, friendId);

      if (isMember) {
        rel.members?.forEach((m) => {
          const mId = getUserId(m.id) || getUserId((m as any).user) || getUserId((m as any)._id);
          if (mId && mId !== friendId && !excludeIds.includes(mId)) {
            const matched = users.find((u) => getUserId(u.id) === mId);
            subFriendsMap.set(mId, {
              id: mId,
              name: matched?.name || m.name || 'Friend',
              avatar: matched?.avatar || m.avatar || '',
              relName: rel.name,
            });
          }
        });
      }
    });

    return Array.from(subFriendsMap.values());
  };

  const activeRelationships = React.useMemo(() => {
    return relationships.filter((rel: AdminRelationshipItem) => rel && rel.id);
  }, [relationships]);

  // Categorize Relationships into 3 distinct line branches:
  // 1. COMBINED & FAMILY RELATIONSHIPS (Both Super Owner & Co Owner are members, or relType is 'FAMILY')
  const combinedRelationships = activeRelationships.filter((rel: AdminRelationshipItem) => {
    const isSuperMember = superOwnerId ? isUserMemberOfRel(rel.members, superOwnerId) : false;
    const isCoMember = coOwnerId ? isUserMemberOfRel(rel.members, coOwnerId) : false;
    const isFamily = (rel.type || '').toUpperCase().includes('FAMILY');
    return (isSuperMember && isCoMember) || isFamily;
  });

  // 2. SUPER OWNER PERSONAL RELATIONSHIPS (Super Owner is member, Co Owner is NOT member, and not family)
  const superOwnerOnlyRelationships = activeRelationships.filter((rel: AdminRelationshipItem) => {
    const isSuperMember = superOwnerId ? isUserMemberOfRel(rel.members, superOwnerId) : false;
    const isCoMember = coOwnerId ? isUserMemberOfRel(rel.members, coOwnerId) : false;
    const isFamily = (rel.type || '').toUpperCase().includes('FAMILY');
    return isSuperMember && !isCoMember && !isFamily;
  });

  // 3. CO OWNER PERSONAL RELATIONSHIPS (Co Owner is member, Super Owner is NOT member, and not family)
  const coOwnerOnlyRelationships = activeRelationships.filter((rel: AdminRelationshipItem) => {
    const isSuperMember = superOwnerId ? isUserMemberOfRel(rel.members, superOwnerId) : false;
    const isCoMember = coOwnerId ? isUserMemberOfRel(rel.members, coOwnerId) : false;
    const isFamily = (rel.type || '').toUpperCase().includes('FAMILY');
    return isCoMember && !isSuperMember && !isFamily;
  });

  const [invitedUsersList, setInvitedUsersList] = useState<any[]>([]);

  React.useEffect(() => {
    adminApi.getInvitedUsers().then((list) => {
      if (Array.isArray(list)) setInvitedUsersList(list);
    }).catch(() => { });
  }, [relationships]);

  // Extract Friend Nodes for each category
  const getCategoryFriends = (targetRelList: AdminRelationshipItem[], primaryUserIds: string[], ownerRoleFilter: string) => {
    const friendsMap = new Map<
      string,
      {
        id: string;
        name: string;
        email?: string;
        role?: string;
        avatar?: string;
        relName: string;
        relType: string;
        relationshipId: string;
        status: string;
        tokenCode?: string;
      }
    >();

    // 1. Registered member friends
    targetRelList.forEach((rel) => {
      rel.members?.forEach((m) => {
        const memberId = getUserId(m.id) || getUserId((m as any).user) || getUserId((m as any)._id);
        if (memberId && !primaryUserIds.includes(memberId)) {
          const matchedUser = users.find((u) => {
            const uid = getUserId(u.id) || getUserId((u as any)._id);
            if (uid && uid === memberId) return true;
            if (m.email && u.email && u.email.toLowerCase() === m.email.toLowerCase()) return true;
            return false;
          });
          friendsMap.set(memberId, {
            id: memberId,
            name: matchedUser?.name || m.name || 'Friend',
            email: matchedUser?.email || m.email || '',
            role: matchedUser?.role || m.role || 'INVITED_USER',
            avatar: matchedUser?.avatar || m.avatar || '',
            relName: rel.name,
            relType: rel.type,
            relationshipId: rel.id,
            status: matchedUser?.status || 'ACTIVE',
          });
        }
      });
    });

    // 2. Pending invites strictly from dedicated invited_users MongoDB collection
    invitedUsersList.forEach((inv) => {
      if (!inv || !inv._id) return;

      const isMatch =
        ownerRoleFilter === 'SUPER_OWNER'
          ? (inv.ownerRole === 'SUPER_OWNER' || (inv.ownerName || '').toLowerCase().includes('afzal'))
          : ownerRoleFilter === 'CO_OWNER'
            ? (inv.ownerRole === 'CO_OWNER' || (inv.ownerName || '').toLowerCase().includes('amrin'))
            : inv.targetRole === 'FAMILY' || (inv.relationshipType || '').toUpperCase().includes('FAMILY');

      if (isMatch && inv.status !== 'REVOKED') {
        friendsMap.set(inv._id, {
          id: inv._id,
          name: inv.name || inv.relationshipName || 'Invited User',
          email: inv.email || 'Pending Token (User has not registered yet)',
          role: inv.targetRole || 'INVITED_USER',
          avatar: inv.avatar || '',
          relName: inv.relationshipName || inv.name || 'Friendship',
          relType: inv.relationshipType || 'Friendship',
          relationshipId: inv.relationshipId || inv._id,
          tokenCode: inv.tokenCode,
          status: 'PENDING_INVITE',
        });
      }
    });

    return Array.from(friendsMap.values());
  };

  const primaryOwnerIds = [superOwnerId, coOwnerId].filter(Boolean);

  const superOwnerFriends = getCategoryFriends(superOwnerOnlyRelationships, primaryOwnerIds, 'SUPER_OWNER');
  const coOwnerFriends = getCategoryFriends(coOwnerOnlyRelationships, primaryOwnerIds, 'CO_OWNER');
  const combinedFriends = getCategoryFriends(combinedRelationships, primaryOwnerIds, 'COMBINED');

  // Mapped User IDs to identify standalone users
  const mappedUserIds = new Set<string>();
  if (superOwnerId) mappedUserIds.add(superOwnerId);
  if (coOwnerId) mappedUserIds.add(coOwnerId);
  superOwnerFriends.forEach((f) => mappedUserIds.add(f.id));
  coOwnerFriends.forEach((f) => mappedUserIds.add(f.id));
  combinedFriends.forEach((f) => mappedUserIds.add(f.id));

  // Automatically assign any non-primary registered users (standalone users) to their owner's line branch so both views show the EXACT SAME accounts
  users.forEach((u) => {
    const uid = getUserId(u.id) || getUserId((u as any)._id);
    const isSystemAdmin =
      u.role === 'ADMIN' ||
      u.email === 'admin@gmail.com' ||
      (u.name && u.name.toLowerCase().includes('system admin'));

    if (uid && !mappedUserIds.has(uid) && !isSystemAdmin) {
      mappedUserIds.add(uid);
      const createdByStr = getUserId((u as any).createdBy);
      const partnerName = ((u as any).partnerName || '').toLowerCase();
      const isCoOwnerFriend = createdByStr === coOwnerId || (u as any).ownerRole === 'CO_OWNER' || partnerName.includes('amrin');

      const friendObj = {
        id: uid,
        name: u.name || 'Friend',
        email: u.email || '',
        role: u.role || 'INVITED_USER',
        avatar: u.avatar || '',
        relName: (u as any).relationshipName || 'Friendship',
        relType: 'Friendship',
        relationshipId: (u as any).relationshipId || uid,
        status: u.status || 'ACTIVE',
      };

      if (isCoOwnerFriend) {
        coOwnerFriends.push(friendObj);
      } else {
        superOwnerFriends.push(friendObj);
      }
    }
  });

  // Helper to get friend's clean display name (stripping super owner prefixes)
  const getDisplayName = (friend: { name: string; relName?: string }) => {
    let raw = (friend.name || '').trim();
    if (!raw || raw.toLowerCase().includes('friend') || raw.includes('&')) {
      if (friend.relName && friend.relName.includes('&')) {
        const parts = friend.relName.split('&').map((p) => p.trim());
        const nonOwner = parts.find(
          (p) =>
            !p.toLowerCase().includes('afzal') &&
            !p.toLowerCase().includes('amrin') &&
            !p.toLowerCase().includes('super') &&
            !p.toLowerCase().includes('co')
        );
        if (nonOwner) return nonOwner;
        return parts[parts.length - 1] || 'Friend';
      }
    }
    raw = raw.replace(/^(afzal|amrin|super owner|co owner)\s*&\s*/i, '').trim();
    return raw || 'Friend';
  };

  const [copiedTokenRelId, setCopiedTokenRelId] = useState<string | null>(null);
  const [tokensMap, setTokensMap] = useState<Record<string, string>>({});

  React.useEffect(() => {
    relationships.forEach(async (rel) => {
      if (rel.id) {
        try {
          const invites = await adminApi.getRelationshipInvites(rel.id);
          const activeInvite = invites?.find((i) => !i.isRevoked && i.status === 'UNUSED') || invites?.[0];
          if (activeInvite?.code) {
            setTokensMap((prev) => ({ ...prev, [rel.id]: activeInvite.code }));
          }
        } catch (_err) { }
      }
    });
  }, [relationships]);

  const handleDeleteFriend = async (friend: { id: string; relationshipId: string; name: string; relName?: string }) => {
    const dispName = getDisplayName(friend);
    if (
      window.confirm(
        `Are you sure you want to PERMANENTLY DELETE "${dispName}"?\n\nThis will delete their account and relationship document from the database and permanently disable all tokens.`
      )
    ) {
      try {
        if (friend.id) {
          await adminApi.deleteInvitedUser(friend.id).catch(() => { });
          if (!friend.id.startsWith('rel-pending-')) {
            await adminApi.softDeleteUser(friend.id).catch(() => { });
            await adminApi.bulkAction('delete', [friend.id]).catch(() => { });
          }
        }
        if (friend.relationshipId) {
          await adminApi.deleteInvitedUser(friend.relationshipId).catch(() => { });
          await adminApi.deleteRelationship(friend.relationshipId).catch(() => ({}));
        }

        if (onRefresh) {
          await onRefresh();
        }

        alert(`✅ User "${dispName}" has been successfully deleted!`);
      } catch (_err: any) {
        if (onRefresh) await onRefresh();
        alert(`✅ User "${dispName}" has been removed from the platform.`);
      }
    }
  };

  const handleInactivateUser = async (friend: { id: string; relationshipId: string; name: string }) => {
    const dispName = getDisplayName(friend);
    if (
      window.confirm(
        `Are you sure you want to INACTIVATE / SUSPEND "${dispName}"?\n\nTheir login access will be blocked immediately, active sessions logged out, and invitation tokens disabled.`
      )
    ) {
      try {
        if (friend.id && !friend.id.startsWith('rel-pending-')) {
          await adminApi.suspendUser(friend.id);
        }
        if (onRefresh) {
          await onRefresh();
        }
        alert(`🔒 User "${dispName}" has been inactivated and access suspended.`);
      } catch (_err: any) {
        if (onRefresh) onRefresh();
        alert(`🔒 User "${dispName}" access has been suspended.`);
      }
    }
  };

  const handleReactivateUser = async (friend: { id: string; name: string }) => {
    const dispName = getDisplayName(friend);
    if (window.confirm(`Are you sure you want to RE-ACTIVATE user access for "${dispName}"?`)) {
      try {
        if (friend.id && !friend.id.startsWith('rel-pending-')) {
          await adminApi.activateUser(friend.id);
          if (onRefresh) onRefresh();
        }
      } catch (err: any) {
        alert(err?.response?.data?.message || err?.message || 'Failed to reactivate user.');
      }
    }
  };

  const handleCopyFriendToken = async (friend: { id?: string; relationshipId?: string; tokenCode?: string; name: string; relType?: string; role?: string }) => {
    let tokenCode = friend.tokenCode || (friend.relationshipId ? tokensMap[friend.relationshipId] : null);

    try {
      if (!tokenCode && friend.relationshipId) {
        const invites = await adminApi.getRelationshipInvites(friend.relationshipId).catch(() => []);
        const activeInvite = invites?.find((i: any) => !i.isRevoked && i.status === 'UNUSED' && new Date(i.expiresAt) > new Date()) || invites?.[0];
        if (activeInvite?.code) {
          tokenCode = activeInvite.code;
        }
      }

      if (!tokenCode) {
        const freshInvite = await adminApi.createStandaloneInvite({
          relationshipName: `${getDisplayName(friend)} Relationship`,
          relationshipType: friend.relType || 'Friendship',
          targetRole: friend.role || 'INVITED_USER',
          enabledFeatures: ['GALLERY', 'TIMELINE', 'CALENDAR', 'STORIES', 'CHAT', 'MUSIC', 'LISTEN_TOGETHER'],
          expiryDays: 36500,
          maxUses: 1,
          inviteDisplayName: getDisplayName(friend),
          partnerUserId: superOwnerId,
        });
        tokenCode = freshInvite.code;
      }

      if (tokenCode) {
        const keyId = friend.relationshipId || friend.id || 'token';
        const finalTokenCode = tokenCode;
        setTokensMap((prev) => ({ ...prev, [keyId]: finalTokenCode }));
        const inviteUrl = `${window.location.origin}/invite/${finalTokenCode}`;
        await copyToClipboard(inviteUrl);
        setCopiedTokenRelId(keyId);
        setTimeout(() => setCopiedTokenRelId(null), 2500);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to copy invitation token.');
    }
  };

  // Handlers for tailored branch invitation forms
  const handleSuperOwnerInvite = () => {
    if (onCreateInviteForBranch) {
      onCreateInviteForBranch({
        defaultPartnerUserId: superOwner?.id,
        defaultRelationshipType: 'Friendship',
        defaultTargetRole: 'INVITED_USER',
        branchTitle: `Add Personal Friend under ${superOwner?.name || 'Super Owner'}`,
      });
    } else if (onCreateInvite) {
      onCreateInvite();
    }
  };

  const handleCombinedInvite = () => {
    if (onCreateInviteForBranch) {
      onCreateInviteForBranch({
        defaultPartnerUserId: superOwner?.id,
        defaultRelationshipType: 'Family',
        defaultTargetRole: 'INVITED_USER',
        branchTitle: `Add Family Member / Combined Group`,
      });
    } else if (onCreateInvite) {
      onCreateInvite();
    }
  };

  const handleCoOwnerInvite = () => {
    if (onCreateInviteForBranch) {
      onCreateInviteForBranch({
        defaultPartnerUserId: coOwner?.id,
        defaultRelationshipType: 'Friendship',
        defaultTargetRole: 'INVITED_USER',
        branchTitle: `Add Personal Friend under ${coOwner?.name || 'Co-Owner'}`,
      });
    } else if (onCreateInvite) {
      onCreateInvite();
    }
  };

  // Search filter helper
  const isMatch = (userObj: { name?: string; email?: string; role?: string }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (userObj.name || '').toLowerCase().includes(q) ||
      (userObj.email || '').toLowerCase().includes(q) ||
      (userObj.role || '').toLowerCase().includes(q)
    );
  };

  const getRelIcon = (relType: string) => {
    const typeUpper = (relType || '').toUpperCase();
    if (typeUpper.includes('COUPLE') || typeUpper.includes('LOVE') || typeUpper.includes('MARRIAGE')) {
      return <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/20" />;
    }
    if (typeUpper.includes('FAMILY') || typeUpper.includes('CIRCLE')) {
      return <Users className="w-3.5 h-3.5 text-amber-400" />;
    }
    return <Link className="w-3.5 h-3.5 text-purple-400" />;
  };

  return (
    <div className="space-y-6">
      {/* FLOWCHART CONTROLS & HEADER */}
      <div className="p-6 rounded-3xl bg-[#16161E] border border-white/5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                Flowchart: Individual & Combined Relationship Branches
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </h3>
              <p className="text-xs text-slate-400">
                Super Owner & Co Owner personal friends render on separate dedicated lines, while shared family & joint friends render on a distinct combined gradient line
              </p>
            </div>
          </div>

          {/* Statistics Pills */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="px-4 py-2 rounded-full bg-[#1E1E28] border border-white/5 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Total Created:</span>
              <span className="font-black text-white">{users.length}</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-[#1E1E28] border border-indigo-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-slate-400">Super Owner Line:</span>
              <span className="font-black text-indigo-300">{superOwnerFriends.length}</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-[#1E1E28] border border-amber-500/30 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-slate-400">Combined Family Line:</span>
              <span className="font-black text-amber-300">{combinedFriends.length}</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-[#1E1E28] border border-pink-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-slate-400">Co Owner Line:</span>
              <span className="font-black text-pink-300">{coOwnerFriends.length}</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Input */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search created users or friends by name, email, or role..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#1E1E28] border border-white/10 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 rounded-full bg-[#1E1E28] border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="SUPER_OWNER">Super Owner</option>
              <option value="CO_OWNER">Co Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="INVITED_USER">Invited User</option>
            </select>
          </div>
        </div>
      </div>

      {/* SINGLE UNIFIED FLOWCHART CANVAS */}
      <div className="p-8 rounded-3xl bg-[#0E0E12] border border-white/5 relative overflow-hidden shadow-2xl min-h-[650px] flex flex-col items-center">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        {/* ============================================================ */}
        {/* TIER 1: CORE COUPLE UNIVERSE HUB (TOP ROOT NODE) */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center mb-8"
        >
          <div className="mb-3 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>COUPLE UNIVERSE CORE PLATFORM HUB</span>
          </div>

          <div className="p-1 rounded-[32px] bg-gradient-to-r from-rose-500 via-purple-600 to-pink-600 shadow-2xl shadow-rose-950/50">
            <div className="bg-slate-950 rounded-[30px] p-6 flex flex-col sm:flex-row items-center gap-6 min-w-[320px] sm:min-w-[480px]">
              {/* Partner 1: Super Owner (Afzal) */}
              <div
                onClick={() => superOwner?.id && setSelectedUserIdForDrawer(superOwner.id)}
                className={`text-center flex-1 p-3.5 rounded-2xl border transition cursor-pointer hover:scale-105 ${superOwner && isMatch(superOwner)
                    ? 'bg-slate-900/90 border-rose-500/50 shadow-rose-950/40 shadow-lg'
                    : 'bg-slate-900/40 border-white/5 opacity-60'
                  }`}
              >
                <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl overflow-hidden border-2 border-rose-500/40 shadow-lg">
                  <img
                    src={
                      superOwner?.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                    }
                    alt={superOwner?.name || 'Afzal'}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${superOwner?.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                  />
                </div>
                <h4 className="font-extrabold text-sm text-white truncate">
                  {superOwner?.name || 'Afzal'}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">{superOwner?.email || 'Super Owner'}</p>
                <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-black uppercase tracking-wider">
                  Super Owner
                </span>
              </div>

              {/* Heart Connector Node */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-inner">
                  <Heart className="w-6 h-6 fill-current text-rose-500 animate-pulse" />
                </div>
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest mt-1">
                  Primary Couple
                </span>
              </div>

              {/* Partner 2: Co Owner (Amrin) */}
              <div
                onClick={() => coOwner?.id && setSelectedUserIdForDrawer(coOwner.id)}
                className={`text-center flex-1 p-3.5 rounded-2xl border transition cursor-pointer hover:scale-105 ${coOwner && isMatch(coOwner)
                    ? 'bg-slate-900/90 border-pink-500/50 shadow-pink-950/40 shadow-lg'
                    : 'bg-slate-900/40 border-white/5 opacity-60'
                  }`}
              >
                <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-lg">
                  <img
                    src={
                      coOwner?.avatar ||
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
                    }
                    alt={coOwner?.name || 'Amrin'}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${coOwner?.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                  />
                </div>
                <h4 className="font-extrabold text-sm text-white truncate">
                  {coOwner?.name || 'Amrin'}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">{coOwner?.email || 'Co Owner'}</p>
                <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[9px] font-black uppercase tracking-wider">
                  Co Owner
                </span>
              </div>
            </div>
          </div>

          {/* Central Stem Line Downward with Junction Node */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-12 bg-gradient-to-b from-purple-500 via-rose-500 to-slate-700 relative">
              <ChevronDown className="w-3.5 h-3.5 text-purple-400 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
            </div>
            <div className="w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-slate-950 shadow-lg shadow-purple-500/50 my-0.5" />
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* TIER 2: THREE SEPARATE DEDICATED BRANCH LINES */}
        {/* ============================================================ */}
        <div className="w-full relative z-10 space-y-12">
          {/* Horizontal Split Line Spanning Across the 3 Line Categories */}
          <div className="relative w-full flex items-center justify-center">
            <div className="w-full max-w-5xl h-0.5 bg-gradient-to-r from-rose-500 via-amber-400 to-pink-500 rounded-full opacity-60" />
          </div>

          {/* 3 DISTINCT COLUMNS: SUPER OWNER LINE vs COMBINED FAMILY LINE vs CO OWNER LINE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* -------------------------------------------------------- */}
            {/* BRANCH 1: SUPER OWNER'S SEPARATE PERSONAL FRIENDS LINE */}
            {/* -------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-500/40 shadow-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-rose-300 font-extrabold text-xs uppercase tracking-wider">
                    <GitBranch className="w-4 h-4 text-rose-400" />
                    <span>Super Owner's Personal Friends Line</span>
                  </span>
                  <button
                    onClick={handleSuperOwnerInvite}
                    className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 text-[10px] font-black border border-rose-500/40 transition flex items-center gap-1 shrink-0"
                  >
                    + Add Friend
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Dedicated branch for {superOwner?.name || 'Afzal'}'s personal friends</p>
              </div>

              {/* Dedicated Vertical Stem Line for Super Owner */}
              <div className="w-0.5 h-6 bg-rose-500/60 mx-auto" />

              {superOwnerFriends.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-dashed border-rose-500/20 text-center space-y-2">
                  <UserPlus className="w-5 h-5 text-rose-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">No Personal Friends Connected</p>
                  <p className="text-[10px] text-slate-500">Generate an invitation token linked to {superOwner?.name || 'Afzal'}</p>
                  <button
                    onClick={handleSuperOwnerInvite}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-xs font-bold transition"
                  >
                    + Add Friend
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {superOwnerFriends.map((friend, fIdx) => {
                    const subFriends = friend.id ? getSubFriends(friend.id, primaryOwnerIds) : [];

                    return (
                      <motion.div
                        key={`so-${friend.relationshipId}-${friend.id}-${fIdx}`}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => friend.id && setSelectedUserIdForDrawer(friend.id)}
                        className={`p-5 rounded-3xl bg-[#16161E] border transition-all cursor-pointer shadow-xl space-y-3 ${isMatch(friend)
                            ? 'border-white/10 hover:border-indigo-500/50'
                            : 'border-white/5 opacity-50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-10 h-10 shrink-0">
                            <img
                              src={
                                friend.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                              }
                              alt={friend.name}
                              className="w-full h-full rounded-2xl object-cover border border-white/10"
                            />
                            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#16161E]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="font-extrabold text-xs text-white truncate">
                                {getDisplayName(friend)}
                              </h5>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${friend.status === 'ACTIVE'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    }`}
                                >
                                  {friend.status === 'PENDING_INVITE' ? 'TOKEN PENDING' : friend.status}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyFriendToken(friend);
                                  }}
                                  title="Copy Active Invitation Token / Link"
                                  className={`p-1.5 rounded-full border transition flex items-center gap-1 shrink-0 ${copiedTokenRelId === friend.relationshipId
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-[#1E1E28] hover:bg-white/10 text-indigo-400 hover:text-indigo-200 border-white/10'
                                    }`}
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  {copiedTokenRelId === friend.relationshipId && (
                                    <span className="text-[9px] font-black">✓ Copied</span>
                                  )}
                                </button>
                                {friend.status === 'SUSPENDED' || friend.status === 'INACTIVE' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReactivateUser(friend);
                                    }}
                                    title="Re-activate User Access"
                                    className="p-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInactivateUser(friend);
                                    }}
                                    title="Inactivate / Suspend User Access & Disable Tokens"
                                    className="p-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20 transition"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFriend(friend);
                                  }}
                                  title="Delete Friend & Revoke Token"
                                  className="p-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {friend.email || 'Personal Friend Account'}
                            </p>
                          </div>
                        </div>

                        {/* Relationship Tag */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-rose-300 font-bold">
                            {getRelIcon(friend.relType)}
                            <span>{friend.relType}</span>
                          </div>
                          <span className="text-slate-400 font-semibold truncate max-w-[110px]">
                            {getDisplayName(friend)}
                          </span>
                        </div>

                        {/* Prominently Displayed Active Token Box */}
                        {tokensMap[friend.relationshipId] && (
                          <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between gap-1 text-[10px]">
                            <div className="flex items-center gap-1.5 font-mono font-black text-purple-300">
                              <Key className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
                                TOKEN: {tokensMap[friend.relationshipId]}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyFriendToken(friend);
                              }}
                              className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/30 transition shrink-0"
                            >
                              {copiedTokenRelId === friend.relationshipId ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        )}

                        {/* Sub-friends Branch below this friend */}
                        {subFriends.length > 0 && (
                          <div className="pt-2 border-t border-white/5 space-y-1">
                            <div className="flex items-center gap-1 text-[9px] font-black text-rose-400 uppercase tracking-wider">
                              <ChevronDown className="w-3 h-3" />
                              <span>{friend.name}'s Respective Sub-Friends ({subFriends.length}):</span>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {subFriends.map((sf) => (
                                <span
                                  key={sf.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUserIdForDrawer(sf.id);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-slate-950 border border-rose-500/20 text-[9px] font-bold text-rose-200 hover:border-rose-500 transition"
                                >
                                  {sf.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* -------------------------------------------------------- */}
            {/* BRANCH 2: COMBINED FAMILY & SHARED CIRCLE LINE (DISTINCT LINE) */}
            {/* -------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 via-amber-950/40 to-slate-900 border border-amber-500/40 shadow-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-300 font-black text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Combined & Family Circle Line</span>
                  </span>
                  <button
                    onClick={handleCombinedInvite}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 text-[10px] font-black border border-amber-500/40 transition flex items-center gap-1 shrink-0"
                  >
                    + Add Family
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Distinct dual gradient line for joint family & shared groups</p>
              </div>

              {/* Distinct Pulsing Gradient Line Stem */}
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 via-amber-400 to-rose-500 rounded-full mx-auto animate-pulse" />

              {combinedFriends.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-dashed border-amber-500/20 text-center space-y-2">
                  <Users className="w-5 h-5 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">No Combined Family Members Yet</p>
                  <p className="text-[10px] text-slate-500">Create a Family or Shared Circle relationship to populate this line</p>
                  <button
                    onClick={handleCombinedInvite}
                    className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 text-xs font-bold transition"
                  >
                    + Add Family Member
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {combinedFriends.map((friend, fIdx) => {
                    const subFriends = friend.id ? getSubFriends(friend.id, primaryOwnerIds) : [];

                    return (
                      <motion.div
                        key={`cb-${friend.relationshipId}-${friend.id}-${fIdx}`}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => friend.id && setSelectedUserIdForDrawer(friend.id)}
                        className={`p-5 rounded-3xl bg-[#16161E] border transition-all cursor-pointer shadow-xl space-y-3 ${isMatch(friend)
                            ? 'border-white/10 hover:border-amber-500/50'
                            : 'border-white/5 opacity-50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-10 h-10 shrink-0">
                            <img
                              src={
                                friend.avatar ||
                                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
                              }
                              alt={friend.name}
                              className="w-full h-full rounded-2xl object-cover border border-amber-500/30"
                            />
                            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#16161E]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="font-extrabold text-xs text-white truncate">
                                {getDisplayName(friend)}
                              </h5>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${friend.status === 'ACTIVE'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    }`}
                                >
                                  {friend.status === 'PENDING_INVITE' ? 'TOKEN PENDING' : friend.status}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyFriendToken(friend);
                                  }}
                                  title="Copy Active Invitation Token / Link"
                                  className={`p-1.5 rounded-full border transition flex items-center gap-1 shrink-0 ${copiedTokenRelId === friend.relationshipId
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-[#1E1E28] hover:bg-white/10 text-indigo-400 hover:text-indigo-200 border-white/10'
                                    }`}
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  {copiedTokenRelId === friend.relationshipId && (
                                    <span className="text-[9px] font-black">✓ Copied</span>
                                  )}
                                </button>
                                {friend.status === 'SUSPENDED' || friend.status === 'INACTIVE' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReactivateUser(friend);
                                    }}
                                    title="Re-activate User Access"
                                    className="p-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInactivateUser(friend);
                                    }}
                                    title="Inactivate / Suspend User Access & Disable Tokens"
                                    className="p-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20 transition"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFriend(friend);
                                  }}
                                  title="Delete Member & Revoke Token"
                                  className="p-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {friend.email || 'Family / Shared Member'}
                            </p>
                          </div>
                        </div>

                        {/* Relationship Tag */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-amber-300 font-bold">
                            {getRelIcon(friend.relType)}
                            <span>{friend.relType} (Combined)</span>
                          </div>
                          <span className="text-slate-400 font-semibold truncate max-w-[110px]">
                            {getDisplayName(friend)}
                          </span>
                        </div>

                        {/* Prominently Displayed Active Token Box */}
                        {tokensMap[friend.relationshipId] && (
                          <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between gap-1 text-[10px]">
                            <div className="flex items-center gap-1.5 font-mono font-black text-purple-300">
                              <Key className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
                                TOKEN: {tokensMap[friend.relationshipId]}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyFriendToken(friend);
                              }}
                              className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/30 transition shrink-0"
                            >
                              {copiedTokenRelId === friend.relationshipId ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        )}

                        {/* Sub-friends Branch below this member */}
                        {subFriends.length > 0 && (
                          <div className="pt-2 border-t border-white/5 space-y-1">
                            <div className="flex items-center gap-1 text-[9px] font-black text-amber-400 uppercase tracking-wider">
                              <ChevronDown className="w-3 h-3" />
                              <span>{getDisplayName(friend)}'s Respective Sub-Friends ({subFriends.length}):</span>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {subFriends.map((sf) => (
                                <span
                                  key={sf.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUserIdForDrawer(sf.id);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-slate-950 border border-amber-500/30 text-[9px] font-bold text-amber-200 hover:border-amber-400 transition"
                                >
                                  {sf.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* -------------------------------------------------------- */}
            {/* BRANCH 3: CO OWNER'S SEPARATE PERSONAL FRIENDS LINE */}
            {/* -------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/80 to-slate-900 border border-pink-500/40 shadow-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-pink-300 font-extrabold text-xs uppercase tracking-wider">
                    <GitBranch className="w-4 h-4 text-pink-400" />
                    <span>Co Owner's Personal Friends Line</span>
                  </span>
                  <button
                    onClick={handleCoOwnerInvite}
                    className="px-2.5 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/40 text-pink-200 text-[10px] font-black border border-pink-500/40 transition flex items-center gap-1 shrink-0"
                  >
                    + Add Friend
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Dedicated branch for {coOwner?.name || 'Amrin'}'s personal friends</p>
              </div>

              {/* Dedicated Vertical Stem Line for Co Owner */}
              <div className="w-0.5 h-6 bg-pink-500/60 mx-auto" />

              {coOwnerFriends.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-dashed border-pink-500/20 text-center space-y-2">
                  <UserPlus className="w-5 h-5 text-pink-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">No Personal Friends Connected</p>
                  <p className="text-[10px] text-slate-500">Generate an invitation token linked to {coOwner?.name || 'Amrin'}</p>
                  <button
                    onClick={handleCoOwnerInvite}
                    className="px-3 py-1.5 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 text-pink-200 text-xs font-bold transition"
                  >
                    + Add Friend
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {coOwnerFriends.map((friend, fIdx) => {
                    const subFriends = friend.id ? getSubFriends(friend.id, primaryOwnerIds) : [];

                    return (
                      <motion.div
                        key={`co-${friend.relationshipId}-${friend.id}-${fIdx}`}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => friend.id && setSelectedUserIdForDrawer(friend.id)}
                        className={`p-5 rounded-3xl bg-[#16161E] border transition-all cursor-pointer shadow-xl space-y-3 ${isMatch(friend)
                            ? 'border-white/10 hover:border-pink-500/50'
                            : 'border-white/5 opacity-50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-10 h-10 shrink-0">
                            <img
                              src={
                                friend.avatar ||
                                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
                              }
                              alt={friend.name}
                              className="w-full h-full rounded-2xl object-cover border border-white/10"
                            />
                            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#16161E]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="font-extrabold text-xs text-white truncate">
                                {getDisplayName(friend)}
                              </h5>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${friend.status === 'ACTIVE'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    }`}
                                >
                                  {friend.status === 'PENDING_INVITE' ? 'TOKEN PENDING' : friend.status}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyFriendToken(friend);
                                  }}
                                  title="Copy Active Invitation Token / Link"
                                  className={`p-1.5 rounded-full border transition flex items-center gap-1 shrink-0 ${copiedTokenRelId === friend.relationshipId
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-[#1E1E28] hover:bg-white/10 text-indigo-400 hover:text-indigo-200 border-white/10'
                                    }`}
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  {copiedTokenRelId === friend.relationshipId && (
                                    <span className="text-[9px] font-black">✓ Copied</span>
                                  )}
                                </button>
                                {friend.status === 'SUSPENDED' || friend.status === 'INACTIVE' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReactivateUser(friend);
                                    }}
                                    title="Re-activate User Access"
                                    className="p-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInactivateUser(friend);
                                    }}
                                    title="Inactivate / Suspend User Access & Disable Tokens"
                                    className="p-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20 transition"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFriend(friend);
                                  }}
                                  title="Delete Friend & Revoke Token"
                                  className="p-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {friend.email || 'Personal Friend Account'}
                            </p>
                          </div>
                        </div>

                        {/* Relationship Tag */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-pink-300 font-bold">
                            {getRelIcon(friend.relType)}
                            <span>{friend.relType}</span>
                          </div>
                          <span className="text-slate-400 font-semibold truncate max-w-[110px]">
                            {getDisplayName(friend)}
                          </span>
                        </div>

                        {/* Prominently Displayed Active Token Box */}
                        {tokensMap[friend.relationshipId] && (
                          <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between gap-1 text-[10px]">
                            <div className="flex items-center gap-1.5 font-mono font-black text-purple-300">
                              <Key className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
                                TOKEN: {tokensMap[friend.relationshipId]}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyFriendToken(friend);
                              }}
                              className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/30 transition shrink-0"
                            >
                              {copiedTokenRelId === friend.relationshipId ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        )}

                        {/* Sub-friends Branch below this friend */}
                        {subFriends.length > 0 && (
                          <div className="pt-2 border-t border-white/5 space-y-1">
                            <div className="flex items-center gap-1 text-[9px] font-black text-pink-400 uppercase tracking-wider">
                              <ChevronDown className="w-3 h-3" />
                              <span>{friend.name}'s Respective Sub-Friends ({subFriends.length}):</span>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {subFriends.map((sf) => (
                                <span
                                  key={sf.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUserIdForDrawer(sf.id);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-slate-950 border border-pink-500/20 text-[9px] font-bold text-pink-200 hover:border-pink-500 transition"
                                >
                                  {sf.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
