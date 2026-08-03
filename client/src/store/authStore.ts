import { create } from 'zustand';
import { axiosClient, setMemoryAccessToken } from '../api/axiosClient.js';
import { ApiResponse, SystemAuthStatus, User } from '../types/index.js';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  systemStatus: SystemAuthStatus | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  fetchSystemStatus: () => Promise<SystemAuthStatus | null>;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateUser: (updatedFields: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  systemStatus: null,
  isAuthenticated: false,
  isLoading: true,

  fetchSystemStatus: async () => {
    try {
      const response = await axiosClient.get<ApiResponse<SystemAuthStatus>>('/auth/system-status');
      const status = response.data.data!;
      set({ systemStatus: status });
      return status;
    } catch (error) {
      console.error('Failed to fetch system auth status:', error);
      return null;
    }
  },

  setAuth: (user, accessToken) => {
    setMemoryAccessToken(accessToken);
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Module X: Reset stealth state on logout and return to calculator link if available
      let stealthTokenToReturn: string | null = null;
      try {
        const { useStealthStore } = await import('./stealthStore.js');
        const stealthState = useStealthStore.getState();
        stealthTokenToReturn = stealthState.stealthToken;
        stealthState.resetStealth();
      } catch {
        // Stealth module may not be loaded — safe to ignore
      }
      setMemoryAccessToken(null);
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });

      if (stealthTokenToReturn && typeof window !== 'undefined') {
        window.location.href = `/s/${stealthTokenToReturn}`;
      }
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosClient.post<ApiResponse>('/auth/refresh-token');
      const { user, accessToken } = response.data.data!;
      get().setAuth(user, accessToken);
      return true;
    } catch (error) {
      setMemoryAccessToken(null);
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },

  updateUser: (updatedFields) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updatedFields } });
    }
  },
}));

// Global logout listener
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}
