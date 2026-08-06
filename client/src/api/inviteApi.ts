import { axiosClient } from './axiosClient';
import { ApiResponse } from '../types';
import { InviteValidationResult } from '../types/admin.types';

export const inviteApi = {
  validateInvite: async (token: string): Promise<InviteValidationResult> => {
    const res = await axiosClient.get<ApiResponse<InviteValidationResult>>(
      `/invites/validate/${token}`
    );
    return res.data.data!;
  },
};
