import type { TFunction } from 'i18next';

export interface ApiError {
  timestamp?: string;
  status?: number;
  code?: string;
  message?: string;
  messageKey?: string;
  errors?: Record<string, string>;
  errorKeys?: Record<string, string>;
}

// Get translated error message from API error response
export function getErrorMessage(error: ApiError | null | undefined, t: TFunction): string {
  if (!error) {
    return t('errors.system.internal');
  }

  // Try to use messageKey for i18n translation
  if (error.messageKey) {
    const translated = t(error.messageKey);
    // If translation exists (not same as key), use it
    if (translated !== error.messageKey) {
      return translated;
    }
  }

  // Fall back to message from server
  if (error.message) {
    return error.message;
  }

  // Default error message
  return t('errors.system.internal');
}

// Get translated field validation errors
export function getFieldErrors(
  error: ApiError | null | undefined,
  t: TFunction
): Record<string, string> {
  if (!error) {
    return {};
  }

  // Try to use errorKeys for i18n translation
  if (error.errorKeys && Object.keys(error.errorKeys).length > 0) {
    const translatedErrors: Record<string, string> = {};
    for (const [field, key] of Object.entries(error.errorKeys)) {
      const translated = t(key, { field });
      translatedErrors[field] = translated !== key ? translated : (error.errors?.[field] || key);
    }
    return translatedErrors;
  }

  // Fall back to errors from server
  return error.errors || {};
}

// Extract API error from axios error response
export function extractApiError(error: unknown): ApiError | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  // Handle axios error format
  const axiosError = error as { response?: { data?: ApiError } };
  if (axiosError.response?.data) {
    return axiosError.response.data;
  }

  return null;
}

// Check if error is a specific error code
export function isErrorCode(error: ApiError | null | undefined, code: string): boolean {
  return error?.code === code;
}

// Common error codes
export const ErrorCodes = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_EMAIL_EXISTS: 'AUTH_002',
  AUTH_INVALID_TOKEN: 'AUTH_003',
  AUTH_TOKEN_EXPIRED: 'AUTH_004',
  AUTH_ACCOUNT_DISABLED: 'AUTH_005',
  VALIDATION_FAILED: 'VAL_001',
  RESOURCE_NOT_FOUND: 'RES_001',
  RESOURCE_EXISTS: 'RES_002',
  ACCESS_DENIED: 'RES_003',
  INSUFFICIENT_BALANCE: 'TXN_001',
  INVALID_TRANSFER: 'TXN_002',
  SAME_ACCOUNT_TRANSFER: 'TXN_003',
  BUDGET_PERIOD_OVERLAP: 'BUD_001',
  INTERNAL_ERROR: 'SYS_001',
  SERVICE_UNAVAILABLE: 'SYS_002',
} as const;
