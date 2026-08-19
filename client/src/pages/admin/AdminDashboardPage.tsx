import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Heart, Key } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import {
  AdminDashboardSummary,
  AdminRelationshipItem,
  AdminUserListItem,
} from '../../types/admin.types';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PrimaryCoupleOverview } from '../../components/admin/PrimaryCoupleOverview';
import { SystemHealthCards } from '../../components/admin/SystemHealthCards';
import { UsersTable } from '../../components/admin/UsersTable';
import { RelationshipsViewer } from '../../components/admin/RelationshipsViewer';
import { UserDetailDrawer } from '../../components/admin/UserDetailDrawer';
import UserModal from '../../components/admin/UserModal';
import RelationshipModal from '../../components/admin/RelationshipModal';
import MemberManagementModal from '../../components/admin/MemberManagementModal';
import { InviteManagementModal } from '../../components/admin/InviteManagementModal';
import { CreateInvitationModal } from '../../components/admin/CreateInvitationModal';
import { AdminSongsViewer } from '../../components/admin/AdminSongsViewer';
import { UploadSongModal } from '../..//components/music/UploadSongModal';
import { RelationshipMap } from '../../components/admin/RelationshipMap';

export const AdminDashboardPage: React.FC = () => {
  const { searchQuery, roleFilter, statusFilter } = useAdminAuthStore();

  const [dashboardData, setDashboardData] = useState<AdminDashboardSummary | null>(null);
  const [usersList, setUsersList] = useState<AdminUserListItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [relationships, setRelationships] = useState<AdminRelationshipItem[]>([]);
  const [totalSongsCount, setTotalSongsCount] = useState<number>(0);

  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Phase 3 Invitation Modal State & Admin Upload Modal State
  const [showCreateInviteModal, setShowCreateInviteModal] = useState(false);
  const [showAdminUploadModal, setShowAdminUploadModal] = useState(false);

  // Branch-Tailored Invitation Modal Config
  const [inviteModalConfig, setInviteModalConfig] = useState<{
    isOpen: boolean;
    defaultPartnerUserId?: string;
    defaultRelationshipType?: string;
    defaultTargetRole?: string;
    branchTitle?: string;
  }>({
    isOpen: false,
  });

  // Phase 2 modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showRelModal, setShowRelModal] = useState(false);
  const [editingRel, setEditingRel] = useState<any | null>(null);
  const [mmRelationship, setMmRelationship] = useState<any | null>(null);
  const [inviteRelationship, setInviteRelationship] = useState<{ id: string; name: string } | null>(null);

  // View Mode: 'table' vs 'map' (Visual flowchart) - defaulted to 'map' (flowchart first)
  const [usersViewMode, setUsersViewMode] = useState<'table' | 'map'>('map');
  const [allUsersList, setAllUsersList] = useState<AdminUserListItem[]>([]);

  // Selected users for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // 1. Fetch Dashboard Payload & Relationships on mount
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsDashboardLoading(true);
    try {
      const [summary, rels, uploadedRes] = await Promise.all([
        adminApi.getDashboardSummary(),
        adminApi.getRelationships(),
        adminApi.getUploadedSongs(1, 1).catch(() => ({ total: 0 })),
      ]);
      setDashboardData(summary);
      setRelationships(rels);
      setTotalSongsCount(uploadedRes.total || 0);
    } catch (err) {
      console.error('Failed to load admin dashboard payload:', err);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  const refreshRelationships = async () => {
    try {
      const rels = await adminApi.getRelationships();
      setRelationships(rels);
    } catch {}
  };

  // 2. Fetch All Created Users for Table Directory View and Flowchart
  const fetchUsers = async (pageToFetch: number = 1) => {
    setIsUsersLoading(true);
    try {
      const [res, allRes] = await Promise.all([
        adminApi.getUsers({
          page: pageToFetch,
          limit: 500,
          search: searchQuery,
          role: roleFilter,
          status: statusFilter,
        }),
        adminApi.getUsers({
          page: 1,
          limit: 1000,
        }).catch(() => ({ users: [] })),
      ]);
      setUsersList(res.users);
      setPagination(res.pagination);
      if (allRes.users && allRes.users.length > 0) {
        setAllUsersList(allRes.users);
      } else {
        setAllUsersList(res.users);
      }
    } catch (err) {
      console.error('Failed to fetch paginated admin users:', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    setSelectedUserIds([]);
  }, [searchQuery, roleFilter, statusFilter]);

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage);
  };

  // --- User Actions ---
  const handleSuspendUser = async (id: string) => {
    try {
      await adminApi.suspendUser(id);
      fetchUsers(pagination.page);
      fetchAll();
    } catch (err: any) {
      console.error('Suspend failed:', err);
    }
  };

  const handleActivateUser = async (id: string) => {
    try {
      await adminApi.activateUser(id);
      fetchUsers(pagination.page);
      fetchAll();
    } catch (err: any) {
      console.error('Activate failed:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to soft delete this user?')) return;
    try {
      await adminApi.softDeleteUser(id);
      fetchUsers(pagination.page);
      fetchAll();
    } catch (err: any) {
      console.error('Delete failed:', err);
    }
  };

  const handleRestoreUser = async (id: string) => {
    try {
      await adminApi.restoreUser(id);
      fetchUsers(pagination.page);
      fetchAll();
    } catch (err: any) {
      console.error('Restore failed:', err);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleBulkAction = async (action: 'suspend' | 'activate' | 'delete' | 'restore') => {
    if (selectedUserIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Soft delete ${selectedUserIds.length} user(s)?`)) return;
    setBulkLoading(true);
    try {
      await adminApi.bulkAction(action, selectedUserIds);
      setSelectedUserIds([]);
      fetchUsers(pagination.page);
      fetchAll();
    } catch (err: any) {
      console.error('Bulk action failed:', err);
    } finally {
      setBulkLoading(false);
    }
  };

  // --- Relationship Actions ---
  const handleEditRelationship = (rel: AdminRelationshipItem) => {
    setEditingRel({
      id: rel.id,
      name: rel.name,
      type: rel.type,
      coverImage: rel.coverImage,
      startDate: rel.startDate,
      status: rel.status,
    });
    setShowRelModal(true);
  };

  const handleArchiveRelationship = async (id: string) => {
    if (!window.confirm('Archive this relationship?')) return;
    try {
      await adminApi.archiveRelationship(id);
      refreshRelationships();
      fetchAll();
    } catch {}
  };

  const handleRestoreRelationship = async (id: string) => {
    try {
      await adminApi.restoreRelationship(id);
      refreshRelationships();
      fetchAll();
    } catch {}
  };

  const handleManageMembers = (rel: AdminRelationshipItem) => {
    setMmRelationship({
      id: rel.id,
      name: rel.name,
      members: rel.members.map((m) => ({ id: m.id, name: m.name, role: m.role, avatar: m.avatar })),
    });
  };

  const handleManageInvites = (rel: AdminRelationshipItem) => {
    setInviteRelationship({ id: rel.id, name: rel.name });
  };

  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'users' | 'relationships' | 'songs'>('dashboard');

  const stats = dashboardData?.platformStats;

  if (isDashboardLoading) {
    return (
      <AdminLayout activeTab={activeAdminTab} onSelectTab={(tab: any) => setActiveAdminTab(tab)}>
        <div className="admin-page-loader">
          <div className="admin-loader-spinner" />
          <p className="admin-loader-text">Loading Enterprise Admin Console...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab={activeAdminTab} onSelectTab={(tab: any) => setActiveAdminTab(tab)}>
      <div className="space-y-6">
        {/* Top Header Tab Selector Bar */}
        <div className="pb-3 pt-1 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveAdminTab('dashboard')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition shrink-0 ${
                activeAdminTab === 'dashboard'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('users')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition shrink-0 ${
                activeAdminTab === 'users'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Users Management ({stats?.totalUsers ?? 0})</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('songs')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition shrink-0 ${
                activeAdminTab === 'songs'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Songs & Music ({totalSongsCount} Tracks)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeAdminTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Super Owner & Co Owner Profile Overview Card */}
            {dashboardData?.primaryCouple && <PrimaryCoupleOverview data={dashboardData.primaryCouple} />}

            {/* Top Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div
                onClick={() => setActiveAdminTab('users')}
                className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1 cursor-pointer hover:border-rose-500/40 transition"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-black text-white">{stats?.totalUsers ?? 0}</p>
              </div>

              <div
                onClick={() => setActiveAdminTab('songs')}
                className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1 cursor-pointer hover:border-rose-500/40 transition"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Uploaded Songs</span>
                  <Key className="w-4 h-4 text-pink-400" />
                </div>
                <p className="text-2xl font-black text-pink-300">{totalSongsCount}</p>
              </div>

              <div
                onClick={() => setActiveAdminTab('users')}
                className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1 cursor-pointer hover:border-rose-500/40 transition"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Active Invited Users</span>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400">{stats?.activeUsers ?? 0}</p>
              </div>



              <div
                onClick={() => setShowCreateInviteModal(true)}
                className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1 cursor-pointer hover:border-rose-500/40 transition"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Active Invites</span>
                  <Key className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-300">{stats?.activeInvites ?? 0}</p>
              </div>

              <div
                onClick={() => setActiveAdminTab('users')}
                className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1 cursor-pointer hover:border-rose-500/40 transition"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Suspended Users</span>
                  <UserX className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400">{stats?.suspendedUsers ?? 0}</p>
              </div>
            </div>

            {/* Quick Actions Card Row */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                <p className="font-extrabold text-white">Quick Administrative Actions</p>
                <p className="text-slate-400">Launch invitation generation or song upload modules</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateInviteModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 text-white text-xs font-bold shadow transition"
                >
                  + Generate Invitation
                </button>
                <button
                  onClick={() => setShowAdminUploadModal(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition"
                >
                  + Upload Song
                </button>
              </div>
            </div>

            {/* System Health Cards */}
            {dashboardData?.systemHealth && <SystemHealthCards health={dashboardData.systemHealth} />}
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeAdminTab === 'users' && (
          <div className="space-y-6 animate-fadeIn flex flex-col">
            {/* View Mode Toggle (Table Directory vs Relationship Map Flowchart) */}
            <div className="flex items-center gap-2 p-1 bg-slate-950/60 rounded-xl border border-white/5 w-fit text-xs self-start mb-2">
              <button
                type="button"
                onClick={() => setUsersViewMode('table')}
                className={`py-2 px-4 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  usersViewMode === 'table'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Table Directory View</span>
              </button>
              <button
                type="button"
                onClick={() => setUsersViewMode('map')}
                className={`py-2 px-4 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  usersViewMode === 'map'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Relationship Flow Chart Map</span>
              </button>
            </div>

            {usersViewMode === 'map' ? (
              <RelationshipMap
                users={allUsersList.length > 0 ? allUsersList : usersList}
                relationships={relationships}
                onRefresh={() => fetchAll()}
                onCreateInvite={() => setInviteModalConfig({ isOpen: true, branchTitle: 'Create Invitation Token' })}
                onCreateInviteForBranch={(config) => setInviteModalConfig({ isOpen: true, ...config })}
              />
            ) : (
              <>
                {/* Bulk Actions Bar */}
                {selectedUserIds.length > 0 && (
                  <div className="admin-bulk-bar">
                    <span className="admin-bulk-bar-count">{selectedUserIds.length} user(s) selected</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-success"
                        onClick={() => handleBulkAction('activate')}
                        disabled={bulkLoading}
                      >
                        Activate
                      </button>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-warning"
                        onClick={() => handleBulkAction('suspend')}
                        disabled={bulkLoading}
                      >
                        Suspend
                      </button>
                      <button
                        className="admin-btn admin-btn-sm"
                        style={{ background: '#8B5CF6', color: '#fff' }}
                        onClick={() => handleBulkAction('restore')}
                        disabled={bulkLoading}
                      >
                        Restore
                      </button>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleBulkAction('delete')}
                        disabled={bulkLoading}
                      >
                        Delete
                      </button>
                      <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => setSelectedUserIds([])}>
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Users Directory Table */}
                <UsersTable
                  users={allUsersList.length > 0 ? allUsersList : usersList}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  isLoading={isUsersLoading}
                  onCreateUser={() => {
                    setShowCreateInviteModal(true);
                  }}
                  onEditUser={handleEditUser}
                  onSuspendUser={handleSuspendUser}
                  onActivateUser={handleActivateUser}
                  onDeleteUser={handleDeleteUser}
                  onRestoreUser={handleRestoreUser}
                  selectedUserIds={selectedUserIds}
                  onSelectUser={(id: string) =>
                    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                  }
                  onSelectAll={(ids: string[]) => setSelectedUserIds(ids)}
                />
              </>
            )}
          </div>
        )}

        {/* TAB 3: RELATIONSHIPS MANAGEMENT */}
        {activeAdminTab === 'relationships' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Relationships Directory Grid */}
            <RelationshipsViewer
              relationships={relationships}
              onCreateRelationship={() => {
                setEditingRel(null);
                setShowRelModal(true);
              }}
              onEditRelationship={handleEditRelationship}
              onArchiveRelationship={handleArchiveRelationship}
              onRestoreRelationship={handleRestoreRelationship}
              onManageMembers={handleManageMembers}
              onManageInvites={handleManageInvites}
            />
          </div>
        )}

        {/* TAB 4: SONGS & JUKEBOX MANAGEMENT */}
        {activeAdminTab === 'songs' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Admin Songs & Jukebox Directory */}
            <AdminSongsViewer
              onOpenUploadModal={() => setShowAdminUploadModal(true)}
              onSongDeleted={() => fetchAll()}
            />
          </div>
        )}

        {/* User Detail Side Drawer */}
        <UserDetailDrawer />
      </div>

      {/* Admin Upload Song Modal */}
      <UploadSongModal
        isOpen={showAdminUploadModal}
        onClose={() => setShowAdminUploadModal(false)}
        onUploaded={() => fetchAll()}
      />

      {/* Phase 3 Create Invitation Modal */}
      <CreateInvitationModal
        isOpen={showCreateInviteModal || inviteModalConfig.isOpen}
        onClose={() => {
          setShowCreateInviteModal(false);
          setInviteModalConfig({ isOpen: false });
        }}
        onSuccess={() => {
          fetchAll();
          fetchUsers(pagination.page);
        }}
        relationships={relationships}
        defaultPartnerUserId={inviteModalConfig.defaultPartnerUserId}
        defaultRelationshipType={inviteModalConfig.defaultRelationshipType}
        defaultTargetRole={inviteModalConfig.defaultTargetRole}
        branchTitle={inviteModalConfig.branchTitle}
      />

      {/* Phase 2 Modals */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSuccess={() => {
          fetchUsers(pagination.page);
          fetchAll();
        }}
        editingUser={editingUser}
      />

      <RelationshipModal
        isOpen={showRelModal}
        onClose={() => setShowRelModal(false)}
        onSuccess={() => {
          refreshRelationships();
          fetchAll();
        }}
        editingRelationship={editingRel}
      />

      <MemberManagementModal
        isOpen={!!mmRelationship}
        onClose={() => {
          setMmRelationship(null);
          refreshRelationships();
          fetchAll();
        }}
        relationship={mmRelationship}
      />

      <InviteManagementModal
        isOpen={!!inviteRelationship}
        onClose={() => {
          setInviteRelationship(null);
          fetchAll();
        }}
        relationship={inviteRelationship}
      />
    </AdminLayout>
  );
};
