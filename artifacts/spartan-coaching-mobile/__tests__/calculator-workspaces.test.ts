import AsyncStorage from "@react-native-async-storage/async-storage";
import fs from "node:fs";
import path from "node:path";
import { calculateActivityTargets, calculateRepCost, calculateRoi } from "../lib/calculators";
import { deleteCalculatorReport, listCalculatorReports, saveCalculatorReport } from "../lib/calculatorHistory";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("complete calculator workspaces", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("turns an admission goal into transparent activity targets", () => {
    const result = calculateActivityTargets({
      repName: "Jordan",
      repStatus: "tenured",
      monthlyGoal: 8,
      lastCycleAdmissions: 6,
      lastCycleConversations: 90,
    });

    expect(result.conversationsPerAdmission).toBe(15);
    expect(result.targetConversationsMonth).toBe(136);
    expect(result.targetConversationsWeek).toBe(34);
    expect(result.targetConversationsDay).toBe(7);
    expect(result.rateSource).toContain("Personal history");
  });

  it("lets leadership control every ROI assumption independently", () => {
    const result = calculateRoi({
      reps: 3,
      referralsPerRep: 15,
      conversionPct: 65,
      losDays: 45,
      rppd: 200,
      activityLiftPct: 10,
      conversionLiftPts: 3,
      losLiftPct: 2,
    });

    expect(result.activityLiftPct).toBe(10);
    expect(result.conversionLiftPts).toBe(3);
    expect(result.losLiftPct).toBe(2);
    expect(result.projectedAdmissions).toBeGreaterThan(result.monthlyAdmissions);
    expect(result.additionalAnnualRevenue).toBeGreaterThan(0);
  });

  it("models loaded rep economics and conversion leakage", () => {
    const result = calculateRepCost(
      {
        baseSalary: 90000,
        benefitsLoad: 42,
        annualMileage: 5400,
        otherFixedCosts: 15484,
        callsPerDay: 12,
        workingDaysPerMonth: 20,
        callsPerReferral: 8,
        conversionRate: 70,
      },
      [
        { id: 1, min: 1, max: 20, rate: 125 },
        { id: 2, min: 21, max: 999, rate: 150 },
      ],
    );

    expect(result.totalRepCost).toBeGreaterThan(result.fixedCost);
    expect(result.costPerReferral).toBeGreaterThan(0);
    expect(result.annualLostAdmissions).toBeGreaterThan(0);
    expect(result.annualConversionLoss).toBeGreaterThan(0);
  });

  it("saves and removes decision reports for My Work", async () => {
    const saved = await saveCalculatorReport({
      kind: "roi",
      title: "ROI Scenario",
      summary: "$125,000 modeled annual opportunity",
      report: "Complete report",
    });

    expect(await listCalculatorReports()).toEqual([saved]);
    await deleteCalculatorReport(saved.id);
    expect(await listCalculatorReports()).toEqual([]);
  });

  it("ships four premium native workspaces with save and share continuity", () => {
    const activity = read("app/activity-calculator.tsx");
    const roi = read("app/roi-calculator.tsx");
    const rep = read("app/rep-cost-calculator.tsx");
    const branch = read("app/staffing.tsx");
    const myWork = read("app/(tabs)/my-work.tsx");

    expect(activity).toContain('testID="activity-calculator-workspace"');
    expect(activity).toContain("Plan versus actual");
    expect(roi).toContain('testID="roi-calculator-workspace"');
    expect(roi).toContain("Control the assumptions");
    expect(rep).toContain('testID="rep-cost-calculator-workspace"');
    expect(rep).toContain("Add commission tier");
    expect(branch).toContain('testID="branch-calculator-workspace"');
    expect(branch).toContain("CASH RUNWAY");
    for (const source of [activity, roi, rep, branch]) {
      expect(source).toContain("CalculatorReportActions");
      expect(source).toContain("DecisionBrief");
    }
    expect(myWork).toContain("SAVED DECISION REPORTS");
    expect(myWork).toContain("listCalculatorReports");
  });
});
