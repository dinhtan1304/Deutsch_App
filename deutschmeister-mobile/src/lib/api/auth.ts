import { apiPost, apiGet, setAccessToken, clearTokens } from './client';

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
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
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
  subscription?: {
    plan: 'free' | 'premium';
    status: string;
    expiresAt: string | null;
  };
}

export const authApi = {
  register: async (data: RegisterDto): Promise<MessageResponse> => {
    return apiPost<MessageResponse>('/auth/register', data);
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/login', data);
    await setAccessToken(response.accessToken);
    return response;
  },

  forgotPassword: async (email: string): Promise<MessageResponse> => {
    return apiPost<MessageResponse>('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<MessageResponse> => {
    return apiPost<MessageResponse>('/auth/reset-password', { token, password });
  },

  logout: async (): Promise<void> => {
    try {
      await apiPost('/auth/logout');
    } finally {
      await clearTokens();
    }
  },

  getMe: async (): Promise<User> => {
    return apiGet<User>('/auth/me');
  },
};
