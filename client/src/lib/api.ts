import axios, { AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth-tokens';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
export const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

// NOTE: no default Content-Type header on purpose.
// axios picks the right one per request: JSON for objects, and
// multipart/form-data (with boundary) for FormData. Forcing
// 'application/json' here makes axios serialize FormData to JSON,
// which silently drops every uploaded image.
export const api = axios.create({
  baseURL: API_URL,
});

// Attach the access token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Send the user to login, remembering where they were. */
export const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  const here = window.location.pathname + window.location.search;
  if (window.location.pathname.startsWith('/login')) return;
  window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
};

// Share one in-flight refresh between parallel 401s
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  setTokens(data.data.accessToken, data.data.refreshToken);
  return data.data.accessToken;
};

// Refresh expired tokens and retry once
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (getRefreshToken()) {
        try {
          refreshPromise = refreshPromise || refreshAccessToken();
          const newToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          clearTokens();
          redirectToLogin();
          return Promise.reject(refreshError);
        } finally {
          refreshPromise = null;
        }
      }

      // Logged out user hit a protected endpoint
      clearTokens();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

/** Pull a human-readable message out of an API error. */
export const getErrorMessage = (err: unknown, fallback = 'Something went wrong. Please try again.') => {
  const message = (err as AxiosError<{ message?: string }>)?.response?.data?.message;
  return typeof message === 'string' && message ? message : fallback;
};
