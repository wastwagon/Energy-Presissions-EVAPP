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
  tenantId?: number;
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
    tenantId?: number;
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
   * Delete user
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /**
   * Change user role
   */
  changeRole: async (id: number, accountType: string): Promise<User> => {
    const response = await api.put(`/users/${id}/role`, { accountType });
    return response.data;
  },
};
