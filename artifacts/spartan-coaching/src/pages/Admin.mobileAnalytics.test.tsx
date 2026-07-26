/**
 * Tests that the Admin page renders the two mobile-analytics cards correctly:
 *   - data-testid="card-mobile-ai-tool-usage"   — mobile AI tool usage
 *   - data-testid="card-mobile-tool-views"       — mobile browse views
 *
 * These cards are gated behind the eventAnalyticsData query; we mock the query
 * client to verify they appear with real event counts.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockEventAnalytics = {
  analytics: {
    aiToolUsage: [{ eventName: "playbook", count: 2 }],
    resourceDownloads: [],
    contactSubmissions: 0,
    mobileAiToolUsage: [{ eventName: "playbook", count: 5 }],
    mobileToolViews: [{ eventName: "tools_home", count: 11 }],
  },
};

vi.mock("@/lib/adminApi", () => ({
  adminGet: vi.fn(async (url: string) => {
    if (url.includes("/api/analytics/events")) return mockEventAnalytics;
    if (url.includes("/api/analytics/visitors")) return { analytics: { day: 0, week: 0, month: 0, quarter: 0, year: 0 } };
    if (url.includes("/api/inquiries")) return { inquiries: [] };
    if (url.includes("/api/newsletter/subscribers")) return { subscribers: [] };
    if (url.includes("/api/signed-agreements")) return { agreements: [] };
    if (url.includes("/api/agreement-requests")) return { requests: [] };
    if (url.includes("/api/resource-leads")) return { leads: [] };
    if (url.includes("/api/usage-events")) return { events: [] };
    if (url.includes("/api/admin/access-metrics")) return {};
    if (url.includes("/api/admin/ai-usage")) return { count: 0, cap: 500, date: "2026-07-26" };
    if (url.includes("/api/admin/assessment-clients")) return { clients: [] };
    return {};
  }),
  adminFetch: vi.fn(async () => ({})),
  markAdminSession: vi.fn(),
  clearAdminSessionFlag: vi.fn(),
  hasAdminSessionFlag: vi.fn(() => true),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/AccessDesk", () => ({
  AccessDesk: () => <div data-testid="access-desk-stub" />,
}));

vi.mock("@/components/ObjectUploader", () => ({
  ObjectUploader: () => <div />,
}));

vi.mock("@/components/SEO", () => ({
  SEO: () => null,
}));

vi.mock("@/components/BackButton", () => ({
  BackButton: () => null,
}));

// ── Browser API stubs ─────────────────────────────────────────────────────────

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
  }
  class IntersectionObserverStub {
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  if (!("IntersectionObserver" in globalThis)) {
    (globalThis as Record<string, unknown>).IntersectionObserver = IntersectionObserverStub;
  }
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ── Helper ────────────────────────────────────────────────────────────────────

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });
}

async function renderAdmin() {
  // Dynamic import so mocks are already in place
  const { default: Admin } = await import("./Admin");
  const qc = buildQueryClient();

  const utils = render(
    <QueryClientProvider client={qc}>
      <Admin />
    </QueryClientProvider>,
  );
  return utils;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Admin page — mobile analytics cards", () => {
  it("renders card-mobile-ai-tool-usage with event counts from the API", async () => {
    const { getByTestId } = await renderAdmin();

    await waitFor(() => {
      getByTestId("card-mobile-ai-tool-usage");
    }, { timeout: 4000 });

    const card = getByTestId("card-mobile-ai-tool-usage");
    expect(card).toBeTruthy();
    // The card should display the count badge
    expect(card.textContent).toContain("5");
    expect(card.textContent).toContain("playbook");
  });

  it("renders card-mobile-tool-views with event counts from the API", async () => {
    const { getByTestId } = await renderAdmin();

    await waitFor(() => {
      getByTestId("card-mobile-tool-views");
    }, { timeout: 4000 });

    const card = getByTestId("card-mobile-tool-views");
    expect(card).toBeTruthy();
    expect(card.textContent).toContain("11");
    expect(card.textContent).toContain("tools home");
  });

  it("renders card-mobile-ai-tool-usage empty state when no events are recorded", async () => {
    // Override the mock for this test
    const { adminGet } = await import("@/lib/adminApi");
    vi.mocked(adminGet).mockImplementation(async (url: string) => {
      if (url.includes("/api/analytics/events")) {
        return {
          analytics: {
            aiToolUsage: [],
            resourceDownloads: [],
            contactSubmissions: 0,
            mobileAiToolUsage: [],
            mobileToolViews: [],
          },
        };
      }
      if (url.includes("/api/analytics/visitors")) return { analytics: { day: 0, week: 0, month: 0, quarter: 0, year: 0 } };
      if (url.includes("/api/admin/ai-usage")) return { count: 0, cap: 500, date: "2026-07-26" };
      if (url.includes("/api/admin/assessment-clients")) return { clients: [] };
      return {};
    });

    const { getByTestId } = await renderAdmin();

    await waitFor(() => {
      getByTestId("card-mobile-ai-tool-usage");
    }, { timeout: 4000 });

    const card = getByTestId("card-mobile-ai-tool-usage");
    expect(card.textContent).toContain("No mobile AI tool usage recorded yet");
  });
});
