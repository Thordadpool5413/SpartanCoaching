/**
 * Decorative imagery must never participate in the native launch path.
 * The prior visual overlay was introduced in the first crashing release.
 * Keep this boundary intentionally inert until it has device-level coverage.
 */
export function BrandBackdrop() {
  return null;
}
