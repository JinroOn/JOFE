import type { AuthResponse, UserResponse } from '../types/auth';
import api from './axios';

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

export const logout = (refreshToken: string) =>
  api.post('/auth/logout', { refreshToken });

export const refreshTokens = (refreshToken: string) =>
  api.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data);

export const changePassword = (data: {
  refreshToken: string;
  currentPassword: string;
  newPassword: string;
}) => api.post('/auth/password', data);
