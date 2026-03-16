/**
 * API Client for Mobile App
 * Adapted from web app API service
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ApiError } from '../types';

import { getApiUrl as getApiUrlFromConfig } from '../config/api.config';

// API Base URL - configured via api.config.ts
const getApiUrl = getApiUrlFromConfig;

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = getApiUrl();
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          throw new Error('No internet connection');
        }

        // Add auth token if available
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add vendor context if impersonating
        const vendorId = await AsyncStorage.getItem('currentVendorId');
        if (vendorId) {
          config.headers['X-Vendor-Id'] = vendorId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear auth data and redirect to login
          await AsyncStorage.multiRemove([
            'token',
            'user',
            'currentVendorId',
            'currentVendorName',
            'isImpersonating',
          ]);
          // Navigation will be handled by auth context
        }

        const apiError: ApiError = {
          message:
            (error.response?.data as any)?.message ||
            error.message ||
            'An error occurred',
          statusCode: error.response?.status,
          error: (error.response?.data as any)?.error,
        };

        return Promise.reject(apiError);
      }
    );
  }

  // Update base URL (useful for switching between dev/prod)
  setBaseURL(url: string) {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient.getClient();
