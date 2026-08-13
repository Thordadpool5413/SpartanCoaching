/**
 * Compatibility re-export only.
 *
 * Single source of truth for Drizzle tables + shared Zod types:
 *   `@workspace/db/schema` → `lib/db/src/schema/*`
 *
 * Do not reintroduce pgTable definitions in this package. Schema changes belong
 * in lib/db (plus numbered SQL under lib/db/migrations when shipping to prod).
 *
 * Stream A — dual-schema elimination.
 */
export * from "@workspace/db/schema";
