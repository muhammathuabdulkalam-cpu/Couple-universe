import { create } from 'zustand';

export interface PendingInviteData {
  token: string;
  relationshipId?: string;
  relationshipName?: string;
  relationshipType?: string;
  targetRole?: string;
  email?: string;
  expiresAt?: string;
}

interface InviteRegistrationState {
  pendingInvite: PendingInviteData | null;
  setPendingInvite: (data: PendingInviteData) => void;
  clearPendingInvite: () => void;
}

export const useInviteRegistrationStore = create<InviteRegistrationState>((set) => ({
  pendingInvite: null,
  setPendingInvite: (pendingInvite) => set({ pendingInvite }),
  clearPendingInvite: () => set({ pendingInvite: null }),
}));
