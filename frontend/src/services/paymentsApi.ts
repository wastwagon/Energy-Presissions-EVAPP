import { api } from './api';

export interface Payment {
  id: number;
  transactionId?: number;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentGateway?: string;
  status: string;
  processedAt?: string;
  createdAt: string;
}

export interface PaymentInitResponse {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
  publicKey?: string;
}

export const paymentsApi = {
  /**
   * Get all payments (Admin/SuperAdmin)
   */
  getAllPayments: async (limit = 100, offset = 0): Promise<{ payments: Payment[]; total: number }> => {
    const response = await api.get(`/payments/all?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  /**
   * Get payments for current user
   */
  getUserPayments: async (): Promise<Payment[] | { payments: Payment[]; total: number }> => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not logged in');
    }
    const user = JSON.parse(userStr);
    const response = await api.get(`/payments/user/${user.id}`);
    // Backend might return { payments: [], total: 0 } or just []
    return response.data;
  },

  /**
   * Get payment by ID
   */
  getPayment: async (id: number): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  /**
   * Get Paystack public key
   */
  getPublicKey: async (): Promise<{ publicKey: string }> => {
    const response = await api.get('/payments/paystack/public-key');
    return response.data;
  },

  /**
   * Initialize Paystack payment
   * Supports mobile money with channel and phone parameters
   */
  initializePayment: async (
    invoiceId: number,
    email: string,
    channel?: string,
    phone?: string,
  ): Promise<PaymentInitResponse> => {
    const response = await api.post('/payments/initialize', {
      invoiceId,
      email,
      channel,
      phone,
    });
    return response.data;
  },

  /**
   * Process invoice payment via Paystack
   */
  processInvoicePayment: async (invoiceId: number, email: string): Promise<Payment> => {
    const response = await api.post(`/payments/paystack/invoice/${invoiceId}`, {
      email,
    });
    return response.data;
  },

  /**
   * Process transaction payment via Paystack
   * This will create an invoice if needed and initialize payment
   */
  processTransactionPayment: async (
    transactionId: number,
    email: string,
    channel?: string,
    phone?: string,
  ): Promise<PaymentInitResponse> => {
    const response = await api.post(`/payments/transaction/${transactionId}`, {
      email,
      channel,
      phone,
    });
    return response.data;
  },

  /**
   * Process wallet payment
   */
  processWalletPayment: async (invoiceId: number): Promise<Payment> => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('User not logged in');
    }
    const user = JSON.parse(userStr);
    const response = await api.post(`/payments/wallet/invoice/${invoiceId}`, {
      userId: user.id,
    });
    return response.data;
  },

  /**
   * Process cash payment (admin only)
   */
  processCashPayment: async (
    transactionId: number,
    amount: number,
    receivedBy: number,
    notes?: string,
  ): Promise<Payment> => {
    const response = await api.post(`/payments/cash/transaction/${transactionId}`, {
      amount,
      receivedBy,
      notes,
    });
    return response.data;
  },
};
