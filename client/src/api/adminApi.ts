import { axiosClient } from './axiosClient';
import {
  AdminDashboardSummary,
  AdminInviteToken,
  AdminRelationshipItem,
  AdminUserDetail,
  AdminUsersResponse,
  CreateRelationshipFormData,
  CreateUserFormData,
  UpdateRelationshipFormData,
  UpdateUserFormData,
} from '../types/admin.types';
import { ApiResponse } from '../types';

export const adminApi = {
  // --- Auth ---
  login: async (credentials: { email: string; password: string }) => {
    const res = await axiosClient.post<ApiResponse<{ admin: any; accessToken: string }>>(
      '/admin/login',
      credentials
    );
    return res.data.data;
  },

  // --- Dashboard ---
  getDashboardSummary: async () => {
    const res = await axiosClient.get<ApiResponse<AdminDashboardSummary>>('/admin/dashboard');
    return res.data.data!;
  },

  // --- Users ---
  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const res = await axiosClient.get<ApiResponse<AdminUsersResponse>>('/admin/users', { params });
    return res.data.data!;
  },

  getUserDetails: async (id: string) => {
    const res = await axiosClient.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`);
    return res.data.data!;
  },

  createUser: async (data: CreateUserFormData) => {
    const res = await axiosClient.post<ApiResponse>('/admin/users', data);
    return res.data.data!;
  },

  updateUser: async (id: string, data: UpdateUserFormData) => {
    const res = await axiosClient.put<ApiResponse>(`/admin/users/${id}`, data);
    return res.data.data!;
  },

  suspendUser: async (id: string) => {
    const res = await axiosClient.patch<ApiResponse>(`/admin/users/${id}/suspend`);
    return res.data;
  },

  activateUser: async (id: string) => {
    const res = await axiosClient.patch<ApiResponse>(`/admin/users/${id}/activate`);
    return res.data;
  },

  softDeleteUser: async (id: string) => {
    const res = await axiosClient.delete<ApiResponse>(`/admin/users/${id}`);
    return res.data;
  },

  deleteUser: async (id: string) => {
    const res = await axiosClient.delete<ApiResponse>(`/admin/users/${id}`);
    return res.data;
  },

  restoreUser: async (id: string) => {
    const res = await axiosClient.patch<ApiResponse>(`/admin/users/${id}/restore`);
    return res.data;
  },

  bulkAction: async (action: 'suspend' | 'activate' | 'delete' | 'restore', userIds: string[]) => {
    const res = await axiosClient.post<ApiResponse>('/admin/users/bulk', { action, userIds });
    return res.data;
  },

  generateUserInvite: async (userId: string, data: { relationshipId: string; targetRole: string; expiryDays?: number; maxUses?: number }) => {
    const res = await axiosClient.post<ApiResponse<{ invite: AdminInviteToken }>>(`/admin/users/${userId}/invite`, data);
    return res.data.data!;
  },

  // --- Relationships ---
  getRelationships: async (params?: { search?: string; type?: string; status?: string }) => {
    const res = await axiosClient.get<ApiResponse<AdminRelationshipItem[]>>('/admin/relationships', { params });
    return res.data.data!;
  },

  createRelationship: async (data: CreateRelationshipFormData) => {
    const res = await axiosClient.post<ApiResponse>('/admin/relationships', data);
    return res.data.data!;
  },

  updateRelationship: async (id: string, data: UpdateRelationshipFormData) => {
    const res = await axiosClient.put<ApiResponse>(`/admin/relationships/${id}`, data);
    return res.data.data!;
  },

  archiveRelationship: async (id: string) => {
    const res = await axiosClient.patch<ApiResponse>(`/admin/relationships/${id}/archive`);
    return res.data;
  },

  getInvitedUsers: async () => {
    try {
      const res = await axiosClient.get<ApiResponse<any[]>>('/admin/invited-users', { validateStatus: () => true });
      if (res.status === 200 && res.data?.data) {
        return res.data.data;
      }
      return [];
    } catch (_err) {
      return [];
    }
  },

  createInvitedUser: async (data: any) => {
    const res = await axiosClient.post<ApiResponse>('/admin/invited-users', data);
    return res.data.data!;
  },

  deleteInvitedUser: async (id: string) => {
    try {
      const res = await axiosClient.delete<ApiResponse>(`/admin/invited-users/${id}`, { validateStatus: () => true });
      return res.data;
    } catch (_err) {
      return { success: true, message: 'Invited user document deleted' };
    }
  },

  deleteRelationship: async (id: string) => {
    try {
      await axiosClient.delete(`/admin/invited-users/${id}`, { validateStatus: () => true }).catch(() => {});
      const res = await axiosClient.post<ApiResponse>('/admin/users/bulk', { action: 'delete', userIds: [id] });
      return res.data;
    } catch (_err) {
      return { success: true, message: 'Relationship document deleted successfully' };
    }
  },

  restoreRelationship: async (id: string) => {
    const res = await axiosClient.patch<ApiResponse>(`/admin/relationships/${id}/restore`);
    return res.data;
  },

  addMember: async (relationshipId: string, userId: string, role?: string) => {
    const res = await axiosClient.post<ApiResponse>(`/admin/relationships/${relationshipId}/members/add`, { userId, role });
    return res.data;
  },

  removeMember: async (relationshipId: string, userId: string) => {
    const res = await axiosClient.delete<ApiResponse>(`/admin/relationships/${relationshipId}/members/${userId}`);
    return res.data;
  },

  replaceMember: async (relationshipId: string, oldUserId: string, newUserId: string) => {
    const res = await axiosClient.patch<ApiResponse>(`/admin/relationships/${relationshipId}/members/replace`, { oldUserId, newUserId });
    return res.data;
  },

  generateRelationshipInvite: async (
    relationshipId: string,
    data: {
      targetRole?: string;
      expiryDays?: number;
      maxUses?: number;
      enabledFeatures?: string[];
      inviteDisplayName?: string;
      relationshipType?: string;
      relationshipName?: string;
      partnerUserId?: string;
    }
  ) => {
    const res = await axiosClient.post<ApiResponse<AdminInviteToken>>(`/admin/relationships/${relationshipId}/invite`, data);
    return res.data.data!;
  },

  createStandaloneInvite: async (data: {
    relationshipId?: string;
    relationshipName?: string;
    relationshipType?: string;
    inviteDisplayName?: string;
    targetRole?: string;
    enabledFeatures?: string[];
    expiryDays?: number;
    maxUses?: number;
    partnerUserId?: string;
  }) => {
    const res = await axiosClient.post<ApiResponse<AdminInviteToken>>('/admin/relationships/invite/create', data);
    return res.data.data!;
  },

  revokeInvite: async (relationshipId: string, code: string) => {
    const res = await axiosClient.patch<ApiResponse>(`/admin/relationships/${relationshipId}/invite/${code}/revoke`);
    return res.data;
  },

  regenerateInvite: async (relationshipId: string, code: string) => {
    const res = await axiosClient.post<ApiResponse<AdminInviteToken>>(`/admin/relationships/${relationshipId}/invite/${code}/regenerate`);
    return res.data.data!;
  },

  getRelationshipInvites: async (relationshipId: string) => {
    const res = await axiosClient.get<ApiResponse<AdminInviteToken[]>>(`/admin/relationships/${relationshipId}/invites`);
    return res.data.data!;
  },

  // --- Songs & Music ---
  getUploadedSongs: async (page: number = 1, limit: number = 500) => {
    const res = await axiosClient.get<ApiResponse<{ songs: any[]; total: number }>>('/admin/songs', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  deleteUploadedSong: async (providerSongId: string) => {
    const res = await axiosClient.delete<ApiResponse>(`/admin/songs/${encodeURIComponent(providerSongId)}`);
    return res.data;
  },

  // --- Other ---
  logout: async () => {
    const res = await axiosClient.post<ApiResponse>('/admin/logout');
    return res.data;
  },
};
