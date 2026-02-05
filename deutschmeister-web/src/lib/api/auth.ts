import { apiPost, apiGet, setAccessToken, clearTokens } from './client';

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
    // Note: refreshToken is automatically set as httpOnly cookie by server
    return response;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/login', data);
    setAccessToken(response.accessToken);
    // Note: refreshToken is automatically set as httpOnly cookie by server
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiPost('/auth/logout');
      // Server will clear the httpOnly cookie
    } finally {
      clearTokens();
    }
  },

  getMe: async (): Promise<User> => {
    return apiGet<User>('/auth/me');
  },

  /**
   * Refresh access token
   * The refresh token is sent automatically via httpOnly cookie
   */
  refresh: async (): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/refresh', {});
    setAccessToken(response.accessToken);
    return response;
  },
};