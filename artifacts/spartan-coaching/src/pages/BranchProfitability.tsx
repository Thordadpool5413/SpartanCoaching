import { AccentText } from "@/components/AccentText";
import { useState, useMemo } from "react";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import { downloadPdf, type EmailPdfPayload } from "@/lib/downloadPdf";
import { Card, CardContent } from "@/components/ui/card";
import { CoachingCTA } from "@/components/CoachingCTA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SEO } from "@/components/SEO";
import { FieldKitToolLayout } from "@/components/FieldKitToolLayout";
import { SlideUp } from "@/components/animations";
import {
  Building,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  Printer,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Plus,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { runEngine, type BranchInputs, type BranchResults, type StaffingRole } from "@workspace/branch-engine/engine";
import { DEFAULT_INPUTS, PRESET_CONFIGS, STAFF_ROLES } from "@workspace/branch-engine/presets";
import { TOOLTIP_CONTENT, getGlossaryEntries } from "@shared/branch_content_presenter";
import { CONTENT_VERSION } from "@workspace/branch-engine/content";

// ─── Display helpers (for use in JSX only — never inside engine) ──────────────
function fmtK(v: number) {
  const sign = v < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(v)).toLocaleString("en-US");
}
function fmtKAbbrev(v: number) {
  if (Math.abs(v) >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return "$" + (v / 1_000).toFixed(0) + "K";
  return "$" + Math.round(v).toLocaleString();
}
// ─── Info tooltip ─────────────────────────────────────────────────────────────
function InfoTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center ml-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          aria-label="More info"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-xs text-xs leading-relaxed p-3">
        {text}
      </PopoverContent>
    </Popover>
  );
}

// ─── How-to glossary — sourced from governed content registry ─────────────────
// No free-form factual text here. All entries come from branch_content_presenter.
const HOW_TO_READ = getGlossaryEntries();

