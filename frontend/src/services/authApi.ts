import { api } from './api';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    accountType: string;
    vendorId: number;
    phone?: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone: string;
}

export const authApi = {
  /**
   * Login user (email or phone number + password).
   */
  login: async (emailOrPhone: string, password: string): Promise<LoginResponse> => {
    const trimmed = emailOrPhone.trim();
    const response = await api.post('/auth/login', { emailOrPhone: trimmed, password });
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<any> => {
    const response = await api.post('/auth/register', {
      ...data,
      phone: data.phone.trim(),
    });
    return response.data;
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Sign in with Apple (id_token from Apple JS SDK)
   */
  appleSignIn: async (idToken: string, user?: { name?: { firstName?: string; lastName?: string }; email?: string }): Promise<LoginResponse> => {
    const response = await api.post('/auth/apple', { id_token: idToken, user });
    return response.data;
  },

  /**
   * Sign in with Google (credential/id_token from Google Identity Services)
   */
  googleSignIn: async (credential: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/google', { credential });
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
    return response.data;
  },

  resetPassword: async (data: { email: string; token: string; password: string }): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', {
      email: data.email.trim().toLowerCase(),
      token: data.token.trim(),
      password: data.password,
    });
    return response.data;
  },

  /**
   * Logout (clear local storage)
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentVendorId');
    localStorage.removeItem('currentVendorName');
    localStorage.removeItem('isImpersonating');
  },
};



