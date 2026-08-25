export const DEFAULT_ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || 'MMD@boss01';
export const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || 'MMD@boss01';

export const AUTH_STORAGE_KEY = 'fetchpro_auth_session';

export interface AuthSession {
  userId: string;
  authenticated: boolean;
  loggedInAt: string;
}

export function validateAdminCredentials(userId: string, pass: string): boolean {
  const cleanUser = userId.trim().toLowerCase();
  const targetUser = DEFAULT_ADMIN_USER.toLowerCase();
  
  return cleanUser === targetUser && pass === DEFAULT_ADMIN_PASS;
}
