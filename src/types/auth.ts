export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: 'member' | 'admin';
  loginType: string;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
