/**
 * Cross-device workspace conflict resolution.
 * Never silently overwrite newer server work with a stale client baseVersion.
 */

export type WorkspaceConflictInput = {
  /** Version the client last observed (0 = create / no prior server version) */
  baseVersion: number;
  /** Client edit time (ms epoch) */
  clientUpdatedAtMs: number;
  /** Server row; null if missing */
  server: {
    version: number;
    clientUpdatedAtMs: number;
    updatedAtMs: number;
    deletedAtMs: number | null;
  } | null;
};

export type WorkspaceConflictResult =
  | { decision: "create"; nextVersion: 1 }
  | { decision: "update"; nextVersion: number }
  | {
      decision: "conflict";
      code: "VERSION_CONFLICT" | "STALE_CLIENT";
      serverVersion: number;
      serverClientUpdatedAtMs: number;
      serverUpdatedAtMs: number;
      deleted: boolean;
    };

/**
 * Optimistic concurrency:
 * - Create when no server row.
 * - Soft-deleted row: allow revive when baseVersion is 0 or equals server.version.
 * - Live row: update only when baseVersion === server.version and client clock is not older.
 * - baseVersion mismatch → conflict (client must reload server state).
 */
export function resolveWorkspaceWrite(
  input: WorkspaceConflictInput,
): WorkspaceConflictResult {
  const base = Math.max(0, Math.floor(input.baseVersion));
  const clientTs = Math.max(0, Math.floor(input.clientUpdatedAtMs));

  if (!input.server) {
    return { decision: "create", nextVersion: 1 };
  }

  const server = input.server;
  const deleted = server.deletedAtMs != null;

  if (deleted) {
    if (base === 0 || base === server.version) {
      return { decision: "update", nextVersion: server.version + 1 };
    }
    return {
      decision: "conflict",
      code: "VERSION_CONFLICT",
      serverVersion: server.version,
      serverClientUpdatedAtMs: server.clientUpdatedAtMs,
      serverUpdatedAtMs: server.updatedAtMs,
      deleted: true,
    };
  }

  if (base !== server.version) {
    return {
      decision: "conflict",
      code: base < server.version ? "STALE_CLIENT" : "VERSION_CONFLICT",
      serverVersion: server.version,
      serverClientUpdatedAtMs: server.clientUpdatedAtMs,
      serverUpdatedAtMs: server.updatedAtMs,
      deleted: false,
    };
  }

  if (clientTs < server.clientUpdatedAtMs) {
    return {
      decision: "conflict",
      code: "STALE_CLIENT",
      serverVersion: server.version,
      serverClientUpdatedAtMs: server.clientUpdatedAtMs,
      serverUpdatedAtMs: server.updatedAtMs,
      deleted: false,
    };
  }

  return { decision: "update", nextVersion: server.version + 1 };
}

/** Merge server + local lists for dual-device display (by clientKey). */
export function mergeWorkspaceLists<
  T extends {
    clientKey: string;
    version: number;
    clientUpdatedAtMs: number;
    deleted?: boolean;
  },
>(serverItems: T[], localItems: T[]): T[] {
  const map = new Map<string, T>();
  for (const s of serverItems) {
    if (!s.deleted) map.set(s.clientKey, s);
  }
  for (const local of localItems) {
    if (local.deleted) {
      map.delete(local.clientKey);
      continue;
    }
    const existing = map.get(local.clientKey);
    if (!existing) {
      map.set(local.clientKey, local);
      continue;
    }
    if (
      local.version > existing.version ||
      (local.version === existing.version &&
        local.clientUpdatedAtMs >= existing.clientUpdatedAtMs)
    ) {
      map.set(local.clientKey, local);
    }
  }
  return [...map.values()].sort(
    (a, b) => b.clientUpdatedAtMs - a.clientUpdatedAtMs,
  );
}
