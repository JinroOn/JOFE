export interface UserFavoriteResponse {
  id: number;
  userId: number;
  majorId: number;
  createdAt: string;
}

export interface UserUpdateRequest {
  nickname?: string;
  profileImageUrl?: string;
}
