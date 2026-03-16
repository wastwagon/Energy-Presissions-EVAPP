/**
 * Validation Utilities
 * Form validation helpers
 */

import { VALIDATION } from '../../../shared/constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`,
    };
  }

  if (password.length > VALIDATION.MAX_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `Password must be less than ${VALIDATION.MAX_PASSWORD_LENGTH} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 */
export function getPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 2) strength = 'medium';

  return { strength, score, feedback };
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string, required: boolean = false): ValidationResult {
  if (!phone || phone.trim().length === 0) {
    if (required) {
      return { isValid: false, error: 'Phone number is required' };
    }
    return { isValid: true }; // Optional field
  }

  if (!VALIDATION.PHONE_REGEX.test(phone)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true };
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Validate amount (for charging)
 */
export function validateAmount(amount: number | string, min: number = 1, max: number = 10000): ValidationResult {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (numAmount < min) {
    return { isValid: false, error: `Minimum amount is ${min} GHS` };
  }

  if (numAmount > max) {
    return { isValid: false, error: `Maximum amount is ${max} GHS` };
  }

  return { isValid: true };
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
}
