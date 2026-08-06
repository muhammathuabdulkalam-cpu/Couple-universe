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

  // --- Users (Phase 1 reads) ---
  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const res = await axiosClient.get<ApiResponse<AdminUsersResponse>>('/admin/users', { params });
    return res.data.data!;
  },

  getUserDetails: async (id: string) => {
    const res = await axiosClient.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`);
    return res.data.data!;
  },

  // --- Users (Phase 2 writes) ---
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

  bulkAction: async (action: 'suspend' | 'activate' | 'delete', userIds: string[]) => {
    const res = await axiosClient.post<ApiResponse>('/admin/users/bulk', { action, userIds });
    return res.data;
  },

  generateUserInvite: async (userId: string, data: { relationshipId: string; targetRole: string; expiryDays?: number; maxUses?: number }) => {
    const res = await axiosClient.post<ApiResponse<{ invite: AdminInviteToken }>>(`/admin/users/${userId}/invite`, data);
    return res.data.data!;
  },

  // --- Relationships (Phase 1 reads) ---
  getRelationships: async (params?: { search?: string; type?: string; status?: string }) => {
    const res = await axiosClient.get<ApiResponse<AdminRelationshipItem[]>>('/admin/relationships', { params });
    return res.data.data!;
  },

  // --- Relationships (Phase 2 writes) ---
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

  generateRelationshipInvite: async (relationshipId: string, data: { targetRole?: string; expiryDays?: number; maxUses?: number }) => {
    const res = await axiosClient.post<ApiResponse<AdminInviteToken>>(`/admin/relationships/${relationshipId}/invite`, data);
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

  // --- Other ---
  logout: async () => {
    const res = await axiosClient.post<ApiResponse>('/admin/logout');
    return res.data;
  },
};

