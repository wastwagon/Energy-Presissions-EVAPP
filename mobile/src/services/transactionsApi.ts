/**
 * Transactions API Service
 */

import { api } from './api';
import { Transaction } from '../types';

export const transactionsApi = {
  /**
   * Get user transactions
   */
  getUserTransactions: async (userId: number): Promise<Transaction[]> => {
    const response = await api.get('/transactions', {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Get active transactions
   */
  getActiveTransactions: async (userId: number): Promise<Transaction[]> => {
    const response = await api.get('/transactions/active', {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Get transaction by ID
   */
  getTransactionById: async (id: number): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },
};
