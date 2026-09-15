import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import IntelligenceCenter from "./IntelligenceCenter";
import type { Provider, ProviderDetail } from "./types";

const mockGet = vi.hoisted(() => vi.fn());

vi.mock("./api", () => ({
  api: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  mockGet.mockReset();
});

const provider: Provider = {
  ccn: "371653",
  name: "Oklahoma Hospice Alpha",
  city: "Tulsa",
  county: "Tulsa",
  state: "OK",
  zip: "74101",
  beneficiaries: 10,
  adc: 12,
  payment: 1500,
  daysPerBene: 45,
};

const detail: ProviderDetail = {
  provider,
  quality: [],
  cahps: [],
  cahpsSummary: { summaryStar: 4 },
  qualitySummary: { visitsNearDeath: 88 },
  zips: [],
  enrollments: [],
  owners: [],
  history: [],
  periods: { cahpsDate: "2025" },
  sources: [],
  confidence: 92,
  dataQuality: { status: "healthy", limitations: [] },
  warnings: [],
};

describe("IntelligenceCenter history contract", () => {
  it("renders change history even when the runtime returns changes without records", async () => {
    mockGet.mockImplementation(async (path: string) => {
      if (path.startsWith("/api/intelligence")) return { data: { threats: [], qualityBattlecard: [], enterprise: { relatedEnrollments: [] }, serviceArea: {} } };
      if (path.startsWith("/api/ssvi/")) return { data: { fy2025: { reportable: true, totalScore: 75 } } };
      if (path.startsWith("/api/hcris/")) return { data: { available: true, costReportBasis: "CMS-1984-14", fiscalYear: "2025" } };
      if (path.startsWith("/api/service-geography/")) return { data: { counties: [], mappingCoveragePct: 100 } };
      if (path.startsWith("/api/white-space/")) return { data: { counties: [] } };
      if (path.startsWith("/api/capabilities/")) return { data: { supported: [] } };
      if (path.startsWith("/api/provider-history/")) return { data: { changes: [{ key: "adc", label: "Estimated Medicare ADC", from: 10, to: 12, percentDelta: 20 }] } };
      throw new Error(`Unexpected request: ${path}`);
    });

    render(<IntelligenceCenter state="OK" stateName="Oklahoma" provider={provider} detail={detail} marketSources={[]} user={null} onSignIn={() => undefined} onOpenProvider={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText("Estimated Medicare ADC")).toBeTruthy();
      expect(screen.getByText("10 → 12 (+20.0%)")).toBeTruthy();
    });
  });
});
