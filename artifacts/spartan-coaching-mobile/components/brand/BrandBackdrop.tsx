/**
 * The previous decorative PNG had no transparent alpha channel. Rendering it
 * at low opacity exposed its square canvas as a grey block across app screens.
 *
 * Keep this shared boundary as a no-op so existing screens remain stable while
 * guaranteeing that no decorative overlay obscures their content.
 */
export function BrandBackdrop() {
  return null;
}
