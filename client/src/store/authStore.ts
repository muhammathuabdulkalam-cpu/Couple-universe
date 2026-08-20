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
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
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

  setAuth: (user, accessToken, refreshToken) => {
    setMemoryAccessToken(accessToken);
    if (typeof window !== 'undefined') {
      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    }

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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
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

    // Pre-populate memory token from localStorage if present
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (storedToken) {
      setMemoryAccessToken(storedToken);
    }

    try {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      const response = await axiosClient.post<ApiResponse>('/auth/refresh-token', {
        refreshToken: storedRefreshToken
      });
      const { user, accessToken, refreshToken: newRefreshToken } = response.data.data!;
      get().setAuth(user, accessToken, newRefreshToken);
      return true;
    } catch (error) {
      // Fallback: If refresh token cookie fails (cross-site/CORS restriction on secondary browsers), test stored token against /profile
      if (storedToken) {
        try {
          const profileRes = await axiosClient.get<ApiResponse>('/profile');
          if (profileRes.data.success && profileRes.data.data) {
            get().setAuth(profileRes.data.data, storedToken);
            return true;
          }
        } catch (_e) {
          // Token expired or invalid
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
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
