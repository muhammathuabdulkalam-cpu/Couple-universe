import { create } from 'zustand';
import { validateStealthToken } from '../components/stealth/UnlockService.js';

interface StealthState {
  stealthToken: string | null;
  isTokenValid: boolean;
  isStealthEnabled: boolean;
  isUnlocked: boolean;
  isValidating: boolean;

  validateToken: (token: string) => Promise<boolean>;
  setUnlocked: () => void;
  setStealthToken: (token: string) => void;
  resetStealth: () => void;
}

const UNLOCK_SESSION_KEY = '__c_s';

export const useStealthStore = create<StealthState>((set) => ({
  stealthToken: null,
  isTokenValid: false,
  isStealthEnabled: false,
  isUnlocked: typeof window !== 'undefined' ? sessionStorage.getItem(UNLOCK_SESSION_KEY) === '1' : false,
  isValidating: false,

  validateToken: async (token: string) => {
    set({ isValidating: true, stealthToken: token });

    try {
      const result = await validateStealthToken(token);
      set({
        isTokenValid: result.valid,
        isStealthEnabled: result.enabled,
        isValidating: false,
      });
      return result.valid && result.enabled;
    } catch {
      set({ isTokenValid: false, isStealthEnabled: false, isValidating: false });
      return false;
    }
  },

  setUnlocked: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(UNLOCK_SESSION_KEY, '1');
    }
    set({ isUnlocked: true });
  },

  setStealthToken: (token: string) => {
    set({ stealthToken: token });
  },

  resetStealth: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(UNLOCK_SESSION_KEY);
    }
    set({
      isUnlocked: false,
      isTokenValid: false,
      isStealthEnabled: false,
    });
  },
}));
