import { axiosClient } from './axiosClient';
import { ApiResponse, User } from '../types';

export const onboardingApi = {
  getOnboardingState: async () => {
    const res = await axiosClient.get<ApiResponse<{ user: User }>>('/onboarding/state');
    return res.data.data!;
  },
  updateProfile: async (data: { name?: string; bio?: string; birthday?: string; avatar?: string; username?: string; phone?: string; gender?: string }) => {
    const res = await axiosClient.patch<ApiResponse<{ user: User }>>('/onboarding/profile', data);
    return res.data.data!;
  },
  completeOnboarding: async () => {
    const res = await axiosClient.post<ApiResponse<{ user: User }>>('/onboarding/complete');
    return res.data.data!;
  },
};
