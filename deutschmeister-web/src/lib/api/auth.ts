import { apiPost, apiGet, api, setAccessToken, clearTokens } from './client';
import { clearSessionHint, setSessionHint } from '@/lib/auth/sessionHint';

/**
 * Auth response from server
 * Note: refreshToken is now set as httpOnly cookie by server, not in response body
 */
export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export interface MessageResponse {
  message: string;
}

export interface LoginDto {
  email: string;
  password: string;
  captchaToken?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  captchaToken?: string;
  referralCode?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio?: string | null;
  coverImage?: string | null;
  isPublic?: boolean;
  role: string;
  createdAt: string;
  onboardingCompleted?: boolean;
  subscription?: {
    plan: 'free' | 'premium_lite' | 'premium' | 'lifetime' | 'exam_bundle';
    status: string;
    expiresAt: string | null;
  };
}

export interface AuthBootstrap {
  user: User;
  settings: Record<string, unknown>;
  subscription: NonNullable<User['subscription']>;
  xp: {
    xp: number;
    level: number;
    name: string;
    nameVi: string;
    cefr: string;
    cefrLabel: string;
    nextLevelXp: number;
    currentLevelXp: number;
    xpInLevel: number;
    xpNeeded: number;
    progress: number;
  };
  unreadCount: { count: number };
  streak: number;
}

export const authApi = {
  register: async (data: RegisterDto): Promise<MessageResponse> => {
    return apiPost<MessageResponse>('/auth/register', data);
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/login', data);
    setAccessToken(response.accessToken);
    setSessionHint();
    return response;
  },

  verifyEmail: async (token: string): Promise<MessageResponse> => {
    return api<MessageResponse>(`/auth/verify-email?token=${encodeURIComponent(token)}`, { method: 'GET' });
  },

  resendVerification: async (email: string): Promise<MessageResponse> => {
    return apiPost<MessageResponse>('/auth/resend-verification', { email });
  },

  forgotPassword: async (email: string, captchaToken?: string): Promise<MessageResponse> => {
    return apiPost<MessageResponse>('/auth/forgot-password', { email, captchaToken });
  },

  resetPassword: async (token: string, password: string): Promise<MessageResponse> => {
    return apiPost<MessageResponse>('/auth/reset-password', { token, password });
  },

  logout: async (): Promise<void> => {
    try {
      await apiPost('/auth/logout');
    } finally {
      clearTokens();
      clearSessionHint();
    }
  },

  getMe: async (): Promise<User> => {
    return apiGet<User>('/auth/me');
  },

  bootstrap: async (): Promise<AuthBootstrap> => {
    return apiGet<AuthBootstrap>('/auth/bootstrap');
  },
};
