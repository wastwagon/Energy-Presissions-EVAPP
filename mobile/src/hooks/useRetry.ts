/**
 * useRetry Hook
 * Provides retry functionality for async operations
 */

import { useState, useCallback } from 'react';
import { isRetryableError, formatError } from '../utils/errorHandler';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
}

export function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: UseRetryOptions = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const executeWithRetry = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: Error | null = null;
      let attempts = 0;

      while (attempts <= maxRetries) {
        try {
          setIsRetrying(attempts > 0);
          setRetryCount(attempts);
          setError(null);

          if (attempts > 0 && onRetry) {
            onRetry(attempts);
          }

          const result = await fn(...args);
          setIsRetrying(false);
          setRetryCount(0);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          
          // If error is not retryable, break immediately
          if (!isRetryableError(err)) {
            setError(lastError);
            setIsRetrying(false);
            throw lastError;
          }

          attempts++;

          // If we've exhausted retries, throw the error
          if (attempts > maxRetries) {
            setError(lastError);
            setIsRetrying(false);
            throw lastError;
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempts));
        }
      }

      setError(lastError);
      setIsRetrying(false);
      throw lastError;
    },
    [fn, maxRetries, retryDelay, onRetry]
  );

  const reset = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    error,
    reset,
  };
}
