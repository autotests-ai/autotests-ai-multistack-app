export const USERNAME_MIN = 3;
export const USERNAME_MAX = 64;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 128;

function fieldError(field: string, value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return `${field} is required`;
  }
  if (value.length < min || value.length > max) {
    return `${field} must be ${min}-${max} characters`;
  }
  return null;
}

/**
 * Returns the contract error message, or `null` when the credentials are valid.
 * Every failing field is reported at once, joined with `"; "` — a single field keeps its
 * message untouched.
 */
export function validateCredentials(username: unknown, password: unknown): string | null {
  const errors = [
    fieldError('username', username, USERNAME_MIN, USERNAME_MAX),
    fieldError('password', password, PASSWORD_MIN, PASSWORD_MAX),
  ].filter((error): error is string => error !== null);

  return errors.length === 0 ? null : errors.join('; ');
}
