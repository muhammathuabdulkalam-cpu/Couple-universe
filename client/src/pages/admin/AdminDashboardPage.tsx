import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Trash2, Heart, Key } from 'lucide-react';
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

export const AdminDashboardPage: React.FC = () => {
  const { searchQuery, roleFilter, statusFilter } = useAdminAuthStore();

  const [dashboardData, setDashboardData] = useState<AdminDashboardSummary | null>(null);
  const [usersList, setUsersList] = useState<AdminUserListItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [relationships, setRelationships] = useState<AdminRelationshipItem[]>([]);

  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Phase 2 modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showRelModal, setShowRelModal] = useState(false);
  const [editingRel, setEditingRel] = useState<any | null>(null);
  const [mmRelationship, setMmRelationship] = useState<any | null>(null);
  const [inviteRelationship, setInviteRelationship] = useState<{ id: string; name: string } | null>(null);

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
      const [summary, rels] = await Promise.all([
        adminApi.getDashboardSummary(),
        adminApi.getRelationships(),
      ]);
      setDashboardData(summary);
      setRelationships(rels);
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

  // 2. Fetch Paginated Users whenever filters change
  const fetchUsers = async (pageToFetch: number = 1) => {
    setIsUsersLoading(true);
    try {
      const res = await adminApi.getUsers({
        page: pageToFetch,
        limit: 10,
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
      });
      setUsersList(res.users);
      setPagination(res.pagination);
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

  const stats = dashboardData?.platformStats;

  if (isDashboardLoading) {
    return (
      <AdminLayout>
        <div className="admin-page-loader">
          <div className="admin-loader-spinner" />
          <p className="admin-loader-text">Loading Enterprise Admin Console...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Top Summary Cards (Requirement 9: 6 Cards Display) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.totalUsers ?? 0}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Users</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">{stats?.activeUsers ?? 0}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Suspended</span>
              <UserX className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400">{stats?.suspendedUsers ?? 0}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Deleted</span>
              <Trash2 className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-400">{stats?.deletedUsers ?? 0}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Relationships</span>
              <Heart className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-purple-300">{stats?.totalRelationships ?? 0}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Invites</span>
              <Key className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-300">{stats?.activeInvites ?? 0}</p>
          </div>
        </div>

        {/* Primary Couple Overview */}
        {dashboardData?.primaryCouple && <PrimaryCoupleOverview data={dashboardData.primaryCouple} />}

        {/* System Health Cards */}
        {dashboardData?.systemHealth && <SystemHealthCards health={dashboardData.systemHealth} />}

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

        {/* Paginated Users Directory Table */}
        <UsersTable
          users={usersList}
          pagination={pagination}
          onPageChange={handlePageChange}
          isLoading={isUsersLoading}
          onCreateUser={() => {
            setEditingUser(null);
            setShowUserModal(true);
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

        {/* User Detail Side Drawer */}
        <UserDetailDrawer />
      </div>

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
