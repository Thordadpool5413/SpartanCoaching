/**
 * Tests that the billing-email health tile in AccessDesk renders the live API
 * response accurately — counts, thresholds, and ok/fail state — so a future UI
 * regression cannot silently hide an active Resend outage.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { render, cleanup, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mocks ────────────────────────────────────────────────────────────────────

// adminFetch is used for all other queries in AccessDesk (access-requests,
// organizations, access-metrics). Return minimal valid shapes so the component
// can render without crashing, keeping the focus on the billing-email tile.
vi.mock("@/lib/adminApi", () => ({
  adminFetch: vi.fn(async (url: string) => {
    if (url.includes("access-requests")) return { requests: [] };
    if (url.includes("organizations")) return { organizations: [] };
    if (url.includes("access-metrics")) return {};
    return {};
  }),
  markAdminSession: vi.fn(),
  clearAdminSessionFlag: vi.fn(),
  hasAdminSessionFlag: vi.fn(() => true),
}));

// Toast is used pervasively; stub it to a no-op.
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// The OrgDetailPanel is rendered when selectedOrgId is set; keep it minimal.
vi.mock("@/components/OrgDetailPanel", () => ({
  OrgDetailPanel: () => <div data-testid="org-detail-panel" />,
}));

// ── Browser API stubs ────────────────────────────────────────────────────────

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
  // Do not vi.restoreAllMocks() — that clears module mocks for adminApi/toast
  // and leaves duplicate AccessDesk instances flaky across tests.
  vi.mocked(globalThis.fetch)?.mockReset?.();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

type BillingEmailHealthResponse = {
  ok: boolean;
  failures1h: number;
  failures24h: number;
  threshold1h: number;
  threshold24h: number;
  byType: Record<string, number>;
  lastFailureAt: string | null;
};

/** Stub global fetch so only /api/admin/billing-email-health is intercepted. */
function mockBillingEmailFetch(payload: BillingEmailHealthResponse) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("billing-email-health")) {
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Fallback for any other fetch calls
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
  });
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

async function renderAccessDesk(payload: BillingEmailHealthResponse) {
  cleanup();
  mockBillingEmailFetch(payload);

  // Lazy import so the module is resolved after mocks are in place
  const { AccessDesk } = await import("@/components/AccessDesk");

  const queryClient = makeQueryClient();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <AccessDesk />
    </QueryClientProvider>,
  );

  // Wait until the health tile has loaded (status badge is rendered).
  // Prefer the latest match in case StrictMode leaves a transient duplicate.
  await waitFor(
    () => {
      const nodes = view.getAllByTestId("billing-email-health-status");
      expect(nodes.length).toBeGreaterThan(0);
      expect(nodes[nodes.length - 1]?.textContent).toMatch(
        /Healthy|Threshold exceeded/,
      );
    },
    { timeout: 8000 },
  );

  return view;
}

