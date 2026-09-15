import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NationalDashboard from "./NationalDashboard";
import type { DashboardData, Provider, ProviderDetail } from "./types";

const mockGet = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({ value: { member: null } }));

vi.mock("./api", () => ({
  api: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth.value }));
vi.mock("./GlobalProviderSearch", () => ({ default: () => <div data-testid="global-provider-search" /> }));
vi.mock("./IntelligenceCenter", () => ({ default: () => <div>Intelligence Center</div> }));
vi.mock("./DecisionRoom", () => ({ default: () => <div>Decision Room</div> }));
vi.mock("./TerritoryView", () => ({ default: () => <div>Territory View</div> }));
vi.mock("./ReferralMarket", () => ({ default: () => <div>Referral Market</div> }));
vi.mock("./DataLab", () => ({ default: () => <div>Data Lab</div> }));

function provider(state: string, ccn: string, name: string): Provider {
  return {
    ccn,
    name,
    city: "Tulsa",
    county: "Tulsa",
    state,
    zip: "74101",
    ownership: "Non-profit",
    beneficiaries: 10,
    adc: 12,
    payment: 1500,
    daysPerBene: 45,
  };
}

function dashboard(state: string, focusCcn: string, providers: Provider[]): DashboardData {
  return {
    generatedAt: "2026-09-15T00:00:00.000Z",
    state,
    stateName: state === "TX" ? "Texas" : "Oklahoma",
    focusCcn,
    providers,
    counties: [],
    hospitals: [],
    snfs: [],
    sources: [],
    warnings: [],
    marketSummary: { totalMedicare: 1000 },
    dataQuality: { status: "good", coveragePct: 95 },
  };
}

function detail(data: Provider): ProviderDetail {
  return {
    provider: data,
    quality: [],
    cahps: [],
    cahpsSummary: {},
    qualitySummary: {},
    zips: [],
    enrollments: [],
    owners: [],
    history: [],
    periods: {},
    sources: [],
    confidence: 0.95,
    dataQuality: { status: "good" },
    warnings: [],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe("NationalDashboard provider selector", () => {
  beforeEach(() => {
    window.location.hash = "";
    mockGet.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("updates provider choices when the market changes and loads the selected provider", async () => {
    const okProviders = [
      provider("OK", "371653", "Oklahoma Hospice Alpha"),
      provider("OK", "371654", "Oklahoma Hospice Beta"),
    ];
    const txProviders = [
      provider("TX", "111111", "Texas Hospice One"),
      provider("TX", "222222", "Texas Hospice Two"),
    ];

    mockGet.mockImplementation(async (path: string) => {
      if (path === "/api/dashboard?state=OK&ccn=371653") return { data: dashboard("OK", "371653", okProviders) };
      if (path === "/api/provider/371653") return { data: detail(okProviders[0]) };
      if (path === "/api/dashboard?state=TX&ccn=") return { data: dashboard("TX", "111111", txProviders) };
      if (path === "/api/provider/111111") return { data: detail(txProviders[0]) };
      if (path === "/api/provider/222222") return { data: detail(txProviders[1]) };
      throw new Error(`Unexpected request: ${path}`);
    });

    render(<NationalDashboard />);

    await waitFor(() => {
      expect((screen.getByLabelText("Select Medicare provider") as HTMLSelectElement).value).toBe("371653");
    });

    fireEvent.change(screen.getByLabelText("Select Medicare market"), { target: { value: "TX" } });

    await waitFor(() => {
      expect((screen.getByLabelText("Select Medicare provider") as HTMLSelectElement).value).toBe("111111");
    });

    const providerSelect = screen.getByLabelText("Select Medicare provider") as HTMLSelectElement;
    const providerOptions = Array.from(providerSelect.options).map((option) => option.textContent);

    expect(providerOptions).toContain("Texas Hospice One · 111111");
    expect(providerOptions).toContain("Texas Hospice Two · 222222");
    expect(providerOptions).not.toContain("Oklahoma Hospice Alpha · 371653");

    fireEvent.change(providerSelect, { target: { value: "222222" } });

    await waitFor(() => {
      expect(screen.getAllByText("Texas Hospice Two").length).toBeGreaterThan(0);
    });

    expect(mockGet).toHaveBeenCalledWith("/api/provider/222222");
  });

  it("disables the provider selector while provider context is loading", async () => {
    const okProviders = [
      provider("OK", "371653", "Oklahoma Hospice Alpha"),
      provider("OK", "371654", "Oklahoma Hospice Beta"),
    ];
    const pendingDetail = deferred<{ data: ProviderDetail }>();

    mockGet.mockImplementation((path: string) => {
      if (path === "/api/dashboard?state=OK&ccn=371653") return Promise.resolve({ data: dashboard("OK", "371653", okProviders) });
      if (path === "/api/provider/371653") return pendingDetail.promise;
      throw new Error(`Unexpected request: ${path}`);
    });

    render(<NationalDashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText("Select Medicare provider")).toBeTruthy();
    });

    const providerSelect = screen.getByLabelText("Select Medicare provider") as HTMLSelectElement;
    expect(providerSelect.disabled).toBe(true);
    expect(providerSelect.options[0]?.textContent).toBe("Loading providers…");

    pendingDetail.resolve({ data: detail(okProviders[0]) });

    await waitFor(() => {
      expect((screen.getByLabelText("Select Medicare provider") as HTMLSelectElement).disabled).toBe(false);
    });
  });
});
