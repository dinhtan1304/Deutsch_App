'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, LoginDto, RegisterDto, MessageResponse, User } from '@/lib/api/auth';
import { clearTokens, initAuth, onAuthExpired, setAccessToken } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<MessageResponse>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  loginWithOAuth: (token: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: async (data) => {
        set({ isLoading: true });
        try {
          await authApi.login(data);
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const result = await authApi.register(data);
          set({ isLoading: false });
          return result;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
          // Ignore: clear local state even if server logout fails (offline, expired token)
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      loginWithOAuth: async (token: string) => {
        setAccessToken(token);
        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
          throw new Error('OAuth login failed');
        }
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const hasToken = await initAuth();
          if (!hasToken) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// ─── Sync API client token expiry → zustand auth state ───
// When client.ts detects 401 + refresh failure, this callback
// resets zustand so Header/UI immediately reflects logged-out state.
// Without this: clearTokens() removes accessToken but zustand still
// has isAuthenticated:true in localStorage → Header shows avatar,
// pages show login form = desync bug.
onAuthExpired(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
});
