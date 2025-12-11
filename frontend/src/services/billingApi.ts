import { api } from './api';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  transactionId?: number;
  userId: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  currency: string;
  status: string;
  pdfPath?: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
}

export interface TransactionsResponse {
  transactions: any[];
  total: number;
}

export const billingApi = {
  getTransactions: async (
    limit?: number,
    offset?: number,
    userId?: number,
  ): Promise<TransactionsResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (userId) params.append('userId', userId.toString());

    const response = await api.get(`/billing/transactions?${params.toString()}`);
    return response.data;
  },

  getInvoices: async (
    limit?: number,
    offset?: number,
    userId?: number,
  ): Promise<InvoicesResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (userId) params.append('userId', userId.toString());

    const response = await api.get(`/billing/invoices?${params.toString()}`);
    return response.data;
  },

  getInvoice: async (id: number): Promise<Invoice> => {
    const response = await api.get(`/billing/invoices/${id}`);
    return response.data;
  },

  calculateTransactionCost: async (transactionId: number) => {
    const response = await api.post(`/billing/transactions/${transactionId}/calculate`);
    return response.data;
  },

  generateInvoice: async (transactionId: number): Promise<Invoice> => {
    const response = await api.post(`/billing/transactions/${transactionId}/invoice`);
    return response.data;
  },
};



