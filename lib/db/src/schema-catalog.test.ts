import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";
import { diffCatalog, readCatalog } from "./schema-catalog";

describe("content-free schema evidence", () => {
  it("hashes definitions and literals instead of emitting their contents", async () => {
    const sentinel = "SYNTHETIC_SCHEMA_SENTINEL_DO_NOT_LOG";
    const client = {
      query: vi.fn(async () => ({
        rows: [{ key: "synthetic_object", definition: sentinel }],
      })),
    } as unknown as PoolClient;
    const catalog = await readCatalog(client);
    expect(Object.keys(catalog)).toHaveLength(12);
    expect(JSON.stringify(catalog)).not.toContain(sentinel);
    const differences = diffCatalog(catalog, {});
    expect(differences).toHaveLength(12);
    expect(JSON.stringify(differences)).not.toContain(sentinel);
  });
  it("detects added, removed and changed objects in every compared category", () => {
    expect(
      diffCatalog(
        { columns: { same: "a", removed: "b", changed: "c" } },
        { columns: { same: "a", added: "d", changed: "e" } },
      ),
    ).toEqual([
      { category: "columns", key: "added", kind: "source_only" },
      { category: "columns", key: "changed", kind: "definition_differs" },
      { category: "columns", key: "removed", kind: "replay_only" },
    ]);
  });
});
