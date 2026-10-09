import { Worker } from "node:worker_threads";
import { CommandDeadline, KnowledgeUnavailable } from "./deadline";
let active = 0;
/** Two process-local pure evaluators. No queue, database, network, or authority inputs from HTTP. */
export async function evaluate<T>(
  input: unknown,
  deadline: CommandDeadline,
): Promise<T> {
  if (active >= 2) throw new KnowledgeUnavailable("COMMAND_UNAVAILABLE");
  deadline.remaining();
  active++;
  let worker: Worker | undefined;
  try {
    const source = import.meta.url.endsWith(".ts");
    worker = new Worker(
      new URL(
        source ? "./evaluation.worker.ts" : "./evaluation.worker.mjs",
        import.meta.url,
      ),
      source ? { execArgv: ["--import", "tsx"] } : {},
    );
    const running = worker;
    return await deadline.bound(
      new Promise<T>((resolve, reject) => {
        running.once("error", () =>
          reject(new KnowledgeUnavailable("COMMAND_UNAVAILABLE")),
        );
        running.once("exit", () =>
          reject(new KnowledgeUnavailable("COMMAND_UNAVAILABLE")),
        );
        running.once(
          "message",
          (message: { ok: boolean; result: T; code: string }) => {
            if (message.ok) resolve(message.result);
            else reject(new Error(message.code));
          },
        );
        running.postMessage(input);
      }),
      () => {
        void running.terminate();
      },
    );
  } finally {
    if (worker) void worker.terminate();
    active--;
  }
}
