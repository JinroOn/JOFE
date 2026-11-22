import type { AuthResponse, UserResponse } from '../types/auth';
import api, { publicApi } from './axios';

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data);

export const signup = (data: {
  email: string;
  password: string;
  nickname: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
}) => api.post<UserResponse>('/auth/signup', data).then((r) => r.data);

// Access Token 없이 Refresh Token으로 로그아웃
export const logout = (refreshToken: string) =>
  publicApi.post('/auth/logout', { refreshToken });

// Access Token 없이 Refresh Token 갱신
export const refreshTokens = (refreshToken: string) =>
  publicApi
    .post<AuthResponse>('/auth/refresh', { refreshToken })
    .then((r) => r.data);

export const changePassword = (data: {
  refreshToken: string;
  currentPassword: string;
  newPassword: string;
}) => api.post('/auth/password', data);

export const sendPasswordResetCode = (email: string) =>
  api.post('/auth/password-resets', { email });

export const resetPassword = (data: {
  email: string;
  code: string;
  newPassword: string;
}) => api.post('/auth/password-resets/confirm', data);

export const sendEmailVerification = (email: string) =>
  api
    .post<{ email: string; expiresAt: string }>(
      '/auth/email-verifications',
      { email }
    )
    .then((r) => r.data);

export const confirmEmailVerification = (email: string, token: string) =>
  api.post('/auth/email-verifications/confirm', { email, token });