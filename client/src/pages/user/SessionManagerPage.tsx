import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Copy,
  Key,
  Laptop,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Skeleton } from '../../components/ui/Skeleton.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ApiResponse, InviteItem, SessionItem, User, UserRole } from '../../types/index.js';
import { StealthSettings } from '../../components/stealth/StealthSettings.js';
import { copyToClipboard } from '../../utils/clipboard.js';

export const SessionManagerPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'sessions' | 'security' | 'invites' | 'users' | 'stealth'>('sessions');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Invite Generator State
  const [targetRole, setTargetRole] = useState<UserRole>('CO_OWNER');
  const [targetEmail, setTargetEmail] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  // Fetch Active Sessions
  const { data: sessions, isLoading: loadingSessions, refetch: refetchSessions } = useQuery<SessionItem[]>({
    queryKey: ['activeSessions'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<SessionItem[]>>('/auth/sessions');
      return res.data.data!;
    },
  });

  // Fetch Invites (Super Owner)
  const { data: invites, isLoading: loadingInvites, refetch: refetchInvites } = useQuery<InviteItem[]>({
    queryKey: ['invitesList'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<InviteItem[]>>('/users/invites');
      return res.data.data!;
    },
    enabled: user?.role === 'SUPER_OWNER',
  });

  // Fetch Users List (Super Owner / Co Owner)
  const { data: usersList, isLoading: loadingUsers, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['usersList'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<User[]>>('/users');
      return res.data.data!;
    },
    enabled: user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER',
  });

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await axiosClient.delete(`/auth/sessions/${sessionId}`);
      addToast('Session Revoked', 'Target session has been logged out.', 'success');
      refetchSessions();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to revoke session', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Validation Error', 'New passwords do not match.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await axiosClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      addToast('Success', 'Password updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to change password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingInvite(true);
    try {
      const res = await axiosClient.post<ApiResponse<{ inviteCode: string; inviteLink: string }>>('/users/invites', {
        targetRole,
        email: targetEmail || undefined,
      });

      addToast('Invite Created!', `Code: ${res.data.data?.inviteCode}`, 'success');
      setTargetEmail('');
      refetchInvites();
    } catch (err: any) {
      addToast('Invite Failed', err.message || 'Unable to generate invite code.', 'error');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleUserAction = async (action: 'suspend' | 'restore' | 'delete' | 'revoke', targetId: string) => {
    try {
      if (action === 'suspend') {
        await axiosClient.patch(`/users/${targetId}/suspend`);
        addToast('User Suspended', 'User account suspended and sessions revoked.', 'warning');
      } else if (action === 'restore') {
        await axiosClient.patch(`/users/${targetId}/restore`);
        addToast('User Restored', 'User status set to ACTIVE.', 'success');
      } else if (action === 'delete') {
        await axiosClient.delete(`/users/${targetId}`);
        addToast('User Deleted', 'User account removed.', 'info');
      } else if (action === 'revoke') {
        await axiosClient.post(`/users/${targetId}/revoke-sessions`);
        addToast('Sessions Revoked', 'Forced logout executed for target user.', 'info');
      }
      refetchUsers();
    } catch (err: any) {
      addToast('Action Failed', err.message || 'Operation error', 'error');
    }
  };

  const handleCopyCode = async (text: string) => {
    await copyToClipboard(text);
    addToast('Copied', 'Invite code copied to clipboard', 'info');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="p-6 border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-afzal via-amrin to-heart p-0.5 shadow-lg">
                <div className="w-full h-full bg-obsidian-950 rounded-[14px] flex items-center justify-center text-white font-extrabold text-xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                  <Badge variant={user?.role === 'SUPER_OWNER' ? 'green' : user?.role === 'CO_OWNER' ? 'violet' : 'cyan'}>
                    {user?.role}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="danger" size="sm" onClick={logout} leftIcon={<LogOut className="w-4 h-4" />}>
                Logout All
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <Button
          variant={activeTab === 'sessions' ? 'cyan' : 'glass'}
          size="sm"
          onClick={() => setActiveTab('sessions')}
          leftIcon={<Laptop className="w-4 h-4" />}
        >
          Active Sessions
        </Button>
        <Button
          variant={activeTab === 'security' ? 'violet' : 'glass'}
          size="sm"
          onClick={() => setActiveTab('security')}
          leftIcon={<Lock className="w-4 h-4" />}
        >
          Change Password
        </Button>

        {user?.role === 'SUPER_OWNER' && (
          <>
            <Button
              variant={activeTab === 'invites' ? 'cyan' : 'glass'}
              size="sm"
              onClick={() => setActiveTab('invites')}
              leftIcon={<Key className="w-4 h-4" />}
            >
              Invites Generator
            </Button>
            <Button
              variant={activeTab === 'users' ? 'violet' : 'glass'}
              size="sm"
              onClick={() => setActiveTab('users')}
              leftIcon={<Users className="w-4 h-4" />}
            >
              User Administration
            </Button>
            <Button
              variant={activeTab === 'stealth' ? 'cyan' : 'glass'}
              size="sm"
              onClick={() => setActiveTab('stealth')}
              leftIcon={<Shield className="w-4 h-4" />}
            >
              Stealth Mode
            </Button>
          </>
        )}
      </div>

      {/* Tab 1: Active Sessions */}
      {activeTab === 'sessions' && (
        <Card variant="glass" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg">Logged-in Devices & Sessions</h3>
            <Button variant="glass" size="sm" onClick={() => refetchSessions()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
          </div>

          {loadingSessions ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session._id} className="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Laptop className="w-5 h-5 text-afzal shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-white">{session.userAgent}</div>
                      <div className="text-[11px] text-slate-400 font-mono">IP: {session.ipAddress} • Active: {new Date(session.lastActiveAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRevokeSession(session._id)}>
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active session records found.</p>
          )}
        </Card>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <Card variant="glass" className="max-w-xl space-y-6">
          <h3 className="font-bold text-white text-lg">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 px-4 text-sm text-white focus:border-amrin"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 px-4 text-sm text-white focus:border-amrin"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 px-4 text-sm text-white focus:border-amrin"
              />
            </div>
            <Button type="submit" variant="violet" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: Invites Generator (Super Owner) */}
      {activeTab === 'invites' && user?.role === 'SUPER_OWNER' && (
        <div className="space-y-6">
          <Card variant="glass" className="space-y-4 max-w-xl">
            <h3 className="font-bold text-white text-lg">Generate Invitation Code</h3>
            <form onSubmit={handleGenerateInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as UserRole)}
                  className="w-full bg-obsidian-950 border border-slate-700 rounded-xl py-2.5 px-4 text-sm text-white"
                >
                  <option value="CO_OWNER">CO_OWNER (Amrin / Primary Co-Owner)</option>
                  <option value="INVITED_USER">INVITED_USER (Family / Member)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Email (Optional)</label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="amrin@afrinuniverse.com"
                  className="w-full bg-obsidian-950/80 border border-slate-700/80 rounded-xl py-2.5 px-4 text-sm text-white"
                />
              </div>

              <Button type="submit" variant="cyan" leftIcon={<Plus className="w-4 h-4" />} isLoading={isGeneratingInvite}>
                Create Invitation Code
              </Button>
            </form>
          </Card>

          <Card variant="glass" className="space-y-4">
            <h3 className="font-bold text-white text-lg">Generated Invites History</h3>
            {loadingInvites ? (
              <Skeleton className="h-20" />
            ) : invites && invites.length > 0 ? (
              <div className="space-y-3">
                {invites.map((inv) => (
                  <div key={inv._id} className="glass-card p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm tracking-wider">{inv.code}</span>
                        <Badge variant={inv.isUsed ? 'gray' : 'green'}>{inv.isUsed ? 'USED' : 'ACTIVE'}</Badge>
                        <Badge variant="violet" size="sm">{inv.targetRole}</Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Expires: {new Date(inv.expiresAt).toLocaleDateString()} {inv.email ? `• Target: ${inv.email}` : ''}
                      </div>
                    </div>
                    {!inv.isUsed && (
                      <Button variant="glass" size="sm" onClick={() => handleCopyCode(inv.code)} leftIcon={<Copy className="w-3.5 h-3.5" />}>
                        Copy Code
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No invitations generated yet.</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 4: User Administration (Super Owner) */}
      {activeTab === 'users' && (user?.role === 'SUPER_OWNER' || user?.role === 'CO_OWNER') && (
        <Card variant="glass" className="space-y-4">
          <h3 className="font-bold text-white text-lg">User Directory</h3>
          {loadingUsers ? (
            <Skeleton className="h-32" />
          ) : usersList && usersList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-obsidian-950/80 text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last Login</th>
                    {user?.role === 'SUPER_OWNER' && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersList.map((usr) => (
                    <tr key={usr.id || (usr as any)._id} className="hover:bg-white/5">
                      <td className="p-3">
                        <div className="font-semibold text-white">{usr.name}</div>
                        <div className="text-slate-400 text-[11px]">{usr.email}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={usr.role === 'SUPER_OWNER' ? 'green' : usr.role === 'CO_OWNER' ? 'violet' : 'cyan'}>
                          {usr.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={usr.status === 'ACTIVE' ? 'green' : 'rose'}>{usr.status}</Badge>
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        {usr.lastLoginAt ? new Date(usr.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      {user?.role === 'SUPER_OWNER' && usr.role !== 'SUPER_OWNER' && (
                        <td className="p-3 text-right space-x-2">
                          {usr.status === 'ACTIVE' ? (
                            <Button variant="outline" size="sm" onClick={() => handleUserAction('suspend', usr.id || (usr as any)._id)}>
                              Suspend
                            </Button>
                          ) : (
                            <Button variant="cyan" size="sm" onClick={() => handleUserAction('restore', usr.id || (usr as any)._id)}>
                              Restore
                            </Button>
                          )}
                          <Button variant="danger" size="sm" onClick={() => handleUserAction('delete', usr.id || (usr as any)._id)}>
                            Delete
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No users found.</p>
          )}
        </Card>
      )}

      {/* Tab 5: Stealth Mode (Super Owner) */}
      {activeTab === 'stealth' && user?.role === 'SUPER_OWNER' && (
        <StealthSettings />
      )}

    </div>
  );
};
