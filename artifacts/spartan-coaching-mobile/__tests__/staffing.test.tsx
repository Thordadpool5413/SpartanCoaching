import React from "react";
import { render, fireEvent, within, cleanup } from "@testing-library/react-native";
import StaffingScreen from "../app/staffing";
import { fmtK } from "../components/StaffingTable";
import { runEngine, type BranchInputs } from "@workspace/branch-engine/engine";
import {
  DEFAULT_INPUTS,
  STAFF_ROLES,
  PRESET_CONFIGS,
} from "@workspace/branch-engine/presets";
import { CONTENT_VERSION } from "@workspace/branch-engine/content";

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

afterEach(cleanup);

function expectStaffingMatchesEngine(
  view: ReturnType<typeof render>,
  inputs: BranchInputs,
) {
  const expected = runEngine(inputs, STAFF_ROLES, CONTENT_VERSION);
  const rows = expected.tables.requiredStaffing;
  expect(rows.length).toBeGreaterThan(0);

  rows.forEach((row, i) => {
    const tr = view.getByTestId(`row-staff-${i}`);
    expect(within(tr).getByTestId(`text-staff-role-${i}`).props.children).toBe(
      row.role,
    );
    expect(within(tr).getByTestId(`text-staff-fte-${i}`).props.children).toBe(
      String(row.fte),
    );
    expect(within(tr).getByTestId(`text-staff-salary-${i}`).props.children).toBe(
      fmtK(row.salary),
    );
    expect(within(tr).getByTestId(`text-staff-cost-${i}`).props.children).toBe(
      fmtK(row.annualCost),
    );
  });

  expect(view.getByTestId("text-total-payroll").props.children).toBe(
    expected.display.totalPayroll,
  );
}

describe("mobile staffing screen matches engine output", () => {
  for (const adc of [20, 50, 80]) {
    it(`renders engine staffing rows at ADC ${adc} (base preset)`, () => {
      const view = render(<StaffingScreen />);
      fireEvent.changeText(view.getByTestId("input-adc"), String(adc));
      expectStaffingMatchesEngine(view, {
        ...DEFAULT_INPUTS,
        targetADC: adc,
      });
    });
  }

  for (const presetKey of Object.keys(PRESET_CONFIGS)) {
    it(`renders engine staffing rows for preset "${presetKey}" at ADC 20, 50, 80`, () => {
      const view = render(<StaffingScreen />);
      fireEvent.press(view.getByTestId(`button-scenario-${presetKey}`));
      for (const adc of [20, 50, 80]) {
        fireEvent.changeText(view.getByTestId("input-adc"), String(adc));
        expectStaffingMatchesEngine(view, {
          ...DEFAULT_INPUTS,
          ...PRESET_CONFIGS[presetKey].inputs,
          scenarioPreset: presetKey,
          targetADC: adc,
        });
      }
    });
  }
});
