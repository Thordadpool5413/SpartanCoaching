const API_ROOT = "/api/v1/medicare";
const REQUEST_TIMEOUT_MS = 45_000;

type ApiResponse<T = any> = { data: T };

async function request<T>(method: string, sourcePath: string, body?: unknown): Promise<ApiResponse<T>> {
  const path = sourcePath.startsWith("/api/") ? sourcePath.slice(4) : sourcePath;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      credentials: "include",
      signal: controller.signal,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    const timedOut = controller.signal.aborted;
    const failure = new Error(timedOut ? "The Medicare data request timed out. Retry the market or choose another state." : "The Medicare workspace could not reach the server.") as Error & { response?: { status: number; data: unknown } };
    failure.response = { status: timedOut ? 408 : 0, data: { error: failure.message, code: timedOut ? "MEDICARE_TIMEOUT" : "MEDICARE_NETWORK_ERROR" } };
    throw failure;
  } finally {
    window.clearTimeout(timeout);
  }
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text || response.statusText }; }
  if (!response.ok) {
    const failure = new Error(typeof data?.error === "string" ? data.error : `Medicare Intelligence request failed (${response.status}).`) as Error & { response?: { status: number; data: unknown } };
    failure.response = { status: response.status, data };
    throw failure;
  }
  return { data: data as T };
}

export const api = {
  get: <T = any>(path: string) => request<T>("GET", path),
  post: <T = any>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T = any>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T = any>(path: string) => request<T>("DELETE", path),
};
