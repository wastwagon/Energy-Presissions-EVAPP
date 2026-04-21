import { api } from './api';

export type VendorStatus = 'active' | 'suspended' | 'disabled';

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
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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
  }): Promise<Vendor> => {
    const response = await api.post('/admin/vendors', data);
    return response.data;
  },

  /**
   * Update vendor
   */
  update: async (id: number, data: Partial<Vendor>): Promise<Vendor> => {
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

  /**
   * Get current user's vendor status (for non-admin users)
   */
  getCurrentVendorStatus: async (): Promise<{ status: VendorStatus; reason?: string }> => {
    const response = await api.get('/vendor/status');
    return response.data;
  },
};

