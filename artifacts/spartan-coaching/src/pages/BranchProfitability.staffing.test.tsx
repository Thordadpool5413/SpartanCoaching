import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent, within, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import type { AuthMember } from "@/context/AuthContext";

// ── Shared auth fixture type ─────────────────────────────────────────────────
// Mirrors AuthContextValue without importing the unexported type directly.
type MockAuth = {
  isAuthenticated: boolean;
  member: AuthMember | null;
  organization: null;
  canUseFieldKit: boolean;
  isLoading: boolean;
  fieldKit: null;
  refresh: () => Promise<void>;
  login: () => Promise<never>;
  logout: () => Promise<void>;
  setSessionFromResponse: () => void;
};

// ── Configurable auth mock (must be hoisted so vi.mock can reference it) ────────
const mockUseAuth = vi.hoisted(() => vi.fn<() => MockAuth>());

// ── Minimal stubs required for rendering BranchProfitability in jsdom ──────────

vi.mock("@/context/AuthContext", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/tools/branch-profitability", () => {}],
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/SEO", () => ({ SEO: () => null }));

// Mock downloadPdf so Print tests don't attempt real network calls
const mockDownloadPdf = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock("@/lib/downloadPdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/downloadPdf")>();
  return { ...actual, downloadPdf: mockDownloadPdf };
});

import BranchProfitability from "./BranchProfitability";
import { runEngine, type BranchInputs } from "@workspace/branch-engine/engine";
import { DEFAULT_INPUTS, STAFF_ROLES, PRESET_CONFIGS } from "@workspace/branch-engine/presets";
import { CONTENT_VERSION } from "@workspace/branch-engine/content";

function fmtK(v: number) {
  const sign = v < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(v)).toLocaleString("en-US");
}

// ── Auth fixture: guest ──────────────────────────────────────────────────────
const GUEST_AUTH: MockAuth = {
  isAuthenticated: false,
  member: null,
  organization: null,
  canUseFieldKit: false,
  isLoading: false,
  fieldKit: null,
  refresh: async () => {},
  login: async () => { throw new Error("not implemented"); },
  logout: async () => {},
  setSessionFromResponse: () => {},
};

// ── Auth fixture: authenticated membership member ────────────────────────────
const MEMBER_AUTH: MockAuth = {
  isAuthenticated: true,
  member: {
    id: 1,
    name: "Ada Spartan",
    email: "ada@spartan.test",
    role: "member",
    organizationId: 1,
    status: "active",
  },
  organization: null,
  canUseFieldKit: true,
  isLoading: false,
  fieldKit: null,
  refresh: async () => {},
  login: async () => { throw new Error("not implemented"); },
  logout: async () => {},
  setSessionFromResponse: () => {},
};

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
    thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
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

beforeEach(() => {
  // Default: guest
  mockUseAuth.mockReturnValue(GUEST_AUTH);
  mockDownloadPdf.mockClear();
  // Stub fetch so trackUsage/submitLead don't throw in jsdom
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ downloadUrl: "/fake.pdf" }) })
    )
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderPage() {
  return render(
    <HelmetProvider>
      <BranchProfitability />
    </HelmetProvider>,
  );
}

function expectStaffingTableMatchesEngine(
  view: ReturnType<typeof render>,
  inputs: BranchInputs,
) {
  const expected = runEngine(inputs, STAFF_ROLES, CONTENT_VERSION);
  const rows = expected.tables.requiredStaffing;
  expect(rows.length).toBeGreaterThan(0);

  rows.forEach((row, i) => {
    const tr = view.getByTestId(`row-staff-${i}`);
    const cells = within(tr).getAllByRole("cell");
    expect(cells).toHaveLength(4);
    expect(cells[0].textContent).toBe(row.role);
    expect((within(cells[1]).getByRole("spinbutton") as HTMLInputElement).value).toBe(String(row.fte));
    expect((within(cells[2]).getByRole("spinbutton") as HTMLInputElement).value).toBe(String(row.salary));
    expect(cells[3].textContent).toBe(fmtK(row.annualCost));
  });

  expect(view.getByTestId("text-total-payroll").textContent).toBe(
    expected.display.totalPayroll,
  );
}

describe("staffing table matches engine output", () => {
  it("recalculates payroll and profit from edited FTE and salary", () => {
    const view = renderPage();
    const payrollBefore = view.getByTestId("text-total-payroll").textContent;
    const profitBefore = view.getByTestId("text-annual-profit").textContent;

    fireEvent.change(view.getByTestId("input-staff-fte-2"), { target: { value: "6.5" } });
    fireEvent.change(view.getByTestId("input-staff-salary-2"), { target: { value: "125000" } });

    expect(view.getByTestId("text-total-fte").textContent).toContain("FTE");
    expect(view.getByTestId("text-total-payroll").textContent).not.toBe(payrollBefore);
    expect(view.getByTestId("text-annual-profit").textContent).not.toBe(profitBefore);
  });

  for (const adc of [20, 50, 80]) {
    it(`renders engine staffing rows at ADC ${adc} (base preset)`, () => {
      const view = renderPage();
      const adcInput = view.getByTestId("input-adc");
      fireEvent.change(adcInput, { target: { value: String(adc) } });
      expectStaffingTableMatchesEngine(view, {
        ...DEFAULT_INPUTS,
        targetADC: adc,
      });
    });
  }

  for (const presetKey of Object.keys(PRESET_CONFIGS)) {
    it(`renders engine staffing rows for preset "${presetKey}" at ADC 20, 50, 80`, () => {
      const view = renderPage();
      const presetButton = view.getByTestId(`button-scenario-${presetKey}`);
      fireEvent.click(presetButton);
      const adcInput = view.getByTestId("input-adc");
      for (const adc of [20, 50, 80]) {
        fireEvent.change(adcInput, { target: { value: String(adc) } });
        expectStaffingTableMatchesEngine(view, {
          ...DEFAULT_INPUTS,
          ...PRESET_CONFIGS[presetKey].inputs,
          scenarioPreset: presetKey,
          targetADC: adc,
        });
      }
    });
  }
});

// ── Lead-gate / export button tests ─────────────────────────────────────────

describe("Print button — lead-gate behavior", () => {
  it("opens the lead-gate dialog when a guest clicks Print", () => {
    // Guest auth is already set in beforeEach
    renderPage();

    // Dialog inputs must not exist before the button is clicked
    expect(screen.queryByTestId("input-gate-name")).toBeNull();
    expect(screen.queryByTestId("input-gate-email")).toBeNull();

    fireEvent.click(screen.getByTestId("button-print"));

    // After click the gate dialog must be visible
    expect(screen.getByTestId("input-gate-name")).toBeTruthy();
    expect(screen.getByTestId("input-gate-email")).toBeTruthy();
    expect(screen.getByTestId("button-gate-submit")).toBeTruthy();
  });

  it("does not open the lead-gate dialog when an authenticated member clicks Print", async () => {
    mockUseAuth.mockReturnValue(MEMBER_AUTH);
    renderPage();

    fireEvent.click(screen.getByTestId("button-print"));

    // Dialog must never appear for authenticated members
    expect(screen.queryByTestId("input-gate-name")).toBeNull();
    expect(screen.queryByTestId("input-gate-email")).toBeNull();

    // downloadPdf should be called directly without a gate
    await waitFor(() => {
      expect(mockDownloadPdf).toHaveBeenCalledTimes(1);
    });
  });
});
