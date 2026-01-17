import type { User } from './types';

export const ROLES: { [key: string]: User['role'] } = {
  ADMIN: 'admin',
  SELLER: 'seller',
  ACCOUNTANT: 'accountant',
};

// Define the base paths accessible by each role.
// The admin role has access to everything by default, handled separately.
export const PERMISSIONS: Record<User['role'], string[]> = {
  admin: [], // This is handled as a special case in the hasPermission function.
  seller: ['/pos', '/invoices', '/products', '/customers'],
  accountant: ['/invoices', '/reports', '/expenses'],
};

/**
 * Checks if a role has access to a specific path.
 * Admin role always has access.
 * Root path '/' is always allowed for logged-in users.
 * For other roles/paths, checks if the path starts with any of the allowed base paths.
 * @param role The user's role.
 * @param path The path to check.
 * @returns boolean True if the role has access, false otherwise.
 */
export const hasPermission = (role: User['role'], path: string): boolean => {
  if (role === ROLES.ADMIN) {
    return true;
  }
  
  if (path === '/') {
    return true;
  }

  const allowedPaths = PERMISSIONS[role] || [];
  return allowedPaths.some(allowedPath => path.startsWith(allowedPath));
};
