import { performance } from "node:perf_hooks";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import { storageTypes } from "./codec";

export class KnowledgeUnavailable extends Error {
  constructor(
    public readonly code:
      "COMMAND_IN_PROGRESS" | "COMMAND_UNAVAILABLE" | "COMMAND_OUTCOME_UNKNOWN",
  ) {
    super(code);
  }
}
export class CommandDeadline {
  readonly expires = performance.now() + 5000;
  remaining(): number {
    const r = Math.floor(this.expires - performance.now());
    if (r < 2) throw new KnowledgeUnavailable("COMMAND_IN_PROGRESS");
    return r;
  }
  async bound<T>(
    action: Promise<T>,
    onTimeout: () => void = () => {},
  ): Promise<T> {
    const r = this.remaining();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        action,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            onTimeout();
            reject(new KnowledgeUnavailable("COMMAND_IN_PROGRESS"));
          }, r);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
}

export class CommandConnection {
  private released = false;
  private dirty = false;
  private transaction = false;
  private commitDispatched = false;
  constructor(
    readonly client: PoolClient,
    readonly deadline: CommandDeadline,
  ) {}
  private destroy = () => {
    this.dirty = true;
    if (!this.released) {
      this.released = true;
      this.client.release(true);
    }
  };
  async raw<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values: unknown[] = [],
  ) {
    if (this.released) throw new KnowledgeUnavailable("COMMAND_UNAVAILABLE");
    this.deadline.remaining();
    return this.deadline.bound(
      this.client.query<T>({ text: sql, values, types: storageTypes }),
      this.destroy,
    );
  }
  async begin(readonly = false) {
    await this.raw(
      readonly
        ? "BEGIN ISOLATION LEVEL READ COMMITTED READ ONLY"
        : "BEGIN ISOLATION LEVEL READ COMMITTED",
    );
    this.transaction = true;
    await this.raw("SET LOCAL idle_in_transaction_session_timeout='5000ms'");
  }
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values: unknown[] = [],
  ) {
    let r = this.deadline.remaining();
    await this.raw(
      "SELECT set_config('statement_timeout',$1,true),set_config('lock_timeout',$2,true)",
      [`${r}ms`, `${Math.max(1, r - 1)}ms`],
    );
    r = this.deadline.remaining();
    // SET LOCAL itself consumed budget. The client watchdog bounds any remaining server timeout.
    if (r < 2) throw new KnowledgeUnavailable("COMMAND_IN_PROGRESS");
    return this.raw<T>(sql, values);
  }
  async finishRead() {
    await this.query("ROLLBACK");
    this.transaction = false;
  }
  async commit() {
    const r = this.deadline.remaining();
    await this.raw(
      "SELECT set_config('statement_timeout',$1,true),set_config('lock_timeout',$2,true)",
      [`${r}ms`, `${Math.max(1, r - 1)}ms`],
    );
    this.deadline.remaining();
    this.commitDispatched = true;
    try {
      await this.raw("COMMIT");
      this.transaction = false;
    } catch {
      this.destroy();
      throw new KnowledgeUnavailable("COMMAND_OUTCOME_UNKNOWN");
    }
  }
  async close() {
    if (this.released) return;
    if (this.transaction && !this.commitDispatched) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          this.client.query("ROLLBACK"),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              this.destroy();
              reject(new Error("ROLLBACK_TIMEOUT"));
            }, 1000);
          }),
        ]);
        this.transaction = false;
      } catch {
        this.dirty = true;
      } finally {
        clearTimeout(timer);
      }
    }
    if (!this.released) {
      this.released = true;
      this.client.release(this.dirty || this.transaction);
    }
  }
}
export async function acquire(
  pool: Pool,
  deadline: CommandDeadline,
): Promise<CommandConnection> {
  let abandoned = false;
  const pending = pool.connect().then((client) => {
    if (abandoned) {
      client.release();
      throw new KnowledgeUnavailable("COMMAND_IN_PROGRESS");
    }
    return client;
  });
  try {
    return new CommandConnection(
      await deadline.bound(pending, () => {
        abandoned = true;
      }),
      deadline,
    );
  } catch (e) {
    abandoned = true;
    if (e instanceof KnowledgeUnavailable) throw e;
    throw new KnowledgeUnavailable("COMMAND_UNAVAILABLE");
  }
}
export const contention = (e: unknown) =>
  !!e &&
  typeof e === "object" &&
  "code" in e &&
  ["55P03", "57014", "40P01", "40001"].includes(String(e.code));
