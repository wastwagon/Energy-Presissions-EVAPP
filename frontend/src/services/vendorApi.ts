import { api } from './api';

export type VendorStatus = 'active' | 'suspended' | 'disabled';
export type VendorPayoutCycle = 'weekly' | 'biweekly' | 'monthly';
export type VendorPayoutMethod = 'mobile_money' | 'bank';

export interface Vendor {
  id: number;
  name: string;
  slug?: string;
  domain?: string;
  status: VendorStatus;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  businessName?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  logoUrl?: string;
  receiptFooterText?: string;
  receiptHeaderText?: string;
  supportEmail?: string;
  supportPhone?: string;
  websiteUrl?: string;
  payoutCycle?: VendorPayoutCycle;
  payoutHoldDays?: number;
  payoutMethod?: VendorPayoutMethod | null;
  payoutMomoNetwork?: string | null;
  payoutMomoPhone?: string | null;
  payoutBankName?: string | null;
  payoutAccountName?: string | null;
  payoutAccountNumber?: string | null;
  payoutBankBranch?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  stationCount?: number;
  lastSessionAt?: string | null;
  gmv?: number;
}

export interface VendorStatusInfo {
  status: VendorStatus;
  reason?: string;
  effectiveAt: string;
  updatedBy?: number;
  history: VendorDisablement[];
}

export interface VendorDisablement {
  id: number;
  vendorId: number;
  status: VendorStatus;
  reason?: string;
  effectiveAt: string;
  byUserId?: number;
  liftedAt?: string;
  createdAt: string;
}

export interface ChangeStatusRequest {
  status: VendorStatus;
  reason?: string;
}

export interface VendorPortalAdmin {
  userId: number | null;
  email: string | null;
}

export interface VendorPayoutSummary {
  payoutCycle: VendorPayoutCycle;
  payoutCycleLabel: string;
  payoutHoldDays: number;
  nextPayoutAt: string;
  currency: string;
  grossCompleted: number;
  paidToDate: number;
  inHold: number;
  matured?: number;
  eligible: number;
  payoutMethod: VendorPayoutMethod | null;
  payoutMethodReady: boolean;
  payoutDestinationLabel: string | null;
}

export interface VendorPayoutRecord {
  id: number;
  vendorId: number;
  amount: number;
  currency: string;
  status: 'paid' | 'failed';
  paidAt: string;
  reference?: string | null;
  notes?: string | null;
  methodSnapshot?: string | null;
  destinationSnapshot?: string | null;
}

export const PAYOUT_CYCLE_OPTIONS: { value: VendorPayoutCycle; label: string }[] = [
  { value: 'weekly', label: 'Weekly (Mondays)' },
  { value: 'biweekly', label: 'Every two weeks (Mondays)' },
  { value: 'monthly', label: 'Monthly (1st)' },
];

export const PAYOUT_MOMO_NETWORKS: { value: string; label: string }[] = [
  { value: 'mtn', label: 'MTN' },
  { value: 'telecel', label: 'Telecel' },
  { value: 'airteltigo', label: 'AirtelTigo' },
];

export const vendorApi = {
  /**
   * Get all vendors (Super Admin only)
   */
  getAll: async (): Promise<Vendor[]> => {
    const response = await api.get('/admin/vendors');
    return response.data;
  },

  /**
   * Get vendor by ID
   */
  getById: async (id: number): Promise<Vendor> => {
    const response = await api.get(`/admin/vendors/${id}`);
    return response.data;
  },

  /**
   * Get vendor status with history
   */
  getStatus: async (id: number): Promise<VendorStatusInfo> => {
    const response = await api.get(`/admin/vendors/${id}/status`);
    return response.data;
  },

  /**
   * Vendor portal admin login (Super Admin)
   */
  getPortalAdmin: async (id: number): Promise<VendorPortalAdmin> => {
    const response = await api.get(`/admin/vendors/${id}/portal-admin`);
    return response.data;
  },

  /**
   * Create a new vendor
   */
  create: async (data: {
    name: string;
    slug?: string;
    domain?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    metadata?: Record<string, any>;
    adminEmail?: string;
    adminPassword: string;
    payoutCycle?: VendorPayoutCycle;
    payoutHoldDays?: number;
  }): Promise<Vendor> => {
    const response = await api.post('/admin/vendors', data);
    return response.data;
  },

  /**
   * Update vendor
   */
  update: async (
    id: number,
    data: Partial<Vendor> & { adminEmail?: string; adminPassword?: string },
  ): Promise<Vendor> => {
    const response = await api.put(`/admin/vendors/${id}`, data);
    return response.data;
  },

  /**
   * Upload vendor logo (multipart) — stores file in object storage and sets logoUrl
   */
  uploadLogo: async (id: number, file: File): Promise<Vendor> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/admin/vendors/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Change vendor status
   */
  changeStatus: async (id: number, data: ChangeStatusRequest): Promise<{ ok: boolean; appliedAt: string }> => {
    const response = await api.put(`/admin/vendors/${id}/status`, data);
    return response.data;
  },

  /**
   * Delete vendor (soft delete - sets to disabled)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/vendors/${id}`);
  },

  /**
   * Login as vendor (Super Admin impersonation)
   */
  loginAsVendor: async (id: number): Promise<{ success: boolean; message: string; vendorId: number }> => {
    const response = await api.post(`/admin/vendors/${id}/login`);
    return response.data;
  },

  getPayoutSummary: async (id: number): Promise<VendorPayoutSummary> => {
    const response = await api.get(`/admin/vendors/${id}/payout-summary`);
    return response.data;
  },

  getOwnPayoutSummary: async (): Promise<VendorPayoutSummary> => {
    const response = await api.get('/vendor/payout-summary');
    return response.data;
  },

  listOwnPayouts: async (): Promise<VendorPayoutRecord[]> => {
    const response = await api.get('/vendor/payouts');
    return response.data;
  },

  listPayouts: async (id: number): Promise<VendorPayoutRecord[]> => {
    const response = await api.get(`/admin/vendors/${id}/payouts`);
    return response.data;
  },

  recordPayout: async (
    id: number,
    data: { amount: number; reference?: string; notes?: string },
  ): Promise<VendorPayoutRecord> => {
    const response = await api.post(`/admin/vendors/${id}/payouts`, data);
    return response.data;
  },

  /**
   * Get current user's vendor status (for non-admin users)
   */
  getCurrentVendorStatus: async (): Promise<{ status: VendorStatus; reason?: string }> => {
    const response = await api.get('/vendor/status');
    return response.data;
  },
};

