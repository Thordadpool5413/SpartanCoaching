import { describe, expect, it } from "vitest";
import { normalizeCheckDefinition as normalize } from "./normalize-check-definition";

const source =
  "CHECK (status::text = ANY (ARRAY['queued'::character varying, 'done'::character varying]::text[]))";
const restored =
  "CHECK (status::text = ANY (ARRAY['queued'::character varying::text, 'done'::character varying::text]))";
describe("lossless PostgreSQL text-enum cast normalization", () => {
  it("equates array coercion with per-element unbounded text coercion", () => {
    expect(normalize(source)).toBe(normalize(restored));
    expect(normalize(source.replaceAll("character varying", "text"))).toBe(
      normalize(restored),
    );
  });
  it("preserves literal contents including commas and escaped quotes", () => {
    const before = source.replace("queued", "queue,''quoted''");
    const after = restored.replace("queued", "queue,''quoted''");
    expect(normalize(before)).toBe(normalize(after));
    expect(normalize(before)).not.toBe(normalize(source));
  });
  it("still detects changed values, columns and operators", () => {
    for (const changed of [
      restored.replace("done", "failed"),
      restored.replace("status", "decision"),
      restored.replace(" = ", " <> "),
    ])
      expect(normalize(source)).not.toBe(normalize(changed));
  });
  it("does not normalize bounded casts, NULL, collations or compound SQL", () => {
    for (const sql of [
      source.replaceAll("character varying", "character varying(2)"),
      source.replace("'done'::character varying", "NULL"),
      source.replace("status::text", 'status::text COLLATE "C"'),
      source + " OR true",
      source.replace("::text[]", ""),
      "CHECK (version > 0)",
    ])
      expect(normalize(sql)).toBe(sql);
  });
});
