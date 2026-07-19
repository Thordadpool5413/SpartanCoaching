import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { render, cleanup, fireEvent, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import BranchProfitability from "./BranchProfitability";
import { runEngine, type BranchInputs } from "@workspace/branch-engine/engine";
import { DEFAULT_INPUTS, STAFF_ROLES, PRESET_CONFIGS } from "@workspace/branch-engine/presets";
import { CONTENT_VERSION } from "@workspace/branch-engine/content";

function fmtK(v: number) {
  const sign = v < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(v)).toLocaleString("en-US");
}

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

afterEach(cleanup);

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
    expect(cells[1].textContent).toBe(String(row.fte));
    expect(cells[2].textContent).toBe(fmtK(row.salary));
    expect(cells[3].textContent).toBe(fmtK(row.annualCost));
  });

  expect(view.getByTestId("text-total-payroll").textContent).toBe(
    expected.display.totalPayroll,
  );
}

describe("staffing table matches engine output", () => {
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
