import { api } from './api';
import { requireStoredUserId } from '../utils/authSession';

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  reference?: string;
  paymentId?: number;
  transactionId?: number;
  adminId?: number;
  adminNote?: string;
  createdAt: string;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
}

export const walletApi = {
  /**
   * Get user wallet balance
   */
  getBalance: async (userId?: number): Promise<WalletBalance> => {
    // If userId not provided, get from current user
    if (!userId) {
      userId = requireStoredUserId();
    }
    const response = await api.get(`/wallet/balance/${userId}`);
    return response.data;
  },

  /**
   * Get available wallet balance (excluding pending reservations)
   */
  getAvailableBalance: async (userId?: number): Promise<{ available: number; reserved: number; total: number; currency: string }> => {
    // If userId not provided, get from current user
    if (!userId) {
      userId = requireStoredUserId();
    }
    const response = await api.get(`/wallet/available-balance/${userId}`);
    return response.data;
  },

  /**
   * Top up wallet (Admin)
   */
  topUp: async (userId: number, amount: number, adminNote?: string): Promise<WalletTransaction> => {
    const response = await api.post('/wallet/top-up', {
      userId,
      amount,
      adminNote,
    });
    return response.data;
  },

  /**
   * Adjust wallet balance (Admin)
   */
  adjust: async (userId: number, amount: number, adminNote: string): Promise<WalletTransaction> => {
    const response = await api.post('/wallet/adjust', {
      userId,
      amount,
      adminNote,
    });
    return response.data;
  },

  /**
   * Get wallet transactions
   */
  getTransactions: async (userId: number, limit?: number, offset?: number): Promise<WalletTransactionsResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const response = await api.get(`/wallet/transactions/${userId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Get wallet transaction by ID
   */
  getTransaction: async (id: number): Promise<WalletTransaction> => {
    const response = await api.get(`/wallet/transactions/detail/${id}`);
    return response.data;
  },

  /**
   * Process payment using wallet for invoice
   */
  payWithWallet: async (invoiceId: number, userId: number) => {
    const response = await api.post(`/payments/wallet/invoice/${invoiceId}`, { userId });
    return response.data;
  },

  /**
   * Process payment using wallet for transaction
   */
  payTransactionWithWallet: async (transactionId: number, userId: number) => {
    const response = await api.post(`/payments/wallet/transaction/${transactionId}`, { userId });
    return response.data;
  },
};

