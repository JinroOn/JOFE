import type {
  UserFavoriteResponse,
  UserUpdateRequest,
  UserConsentResponse,
  UserConsentRequest,
} from '../types/user';
import type { UserResponse } from '../types/auth';
import api from './axios';

export const getUsers = () =>
  api.get<UserResponse[]>('/users').then((r) => r.data);

export const getMe = () =>
  api.get<UserResponse>('/users/me').then((r) => r.data);

export const updateMe = (data: UserUpdateRequest) =>
  api.patch<UserResponse>('/users/me', data).then((r) => r.data);

// 회원 탈퇴: DELETE /api/users/me
export const deleteMe = () => api.delete<void>('/users/me');

// 내 동의 내역 조회
export const getMyConsents = () =>
  api.get<UserConsentResponse[]>('/users/me/consents').then((r) => r.data);

// 동의 내역 변경: 새로운 동의 기록 생성
export const createMyConsent = (data: UserConsentRequest) =>
  api.post<UserConsentResponse>('/users/consents', data).then((r) => r.data);

export const getFavorites = () =>
  api.get<UserFavoriteResponse[]>('/users/me/favorites').then((r) => r.data);

export const addFavorite = (majorId: number) =>
  api.post<UserFavoriteResponse>('/users/favorites', { majorId }).then((r) => r.data);

export const deleteFavorite = (favoriteId: number) =>
  api.delete(`/users/favorites/${favoriteId}`);
