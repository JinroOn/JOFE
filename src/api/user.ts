import type { UserFavoriteResponse, UserUpdateRequest } from '../types/user';
import type { UserResponse } from '../types/auth';
import api from './axios';

export const getMe = () => api.get<UserResponse>('/users/me').then((r) => r.data);

export const updateMe = (data: UserUpdateRequest) =>
  api.patch<UserResponse>('/users/me', data).then((r) => r.data);

export const deleteMe = () => api.delete('/users/me');

export const getFavorites = () =>
  api.get<UserFavoriteResponse[]>('/users/me/favorites').then((r) => r.data);

export const deleteFavorite = (favoriteId: number) =>
  api.delete(`/users/favorites/${favoriteId}`);
