/**
 * Error Handler Utility
 * Centralized error handling and formatting
 */

import { ApiError } from '../types';
import NetInfo from '@react-native-community/netinfo';

export interface ErrorInfo {
  message: string;
  code?: string;
  retryable: boolean;
  type: 'network' | 'api' | 'validation' | 'unknown';
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

/**
 * Format error message for display
 */
export function formatError(error: unknown): ErrorInfo {
  // Network errors
  if (error instanceof Error) {
    if (error.message.includes('Network') || error.message.includes('network')) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        retryable: true,
        type: 'network',
      };
    }

    if (error.message.includes('timeout')) {
      return {
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
        retryable: true,
        type: 'network',
      };
    }

    if (error.message.includes('No internet')) {
      return {
        message: 'No internet connection. Please check your network settings.',
        code: 'NO_INTERNET',
        retryable: true,
        type: 'network',
      };
    }
  }

  // API errors
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const apiError = error as ApiError;
    
    switch (apiError.statusCode) {
      case 400:
        return {
          message: apiError.message || 'Invalid request. Please check your input.',
          code: 'BAD_REQUEST',
          retryable: false,
          type: 'validation',
        };
      case 401:
        return {
          message: 'Session expired. Please login again.',
          code: 'UNAUTHORIZED',
          retryable: false,
          type: 'api',
        };
      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          retryable: false,
          type: 'api',
        };
      case 404:
        return {
          message: 'Resource not found.',
          code: 'NOT_FOUND',
          retryable: false,
          type: 'api',
        };
      case 500:
      case 502:
      case 503:
        return {
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          retryable: true,
          type: 'api',
        };
      default:
        return {
          message: apiError.message || 'An error occurred. Please try again.',
          code: 'API_ERROR',
          retryable: true,
          type: 'api',
        };
    }
  }

  // Default error
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN',
      retryable: true,
      type: 'unknown',
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN',
    retryable: true,
    type: 'unknown',
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorInfo = formatError(error);
  return errorInfo.retryable;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const errorInfo = formatError(error);
  return errorInfo.message;
}
