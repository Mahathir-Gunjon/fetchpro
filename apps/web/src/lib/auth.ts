export const DEFAULT_ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || 'admin@fetchpro.ai';
export const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || 'fetchpro2026!';

export const AUTH_STORAGE_KEY = 'fetchpro_auth_session';

export interface AuthSession {
  userId: string;
  authenticated: boolean;
  loggedInAt: string;
}

export function validateAdminCredentials(userId: string, pass: string): boolean {
  const cleanUser = userId.trim().toLowerCase();
  const validUsers = [
    DEFAULT_ADMIN_USER.toLowerCase(),
    'admin',
    'mahathir',
    'admin@fetchpro.ai',
  ];
  return validUsers.includes(cleanUser) && pass === DEFAULT_ADMIN_PASS;
}
