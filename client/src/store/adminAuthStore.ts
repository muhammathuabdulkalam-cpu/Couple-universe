import { create } from 'zustand';
import { adminApi } from '../api/adminApi';
import { setMemoryAccessToken } from '../api/axiosClient';
import { AdminUser } from '../types/admin.types';

interface AdminAuthState {
  admin: AdminUser | null;
  accessToken: string | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  selectedUserIdForDrawer: string | null;
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;

  setAdminAuth: (admin: AdminUser, accessToken: string) => void;
  adminLogout: () => Promise<void>;
  setSelectedUserIdForDrawer: (userId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: string) => void;
  setStatusFilter: (status: string) => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  admin: null,
  accessToken: null,
  isAdminAuthenticated: false,
  isLoading: false,
  selectedUserIdForDrawer: null,
  searchQuery: '',
  roleFilter: '',
  statusFilter: '',

  setAdminAuth: (admin, accessToken) => {
    setMemoryAccessToken(accessToken);
    set({
      admin,
      accessToken,
      isAdminAuthenticated: true,
      isLoading: false,
    });
  },

  adminLogout: async () => {
    try {
      await adminApi.logout();
    } catch (_err) {
      // Ignore logout errors
    } finally {
      setMemoryAccessToken(null);
      set({
        admin: null,
        accessToken: null,
        isAdminAuthenticated: false,
        isLoading: false,
        selectedUserIdForDrawer: null,
      });
    }
  },

  setSelectedUserIdForDrawer: (userId) => set({ selectedUserIdForDrawer: userId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}));
