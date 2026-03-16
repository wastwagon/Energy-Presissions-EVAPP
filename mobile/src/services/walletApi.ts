/**
 * Wallet API Service
 */

import { api } from './api';
import { WalletBalance, WalletTransaction } from '../types';

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
}

export const walletApi = {
  /**
   * Get wallet balance
   */
  getBalance: async (userId?: number): Promise<WalletBalance> => {
    if (!userId) {
      // Get from current user context
      const userStr = await require('@react-native-async-storage/async-storage').default.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      const user = JSON.parse(userStr);
      userId = user.id;
    }
    const response = await api.get(`/wallet/balance/${userId}`);
    return response.data;
  },

  /**
   * Get available balance (excluding reservations)
   */
  getAvailableBalance: async (userId?: number): Promise<{
    available: number;
    reserved: number;
    total: number;
    currency: string;
  }> => {
    if (!userId) {
      const userStr = await require('@react-native-async-storage/async-storage').default.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      const user = JSON.parse(userStr);
      userId = user.id;
    }
    const response = await api.get(`/wallet/available-balance/${userId}`);
    return response.data;
  },

  /**
   * Top up wallet
   */
  topUp: async (
    userId: number,
    amount: number,
    adminNote?: string
  ): Promise<WalletTransaction> => {
    const response = await api.post('/wallet/top-up', {
      userId,
      amount,
      adminNote,
    });
    return response.data;
  },

  /**
   * Get wallet transactions
   */
  getTransactions: async (
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<WalletTransactionsResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await api.get(
      `/wallet/transactions/${userId}?${params.toString()}`
    );
    return response.data;
  },
};
