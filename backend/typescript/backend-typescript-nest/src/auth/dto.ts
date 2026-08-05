/** Bodies arrive unvalidated; `validateCredentials` is the single gate. */
export interface CredentialsDto {
  username?: unknown;
  password?: unknown;
}

export interface AuthResponse {
  token: string;
  username: string;
  redirectUrl: string;
}

export interface UserProfileResponse {
  username: string;
}
