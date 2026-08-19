import { create } from 'zustand';

export interface PendingInviteData {
  token: string;
  relationshipId?: string;
  relationshipName?: string;
  relationshipType?: string;
  targetRole?: string;
  enabledFeatures?: string[];
  email?: string;
  expiresAt?: string;
}

interface InviteRegistrationState {
  pendingInvite: PendingInviteData | null;
  setPendingInvite: (data: PendingInviteData) => void;
  clearPendingInvite: () => void;
}

const STORAGE_KEY = 'couple_universe_pending_invite';

const getInitialState = (): PendingInviteData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useInviteRegistrationStore = create<InviteRegistrationState>((set) => ({
  pendingInvite: getInitialState(),
  setPendingInvite: (pendingInvite) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingInvite));
    } catch (e) {
      console.error('Failed to save pending invite to storage:', e);
    }
    set({ pendingInvite });
  },
  clearPendingInvite: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ pendingInvite: null });
  },
}));
