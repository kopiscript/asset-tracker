/**
 * lib/validation.ts
 * Shared input-validation helpers.
 */

/**
 * Pragmatic email-format check: a non-empty local part, one `@`, and a domain
 * with at least one dot and a TLD — no whitespace anywhere.
 *
 * Intentionally permissive enough for any real address but rejects the junk
 * shapes that Billplz refuses with "Email is invalid" (e.g. "test",
 * "test@test", or values containing spaces). Stricter than the browser's
 * `type="email"`, which accepts "test@test".
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
