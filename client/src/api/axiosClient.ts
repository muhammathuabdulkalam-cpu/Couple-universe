/// <reference types="vite/client" />
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/index.js';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

let accessTokenInMemory: string | null = null;

export const setMemoryAccessToken = (token: string | null) => {
  accessTokenInMemory = token;
};

export const getMemoryAccessToken = () => accessTokenInMemory;

// Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('admin_access_token');
    const userToken = accessTokenInMemory || localStorage.getItem('access_token');
    const isAdminPath = (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) || config.url?.startsWith('/admin');

    // Do not attach authorization header for login requests
    if (config.url?.includes('/login')) {
      delete config.headers.Authorization;
    } else if (isAdminPath && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor with Silent Token Refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as any;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/login') &&
      !originalRequest.url?.includes('/refresh-token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        if (!storedRefreshToken || storedRefreshToken === 'null' || storedRefreshToken === 'undefined' || !storedRefreshToken.trim()) {
          processQueue(error, null);
          setMemoryAccessToken(null);
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post<ApiResponse>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data?.accessToken;
        const newRefreshToken = refreshResponse.data.data?.refreshToken;
        if (newAccessToken) {
          setMemoryAccessToken(newAccessToken);
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refresh_token', newRefreshToken);
            }
          }
          axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return axiosClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setMemoryAccessToken(null);
        window.dispatchEvent(new Event('auth:logout'));
      } finally {
        isRefreshing = false;
      }
    }

    const errorData: ApiResponse = error.response?.data || {
      success: false,
      statusCode: error.response?.status || 500,
      message: error.message || 'Network error occurred. Unable to connect to server.',
    };

    return Promise.reject(errorData);
  }
);
