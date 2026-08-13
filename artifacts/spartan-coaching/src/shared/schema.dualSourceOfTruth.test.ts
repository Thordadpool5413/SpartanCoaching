/**
 * Dual-schema elimination — source-of-truth contract.
 *
 * Web package must not reintroduce a parallel Drizzle/Zod schema.
 * `src/shared/schema.ts` is a re-export of `@workspace/db/schema` only.
 *
 * Stream A — dual-schema elimination.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as dbSchema from "@workspace/db/schema";
import * as sharedSchema from "@shared/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaFilePath = path.join(here, "schema.ts");

describe("dual-schema source of truth", () => {
  it("shared/schema.ts is re-export only (no local pgTable / createInsertSchema)", () => {
    const source = readFileSync(schemaFilePath, "utf8");

    expect(source).toMatch(/export \* from ["']@workspace\/db\/schema["']/);
    expect(source).not.toMatch(/\bpgTable\s*\(/);
    expect(source).not.toMatch(/\bcreateInsertSchema\s*\(/);
    expect(source).not.toMatch(/from\s+["']drizzle-orm\/pg-core["']/);
    expect(source).not.toMatch(/from\s+["']drizzle-zod["']/);
  });

  it("re-exports key CMS + chat types from @workspace/db/schema", () => {
    // Types the web admin / marketing pages import via @shared/schema
    const requiredKeys = [
      "articles",
      "resources",
      "podcasts",
      "testimonials",
      "caseStudies",
      "assessmentQuestions",
      "usageEvents",
      "chatMessageSchema",
      "insertArticleSchema",
      "insertResourceSchema",
    ] as const;

    for (const key of requiredKeys) {
      expect(dbSchema, `db schema missing ${key}`).toHaveProperty(key);
      expect(sharedSchema, `shared re-export missing ${key}`).toHaveProperty(key);
      expect(
        (sharedSchema as Record<string, unknown>)[key],
        `${key} must be the same export as @workspace/db/schema`,
      ).toBe((dbSchema as Record<string, unknown>)[key]);
    }
  });

  it("does not leave a second independent SelectArticle / ChatMessage shape", () => {
    // Runtime identity check: same table/schema object, not a fork.
    expect(sharedSchema.articles).toBe(dbSchema.articles);
    expect(sharedSchema.chatMessageSchema).toBe(dbSchema.chatMessageSchema);
  });
});