// ─── Main component ───────────────────────────────────────────────────────────
export default function BranchProfitability() {
  const { capture, gateState } = useLeadGate("Branch Profitability Calculator");
  const [inputs, setInputs] = useState<BranchInputs>(DEFAULT_INPUTS);
  const [staffingRoles, setStaffingRoles] = useState<StaffingRole[]>(() => STAFF_ROLES.map((role) => ({ ...role })));
  const [showHowTo, setShowHowTo] = useState(false);

  // Single engine call — all downstream output from one structured result.
  // CONTENT_VERSION passed so the result object carries both formula and content provenance.
  const results: BranchResults = useMemo(
    () => runEngine(inputs, staffingRoles, CONTENT_VERSION),
    [inputs, staffingRoles]
  );

  const { derived, display, tables, charts, narrative } = results;

  function applyPreset(key: string) {
    const preset = PRESET_CONFIGS[key];
    if (!preset) return;
    setInputs((prev) => ({
      ...prev,
      scenarioPreset: key,
      ...preset.inputs,
    }));
  }

  function set<K extends keyof BranchInputs>(field: K, value: BranchInputs[K]) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  function numSet(field: keyof BranchInputs, raw: string, scale = 1) {
    const n = parseFloat(raw);
    set(field, (isNaN(n) ? 0 : n) / scale as any);
  }

  function updateStaffing(index: number, field: "minFte" | "salary", raw: string) {
    const value = Math.max(0, Number(raw) || 0);
    setStaffingRoles((current) => current.map((role, roleIndex) => roleIndex === index
      ? { ...role, [field]: value, caseloadTrigger: 9999 }
      : role));
  }

  function addStaffingRole() {
    setStaffingRoles((current) => [...current, {
      role: `Custom role ${current.filter((item) => item.role.startsWith("Custom role")).length + 1}`,
      salary: 0,
      minFte: 1,
      caseloadTrigger: 9999,
    }]);
  }

  function resetStaffing() {
    setStaffingRoles(STAFF_ROLES.map((role) => ({ ...role })));
  }

  // PDF export — all data comes from the engine results, never recalculated here
  function buildExportPayload(): EmailPdfPayload {
    return {
      title: "Branch Profitability Analysis",
      filename: "spartan-branch-profitability",
      subtitle: `Scenario: ${PRESET_CONFIGS[inputs.scenarioPreset]?.label ?? inputs.scenarioPreset} | ADC: ${inputs.targetADC}`,
      sections: [
        {
          heading: "Key Inputs",
          body: [
            `Average Daily Census (ADC): ${inputs.targetADC}`,
            `Average Length of Stay: ${inputs.avgLengthOfStayDays} days`,
            `Target Operating Margin: ${inputs.targetOperatingMarginPercent}%`,
            `RHC Day 1–60: ${display.blendedRevenuePerDay}/day`,
            `Monthly Non-Payroll Overhead: ${fmtK(inputs.monthlyNonPayrollOverhead)}`,
            `Starting Capital: ${fmtK(inputs.startingCapital)}`,
          ].join("\n"),
        },
        {
          heading: "Financial Summary",
          body: [
            `Blended Revenue/Day: ${display.blendedRevenuePerDay}`,
            `Annual Revenue: ${display.annualRevenue}`,
            `Variable Cost/Day: ${display.totalVariableCostPerDay}`,
            `Annual Variable Cost: ${display.annualVariableCost}`,
            `Annual Payroll: ${display.annualPayroll}`,
            `Annual Overhead: ${display.annualOverhead}`,
            `Annual Profit: ${display.annualProfit}`,
            `Operating Margin: ${display.operatingMarginPercent}`,
            `Contribution/Day: ${display.contributionPerDay}`,
          ].join("\n"),
        },
        {
          heading: "Key Thresholds",
          body: [
            `Break-Even ADC: ${display.breakEvenADC} patients`,
            `Target Margin ADC: ${display.targetMarginADC} patients`,
            `Monthly Admissions Needed: ${display.monthlyAdmissionsNeeded}`,
            `Weekly Admissions Needed: ${display.weeklyAdmissionsNeeded}`,
            `Marketers Needed: ${display.marketersNeeded}`,
          ].join("\n"),
        },
        {
          heading: "Cash Runway (18-Month Ramp)",
          body: [
            `Starting Capital: ${fmtK(inputs.startingCapital)}`,
            `Months of Runway: ${narrative.monthsOfRunway === 18 ? "18+" : narrative.monthsOfRunway}`,
            `Month Goes Cash-Flow Positive: ${narrative.monthCashFlowTurnsPositive > 0 ? `Month ${narrative.monthCashFlowTurnsPositive}` : "Not within 18 months"}`,
            `Cash at Month 12: ${fmtK(narrative.cashAtMonth12)}`,
          ].join("\n"),
        },
        {
          heading: "Required Staffing",
          body: tables.requiredStaffing
            .map(
              (r) =>
                `${r.role} — ${r.fte} FTE @ ${fmtK(r.salary)}/yr = ${fmtK(r.annualCost)}`
            )
            .concat([`Total Payroll: ${display.totalPayroll}`])
            .join("\n"),
        },
      ],
    };
  }

  // Status badge — reads from engine result
  function StatusBadge() {
    if (narrative.status === "below-breakeven")
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive">
          <AlertCircle className="w-4 h-4" /> Below Break-Even
        </span>
      );
    if (narrative.status === "profitable-below-target")
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
          <TrendingUp className="w-4 h-4" /> Profitable — Below Target Margin
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
        <CheckCircle className="w-4 h-4" /> At or Above Target
      </span>
    );
  }

  return (
    <FieldKitToolLayout toolPath="/tools/branch-profitability">
      <SEO
        title="Branch Profitability Simulator | Spartan Coaching"
        description="Model hospice branch profitability across any ADC. Enter your revenue rates, clinical costs, and staffing assumptions to find your break-even point and target margin ADC."
      />
      <style>{`
        @page { size: letter portrait; margin: 0.75in; }
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11pt; }
        }
      `}</style>

      <SlideUp>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-h1 font-black text-foreground mb-2"
              data-testid="text-branch-profit-title"
            ><AccentText>Branch Profitability Simulator</AccentText></h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl leading-relaxed">
              Model your hospice branch across any average daily census. Enter
              your revenue rates, clinical variable costs, and staffing to find
              your break-even point, required admissions, and target margin ADC.
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <Button
              variant="outline"
              size="default"
              onClick={() => { setInputs(DEFAULT_INPUTS); resetStaffing(); }}
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                const payload = buildExportPayload();
                capture(
                  async () => {
                    await downloadPdf(
                      payload.filename,
                      payload.title,
                      payload.sections,
                      payload.subtitle
                    );
                  },
                  () => payload
                );
              }}
              data-testid="button-print"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={() =>
                capture(
                  () => {
                    // Prefer API-served path; fall back to static public path
                    const primary = "/resources/files/branch-profitability-education.pdf";
                    window.open(primary, "_blank");
                  },
                  () => null
                )
              }
              data-testid="button-education-guide"
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Education Guide
            </Button>
          </div>
        </div>
      </SlideUp>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── LEFT: INPUTS ────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5 no-print">

          {/* Scenario Preset */}
          <Card className="spacing-card">
            <h2 className="text-base font-bold mb-3"><AccentText>Scenario Preset</AccentText></h2>
            <div className="grid grid-cols-3 gap-2">
              {(["lean", "base", "highAcuity"] as const).map((k) => (
                <Button
                  key={k}
                  variant={inputs.scenarioPreset === k ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(k)}
                  className="font-semibold"
                  data-testid={`button-scenario-${k}`}
                >
                  {PRESET_CONFIGS[k].label}
                </Button>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground border-t border-border pt-3">
              {(["lean", "base", "highAcuity"] as const).map((k) => (
                <p key={k}>
                  <span className="font-semibold text-foreground">
                    {PRESET_CONFIGS[k].label}
                  </span>{" "}
                  — {PRESET_CONFIGS[k].description}
                </p>
              ))}
            </div>
          </Card>

          {/* Census & LOS */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold"><AccentText>Census &amp; Length of Stay</AccentText></h2>
            <div>
              <Label htmlFor="adc" className="text-sm font-medium flex items-center">
                Target ADC (patients)
                <InfoTip text={TOOLTIP_CONTENT.targetADC()} />
              </Label>
              <Input
                id="adc"
                type="number"
                min={1}
                max={500}
                value={inputs.targetADC}
                onChange={(e) => numSet("targetADC", e.target.value)}
                className="mt-1"
                data-testid="input-adc"
              />
            </div>
            <div>
              <Label htmlFor="los" className="text-sm font-medium flex items-center">
                Avg Length of Stay (days)
                <InfoTip text={TOOLTIP_CONTENT.avgLengthOfStayDays()} />
              </Label>
              <Input
                id="los"
                type="number"
                min={1}
                value={inputs.avgLengthOfStayDays}
                onChange={(e) => numSet("avgLengthOfStayDays", e.target.value)}
                className="mt-1"
                data-testid="input-los"
              />
            </div>
            <div>
              <Label htmlFor="targetMargin" className="text-sm font-medium flex items-center">
                Target Operating Margin (%)
                <InfoTip text={TOOLTIP_CONTENT.targetOperatingMarginPercent()} />
              </Label>
              <Input
                id="targetMargin"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={inputs.targetOperatingMarginPercent}
                onChange={(e) =>
                  numSet("targetOperatingMarginPercent", e.target.value)
                }
                className="mt-1"
                data-testid="input-target-margin"
              />
            </div>
          </Card>

          {/* Revenue Rates */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold"><AccentText>Revenue Rates</AccentText></h2>
            <div>
              <Label htmlFor="rhc1" className="text-sm font-medium flex items-center">
                RHC Day 1–60 ($/day)
                <InfoTip text={TOOLTIP_CONTENT.rhcDay1To60()} />
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                <Input
                  id="rhc1"
                  type="number"
                  step={0.01}
                  value={inputs.rhcDay1To60}
                  onChange={(e) => numSet("rhcDay1To60", e.target.value)}
                  className="pl-6"
                  data-testid="input-rhc1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rhc2" className="text-sm font-medium flex items-center">
                RHC Day 61+ ($/day)
                <InfoTip text={TOOLTIP_CONTENT.rhcDay61Plus()} />
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                <Input
                  id="rhc2"
                  type="number"
                  step={0.01}
                  value={inputs.rhcDay61Plus}
                  onChange={(e) => numSet("rhcDay61Plus", e.target.value)}
                  className="pl-6"
                  data-testid="input-rhc2"
                />
              </div>
            </div>
          </Card>

          {/* Variable Costs */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold"><AccentText>Variable Clinical Costs ($/day)</AccentText></h2>
            {(
              [
                { key: "pharmacyPerDay",  label: "Pharmacy" },
                { key: "dmePerDay",       label: "DME"      },
                { key: "suppliesPerDay",  label: "Supplies" },
                { key: "travelPerDay",    label: "Travel"   },
                { key: "otherPerDay",     label: "Other"    },
              ] as const
            ).map(({ key, label }) => (
              <div key={key}>
                <Label htmlFor={key} className="text-sm font-medium flex items-center">
                  {label}
                  <InfoTip text={TOOLTIP_CONTENT[key]()} />
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                  <Input
                    id={key}
                    type="number"
                    step={0.01}
                    min={0}
                    value={inputs[key]}
                    onChange={(e) => numSet(key, e.target.value)}
                    className="pl-6"
                    data-testid={`input-${key}`}
                  />
                </div>
              </div>
            ))}
          </Card>

          {/* Fixed Overhead */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold"><AccentText>Fixed Overhead</AccentText></h2>
            <div>
              <Label htmlFor="overhead" className="text-sm font-medium flex items-center">
                Monthly Non-Payroll Overhead ($)
                <InfoTip text={TOOLTIP_CONTENT.monthlyNonPayrollOverhead()} />
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                <Input
                  id="overhead"
                  type="number"
                  step={100}
                  min={0}
                  value={inputs.monthlyNonPayrollOverhead}
                  onChange={(e) => numSet("monthlyNonPayrollOverhead", e.target.value)}
                  className="pl-6"
                  data-testid="input-overhead"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="startCash" className="text-sm font-medium flex items-center">
                Starting Capital ($)
                <InfoTip text={TOOLTIP_CONTENT.startingCapital()} />
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                <Input
                  id="startCash"
                  type="number"
                  step={5000}
                  min={0}
                  value={inputs.startingCapital}
                  onChange={(e) => numSet("startingCapital", e.target.value)}
                  className="pl-6"
                  data-testid="input-start-cash"
                />
              </div>
            </div>
          </Card>

          {/* Sales Assumptions */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold"><AccentText>Sales Assumptions</AccentText></h2>
            <div>
              <Label htmlFor="admissionsPerMarketer" className="text-sm font-medium flex items-center">
                Admissions per Marketer / Month
                <InfoTip text={TOOLTIP_CONTENT.admissionsPerMarketerPerMonth()} />
              </Label>
              <Input
                id="admissionsPerMarketer"
                type="number"
                min={1}
                value={inputs.admissionsPerMarketerPerMonth}
                onChange={(e) =>
                  numSet("admissionsPerMarketerPerMonth", e.target.value)
                }
                className="mt-1"
                data-testid="input-admissions-per-marketer"
              />
            </div>
          </Card>
        </div>

        {/* ── RIGHT: RESULTS ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          <Card className="border-primary/30 bg-primary/[0.06] p-4 sm:p-5 no-print">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Start with the biggest cost</p>
                <p className="mt-1 font-bold text-foreground">Staffing and salaries are fully editable.</p>
                <p className="mt-1 text-sm text-muted-foreground">Set the team first, then read profit, margin, break-even, and runway.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => document.getElementById("staffing-plan")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Edit staffing plan</Button>
            </div>
          </Card>

          {/* How to Read */}
          <Card className="border-primary/20 bg-primary/5">
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              onClick={() => setShowHowTo((v) => !v)}
              data-testid="button-how-to-toggle"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">
                  How to Read Your Results
                </span>
              </div>
              {showHowTo ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {showHowTo && (
              <div className="px-5 pb-5 grid sm:grid-cols-2 gap-x-6 gap-y-4 border-t border-primary/10 pt-4">
                {HOW_TO_READ.map(({ term, def }) => (
                  <div key={term}>
                    <div className="text-xs font-bold text-foreground mb-0.5">{term}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{def}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Key Metric Cards */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                icon: <DollarSign className="w-5 h-5 text-primary" />,
                label: "Annual Profit",
                value: display.annualProfit,
                sub: "at current ADC",
                testId: "text-annual-profit",
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-primary" />,
                label: "Operating Margin",
                value: display.operatingMarginPercent,
                sub: `target: ${inputs.targetOperatingMarginPercent}%`,
                testId: "text-margin",
              },
              {
                icon: <Target className="w-5 h-5 text-primary" />,
                label: "Break-Even ADC",
                value: display.breakEvenADC,
                sub: "patients",
                testId: "text-breakeven-adc",
              },
              {
                icon: <Users className="w-5 h-5 text-primary" />,
                label: "Marketers Needed",
                value: display.marketersNeeded,
                sub: `${display.monthlyAdmissionsNeeded} admits/mo`,
                testId: "text-marketers-needed",
              },
            ].map(({ icon, label, value, sub, testId }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    {icon}
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                  <div
                    className="text-2xl font-black text-foreground"
                    data-testid={testId}
                  >
                    {value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary at ADC */}
          <Card className="spacing-card">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold"><AccentText>Summary at ADC {inputs.targetADC}</AccentText></h2>
                <div className="mt-1">
                  <StatusBadge />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Target Margin ADC</div>
                <div
                  className="text-xl font-black text-foreground"
                  data-testid="text-target-adc"
                >
                  {display.targetMarginADC}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue</div>
                <div className="flex justify-between">
                  <span>Blended $/Day</span>
                  <span className="font-semibold">{display.blendedRevenuePerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Revenue</span>
                  <span className="font-semibold">{display.annualRevenue}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Costs</div>
                <div className="flex justify-between">
                  <span>Var Cost/Day</span>
                  <span className="font-semibold">{display.totalVariableCostPerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Payroll</span>
                  <span className="font-semibold">{display.annualPayroll}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Overhead</span>
                  <span className="font-semibold">{display.annualOverhead}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Margin Drivers</div>
                <div className="flex justify-between">
                  <span>Contrib/Day</span>
                  <span className="font-semibold">{display.contributionPerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span>Break-Even ADC</span>
                  <span className="font-semibold">{display.breakEvenADC}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target ADC</span>
                  <span className="font-semibold">{display.targetMarginADC}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly Admits</span>
                  <span className="font-semibold">{display.weeklyAdmissionsNeeded}/wk</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Admissions Reference Table */}
          <Card className="spacing-card">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold"><AccentText>Admissions Reference — Standard ADC Checkpoints</AccentText></h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Required monthly and weekly admissions at key ADC levels using your current LOS of{" "}
              <span className="font-semibold text-foreground">{inputs.avgLengthOfStayDays} days</span>.
              Calculated from the engine formula: (ADC &times; 365) &divide; LOS &divide; 12.
            </p>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm min-w-[420px]" data-testid="table-admissions-reference">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 font-semibold text-muted-foreground">Target ADC</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Monthly Admits</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Weekly Admits</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Your ADC?</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.admissionsReferenceTable.map((row, i) => {
                    const isYou = row.targetADC === inputs.targetADC;
                    return (
                      <tr
                        key={row.targetADC}
                        className={`${i % 2 === 0 ? "bg-muted/30" : ""} ${isYou ? "ring-1 ring-primary/40 rounded" : ""}`}
                        data-testid={`row-admref-${row.targetADC}`}
                      >
                        <td className={`py-1.5 pr-3 font-semibold ${isYou ? "text-primary" : ""}`}>
                          {row.targetADC}
                          {isYou && (
                            <span className="ml-1.5 text-xs font-normal text-primary opacity-80">you</span>
                          )}
                        </td>
                        <td className="py-1.5 text-right font-semibold">
                          {row.display.monthlyAdmissionsNeeded}/mo
                        </td>
                        <td className="py-1.5 text-right">
                          {row.display.weeklyAdmissionsNeeded}/wk
                        </td>
                        <td className="py-1.5 text-right text-muted-foreground text-xs">
                          {isYou ? (
                            <span className="font-semibold text-primary">Yes</span>
                          ) : row.targetADC < inputs.targetADC ? "below" : "above"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td colSpan={4} className="pt-2 text-xs text-muted-foreground">
                      LOS = {inputs.avgLengthOfStayDays} days &bull; All values calculated by the engine
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Cash Runway */}
          <Card className="spacing-card">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold"><AccentText>Cash Runway — 18-Month Ramp</AccentText></h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              {[
                {
                  label: "Months of Runway",
                  value:
                    narrative.monthsOfRunway === 18
                      ? "18+"
                      : narrative.monthsOfRunway.toString(),
                  sub: "before cash runs out",
                  danger: narrative.monthsOfRunway < 6,
                  testId: "text-months-runway",
                },
                {
                  label: "Month Goes Cash-Flow +",
                  value:
                    narrative.monthCashFlowTurnsPositive === -1
                      ? "18+"
                      : `Month ${narrative.monthCashFlowTurnsPositive}`,
                  sub: "first month P&L > 0",
                  danger: narrative.monthCashFlowTurnsPositive === -1,
                  testId: "text-month-positive",
                },
                {
                  label: "Cash at Month 12",
                  value: fmtK(narrative.cashAtMonth12),
                  sub: "projected remaining",
                  danger: narrative.cashAtMonth12 < 0,
                  testId: "text-cash-month-12",
                },
              ].map(({ label, value, sub, danger, testId }) => (
                <div key={label} className="bg-muted/40 rounded-md px-4 py-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    {label}
                  </div>
                  <div
                    className={`text-xl font-black ${danger ? "text-destructive" : "text-foreground"}`}
                    data-testid={testId}
                  >
                    {value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                </div>
              ))}
            </div>

            {/* Runway chart */}
            <div className="h-48 w-full mb-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={tables.runwayMonths}
                  margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: "Month", position: "insideBottomRight", offset: -4, fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtKAbbrev(v)}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    width={66}
                  />
                  <RTooltip
                    formatter={(v: number) => [fmtK(v), "Cumulative Cash"]}
                    labelFormatter={(l) => `Month ${l}`}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <ReferenceLine
                    y={0}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="4 4"
                    label={{ value: "$0", fontSize: 10, fill: "hsl(var(--destructive))" }}
                  />
                  {narrative.monthCashFlowTurnsPositive > 0 && (
                    <ReferenceLine
                      x={narrative.monthCashFlowTurnsPositive}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="4 4"
                      label={{ value: "CF+", fontSize: 10, fill: "hsl(var(--primary))" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="cumulativeCash"
                    name="Cumulative Cash"
                    stroke="hsl(var(--primary))"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Runway table */}
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-xs min-w-[520px]" data-testid="table-runway">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 font-semibold text-muted-foreground">Mo</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">ADC</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Revenue</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Var Cost</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Payroll</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Overhead</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Monthly P&L</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Cum. Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.runwayMonths.map((r) => {
                    const neg = r.cumulativeCash < 0;
                    const pnlNeg = r.monthlyProfitLoss < 0;
                    return (
                      <tr
                        key={r.month}
                        className={r.month % 2 === 0 ? "bg-muted/30" : ""}
                        data-testid={`row-runway-${r.month}`}
                      >
                        <td className="py-1 pr-2 font-medium">{r.month}</td>
                        <td className="py-1 text-right">{r.avgADC.toFixed(1)}</td>
                        <td className="py-1 text-right">{fmtKAbbrev(r.monthlyRevenue)}</td>
                        <td className="py-1 text-right">{fmtKAbbrev(r.monthlyVariableCost)}</td>
                        <td className="py-1 text-right">{fmtKAbbrev(r.monthlyPayroll)}</td>
                        <td className="py-1 text-right">{fmtKAbbrev(r.monthlyOverhead)}</td>
                        <td
                          className={`py-1 text-right font-semibold ${pnlNeg ? "text-destructive" : "text-green-600 dark:text-green-400"}`}
                        >
                          {fmtKAbbrev(r.monthlyProfitLoss)}
                        </td>
                        <td
                          className={`py-1 text-right font-bold ${neg ? "text-destructive" : "text-foreground"}`}
                        >
                          {fmtKAbbrev(r.cumulativeCash)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Profit Curve */}
          <Card className="spacing-card">
            <h2 className="text-base font-bold mb-4"><AccentText>Profit Curve — ADC 10 to 200</AccentText></h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts.profitCurve}
                  margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="adc"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: "ADC", position: "insideBottomRight", offset: -4, fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtKAbbrev(v)}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    width={62}
                  />
                  <RTooltip
                    formatter={(v: number, name: string) =>
                      name === "Annual Profit"
                        ? [fmtK(v), name]
                        : [v.toFixed(1) + "%", name]
                    }
                    labelFormatter={(l) => `ADC: ${l}`}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine
                    x={Math.round(derived.breakEvenADC)}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="4 4"
                    label={{ value: "B/E", fontSize: 10, fill: "hsl(var(--destructive))" }}
                  />
                  <ReferenceLine
                    x={inputs.targetADC}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="4 4"
                    label={{ value: "You", fontSize: 10, fill: "hsl(var(--primary))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="annualProfit"
                    name="Annual Profit"
                    stroke="hsl(var(--primary))"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Operating Margin by ADC */}
          <Card className="spacing-card">
            <h2 className="text-base font-bold mb-4"><AccentText>Operating Margin by ADC</AccentText></h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts.operatingMarginCurve}
                  margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="adc"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: "ADC", position: "insideBottomRight", offset: -4, fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={(v) => v.toFixed(0) + "%"}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    width={44}
                  />
                  <RTooltip
                    formatter={(v: number) => [v.toFixed(1) + "%", "Margin"]}
                    labelFormatter={(l) => `ADC: ${l}`}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <ReferenceLine
                    y={inputs.targetOperatingMarginPercent}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="4 4"
                    label={{ value: "Target", fontSize: 10, fill: "hsl(var(--primary))" }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="operatingMarginPercent"
                    name="Margin %"
                    stroke="#22c55e"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Editable staffing model */}
          <Card className="spacing-card scroll-mt-24" id="staffing-plan">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold"><AccentText>Your Staffing Plan at ADC {inputs.targetADC}</AccentText></h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Edit FTE and annual salary. Profit, margin, break-even, runway, charts, and exports recalculate from this plan.</p>
              </div>
              <div className="flex flex-wrap gap-2 no-print">
                <Button type="button" variant="outline" size="sm" onClick={resetStaffing}>Recommended baseline</Button>
                <Button type="button" variant="outline" size="sm" onClick={addStaffingRole}><Plus className="mr-1.5 h-4 w-4" /> Add role</Button>
              </div>
            </div>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm min-w-[480px]" data-testid="table-staffing">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 font-semibold text-muted-foreground">Role</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">FTE</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Annual Salary</th>
                    <th className="text-right pb-2 font-semibold text-muted-foreground">Annual Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.requiredStaffing.map((r, i) => (
                    <tr
                      key={r.role}
                      className={i % 2 === 0 ? "bg-muted/30" : ""}
                      data-testid={`row-staff-${i}`}
                    >
                      <td className="py-1.5 pr-3">{r.role}</td>
                      <td className="py-1.5 pl-2">
                        <Input type="number" min={0} step={0.1} value={r.fte} onChange={(event) => updateStaffing(i, "minFte", event.target.value)} className="ml-auto h-9 w-24 text-right" aria-label={`${r.role} FTE`} data-testid={`input-staff-fte-${i}`} />
                      </td>
                      <td className="py-1.5 pl-2">
                        <div className="flex items-center justify-end gap-1"><span className="text-muted-foreground">$</span><Input type="number" min={0} step={1000} value={r.salary} onChange={(event) => updateStaffing(i, "salary", event.target.value)} className="h-9 w-32 text-right" aria-label={`${r.role} annual salary`} data-testid={`input-staff-salary-${i}`} /></div>
                      </td>
                      <td className="py-1.5 text-right font-semibold whitespace-nowrap">
                        {fmtK(r.annualCost)}{staffingRoles[i]?.role.startsWith("Custom role") ? <Button type="button" variant="ghost" size="icon" className="ml-1 h-8 w-8 no-print" aria-label={`Remove ${r.role}`} onClick={() => setStaffingRoles((current) => current.filter((_, roleIndex) => roleIndex !== i))}><Trash2 className="h-4 w-4" /></Button> : null}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-bold">
                    <td className="py-2">Totals</td>
                    <td className="py-2 text-right" data-testid="text-total-fte">{tables.requiredStaffing.reduce((sum, row) => sum + row.fte, 0).toFixed(1)} FTE</td>
                    <td />
                    <td
                      className="py-2 text-right"
                      data-testid="text-total-payroll"
                    >
                      {display.totalPayroll}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <CoachingCTA className="no-print" />
        </div>
      </div>

      <LeadGateDialog gateState={gateState} />
    </FieldKitToolLayout>
  );
}
