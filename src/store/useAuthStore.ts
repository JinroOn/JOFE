import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  nickname: string;
  role?: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoggedIn: false,
      login: (user, token) => set({ user, accessToken: token, isLoggedIn: true }),
      logout: () => set({ user: null, accessToken: null, isLoggedIn: false }),
      updateUser: (user) => set({ user }),
    }),
    { name: 'auth' }
  )
);

export default useAuthStore;
