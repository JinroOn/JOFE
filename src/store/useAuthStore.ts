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
  sessionExpired: boolean;
  // 토큰 회전과 별개로 로그인·로그아웃을 구분한다. 저장소에는 보존하지 않는다.
  sessionVersion: number;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setSessionExpired: (v: boolean) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoggedIn: false,
      sessionExpired: false,
      sessionVersion: 0,
      login: (user, accessToken, refreshToken) =>
        set((state) => ({ user, accessToken, refreshToken, isLoggedIn: true, sessionExpired: false, sessionVersion: state.sessionVersion + 1 })),
      logout: () =>
        set((state) => ({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false, sessionVersion: state.sessionVersion + 1 })),
      updateUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setSessionExpired: (v) => set({ sessionExpired: v }),
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useAuthStore;
