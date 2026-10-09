import { parentPort } from "node:worker_threads";
import {
  transitionKnowledge,
  evaluateExpiryIntents,
} from "../foundation/lifecycle";
parentPort?.on(
  "message",
  (input: {
    task: "transition" | "expiry";
    state: unknown;
    actor?: unknown;
    command?: unknown;
    server?: unknown;
    now?: unknown;
  }) => {
    try {
      const result =
        input.task === "expiry"
          ? evaluateExpiryIntents(input.state, input.now)
          : transitionKnowledge(
              input.state,
              input.actor,
              input.command,
              input.server,
            );
      parentPort!.postMessage({ ok: true, result });
    } catch (e) {
      const code =
        e instanceof Error && /^[A-Z][A-Z0-9_]{0,79}$/.test(e.message)
          ? e.message
          : "KNOWLEDGE_CONTRACT_INVALID";
      parentPort!.postMessage({ ok: false, code });
    }
  },
);
