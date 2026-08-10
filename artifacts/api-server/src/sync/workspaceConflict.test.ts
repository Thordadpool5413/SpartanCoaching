import { describe, expect, it } from "vitest";
import { mergeWorkspaceLists, resolveWorkspaceWrite } from "./workspaceConflict";

describe("resolveWorkspaceWrite", () => {
  it("creates when no server row", () => {
    expect(
      resolveWorkspaceWrite({
        baseVersion: 0,
        clientUpdatedAtMs: 1000,
        server: null,
      }),
    ).toEqual({ decision: "create", nextVersion: 1 });
  });

  it("updates when baseVersion matches server", () => {
    expect(
      resolveWorkspaceWrite({
        baseVersion: 2,
        clientUpdatedAtMs: 5000,
        server: {
          version: 2,
          clientUpdatedAtMs: 4000,
          updatedAtMs: 4100,
          deletedAtMs: null,
        },
      }),
    ).toEqual({ decision: "update", nextVersion: 3 });
  });

  it("rejects stale baseVersion without overwriting", () => {
    const result = resolveWorkspaceWrite({
      baseVersion: 1,
      clientUpdatedAtMs: 99999,
      server: {
        version: 3,
        clientUpdatedAtMs: 8000,
        updatedAtMs: 8100,
        deletedAtMs: null,
      },
    });
    expect(result.decision).toBe("conflict");
    if (result.decision === "conflict") {
      expect(result.code).toBe("STALE_CLIENT");
      expect(result.serverVersion).toBe(3);
    }
  });

  it("rejects same version with older client clock", () => {
    const result = resolveWorkspaceWrite({
      baseVersion: 2,
      clientUpdatedAtMs: 1000,
      server: {
        version: 2,
        clientUpdatedAtMs: 5000,
        updatedAtMs: 5100,
        deletedAtMs: null,
      },
    });
    expect(result.decision).toBe("conflict");
    if (result.decision === "conflict") {
      expect(result.code).toBe("STALE_CLIENT");
    }
  });
});

describe("mergeWorkspaceLists dual-device", () => {
  it("prefers higher version and keeps both keys", () => {
    const server = [
      { clientKey: "a", version: 2, clientUpdatedAtMs: 2000 },
      { clientKey: "b", version: 1, clientUpdatedAtMs: 1000 },
    ];
    const local = [
      { clientKey: "a", version: 1, clientUpdatedAtMs: 9000 },
      { clientKey: "c", version: 1, clientUpdatedAtMs: 3000 },
    ];
    const merged = mergeWorkspaceLists(server, local);
    const keys = merged.map((m) => m.clientKey).sort();
    expect(keys).toEqual(["a", "b", "c"]);
    expect(merged.find((m) => m.clientKey === "a")?.version).toBe(2);
  });

  it("drops soft-deleted local keys and keeps server when versions tie with newer server clock", () => {
    const merged = mergeWorkspaceLists(
      [{ clientKey: "x", version: 3, clientUpdatedAtMs: 5000 }],
      [
        { clientKey: "x", version: 3, clientUpdatedAtMs: 4000 },
        { clientKey: "y", version: 1, clientUpdatedAtMs: 1000, deleted: true },
      ],
    );
    expect(merged.map((m) => m.clientKey)).toEqual(["x"]);
    expect(merged[0]?.clientUpdatedAtMs).toBe(5000);
  });
});

describe("soft-delete revive", () => {
  it("allows recreate when baseVersion matches deleted server version", () => {
    expect(
      resolveWorkspaceWrite({
        baseVersion: 2,
        clientUpdatedAtMs: 9000,
        server: {
          version: 2,
          clientUpdatedAtMs: 1000,
          updatedAtMs: 1100,
          deletedAtMs: 2000,
        },
      }),
    ).toEqual({ decision: "update", nextVersion: 3 });
  });
});
