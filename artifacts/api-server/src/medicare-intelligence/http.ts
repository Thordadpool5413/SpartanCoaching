import { currentCancellationSignal } from "./cancellation";

export type FetchOptions = {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

const abortError = (signal: AbortSignal) =>
  signal.reason instanceof Error
    ? signal.reason
    : new DOMException("The operation was aborted", "AbortError");

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError(signal));
    const timer = setTimeout(done, ms);
    function done() {
      cleanup();
      resolve();
    }
    function aborted() {
      clearTimeout(timer);
      cleanup();
      reject(abortError(signal!));
    }
    function cleanup() {
      signal?.removeEventListener("abort", aborted);
    }
    signal?.addEventListener("abort", aborted, { once: true });
  });

const retryable = (status: number) =>
  status === 408 || status === 425 || status === 429 || status >= 500;

async function request<T>(
  url: string,
  options: FetchOptions,
  readBody: (response: Response) => Promise<T>,
) {
  const timeout = options.timeout ?? 20_000;
  const retries = options.retries ?? 2;
  const parentSignal = options.signal ?? currentCancellationSignal();
  let last = "";
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (parentSignal?.aborted) throw abortError(parentSignal);
    const controller = new AbortController();
    const onAbort = () => controller.abort(abortError(parentSignal!));
    const timer = setTimeout(
      () => controller.abort(new Error(`Upstream request timed out after ${timeout}ms`)),
      timeout,
    );
    parentSignal?.addEventListener("abort", onAbort, { once: true });
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: options.headers,
      });
      if (!response.ok) {
        last = `${response.status} ${response.statusText}`;
        if (attempt < retries && retryable(response.status)) {
          await wait(
            Math.min(2_500, 350 * Math.pow(2, attempt) + Math.random() * 180),
            parentSignal,
          );
          continue;
        }
        throw new Error(`Upstream ${last}`);
      }
      return await readBody(response);
    } catch (cause) {
      if (parentSignal?.aborted) throw abortError(parentSignal);
      last = cause instanceof Error ? cause.message : String(cause);
      if (attempt >= retries) throw new Error(`Upstream request failed: ${last}`);
      await wait(
        Math.min(2_500, 350 * Math.pow(2, attempt) + Math.random() * 180),
        parentSignal,
      );
    } finally {
      clearTimeout(timer);
      parentSignal?.removeEventListener("abort", onAbort);
    }
  }
  throw new Error(`Upstream request failed: ${last}`);
}

export async function fetchJsonWithRetry(url: string, options: FetchOptions = {}) {
  const body = await request(url, {
    ...options,
    headers: { accept: "application/json", ...(options.headers || {}) },
  }, (response) => response.text());
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`Upstream returned invalid JSON from ${new URL(url).hostname}`);
  }
}

export async function fetchTextWithRetry(url: string, options: FetchOptions = {}) {
  return request(url, {
    ...options,
    headers: { accept: "text/plain,*/*", ...(options.headers || {}) },
  }, (response) => response.text());
}

export async function fetchBytesWithRetry(url: string, options: FetchOptions = {}) {
  const buffer = await request(url, {
    ...options,
    headers: {
      accept: "application/zip,application/octet-stream,*/*",
      ...(options.headers || {}),
    },
  }, (response) => response.arrayBuffer());
  return new Uint8Array(buffer);
}

export function fingerprintBytes(bytes: Uint8Array) {
  let hash = 2_166_136_261;
  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 16_777_619);
  }
  return `${bytes.length.toString(36)}-${(hash >>> 0).toString(36)}`;
}

export function fingerprintText(value: string) {
  return fingerprintBytes(new TextEncoder().encode(value));
}