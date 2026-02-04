import { apiPost, apiGet, setAccessToken, setRefreshToken, clearTokens } from './client';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
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
  createdAt: string;
}

export const authApi = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/register', data);
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    return response;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/login', data);
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiPost('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  getMe: async (): Promise<User> => {
    return apiGet<User>('/auth/me');
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    return apiPost<AuthResponse>('/auth/refresh', { refreshToken });
  },
};