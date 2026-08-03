/**
 * Stealth Unlock Service
 * Handles expression hashing and server-side unlock verification.
 * Uses Web Crypto API (SubtleCrypto) for SHA-256 hashing.
 * Zero console output. Zero debug traces.
 */

import { axiosClient } from '../../api/axiosClient.js';
import { useAuthStore } from '../../store/authStore.js';
import { ApiResponse, User } from '../../types/index.js';

const hashExpression = async (expression: string): Promise<string> => {
  // Strip whitespace and optional trailing equals sign for normalized hashing
  const cleaned = expression.replace(/\s/g, '').replace(/=$/, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(cleaned);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const attemptUnlock = async (
  token: string,
  rawExpression: string
): Promise<boolean> => {
  try {
    const expressionHash = await hashExpression(rawExpression);

    const response = await axiosClient.post<
      ApiResponse<{ unlocked: boolean; user?: User; accessToken?: string }>
    >('/stealth/unlock', { token, expressionHash });

    if (
      response.data.data?.unlocked &&
      response.data.data?.user &&
      response.data.data?.accessToken
    ) {
      useAuthStore.getState().setAuth(response.data.data.user, response.data.data.accessToken);
    }

    return response.data.data?.unlocked === true;
  } catch {
    return false;
  }
};

export const validateStealthToken = async (
  token: string
): Promise<{ valid: boolean; enabled: boolean }> => {
  try {
    const response = await axiosClient.get<ApiResponse<{ valid: boolean; enabled: boolean }>>(
      `/stealth/validate/${encodeURIComponent(token)}`
    );

    return {
      valid: response.data.data?.valid === true,
      enabled: response.data.data?.enabled === true,
    };
  } catch {
    return { valid: false, enabled: false };
  }
};
