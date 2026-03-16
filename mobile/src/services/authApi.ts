/**
 * Authentication API Service
 */

import { api } from './api';
import { AuthResponse, User } from '../types';

export const authApi = {
  /**
   * Login user
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Logout (client-side only - clears token)
   */
  logout: async (): Promise<void> => {
    // Token removal is handled by API interceptor on 401
    // This is just for explicit logout
    return Promise.resolve();
  },
};
