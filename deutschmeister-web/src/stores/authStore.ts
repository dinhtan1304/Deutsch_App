'use client';

import { create } from 'zustand';
import { authApi, LoginDto, RegisterDto, MessageResponse, User, AuthBootstrap } from '@/lib/api/auth';
import { clearTokens, getAccessToken, onAuthExpired, setAccessToken } from '@/lib/api/client';
import { clearSessionHint, setSessionHint } from '@/lib/auth/sessionHint';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  bootstrap: AuthBootstrap | null;
  
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<MessageResponse>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  loginWithOAuth: (token: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setBootstrap: (bootstrap: AuthBootstrap | null) => void;
  setLoading: (isLoading: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  _hasHydrated: false,
  bootstrap: null,

  setHasHydrated: (state) => set({ _hasHydrated: state }),
  setLoading: (isLoading) => set({ isLoading }),

  login: async (data) => {
    set({ isLoading: true });
    try {
      await authApi.login(data);
      const bootstrap = await authApi.bootstrap();
      setSessionHint();
      set({ bootstrap, user: bootstrap.user, isAuthenticated: true, isLoading: false, _hasHydrated: true });
    } catch (error) {
      set({ isLoading: false, _hasHydrated: true });
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
      clearSessionHint();
      set({ bootstrap: null, user: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
    }
  },

  loginWithOAuth: async (token: string) => {
    setAccessToken(token);
    set({ isLoading: true });
    try {
      const bootstrap = await authApi.bootstrap();
      setSessionHint();
      set({ bootstrap, user: bootstrap.user, isAuthenticated: true, isLoading: false, _hasHydrated: true });
    } catch {
      clearTokens();
      clearSessionHint();
      set({ bootstrap: null, user: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
      throw new Error('OAuth login failed');
    }
  },

  fetchUser: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ bootstrap: null, user: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
      return;
    }
    set({ isLoading: true });
    try {
      const bootstrap = await authApi.bootstrap();
      setSessionHint();
      set({ bootstrap, user: bootstrap.user, isAuthenticated: true, isLoading: false, _hasHydrated: true });
    } catch {
      clearTokens();
      clearSessionHint();
      set({ bootstrap: null, user: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setBootstrap: (bootstrap) => set({ bootstrap, user: bootstrap?.user ?? null, isAuthenticated: !!bootstrap }),
}));

// Field-scoped selector hooks — Header/Sidebar dùng những hook này để chỉ
// re-render khi field cụ thể đổi, thay vì mỗi `setState` (loading, bootstrap…)
// đều buộc cả tree re-render.
export const useAuthUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthBootstrap = () => useAuthStore((s) => s.bootstrap);
export const useAuthLogout = () => useAuthStore((s) => s.logout);

if (typeof window !== 'undefined') {
  localStorage.removeItem('auth-storage');
}

// ─── Sync API client token expiry → zustand auth state ───
// When client.ts detects 401 + refresh failure, this callback
// resets zustand so Header/UI immediately reflects logged-out state.
// Without this: clearTokens() removes accessToken but zustand still
// has isAuthenticated:true in localStorage → Header shows avatar,
// pages show login form = desync bug.
onAuthExpired(() => {
  clearSessionHint();
  useAuthStore.setState({
    bootstrap: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    _hasHydrated: true,
  });
});
