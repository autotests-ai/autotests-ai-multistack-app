import { compare, hash } from 'bcryptjs';

const SALT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export function checkPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}
