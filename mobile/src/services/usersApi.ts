/**
 * Users API Service
 * Profile update and account deletion
 */

import { api } from './api';
import { User } from '../types';

export const usersApi = {
  /**
   * Update user profile
   */
  update: async (
    id: number,
    data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>>
  ): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user account
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
