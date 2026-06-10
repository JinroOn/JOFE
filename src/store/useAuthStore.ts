import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl?: string | null;
  role?: 'member' | 'admin';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoggedIn: false,
      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isLoggedIn: true }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false }),
      updateUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
    }),
    { name: 'auth' }
  )
);

export default useAuthStore;
