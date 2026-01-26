// Shared validation constants - must match backend validation rules
export const VALIDATION = {
  PASSWORD_MIN: 8,
  NAME_MIN: 2,
  NAME_MAX: 100,
  DESCRIPTION_MAX: 500,
  AMOUNT_MAX: 999999999999.99,
  CURRENCY_LENGTH: 3,
  BILLING_DAY_MIN: 1,
  BILLING_DAY_MAX: 31,
  ALERT_THRESHOLD_MIN: 1,
  ALERT_THRESHOLD_MAX: 100,
} as const;

// Password strength regex - matches backend @StrongPassword validator
// Must have: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Validate strong password
export function isStrongPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}
