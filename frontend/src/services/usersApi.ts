import { api } from './api';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  accountType: string;
  balance?: number;
  currency?: string;
  status: string;
  emailVerified?: boolean;
  vendorId?: number;
  createdAt: string;
  updatedAt: string;
}

export const usersApi = {
  /**
   * Get all users
   */
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  /**
   * Get user by ID
   */
  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Create a new user
   */
  create: async (data: {
    email: string;
    password?: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    accountType?: string;
    status?: string;
    vendorId?: number;
  }): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  /**
   * Update user
   */
  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user (admin / self via ID — prefer deleteOwnAccount for profile)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /**
   * Delete your own customer account (requires current password)
   */
  deleteOwnAccount: async (password: string): Promise<void> => {
    await api.post('/users/me/delete-account', { password });
  },

  /**
   * Change user role
   */
  changeRole: async (id: number, accountType: string): Promise<User> => {
    const response = await api.put(`/users/${id}/role`, { accountType });
    return response.data;
  },

  /**
   * Get user favorite station IDs
   */
  getFavorites: async (id: number): Promise<string[]> => {
    const response = await api.get(`/users/${id}/favorites`);
    return response.data;
  },

  /**
   * Add station to favorites
   */
  addFavorite: async (id: number, chargePointId: string): Promise<void> => {
    await api.post(`/users/${id}/favorites/${encodeURIComponent(chargePointId)}`);
  },

  /**
   * Remove station from favorites
   */
  removeFavorite: async (id: number, chargePointId: string): Promise<void> => {
    await api.delete(`/users/${id}/favorites/${encodeURIComponent(chargePointId)}`);
  },
};
