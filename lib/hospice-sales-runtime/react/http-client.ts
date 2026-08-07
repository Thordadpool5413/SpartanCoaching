import type { WorkflowApi } from "./react";

export interface WorkflowHttpClientOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
}

export function createWorkflowHttpClient(
  options: WorkflowHttpClientOptions = {},
): WorkflowApi {
  const base = (options.baseUrl ?? "/api/v1/sales-workflow").replace(/\/$/, "");
  const transport = options.fetch ?? globalThis.fetch;

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const configuredHeaders = (await options.headers?.()) ?? {};
    const response = await transport(`${base}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...configuredHeaders,
        ...init.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        (data as { error?: { message?: string } })?.error?.message ??
        `Request failed (${response.status})`;
      throw new Error(message);
    }
    return data as T;
  };

  const post = <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(body),
    });

  return {
    today: (from, to) =>
      request(`/today?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    accounts: () => request("/accounts"),
    startCycle: (input) => post("/cycles", input),
    buildPlan: (planId, input) => post(`/plans/${planId}/build`, input),
    startRoleplay: (planId, input) => post(`/plans/${planId}/roleplay`, input),
    continueRoleplay: (sessionId, input) => post(`/roleplay/${sessionId}/continue`, input),
    completeCall: (callId, input) => post(`/calls/${callId}/complete`, input),
    approveCoaching: (coachingId, input) => post(`/coaching/${coachingId}/approve`, input),
    scheduleNext: (cycleId, input) => post(`/cycles/${cycleId}/next-call`, input),
    generateEmailDraft: (actionId, input) =>
      post(`/next-actions/${actionId}/email-draft`, input),
    draftDebrief: (input) => post("/debrief/draft", input),
    previewCsv: (content) => post("/imports/csv/preview", { content }),
    commitCsv: (preview, mapping, dryRun = false) =>
      post("/imports/csv/commit", { preview, mapping, dryRun }),
    connectCalendar: (provider, redirectUri) =>
      post(`/integrations/calendar/${provider}/connect`, { redirectUri }),
  };
}
