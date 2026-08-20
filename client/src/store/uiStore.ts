import { create } from 'zustand';
import { ToastMessage, ToastType } from '../types/index.js';

interface UIState {
  theme: 'dark' | 'light';
  isSidebarOpen: boolean;
  toasts: ToastMessage[];
  
  toggleTheme: () => void;
  toggleSidebar: () => void;
  addToast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'dark',
  isSidebarOpen: false,
  toasts: [],

  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: newTheme });
  },

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  addToast: (title, message, type = 'info', duration = 4000) => {
    const activeToasts = get().toasts;
    const isDuplicate = activeToasts.some(
      (t) => t.title === title
    );
    if (isDuplicate) return;

    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, message, type, duration };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
