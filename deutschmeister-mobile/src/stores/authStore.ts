import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, LoginDto, RegisterDto, MessageResponse, User } from '@/lib/api/auth';
import {
  clearTokens,
  getAccessToken,
  onAuthExpired,
  setAccessToken,
  setRefreshToken,
} from '@/lib/api/client';
import { mmkvStorage } from '@/lib/storage';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<MessageResponse>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  loginWithOAuth: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: async (data) => {
        set({ isLoading: true });
        try {
          // Mobile: login returns both accessToken and refreshToken in body
          const response = await authApi.login(data);
          // Store both tokens securely
          await setAccessToken(response.accessToken);
          if (response.refreshToken) {
            await setRefreshToken(response.refreshToken);
          }
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
        } catch {} finally {
          await clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      loginWithOAuth: async (accessToken: string, refreshToken: string) => {
        await setAccessToken(accessToken);
        await setRefreshToken(refreshToken);
        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          await clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
          throw new Error('OAuth login failed');
        }
      },

      fetchUser: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          await clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Sync API client token expiry → zustand auth state
onAuthExpired(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
});