function latestByTestId(
  view: ReturnType<typeof render>,
  testId: string,
): HTMLElement {
  const nodes = view.getAllByTestId(testId);
  return nodes[nodes.length - 1]!;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("billing-email health tile — ok: true (Healthy)", () => {
  it(
    "shows a green Healthy badge",
    async () => {
      const view = await renderAccessDesk({
        ok: true,
        failures1h: 1,
        failures24h: 3,
        threshold1h: 3,
        threshold24h: 10,
        byType: {},
        lastFailureAt: null,
      });

      const badge = latestByTestId(view, "billing-email-health-status");
      expect(badge.textContent).toBe("Healthy");
      expect(badge.className).toMatch(/green/);
    },
    15_000,
  );

  it("renders the correct 1h failure count and threshold", async () => {
    const view = await renderAccessDesk({
      ok: true,
      failures1h: 1,
      failures24h: 3,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: null,
    });

    const cell1h = latestByTestId(view, "billing-email-health-1h");
    expect(cell1h.textContent).toContain("1");   // count
    expect(cell1h.textContent).toContain("3");   // threshold
  });

  it("renders the correct 24h failure count and threshold", async () => {
    const view = await renderAccessDesk({
      ok: true,
      failures1h: 1,
      failures24h: 3,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: null,
    });

    const cell24h = latestByTestId(view, "billing-email-health-24h");
    expect(cell24h.textContent).toContain("3");  // count
    expect(cell24h.textContent).toContain("10"); // threshold
  });

  it("does not apply the red highlight class when below threshold", async () => {
    const view = await renderAccessDesk({
      ok: true,
      failures1h: 1,
      failures24h: 3,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: null,
    });

    const cell1h = latestByTestId(view, "billing-email-health-1h");
    const cell24h = latestByTestId(view, "billing-email-health-24h");
    expect(cell1h.className).not.toMatch(/red/);
    expect(cell24h.className).not.toMatch(/red/);
  });

  it("does not render lastFailureAt when null", async () => {
    const view = await renderAccessDesk({
      ok: true,
      failures1h: 0,
      failures24h: 0,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: null,
    });

    expect(view.queryByText(/Last failure/)).toBeNull();
  });

  it("does not render the byType breakdown when empty", async () => {
    const view = await renderAccessDesk({
      ok: true,
      failures1h: 0,
      failures24h: 0,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: null,
    });

    expect(view.queryByText(/By type/)).toBeNull();
  });
});

describe("billing-email health tile — ok: false (threshold exceeded)", () => {
  it("shows a red 'Threshold exceeded' badge", async () => {
    const view = await renderAccessDesk({
      ok: false,
      failures1h: 4,
      failures24h: 12,
      threshold1h: 3,
      threshold24h: 10,
      byType: { payment_failed: 8, canceled: 4 },
      lastFailureAt: "2026-07-25T10:30:00.000Z",
    });

    const badge = latestByTestId(view, "billing-email-health-status");
    expect(badge.textContent).toMatch(/Threshold exceeded/);
    expect(badge.className).toMatch(/red/);
  });

  it("renders the correct 1h failure count when threshold is breached", async () => {
    const view = await renderAccessDesk({
      ok: false,
      failures1h: 4,
      failures24h: 12,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: null,
    });

    const cell1h = latestByTestId(view, "billing-email-health-1h");
    expect(cell1h.textContent).toContain("4");
    expect(cell1h.textContent).toContain("3"); // threshold
  });

  it("renders the correct 24h failure count when threshold is breached", async () => {
    const view = await renderAccessDesk({
      ok: false,
      failures1h: 4,
      failures24h: 12,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: null,
    });

    const cell24h = latestByTestId(view, "billing-email-health-24h");
    expect(cell24h.textContent).toContain("12");
    expect(cell24h.textContent).toContain("10"); // threshold
  });

  it("applies red highlight class to the over-threshold 1h cell", async () => {
    const view = await renderAccessDesk({
      ok: false,
      failures1h: 4,
      failures24h: 2,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: null,
    });

    const cell1h = latestByTestId(view, "billing-email-health-1h");
    expect(cell1h.className).toMatch(/red/);
    // 24h is still under threshold — no highlight
    const cell24h = latestByTestId(view, "billing-email-health-24h");
    expect(cell24h.className).not.toMatch(/red/);
  });

  it("applies red highlight class to the over-threshold 24h cell", async () => {
    const view = await renderAccessDesk({
      ok: false,
      failures1h: 1,
      failures24h: 11,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: null,
    });

    const cell24h = latestByTestId(view, "billing-email-health-24h");
    expect(cell24h.className).toMatch(/red/);
    // 1h is still under threshold — no highlight
    const cell1h = latestByTestId(view, "billing-email-health-1h");
    expect(cell1h.className).not.toMatch(/red/);
  });

  it("renders lastFailureAt in a human-readable format", async () => {
    const ts = "2026-07-25T10:30:00.000Z";
    const view = await renderAccessDesk({
      ok: false,
      failures1h: 4,
      failures24h: 12,
      threshold1h: 3,
      threshold24h: 10,
      byType: {},
      lastFailureAt: ts,
    });

    // The component calls new Date(ts).toLocaleString() — just verify the
    // label is present and the raw timestamp has been formatted (not shown as-is).
    const section = latestByTestId(view, "section-billing-email-health");
    expect(within(section).getByText(/Last failure/)).toBeTruthy();
    // Formatted string should NOT equal the raw ISO string
    const formatted = new Date(ts).toLocaleString();
    expect(within(section).getByText(new RegExp(formatted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeTruthy();
  });

  it("renders the byType breakdown for all failure types", async () => {
    const view = await renderAccessDesk({
      ok: false,
      failures1h: 4,
      failures24h: 12,
      threshold1h: 3,
      threshold24h: 10,
      byType: { payment_failed: 8, canceled: 4 },
      lastFailureAt: null,
    });

    const section = latestByTestId(view, "section-billing-email-health");
    // The breakdown is rendered as a single paragraph: "By type (24 h): payment_failed ×8 · canceled ×4"
    // Use getAllByText + check textContent to avoid "multiple elements found" errors on partial matches.
    const byTypePara = within(section).getAllByText(/By type/)[0];
    expect(byTypePara).toBeTruthy();
    const text = byTypePara!.textContent ?? "";
    expect(text).toContain("payment_failed");
    expect(text).toContain("canceled");
    expect(text).toContain("×8");
    expect(text).toContain("×4");
  });
});
