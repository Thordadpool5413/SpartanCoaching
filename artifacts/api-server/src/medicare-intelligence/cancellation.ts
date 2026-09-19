import { AsyncLocalStorage } from "node:async_hooks";

type SharedEntry<T> = {
  controller: AbortController;
  promise: Promise<T>;
  subscribers: number;
};

const shared = new Map<string, SharedEntry<unknown>>();
const signalStore = new AsyncLocalStorage<AbortSignal>();

export function currentCancellationSignal() {
  return signalStore.getStore();
}

export function withCancellationSignal<T>(signal: AbortSignal, work: () => Promise<T>) {
  return signalStore.run(signal, work);
}

function abortReason(signal: AbortSignal) {
  return signal.reason instanceof Error ? signal.reason : new DOMException("The operation was aborted", "AbortError");
}

export function throwIfRequestCancelled(_cause?: unknown) {
  const signal = currentCancellationSignal();
  if (signal?.aborted) throw abortReason(signal);
}

export async function shareAbortable<T>(
  key: string,
  signal: AbortSignal | undefined,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  if (signal?.aborted) throw abortReason(signal);
  let entry = shared.get(key) as SharedEntry<T> | undefined;
  if (!entry) {
    const controller = new AbortController();
    const promise = withCancellationSignal(controller.signal, () => work(controller.signal)).finally(() => shared.delete(key));
    entry = { controller, promise, subscribers: 0 };
    shared.set(key, entry as SharedEntry<unknown>);
  }
  entry.subscribers += 1;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    entry!.subscribers -= 1;
    if (entry!.subscribers === 0 && shared.get(key) === entry) entry!.controller.abort(new Error("All request subscribers disconnected"));
  };
  const disconnected = signal
    ? new Promise<never>((_, reject) => signal.addEventListener("abort", () => {
        release();
        reject(abortReason(signal));
      }, { once: true }))
    : null;
  try {
    return await (disconnected ? Promise.race([entry.promise, disconnected]) : entry.promise);
  } finally {
    release();
  }
}

export async function withinBudget<T>(
  label: string,
  timeoutMs: number,
  parentSignal: AbortSignal | undefined,
  work: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  if (parentSignal?.aborted) throw abortReason(parentSignal);
  const controller = new AbortController();
  const onParentAbort = () => controller.abort(parentSignal?.reason);
  parentSignal?.addEventListener("abort", onParentAbort, { once: true });
  const reason = new Error(`${label} exceeded the ${Math.round(timeoutMs / 1000)} second market-load budget.`);
  const timer = setTimeout(() => controller.abort(reason), timeoutMs);
  try {
    return await work(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason instanceof Error ? controller.signal.reason : error;
    throw error;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onParentAbort);
  }
}