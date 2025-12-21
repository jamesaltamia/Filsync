import api from './api';
import type { AuthResponse, LoginCredentials, User } from '../types/user';

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'admin' | 'cashier';
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/register', credentials);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string; otp?: string }> => {
    const response = await api.post<{ message: string; otp?: string }>('/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/reset-password', data);
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

