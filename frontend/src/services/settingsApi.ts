import { api } from './api';

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  category: 'branding' | 'billing' | 'ocpp' | 'payment' | 'notification' | 'general';
  description?: string;
  dataType: 'string' | 'number' | 'boolean' | 'json';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CmsContent {
  id: number;
  key: string;
  title?: string;
  content?: string;
  contentType: 'text' | 'html' | 'markdown' | 'image' | 'file';
  section?: string;
  tenantId?: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingAsset {
  id: number;
  assetType: 'logo' | 'favicon' | 'banner' | 'background' | 'icon';
  filePath: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  tenantId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const settingsApi = {
  // System Settings
  getSystemSettings: async (category?: string): Promise<SystemSetting[]> => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/admin/settings/system${params}`);
    return response.data;
  },

  getPublicSettings: async (): Promise<Record<string, any>> => {
    const response = await api.get('/admin/settings/system/public');
    return response.data;
  },

  getSetting: async (key: string): Promise<SystemSetting> => {
    const response = await api.get(`/admin/settings/system/${key}`);
    return response.data;
  },

  updateSetting: async (key: string, value: any): Promise<SystemSetting> => {
    const response = await api.put(`/admin/settings/system/${key}`, { value });
    return response.data;
  },

  createSetting: async (data: {
    key: string;
    value: any;
    category: SystemSetting['category'];
    description?: string;
    dataType?: SystemSetting['dataType'];
    isPublic?: boolean;
  }): Promise<SystemSetting> => {
    const response = await api.post('/admin/settings/system', data);
    return response.data;
  },

  // CMS Content
  getAllContent: async (tenantId?: number, section?: string): Promise<CmsContent[]> => {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId.toString());
    if (section) params.append('section', section);
    const response = await api.get(`/admin/settings/cms?${params.toString()}`);
    return response.data;
  },

  getContent: async (key: string, tenantId?: number): Promise<CmsContent> => {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/admin/settings/cms/${key}${params}`);
    return response.data;
  },

  createOrUpdateContent: async (data: {
    key: string;
    title: string;
    content: string;
    contentType: CmsContent['contentType'];
    section?: string;
    tenantId?: number;
    metadata?: Record<string, any>;
  }): Promise<CmsContent> => {
    const response = await api.post('/admin/settings/cms', data);
    return response.data;
  },

  deleteContent: async (key: string, tenantId?: number): Promise<void> => {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    await api.delete(`/admin/settings/cms/${key}${params}`);
  },

  // Branding Assets
  getAllAssets: async (tenantId?: number, assetType?: BrandingAsset['assetType']): Promise<BrandingAsset[]> => {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId.toString());
    if (assetType) params.append('assetType', assetType);
    const response = await api.get(`/admin/settings/branding?${params.toString()}`);
    return response.data;
  },

  getActiveBrandingAsset: async (
    assetType: BrandingAsset['assetType'],
    tenantId?: number,
  ): Promise<BrandingAsset | null> => {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/admin/settings/branding/active/${assetType}${params}`);
    return response.data;
  },

  uploadBrandingAsset: async (formData: FormData): Promise<BrandingAsset> => {
    const response = await api.post('/admin/settings/branding/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAsset: async (id: number): Promise<void> => {
    await api.delete(`/admin/settings/branding/${id}`);
  },
};



