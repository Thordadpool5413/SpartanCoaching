/**
 * Legacy marketing page for /field-kit.
 * Routes now redirect to /membership; keep this module as a thin alias so any
 * deep imports still resolve to the membership lander.
 */
export { default } from "./FieldKitMembership";
