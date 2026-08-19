import React, { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Heart,
  User as UserIcon,
  Plus,
  Pencil,
  Trash2,
  Download,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { AdminUserListItem } from '../../types/admin.types';
import { useAdminAuthStore } from '../../store/adminAuthStore';

interface UsersTableProps {
  users: AdminUserListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  onCreateUser?: () => void;
  onEditUser?: (user: any) => void;
  onSuspendUser?: (id: string) => void;
  onActivateUser?: (id: string) => void;
  onDeleteUser?: (id: string) => void;
  onRestoreUser?: (id: string) => void;
  selectedUserIds?: string[];
  onSelectUser?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  pagination,
  onPageChange,
  isLoading,
  onCreateUser,
  onEditUser,
  onSuspendUser,
  onActivateUser,
  onDeleteUser,
  onRestoreUser,
  selectedUserIds = [],
  onSelectUser,
  onSelectAll,
}) => {
  const {
    setSelectedUserIdForDrawer,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
  } = useAdminAuthStore();

  const [showExportMenu, setShowExportMenu] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_OWNER':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
            SUPER_OWNER
          </span>
        );
      case 'CO_OWNER':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
            CO_OWNER
          </span>
        );
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
            ADMIN
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-white/10 text-slate-300 text-[10px] font-bold">
            {role === 'INVITED_USER' ? 'MEMBER' : role}
          </span>
        );
    }
  };

  const allSelected = users.length > 0 && users.every((u) => selectedUserIds.includes(u.id));

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectAll?.([]);
    } else {
      onSelectAll?.(users.map((u) => u.id));
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/admin/users/export?${params.toString()}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('admin_access_token')}` } }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="space-y-4 bg-[#16161E] border border-white/5 rounded-3xl p-6 shadow-2xl">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-400" />
            <span>Platform User Directory ({pagination.total})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any row to open the complete user details side drawer.
          </p>
        </div>

        {/* Filters & Export Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user / email / phone..."
              className="w-full bg-[#1E1E28] border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#1E1E28] border border-white/10 rounded-full px-4 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">All Roles</option>
            <option value="SUPER_OWNER">SUPER_OWNER</option>
            <option value="CO_OWNER">CO_OWNER</option>
            <option value="INVITED_USER">INVITED_USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1E1E28] border border-white/10 rounded-full px-4 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DELETED">DELETED</option>
          </select>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1E1E28] hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold transition"
            >
              <Download className="w-4 h-4 text-indigo-400" /> Export
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1E1E28] border border-white/10 rounded-2xl p-2 shadow-2xl z-20 space-y-1 text-xs">
                <button
                  onClick={() => {
                    handleExportCSV();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 text-left transition"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Export CSV
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Create User Button */}
          {onCreateUser && (
            <button
              onClick={onCreateUser}
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Invite Token
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-white/10 font-semibold uppercase text-[10px] tracking-wider">
              {onSelectAll && (
                <th className="pb-3 px-3">
                  <input type="checkbox" checked={allSelected} onChange={handleSelectAll} className="accent-rose-500" />
                </th>
              )}
              <th className="pb-3 px-3">User</th>
              <th className="pb-3 px-3">Email</th>
              <th className="pb-3 px-3">Role</th>
              <th className="pb-3 px-3">Relationship</th>
              <th className="pb-3 px-3">Partner</th>
              <th className="pb-3 px-3 text-center">Status</th>
              <th className="pb-3 px-3">Joined</th>
              {(onEditUser || onSuspendUser || onDeleteUser) && <th className="pb-3 px-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading User Directory...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-semibold">
                  No user records match the specified query filters.
                </td>
              </tr>
            ) : (
              users.map((usr) => (
                <tr
                  key={usr.id}
                  onClick={() => setSelectedUserIdForDrawer(usr.id)}
                  className={`hover:bg-white/5 transition cursor-pointer group ${
                    selectedUserIds.includes(usr.id) ? 'bg-rose-500/5' : ''
                  }`}
                >
                  {/* Checkbox */}
                  {onSelectUser && (
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(usr.id)}
                        onChange={() => onSelectUser(usr.id)}
                        className="accent-rose-500"
                      />
                    </td>
                  )}

                  {/* Profile & Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={usr.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                          alt={usr.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-rose-500/50"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                            usr.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-rose-300 transition">{usr.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {usr.id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{usr.email}</td>

                  {/* Role */}
                  <td className="py-3 px-3">{getRoleBadge(usr.role)}</td>

                  {/* Relationship Name */}
                  <td className="py-3 px-3 text-slate-300">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      <span>{usr.relationshipName}</span>
                    </span>
                  </td>

                  {/* Partner */}
                  <td className="py-3 px-3 text-slate-300 font-medium">{usr.partnerName}</td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
                    {usr.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        <UserCheck className="w-3 h-3" /> ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">
                        <UserX className="w-3 h-3" /> {usr.status}
                      </span>
                    )}
                  </td>

                  {/* Created Date */}
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(usr.createdAt).toLocaleDateString()}
                  </td>

                  {/* Action Buttons */}
                  {(onEditUser || onSuspendUser || onDeleteUser) && (
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        {onEditUser && (
                          <button
                            onClick={() => onEditUser(usr)}
                            title="Edit"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-slate-400 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {usr.role !== 'ADMIN' && usr.email !== 'admin@gmail.com' && usr.status === 'ACTIVE' && onSuspendUser && (
                          <button
                            onClick={() => onSuspendUser(usr.id)}
                            title="Suspend"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 transition"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {usr.role !== 'ADMIN' && usr.email !== 'admin@gmail.com' && usr.status !== 'ACTIVE' && onActivateUser && (
                          <button
                            onClick={() => onActivateUser(usr.id)}
                            title="Activate"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onRestoreUser && usr.status === 'DELETED' && (
                          <button
                            onClick={() => onRestoreUser(usr.id)}
                            title="Restore User"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-slate-400 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {usr.role !== 'ADMIN' && usr.email !== 'admin@gmail.com' && onDeleteUser && (
                          <button
                            onClick={() => onDeleteUser(usr.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs text-slate-400">
        <p>
          Showing Page <span className="font-bold text-white">{pagination.page}</span> of{' '}
          <span className="font-bold text-white">{pagination.totalPages || 1}</span> ({pagination.total} Users)
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 rounded-xl bg-slate-800 text-white font-bold text-xs">{pagination.page}</span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
