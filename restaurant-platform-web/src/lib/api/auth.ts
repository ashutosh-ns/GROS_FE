import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    platformRole: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => apiClient.post<AuthResponse>('/auth/register', data),
  refresh: (refreshToken: string) => apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),
  logout: (refreshToken?: string) => apiClient.post('/auth/logout', { refreshToken }),
};
