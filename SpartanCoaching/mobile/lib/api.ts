import { formatDate, safeJsonParse } from "@/lib/format";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:5000").replace(/\/$/, "");
const ADMIN_AUTH =
  process.env.EXPO_PUBLIC_ADMIN_AUTH_CODE ??
  process.env.EXPO_PUBLIC_BETA_ADMIN_CODE ??
  "5413";

export type ApiError = Error & {
  status: number;
  payload?: unknown;
};

export function buildApiUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  const payload = safeJsonParse<unknown>(raw, raw);

  if (!response.ok) {
    const error = new Error(
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error?: unknown }).error ?? `Request failed (${response.status})`)
        : `Request failed (${response.status})`
    ) as ApiError;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload as T;
}

async function request<T>(
  path: string,
  init: RequestInit & { admin?: boolean } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (init.admin) {
    headers.set("x-admin-auth", ADMIN_AUTH);
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    credentials: "omit",
  });

  return parseResponse<T>(response);
}

function json<T>(path: string, body?: unknown, init: RequestInit & { admin?: boolean } = {}) {
  return request<T>(path, {
    ...init,
    method: init.method ?? "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function isApiError(error: unknown): error is ApiError {
  return !!error && typeof error === "object" && "status" in error;
}

export function apiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; error?: unknown };
    if (typeof maybeError.message === "string") return maybeError.message;
    if (typeof maybeError.error === "string") return maybeError.error;
  }
  return fallback;
}

export function safeDateLabel(value?: string | number | Date | null) {
  if (!value) return "Unknown";
  return formatDate(value);
}

export const api = {
  getDrills: () => request<Array<{ index: number; category: string; drill: string }>>("/api/drills"),
  getDailyDrill: () => request<Record<string, unknown>>("/api/daily-drill"),
  submitDrillCompletion: (payload: { drillIndex: number; drillTitle: string; notes?: string }) =>
    json("/api/drills/completions", payload),

  chat: (payload: { prompt: string; conversationHistory?: Array<{ role: string; content: string }> }) =>
    json<{ response: string }>("/api/chat", payload),

  createRoleplaySession: (payload: { scenarioId: string; scenarioTitle: string }) =>
    json<{ session: any; initialMessage: string }>("/api/roleplay/sessions", payload),
  getRoleplaySessions: () => request<Array<any>>("/api/roleplay/sessions"),
  getRoleplaySession: (id: number) => request<{ session: any; messages: Array<any> }>(`/api/roleplay/sessions/${id}`),
  sendRoleplayMessage: (id: number, payload: { content: string }) =>
    json<{ response: string }>(`/api/roleplay/sessions/${id}/messages`, payload),
  submitRoleplayFeedback: (id: number) =>
    json<{ session: any; feedback: string; rating: number }>(`/api/roleplay/sessions/${id}/feedback`, {}, { method: "POST" }),

  getPlaybooks: (payload: { scenario: string; desiredOutcomes?: string }) =>
    json<{ playbook: string }>("/api/playbooks", payload),
  getObjectionResponse: (payload: { objection: string }) =>
    json<{ response: string }>("/api/objections", payload),
  research: (payload: { query: string }) =>
    json<{ text: string; sources?: Array<{ title: string; uri: string }> }>("/api/research", payload),
  generateEmailTemplate: (payload: {
    templateType: "follow_up" | "thank_you" | "value_add";
    recipientName?: string;
    context: string;
    customization?: string;
  }) => json<{ template: string }>("/api/email-templates", payload),
  generateColdCallScript: (payload: {
    prospectType: string;
    prospectName?: string;
    situation: string;
    repName?: string;
  }) => json<{ script: string }>("/api/cold-call-script", payload),
  generateWeeklyPlan: (payload: {
    accounts: string;
    weeklyGoal: string;
    territoryFocus?: string;
    challenges?: string;
  }) => json<{ plan: string }>("/api/weekly-plan-builder", payload),
  analyzeTranscript: (payload: { transcript: string }) =>
    json<{ analysis: string }>("/api/transcribe/analyze", payload),

  calculateBranchProfitability: (payload: Record<string, unknown>) =>
    json<Record<string, unknown>>("/api/branch-profitability/calculate", payload),

  getArticles: () => request<{ articles: Array<any> }>("/api/articles"),
  getArticle: (id: number) => request<{ article: any }>(`/api/articles/${id}`),
  createArticle: (payload: Record<string, unknown>) =>
    json<{ success: boolean; article: any }>("/api/articles", payload, { admin: true }),
  updateArticle: (id: number, payload: Record<string, unknown>) =>
    json<{ success: boolean; article: any }>(`/api/articles/${id}`, payload, { method: "PUT", admin: true }),
  deleteArticle: (id: number) =>
    request<{ success: boolean }>(`/api/articles/${id}`, { method: "DELETE", admin: true }),

  getResources: () => request<{ resources: Array<any> }>("/api/resources"),
  getResource: (id: number) => request<{ resource: any }>(`/api/resources/${id}`),
  createResource: (payload: Record<string, unknown>) =>
    json<{ success: boolean; resource: any }>("/api/resources", payload, { admin: true }),
  updateResource: (id: number, payload: Record<string, unknown>) =>
    json<{ success: boolean; resource: any }>(`/api/resources/${id}`, payload, { method: "PUT", admin: true }),
  deleteResource: (id: number) =>
    request<{ success: boolean }>(`/api/resources/${id}`, { method: "DELETE", admin: true }),

  getPodcasts: () => request<{ podcasts: Array<any> }>("/api/podcasts"),

  submitInquiry: (payload: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    serviceType?: string;
    message: string;
    submittedAt?: number;
  }) => json<{ success: boolean; inquiry: any }>("/api/inquiries", payload),
  getInquiries: () => request<{ inquiries: Array<any> }>("/api/inquiries", { admin: true }),

  getAssessments: () => request<Array<any>>("/api/assessments", { admin: true }),
  getDefaultAssessment: () => request<{ assessmentId: number }>("/api/assessments/default"),
  getAssessmentPublic: (id: number) =>
    request<{ assessment: { id: number; name: string; description: string }; questions: Array<any> }>(
      `/api/assessments/${id}/public`
    ),
  submitAssessment: (
    id: number,
    payload: {
      candidateName: string;
      candidateEmail: string;
      answers: Record<string, string>;
      inviteToken?: string;
      clientSlug?: string;
    }
  ) =>
    json<{ submission: any; overallScore: number; quizScore: number | null; aiScore: number | null; feedback: string }>(
      `/api/assessments/${id}/submit`,
      payload
    ),
  getAssessmentSubmissions: (id: number) =>
    request<{ submissions: Array<any> }>(`/api/assessments/${id}/submissions`, { admin: true }),

  getVisitorAnalytics: () => request<{ analytics: any }>("/api/analytics/visitors", { admin: true }),
  getEventAnalytics: () => request<{ analytics: any }>("/api/analytics/events", { admin: true }),
  getAiUsage: () => request<Record<string, unknown>>("/api/admin/ai-usage", { admin: true }),
  getUsageEvents: () => request<{ events: Array<any> }>("/api/usage-events", { admin: true }),
  getResourceLeads: () => request<{ leads: Array<any> }>("/api/resource-leads", { admin: true }),

  trackVisitor: (payload: Record<string, unknown>) => json("/api/analytics/track", payload),
  trackEvent: (payload: Record<string, unknown>) => json("/api/analytics/events", payload),
};

