/** Marker stored in `users.password_hash` until `db:seed` applies INITIAL_ADMIN_PASSWORD. */
export const BOOTSTRAP_ADMIN_HASH_PLACEHOLDER = 'bootstrap_admin_hash_placeholder';

export function isBootstrapAdminPasswordHash(passwordHash: string): boolean {
  return passwordHash.includes(BOOTSTRAP_ADMIN_HASH_PLACEHOLDER);
}

/** Password was never seeded (migrate-config placeholder) or hash is not verifiable argon2. */
export function isUnusableLoginPasswordHash(passwordHash: string): boolean {
  if (isBootstrapAdminPasswordHash(passwordHash)) {
    return true;
  }
  // Legacy migrate-config stored a fake argon2-looking string that argon2.verify rejects.
  if (passwordHash.includes('bootstrap_admin_hash_placeholder')) {
    return true;
  }
  return !passwordHash.startsWith('$argon2');
}
