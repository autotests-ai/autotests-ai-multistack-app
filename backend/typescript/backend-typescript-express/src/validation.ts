export const USERNAME_MIN = 3;
export const USERNAME_MAX = 64;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 128;

/** Returns the contract error message, or `null` when the credentials are valid. */
export function validateCredentials(username: unknown, password: unknown): string | null {
  if (typeof username !== 'string' || username.length === 0) {
    return 'username is required';
  }
  if (typeof password !== 'string' || password.length === 0) {
    return 'password is required';
  }
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `username must be ${USERNAME_MIN}-${USERNAME_MAX} characters`;
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return `password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters`;
  }
  return null;
}
