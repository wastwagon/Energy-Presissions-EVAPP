import { api } from './api';

export type TenantStatus = 'active' | 'suspended' | 'disabled';

export interface Tenant {
  id: number;
  name: string;
  slug?: string;
  domain?: string;
  status: TenantStatus;
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

export interface TenantStatusInfo {
  status: TenantStatus;
  reason?: string;
  effectiveAt: string;
  updatedBy?: number;
  history: TenantDisablement[];
}

export interface TenantDisablement {
  id: number;
  tenantId: number;
  status: TenantStatus;
  reason?: string;
  effectiveAt: string;
  byUserId?: number;
  liftedAt?: string;
  createdAt: string;
}

export interface ChangeStatusRequest {
  status: TenantStatus;
  reason?: string;
}

export const tenantApi = {
  /**
   * Get all tenants (Super Admin only)
   */
  getAll: async (): Promise<Tenant[]> => {
    const response = await api.get('/admin/tenants');
    return response.data;
  },

  /**
   * Get tenant by ID
   */
  getById: async (id: number): Promise<Tenant> => {
    const response = await api.get(`/admin/tenants/${id}`);
    return response.data;
  },

  /**
   * Get tenant status with history
   */
  getStatus: async (id: number): Promise<TenantStatusInfo> => {
    const response = await api.get(`/admin/tenants/${id}/status`);
    return response.data;
  },

  /**
   * Create a new tenant
   */
  create: async (data: {
    name: string;
    slug?: string;
    domain?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    metadata?: Record<string, any>;
  }): Promise<Tenant> => {
    const response = await api.post('/admin/tenants', data);
    return response.data;
  },

  /**
   * Update tenant
   */
  update: async (id: number, data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.put(`/admin/tenants/${id}`, data);
    return response.data;
  },

  /**
   * Change tenant status
   */
  changeStatus: async (
    id: number,
    status: TenantStatus,
    reason?: string,
  ): Promise<{ ok: boolean; appliedAt: string }> => {
    const response = await api.put(`/admin/tenants/${id}/status`, {
      status,
      reason,
    });
    return response.data;
  },

  /**
   * Delete tenant (soft delete - sets to disabled)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/tenants/${id}`);
  },

  /**
   * Get current tenant status (for tenant portal)
   */
  getCurrentStatus: async (): Promise<{ status: TenantStatus; reason?: string }> => {
    // This endpoint would need to be created in the backend
    // For now, we'll use a placeholder
    try {
      const response = await api.get('/tenant/status');
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist, return active as default
      if (error.response?.status === 404) {
        return { status: 'active' };
      }
      throw error;
    }
  },

  /**
   * Login as tenant (Super Admin impersonation)
   */
  loginAsTenant: async (tenantId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/tenants/${tenantId}/login`, {});
    return response.data;
  },
};

