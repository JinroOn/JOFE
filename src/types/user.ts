
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

export interface UserConsentResponse {
  id: number;
  userId: number;
  privacyAgreed: boolean;
  termsAgreed: boolean;
  marketingAgreed: boolean;
  termsVersion: string | null;
  agreedAt: string;
}

export interface UserConsentRequest {
  privacyAgreed?: boolean;
  termsAgreed?: boolean;
  marketingAgreed?: boolean;
  termsVersion?: string;
}
