import { randomUUID } from "node:crypto";
import { pool } from "../db";

export type RuntimeUser = { userId: string };
export type RuntimeContext = {
  method: string;
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  body: unknown;
  user?: RuntimeUser;
};
export type RuntimeResponse = { statusCode: number; headers?: Record<string, string>; body?: string };
type Middleware = (ctx: RuntimeContext) => Promise<RuntimeResponse | void> | RuntimeResponse | void;

export const json = (value: unknown, statusCode = 200): RuntimeResponse => ({
  statusCode,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(value),
});
export const error = (message: string, statusCode = 400) => json({ error: message }, statusCode);
export const requireAuth = (): Middleware => (ctx) => ctx.user ? undefined : error("Authentication required", 401);

function match(pattern: string, path: string) {
  const expected = pattern.split("/").filter(Boolean);
  const actual = path.split("/").filter(Boolean);
  if (expected.length !== actual.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < expected.length; i += 1) {
    if (expected[i].startsWith(":")) params[expected[i].slice(1)] = decodeURIComponent(actual[i]);
    else if (expected[i] !== actual[i]) return null;
  }
  return params;
}

export function router(routes: Record<string, Middleware[]>) {
  const compiled = Object.entries(routes).map(([key, middleware]) => {
    const space = key.indexOf(" ");
    return { method: key.slice(0, space), pattern: key.slice(space + 1), middleware };
  });
  return async (event: Omit<RuntimeContext, "params">): Promise<RuntimeResponse> => {
    for (const route of compiled) {
      if (route.method !== event.method.toUpperCase()) continue;
      const params = match(route.pattern, event.path);
      if (!params) continue;
      const ctx: RuntimeContext = { ...event, params };
      for (const fn of route.middleware) {
        try {
          const result = await fn(ctx);
          if (result) return result;
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "Unexpected Medicare Intelligence error";
          console.error("medicare_intelligence_handler_failed", { method: event.method, path: event.path, message });
          return error(message, 500);
        }
      }
      return error("Route did not return a response", 500);
    }
    return error("Medicare Intelligence route not found", 404);
  };
}

type Row<T> = T & { id: string };
const pageOffset = (token?: string) => Math.max(0, Number.parseInt(token || "0", 10) || 0);
const boundedLimit = (limit?: number) => Math.max(1, Math.min(500, limit || 100));

export const db = {
  async list<T>(bucket: string, options: { limit?: number; nextToken?: string } = {}) {
    const limit = boundedLimit(options.limit), offset = pageOffset(options.nextToken);
    const result = await pool.query(
      `SELECT id::text, record FROM medicare_workspace_records WHERE bucket=$1 ORDER BY updated_at DESC, id LIMIT $2 OFFSET $3`,
      [bucket, limit + 1, offset],
    );
    const rows = result.rows.slice(0, limit).map((row) => ({ id: row.id, ...row.record }) as Row<T>);
    return { items: rows, nextToken: result.rows.length > limit ? String(offset + limit) : undefined };
  },
  async get<T>(bucket: string, ids: string[]) {
    if (!ids.length) return [] as Array<T | null>;
    const result = await pool.query(`SELECT id::text, record FROM medicare_workspace_records WHERE bucket=$1 AND id=ANY($2::uuid[])`, [bucket, ids]);
    const byId = new Map(result.rows.map((row) => [row.id, row.record as T]));
    return ids.map((id) => byId.get(id) || null);
  },
  async add<T>(bucket: string, records: T[]) {
    const ids: string[] = [];
    for (const record of records) {
      const id = randomUUID();
      await pool.query(`INSERT INTO medicare_workspace_records (id,bucket,record) VALUES ($1,$2,$3::jsonb)`, [id, bucket, JSON.stringify(record)]);
      ids.push(id);
    }
    return ids;
  },
  async update<T>(bucket: string, updates: Array<{ id: string; record: T }>) {
    const results: boolean[] = [];
    for (const update of updates) {
      const result = await pool.query(`UPDATE medicare_workspace_records SET record=$3::jsonb, updated_at=now() WHERE bucket=$1 AND id=$2`, [bucket, update.id, JSON.stringify(update.record)]);
      results.push(Boolean(result.rowCount));
    }
    return results;
  },
  async delete(bucket: string, ids: string[]) {
    if (!ids.length) return [];
    const result = await pool.query(`DELETE FROM medicare_workspace_records WHERE bucket=$1 AND id=ANY($2::uuid[]) RETURNING id::text`, [bucket, ids]);
    const deleted = new Set(result.rows.map((row) => row.id));
    return ids.map((id) => deleted.has(id));
  },
};

type StorageFile = { path: string; content: string; contentType?: string };
export const storage = {
  async read(paths: string[]): Promise<StorageFile[]> {
    if (!paths.length) return [];
    const result = await pool.query(`SELECT path, content, content_type AS "contentType" FROM medicare_cache_objects WHERE path=ANY($1::text[])`, [paths]);
    const byPath = new Map(result.rows.map((row) => [row.path, row]));
    return paths.map((path) => byPath.get(path)).filter(Boolean);
  },
  async write(files: StorageFile[]) {
    const results: boolean[] = [];
    for (const file of files) {
      await pool.query(`INSERT INTO medicare_cache_objects (path,content,content_type) VALUES ($1,$2,$3) ON CONFLICT (path) DO UPDATE SET content=EXCLUDED.content, content_type=EXCLUDED.content_type, updated_at=now()`, [file.path, file.content, file.contentType || "application/json"]);
      results.push(true);
    }
    return results;
  },
  async delete(paths: string[]) {
    if (!paths.length) return [];
    const result = await pool.query(`DELETE FROM medicare_cache_objects WHERE path=ANY($1::text[]) RETURNING path`, [paths]);
    const deleted = new Set(result.rows.map((row) => row.path));
    return paths.map((path) => deleted.has(path));
  },
  async list(options: { prefix?: string; limit?: number; nextToken?: string } = {}) {
    const limit = boundedLimit(options.limit), offset = pageOffset(options.nextToken);
    const escaped = (options.prefix || "").replace(/[\\%_]/g, "\\$&") + "%";
    const result = await pool.query(`SELECT path, content, content_type AS "contentType" FROM medicare_cache_objects WHERE path LIKE $1 ESCAPE '\\' ORDER BY path LIMIT $2 OFFSET $3`, [escaped, limit + 1, offset]);
    const items = result.rows.slice(0, limit);
    return { items, paths: items.map((item) => item.path), nextToken: result.rows.length > limit ? String(offset + limit) : undefined };
  },
};

export const notifications = {
  async send(input: { userIds: string[]; notification: { title: string; body: string }; data?: unknown; ttlSeconds?: number }) {
    let sent = 0;
    for (const userId of input.userIds) {
      const [organizationId, memberId] = userId.split(":").map(Number);
      if (!organizationId || !memberId) continue;
      const dedupe = `medicare:${randomUUID()}`;
      await pool.query(`INSERT INTO member_notifications (organization_id,member_id,type,title_safe,body_safe,deep_link,dedupe_key) VALUES ($1,$2,'important_next_action',$3,$4,$5::jsonb,$6)`, [organizationId, memberId, input.notification.title.slice(0, 200), input.notification.body.slice(0, 1000), JSON.stringify({ key: "tools", path: "/tools/intelligence/alerts" }), dedupe]);
      sent += 1;
    }
    return { sent };
  },
};
