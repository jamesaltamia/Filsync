import api from './api';
import type { AuthResponse, LoginCredentials, User } from '../types/user';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/logout');
  },

  me: async (): Promise<User> => {
    const response = await api.get<{ user: User }>('/me');
    return response.data.user;
  },
};

