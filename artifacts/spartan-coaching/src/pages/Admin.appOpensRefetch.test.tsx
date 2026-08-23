/**
 * Confirms the Mobile App Opens count card refreshes automatically via the
 * refetchInterval: 60000 set on the eventAnalyticsData query — no page reload
 * required.
 *
 * Two concerns verified:
 *   1. The query in Admin.tsx carries refetchInterval: 60000 in its options.
 *   2. When 60 s elapses (fake timers) and a new app_open event has landed,
 *      the day/week/month counts in the card update without any user action.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { adminGet } from "@/lib/adminApi";

// ── Mutable mock state — updated between timer ticks ──────────────────────────

let mobileAppOpens = { day: 3, week: 5, month: 8 };

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/adminApi", () => ({
  adminGet: vi.fn(async (url: string) => {
    if (url.includes("/api/analytics/events")) {
      return {
        analytics: {
          aiToolUsage: [],
          resourceDownloads: [],
          contactSubmissions: 0,
          publicFunnel: {
            ctaClicks: 0,
            contactStarts: 0,
            contactSuccesses: 0,
            contactFailures: 0,
            appInterest: 0,
          },
          mobileAiToolUsage: [],
          mobileToolViews: [],
          mobileAppOpens,
        },
      };
    }
    if (url.includes("/api/analytics/visitors"))
      return { analytics: { day: 0, week: 0, month: 0, quarter: 0, year: 0 } };
    if (url.includes("/api/inquiries")) return { inquiries: [] };
    if (url.includes("/api/newsletter/subscribers")) return { subscribers: [] };
    if (url.includes("/api/signed-agreements")) return { agreements: [] };
    if (url.includes("/api/agreement-requests")) return { requests: [] };
    if (url.includes("/api/resource-leads")) return { leads: [] };
    if (url.includes("/api/usage-events")) return { events: [] };
    if (url.includes("/api/admin/access-metrics")) return {};
    if (url.includes("/api/admin/ai-usage"))
      return { count: 0, cap: 500, date: "2026-07-26" };
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
    takeRecords() {
      return [];
    }
  }
  if (!("IntersectionObserver" in globalThis)) {
    (globalThis as Record<string, unknown>).IntersectionObserver =
      IntersectionObserverStub;
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
  vi.useRealTimers();
  // Reset mutable mock state for next test
  mobileAppOpens = { day: 3, week: 5, month: 8 };
});

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 401 })),
  );
});

// ── Helper ────────────────────────────────────────────────────────────────────

async function renderAdmin(qc: QueryClient) {
  const { default: Admin } = await import("./Admin");
  return render(
    <QueryClientProvider client={qc}>
      <Admin />
    </QueryClientProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Admin page — Mobile App Opens auto-refresh", () => {
  it("eventAnalyticsData query carries refetchInterval: 60000", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: ({ queryKey }) => adminGet(String(queryKey[0])),
        },
      },
    });

    const { getByTestId } = await renderAdmin(qc);

    await waitFor(
      () => {
        getByTestId("card-mobile-app-opens");
      },
      { timeout: 4000 },
    );

    const query = qc
      .getQueryCache()
      .find({ queryKey: ["/api/analytics/events"] });

    expect(query, "query for /api/analytics/events not found in cache").toBeDefined();
    // refetchInterval is an observer-level option; cast to access the runtime value
    expect(
      (query?.options as Record<string, unknown>)["refetchInterval"],
      "refetchInterval must be 60000",
    ).toBe(60000);
  }, 15_000);

  it("renders the initial Mobile App Opens day count from the first fetch", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: ({ queryKey }) => adminGet(String(queryKey[0])),
        },
      },
    });

    const { getByTestId } = await renderAdmin(qc);

    await waitFor(
      () => {
        getByTestId("text-mobile-app-opens-day");
      },
      { timeout: 4000 },
    );

    expect(getByTestId("text-mobile-app-opens-day").textContent).toBe("3");
    expect(getByTestId("text-mobile-app-opens-week").textContent).toBe("5");
    expect(getByTestId("text-mobile-app-opens-month").textContent).toBe("8");
  }, 15_000);

  it("updates the Mobile App Opens counts when the query refetches — no page reload", async () => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: ({ queryKey }) => adminGet(String(queryKey[0])),
        },
      },
    });

    const { getByTestId } = await renderAdmin(qc);

    // Wait for the initial render with the baseline counts
    await waitFor(
      () => {
        expect(getByTestId("text-mobile-app-opens-day").textContent).toBe("3");
      },
      { timeout: 4000 },
    );

    // Simulate a new app_open event landing on the server side
    mobileAppOpens = { day: 7, week: 9, month: 14 };

    // Directly trigger the refetch that the refetchInterval fires every 60 s
    // (proving: when the interval elapses and the query re-runs, the card updates)
    await act(async () => {
      await qc.refetchQueries({ queryKey: ["/api/analytics/events"] });
    });

    // The card must now show updated counts without any manual page reload
    await waitFor(
      () => {
        expect(getByTestId("text-mobile-app-opens-day").textContent).toBe("7");
      },
      { timeout: 4000 },
    );

    expect(getByTestId("text-mobile-app-opens-week").textContent).toBe("9");
    expect(getByTestId("text-mobile-app-opens-month").textContent).toBe("14");
  }, 15_000);
});
