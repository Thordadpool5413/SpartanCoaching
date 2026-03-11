import { useState } from "react";
import { useLeadGate } from "@/hooks/use-lead-gate";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import { downloadPdf, type EmailPdfPayload } from "@/lib/downloadPdf";
import { Link } from "wouter";
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
import { SlideUp } from "@/components/animations";
import { BackButton } from "@/components/BackButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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

function fmt$(v: number) {
  return "$" + Math.round(v).toLocaleString("en-US");
}
function fmtPct(v: number) {
  return (v * 100).toFixed(1) + "%";
}
function fmtK(v: number) {
  const sign = v < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(v)).toLocaleString("en-US");
}
function fmtKAbbrev(v: number) {
  if (Math.abs(v) >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return "$" + (v / 1_000).toFixed(0) + "K";
  return "$" + Math.round(v).toLocaleString();
}

const SCENARIOS = {
  lean: {
    label: "Lean",
    los: 70,
    rhc1: 224.62,
    rhc2: 176.92,
    pharmacy: 22,
    dme: 10,
    supplies: 10,
    travel: 6,
    other: 5,
    overhead: 38000,
    startCash: 250000,
    admissionsPerMarketer: 10,
  },
  base: {
    label: "Base",
    los: 90,
    rhc1: 208.72,
    rhc2: 208.72,
    pharmacy: 22,
    dme: 10,
    supplies: 10,
    travel: 6,
    other: 5,
    overhead: 38000,
    startCash: 250000,
    admissionsPerMarketer: 10,
  },
  highAcuity: {
    label: "High Acuity",
    los: 90,
    rhc1: 208.72,
    rhc2: 208.72,
    pharmacy: 44.35,
    dme: 10,
    supplies: 23.33,
    travel: 6,
    other: 5,
    overhead: 38000,
    startCash: 250000,
    admissionsPerMarketer: 10,
  },
};

const STAFF_ROLES = [
  { role: "Executive Director", salary: 140000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Supervisor RN Case Manager", salary: 110000, minFte: 1, caseloadTrigger: 9999 },
  { role: "RN Case Manager", salary: 100000, minFte: 2, caseloadTrigger: 12 },
  { role: "Hospice Aide", salary: 50000, minFte: 2, caseloadTrigger: 8 },
  { role: "Social Worker", salary: 75000, minFte: 1, caseloadTrigger: 15 },
  { role: "Chaplain", salary: 70000, minFte: 1, caseloadTrigger: 20 },
  { role: "After Hours RN", salary: 95000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Weekend RN", salary: 95000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Intake Coordinator", salary: 60000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Secretary", salary: 55000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Sales Rep / Marketer", salary: 115000, minFte: 1, caseloadTrigger: 9999 },
  { role: "Medical Director Contract", salary: 75000, minFte: 1, caseloadTrigger: 9999 },
];

function computeBlendedRevenue(rhc1: number, rhc2: number, los: number) {
  if (los <= 0) return rhc1;
  const day160Weight = Math.min(60, los) / los;
  const day61Weight = Math.max(0, los - 60) / los;
  return rhc1 * day160Weight + rhc2 * day61Weight;
}

function computeStaffing(adc: number) {
  return STAFF_ROLES.map((r) => {
    const autoFte = r.caseloadTrigger < 9999
      ? Math.max(r.minFte, Math.ceil(adc / r.caseloadTrigger))
      : r.minFte;
    const monthlyCost = (autoFte * r.salary) / 12;
    const annualCost = autoFte * r.salary;
    return { ...r, autoFte, monthlyCost, annualCost };
  });
}

function computeMetrics(inputs: {
  adc: number;
  los: number;
  rhc1: number;
  rhc2: number;
  pharmacy: number;
  dme: number;
  supplies: number;
  travel: number;
  other: number;
  overhead: number;
  targetMargin: number;
  admissionsPerMarketer: number;
}) {
  const { adc, los, rhc1, rhc2, pharmacy, dme, supplies, travel, other, overhead, targetMargin, admissionsPerMarketer } = inputs;
  const blendedRevDay = computeBlendedRevenue(rhc1, rhc2, los);
  const varCostDay = pharmacy + dme + supplies + travel + other;
  const contribDay = blendedRevDay - varCostDay;

  const staffing = computeStaffing(adc);
  const annualPayroll = staffing.reduce((s, r) => s + r.annualCost, 0);
  const annualOverhead = overhead * 12;
  const annualFixedCost = annualPayroll + annualOverhead;

  const annualRevenue = adc * blendedRevDay * 365;
  const annualVarCost = adc * varCostDay * 365;
  const annualProfit = annualRevenue - annualVarCost - annualFixedCost;
  const margin = annualRevenue > 0 ? annualProfit / annualRevenue : 0;

  const annualBreakevenRevenue = annualFixedCost + annualVarCost;
  const breakevenAdc = annualFixedCost > 0
    ? annualFixedCost / (contribDay * 365)
    : 0;
  const targetMarginAdc = contribDay * 365 > 0
    ? annualFixedCost / ((1 - targetMargin) * blendedRevDay * 365 - varCostDay * 365)
    : 0;

  const admissionsNeeded = los > 0 ? Math.ceil((adc * 365) / los / 12) : 0;
  const marketersNeeded = Math.ceil(admissionsNeeded / admissionsPerMarketer);

  return {
    blendedRevDay,
    varCostDay,
    contribDay,
    annualPayroll,
    annualOverhead,
    annualFixedCost,
    annualRevenue,
    annualVarCost,
    annualProfit,
    margin,
    breakevenAdc: Math.max(0, breakevenAdc),
    targetMarginAdc: Math.max(0, targetMarginAdc),
    admissionsNeeded,
    marketersNeeded,
    staffing,
  };
}

function simulateProfitCurve(inputs: Parameters<typeof computeMetrics>[0]) {
  const rows = [];
  for (let adc = 10; adc <= 200; adc++) {
    const m = computeMetrics({ ...inputs, adc });
    rows.push({
      adc,
      annualProfit: m.annualProfit,
      margin: +(m.margin * 100).toFixed(1),
      annualRevenue: m.annualRevenue,
    });
  }
  return rows;
}

function computeCashRunway(
  inputs: Parameters<typeof computeMetrics>[0] & { startCash: number }
) {
  const { startCash, adc } = inputs;
  const blendedRevDay = computeBlendedRevenue(inputs.rhc1, inputs.rhc2, inputs.los);
  const varCostDay = inputs.pharmacy + inputs.dme + inputs.supplies + inputs.travel + inputs.other;
  const staffing = computeStaffing(adc);
  const annualPayroll = staffing.reduce((s, r) => s + r.annualCost, 0);
  const annualOverhead = inputs.overhead * 12;
  const annualFixedCost = annualPayroll + annualOverhead;
  const monthlyFixed = annualFixedCost / 12;

  const rows: {
    month: number;
    projectedAdc: number;
    monthlyRevenue: number;
    monthlyCost: number;
    monthlyPnl: number;
    cumulativeCash: number;
  }[] = [];

  let cumCash = startCash;
  let monthToPositive = -1;
  let monthsOfRunway = 18;

  for (let m = 1; m <= 18; m++) {
    const projectedAdc = m <= 12 ? (adc * m) / 12 : adc;
    const monthlyRevenue = projectedAdc * blendedRevDay * 30;
    const monthlyVarCost = projectedAdc * varCostDay * 30;
    const monthlyCost = monthlyVarCost + monthlyFixed;
    const monthlyPnl = monthlyRevenue - monthlyCost;
    cumCash += monthlyPnl;

    rows.push({
      month: m,
      projectedAdc: +projectedAdc.toFixed(1),
      monthlyRevenue,
      monthlyCost,
      monthlyPnl,
      cumulativeCash: cumCash,
    });

    if (monthToPositive === -1 && monthlyPnl > 0) monthToPositive = m;
    if (cumCash <= 0 && monthsOfRunway === 18) monthsOfRunway = m - 1;
  }

  const cashAtMonth12 = rows[11]?.cumulativeCash ?? startCash;

  return {
    rows,
    monthToPositive,
    monthsOfRunway,
    cashAtMonth12,
  };
}

const DEFAULT_INPUTS = {
  scenario: "base" as keyof typeof SCENARIOS,
  adc: 50,
  los: 90,
  rhc1: 208.72,
  rhc2: 208.72,
  pharmacy: 22,
  dme: 10,
  supplies: 10,
  travel: 6,
  other: 5,
  overhead: 38000,
  startCash: 250000,
  targetMargin: 0.15,
  admissionsPerMarketer: 10,
};

function InfoTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center ml-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation" aria-label="More info">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-xs text-xs leading-relaxed p-3">
        {text}
      </PopoverContent>
    </Popover>
  );
}

const HOW_TO_READ = [
  {
    term: "Annual Profit",
    def: "Net operating income after all payroll, variable costs, and overhead at your current ADC. A negative number means the branch is losing money every day at that census.",
  },
  {
    term: "Operating Margin",
    def: "Profit ÷ Revenue. Lenders, PE buyers, and investors look for 12–18% in a healthy branch. Below 10% is considered at-risk; above 20% is exceptional.",
  },
  {
    term: "Break-Even ADC",
    def: "The minimum census where monthly revenue exactly covers all fixed and variable costs. Every patient below this number costs you money. Every patient above it generates pure contribution margin.",
  },
  {
    term: "Target Margin ADC",
    def: "The census where you hit your operating margin goal. This is your real sales target — not break-even. Build your 12-month sales plan around closing the gap to this number.",
  },
  {
    term: "Cash Runway",
    def: "How many months your starting capital can absorb negative cash flow while census builds. Plan your sales hiring and ramp so you hit break-even ADC before runway runs out.",
  },
  {
    term: "Admissions Needed",
    def: "Monthly new patient admissions required to maintain your target ADC, accounting for average length of stay. This directly drives how many marketers you need and what their monthly production target should be.",
  },
];

export default function BranchProfitability() {
  const { capture, gateState } = useLeadGate("Branch Profitability Calculator");
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [showHowTo, setShowHowTo] = useState(false);

  function applyScenario(key: keyof typeof SCENARIOS) {
    const s = SCENARIOS[key];
    setInputs((prev) => ({ ...prev, scenario: key, ...s }));
  }

  function set(field: keyof typeof DEFAULT_INPUTS, value: number | string) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  const metrics = computeMetrics(inputs);
  const curve = simulateProfitCurve(inputs);
  const runway = computeCashRunway(inputs);

  const status =
    metrics.annualProfit < 0
      ? "below-breakeven"
      : metrics.margin < inputs.targetMargin
      ? "profitable-below-target"
      : "at-target";

  const StatusBadge = () => {
    if (status === "below-breakeven")
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive">
          <AlertCircle className="w-4 h-4" /> Below Break Even
        </span>
      );
    if (status === "profitable-below-target")
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
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <SEO
        title="Branch Profitability Simulator | Spartan Coaching"
        description="Model hospice branch profitability across any ADC. Enter your revenue rates, clinical costs, and staffing assumptions to find your break-even point and target margin ADC."
      />
      <style>{`
        @page {
          size: letter portrait;
          margin: 0.75in;
        }
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11pt; }
        }
      `}</style>

      <div className="no-print">
        <Breadcrumbs
          items={[
            { label: "AI Tools", href: "/tools" },
            { label: "Branch Profitability Simulator" },
          ]}
        />
      </div>

      <SlideUp>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-h1 font-black text-foreground mb-2" data-testid="text-branch-profit-title">
              Branch Profitability Simulator
            </h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl leading-relaxed">
              Model your hospice branch across any average daily census. Enter your revenue rates, clinical variable costs, and staffing to find your break-even point, required admissions, and target margin ADC.
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <Button
              variant="outline"
              size="default"
              onClick={() => setInputs(DEFAULT_INPUTS)}
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                const getEmailPdf = (): EmailPdfPayload => ({
                  title: "Branch Profitability Analysis",
                  filename: "spartan-branch-profitability",
                  subtitle: `Scenario: ${SCENARIOS[inputs.scenario].label} | ADC: ${inputs.adc}`,
                  sections: [
                    {
                      heading: "Key Inputs",
                      body: `Average Daily Census (ADC): ${inputs.adc}\nAverage Length of Stay: ${inputs.los} days\nMonthly Overhead: ${fmtK(inputs.overhead)}\nStarting Cash: ${fmtK(inputs.startCash)}\nTarget Margin: ${fmtPct(inputs.targetMargin)}`,
                    },
                    {
                      heading: "Financial Summary",
                      body: `Annual Revenue: ${fmtK(metrics.annualRevenue)}\nAnnual Payroll: ${fmtK(metrics.annualPayroll)}\nAnnual Profit: ${fmtK(metrics.annualProfit)}\nOperating Margin: ${fmtPct(metrics.margin)}`,
                    },
                    {
                      heading: "Key Thresholds",
                      body: `Break-Even ADC: ${metrics.breakevenAdc.toFixed(1)} patients\nTarget Margin ADC: ${metrics.targetMarginAdc.toFixed(1)} patients\nAdmissions Needed per Month: ${metrics.admissionsNeeded}\nMarketers Needed: ${metrics.marketersNeeded}`,
                    },
                    {
                      heading: "Cash Runway",
                      body: `Starting Capital: ${fmtK(inputs.startCash)}\nMonths to Positive Cash Flow: ${runway.monthToPositive > 0 ? runway.monthToPositive : "Already positive"}\nCash at Month 12: ${fmtK(runway.cashAtMonth12)}`,
                    },
                  ],
                });
                capture(async () => {
                  const payload = getEmailPdf();
                  await downloadPdf(payload.filename, payload.title, payload.sections, payload.subtitle);
                }, getEmailPdf);
              }}
              data-testid="button-print"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print
            </Button>
          </div>
        </div>
      </SlideUp>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── LEFT: INPUTS ── */}
        <div className="lg:col-span-1 space-y-5 no-print">
          {/* Scenario */}
          <Card className="spacing-card">
            <h2 className="text-base font-bold mb-3">Scenario Preset</h2>
            <div className="grid grid-cols-3 gap-2">
              {(["lean", "base", "highAcuity"] as const).map((k) => (
                <Button
                  key={k}
                  variant={inputs.scenario === k ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyScenario(k)}
                  className="font-semibold"
                  data-testid={`button-scenario-${k}`}
                >
                  {SCENARIOS[k].label}
                </Button>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground border-t border-border pt-3">
              <p><span className="font-semibold text-foreground">Lean</span> — Short LOS (70 days), referral mix weighted toward shorter-stay diagnoses like heart failure or COPD. More revenue captured in the higher Day 1–60 rate.</p>
              <p><span className="font-semibold text-foreground">Base</span> — 90-day blended LOS with equal Day 1–60 and Day 61+ rates. The most common starting model for a new branch with a mixed referral mix.</p>
              <p><span className="font-semibold text-foreground">High Acuity</span> — Same LOS as Base but with significantly higher pharmacy and supply costs, reflecting an oncology-heavy or complex symptom management patient mix.</p>
            </div>
          </Card>

          {/* ADC & LOS */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Census & Length of Stay</h2>
            <div>
              <Label htmlFor="adc" className="text-sm font-medium flex items-center">Target ADC (patients)<InfoTip text="Average Daily Census — the number of patients actively on service at any given time. This is the single most important driver of branch revenue and profit." /></Label>
              <Input
                id="adc"
                type="number"
                min={1}
                max={500}
                value={inputs.adc}
                onChange={(e) => set("adc", +e.target.value || 1)}
                className="mt-1"
                data-testid="input-adc"
              />
            </div>
            <div>
              <Label htmlFor="los" className="text-sm font-medium flex items-center">Avg Length of Stay (days)<InfoTip text="Average number of days a patient remains on service before death or discharge. Longer LOS shifts revenue toward the lower Day 61+ rate. Shorter LOS keeps more revenue in the higher Day 1–60 rate band." /></Label>
              <Input
                id="los"
                type="number"
                min={1}
                value={inputs.los}
                onChange={(e) => set("los", +e.target.value || 1)}
                className="mt-1"
                data-testid="input-los"
              />
            </div>
            <div>
              <Label htmlFor="targetMargin" className="text-sm font-medium flex items-center">Target Operating Margin (%)<InfoTip text="Your goal for operating profit as a percentage of revenue. A healthy hospice branch targets 12–18%. This drives the 'Target Margin ADC' shown in results — the census where you actually hit your goal." /></Label>
              <Input
                id="targetMargin"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={(inputs.targetMargin * 100).toFixed(1)}
                onChange={(e) => set("targetMargin", (+e.target.value || 0) / 100)}
                className="mt-1"
                data-testid="input-target-margin"
              />
            </div>
          </Card>

          {/* Revenue */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Revenue Rates</h2>
            <div>
              <Label htmlFor="rhc1" className="text-sm font-medium flex items-center">RHC Day 1–60 ($/day)<InfoTip text="Medicare's Routine Home Care reimbursement rate for the first 60 days of each benefit period. The 2025 national base rate is $224.62. Your actual rate may vary by CBSA wage index. This is your highest-revenue rate tier." /></Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                <Input
                  id="rhc1"
                  type="number"
                  step={0.01}
                  value={inputs.rhc1}
                  onChange={(e) => set("rhc1", +e.target.value || 0)}
                  className="pl-6"
                  data-testid="input-rhc1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rhc2" className="text-sm font-medium flex items-center">RHC Day 61+ ($/day)<InfoTip text="Medicare's reduced RHC rate for days 61 and beyond in a benefit period. Approximately 21% lower than the Day 1-60 rate. Patients with longer LOS spend more time at this rate, which is why LOS directly affects blended revenue." /></Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                <Input
                  id="rhc2"
                  type="number"
                  step={0.01}
                  value={inputs.rhc2}
                  onChange={(e) => set("rhc2", +e.target.value || 0)}
                  className="pl-6"
                  data-testid="input-rhc2"
                />
              </div>
            </div>
          </Card>

          {/* Variable Costs */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Variable Clinical Costs ($/day)</h2>
            {(
              [
                { key: "pharmacy", label: "Pharmacy", tip: "Average daily drug cost per patient. Your largest variable cost. Standard acuity: $20–25/day. Oncology or complex pain management: $40–60/day." },
                { key: "dme", label: "DME", tip: "Durable Medical Equipment — daily cost for hospital beds, wheelchairs, commodes, and oxygen. Usually $8–12/day for a standard patient mix." },
                { key: "supplies", label: "Supplies", tip: "Clinical supply cost per patient per day — dressings, catheters, incontinence products. Standard acuity: $8–12/day. Wound-heavy or oncology patients can push $20–30/day." },
                { key: "travel", label: "Travel", tip: "Average clinician mileage and drive-time cost per patient per day. Varies by geography and patient density. Rural branches often see $8–12/day." },
                { key: "other", label: "Other", tip: "Any direct variable cost not captured above — contracted therapy, interpreter services, or other per-patient expenses." },
              ] as const
            ).map(({ key, label, tip }) => (
              <div key={key}>
                <Label htmlFor={key} className="text-sm font-medium flex items-center">{label}<InfoTip text={tip} /></Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                  <Input
                    id={key}
                    type="number"
                    step={0.01}
                    min={0}
                    value={inputs[key]}
                    onChange={(e) => set(key, +e.target.value || 0)}
                    className="pl-6"
                    data-testid={`input-${key}`}
                  />
                </div>
              </div>
            ))}
          </Card>

          {/* Fixed Overhead */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Fixed Overhead</h2>
            <div>
              <Label htmlFor="overhead" className="text-sm font-medium flex items-center">Monthly Non-Payroll Overhead ($)<InfoTip text="Fixed non-payroll costs: office rent, EMR subscription, liability insurance, phone systems, and G&A. This cost does not scale with census. It is the same whether you have 10 or 100 patients, which is why it is the key driver of your break-even ADC." /></Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                <Input
                  id="overhead"
                  type="number"
                  step={100}
                  min={0}
                  value={inputs.overhead}
                  onChange={(e) => set("overhead", +e.target.value || 0)}
                  className="pl-6"
                  data-testid="input-overhead"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="startCash" className="text-sm font-medium flex items-center">Starting Capital ($)<InfoTip text="Total cash available at launch to absorb early losses while census ramps up. The Cash Runway section shows how many months this covers before you hit break-even. Typical new branch capital ranges from $200K to $500K." /></Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">$</span>
                <Input
                  id="startCash"
                  type="number"
                  step={5000}
                  min={0}
                  value={inputs.startCash}
                  onChange={(e) => set("startCash", +e.target.value || 0)}
                  className="pl-6"
                  data-testid="input-start-cash"
                />
              </div>
            </div>
          </Card>

          {/* Sales */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Sales Assumptions</h2>
            <div>
              <Label htmlFor="admissionsPerMarketer" className="text-sm font-medium flex items-center">Admissions per Marketer / Month<InfoTip text="New patient admissions each salesperson generates per month. Industry average is 6–10. A coached team with structured referral development and consistent call cycles should consistently exceed 10. This drives your marketer headcount in staffing." /></Label>
              <Input
                id="admissionsPerMarketer"
                type="number"
                min={1}
                value={inputs.admissionsPerMarketer}
                onChange={(e) => set("admissionsPerMarketer", +e.target.value || 1)}
                className="mt-1"
                data-testid="input-admissions-per-marketer"
              />
            </div>
          </Card>
        </div>

        {/* ── RIGHT: RESULTS ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* How to Read Your Results */}
          <Card className="border-primary/20 bg-primary/5">
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              onClick={() => setShowHowTo((v) => !v)}
              data-testid="button-how-to-toggle"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">How to Read Your Results</span>
              </div>
              {showHowTo ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
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

          {/* Key Metrics Row */}
          <div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  icon: <DollarSign className="w-5 h-5 text-primary" />,
                  label: "Annual Profit",
                  value: fmtK(metrics.annualProfit),
                  sub: "at current ADC",
                  testId: "text-annual-profit",
                },
                {
                  icon: <TrendingUp className="w-5 h-5 text-primary" />,
                  label: "Operating Margin",
                  value: fmtPct(metrics.margin),
                  sub: `target: ${fmtPct(inputs.targetMargin)}`,
                  testId: "text-margin",
                },
                {
                  icon: <Target className="w-5 h-5 text-primary" />,
                  label: "Break-Even ADC",
                  value: metrics.breakevenAdc.toFixed(1),
                  sub: "patients",
                  testId: "text-breakeven-adc",
                },
                {
                  icon: <Users className="w-5 h-5 text-primary" />,
                  label: "Marketers Needed",
                  value: metrics.marketersNeeded.toString(),
                  sub: `${metrics.admissionsNeeded} admits/mo`,
                  testId: "text-marketers-needed",
                },
              ].map(({ icon, label, value, sub, testId }) => (
                <Card key={label}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {icon}
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
                    </div>
                    <div className="text-2xl font-black text-foreground" data-testid={testId}>{value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Status & Summary */}
          <div>
            <Card className="spacing-card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold">Summary at ADC {inputs.adc}</h2>
                  <div className="mt-1"><StatusBadge /></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Target Margin ADC</div>
                  <div className="text-xl font-black text-foreground" data-testid="text-target-adc">
                    {metrics.targetMarginAdc > 0 ? metrics.targetMarginAdc.toFixed(1) : "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue</div>
                  <div className="flex justify-between"><span>Blended $/Day</span><span className="font-semibold">{fmt$(metrics.blendedRevDay)}</span></div>
                  <div className="flex justify-between"><span>Annual Revenue</span><span className="font-semibold">{fmtK(metrics.annualRevenue)}</span></div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Costs</div>
                  <div className="flex justify-between"><span>Var Cost/Day</span><span className="font-semibold">{fmt$(metrics.varCostDay)}</span></div>
                  <div className="flex justify-between"><span>Annual Payroll</span><span className="font-semibold">{fmtK(metrics.annualPayroll)}</span></div>
                  <div className="flex justify-between"><span>Annual Overhead</span><span className="font-semibold">{fmtK(metrics.annualOverhead)}</span></div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Margin Drivers</div>
                  <div className="flex justify-between"><span>Contrib/Day</span><span className="font-semibold">{fmt$(metrics.contribDay)}</span></div>
                  <div className="flex justify-between"><span>Break Even ADC</span><span className="font-semibold">{metrics.breakevenAdc.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Target ADC</span><span className="font-semibold">{metrics.targetMarginAdc > 0 ? metrics.targetMarginAdc.toFixed(1) : "N/A"}</span></div>
                </div>
              </div>
            </Card>
          </div>

          {/* Cash Runway */}
          <div>
            <Card className="spacing-card">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold">Cash Runway — 18-Month Ramp</h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-5">
                {[
                  {
                    label: "Months of Runway",
                    value: runway.monthsOfRunway === 18 ? "18+" : runway.monthsOfRunway.toString(),
                    sub: "before cash runs out",
                    danger: runway.monthsOfRunway < 6,
                    testId: "text-months-runway",
                  },
                  {
                    label: "Month Goes Cash-Flow +",
                    value: runway.monthToPositive === -1 ? "18+" : `Month ${runway.monthToPositive}`,
                    sub: "first month P&L > 0",
                    danger: runway.monthToPositive === -1,
                    testId: "text-month-positive",
                  },
                  {
                    label: "Cash at Month 12",
                    value: fmtK(runway.cashAtMonth12),
                    sub: "projected remaining",
                    danger: runway.cashAtMonth12 < 0,
                    testId: "text-cash-month-12",
                  },
                ].map(({ label, value, sub, danger, testId }) => (
                  <div key={label} className="bg-muted/40 rounded-md px-4 py-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
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

              <div className="h-48 w-full mb-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={runway.rows}
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
                    <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "$0", fontSize: 10, fill: "hsl(var(--destructive))" }} />
                    {runway.monthToPositive > 0 && (
                      <ReferenceLine
                        x={runway.monthToPositive}
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

              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-xs min-w-[480px]" data-testid="table-runway">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-2 font-semibold text-muted-foreground">Mo</th>
                      <th className="text-right pb-2 font-semibold text-muted-foreground">ADC</th>
                      <th className="text-right pb-2 font-semibold text-muted-foreground">Revenue</th>
                      <th className="text-right pb-2 font-semibold text-muted-foreground">Costs</th>
                      <th className="text-right pb-2 font-semibold text-muted-foreground">Monthly P&L</th>
                      <th className="text-right pb-2 font-semibold text-muted-foreground">Cum. Cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runway.rows.map((r) => {
                      const neg = r.cumulativeCash < 0;
                      const pnlNeg = r.monthlyPnl < 0;
                      return (
                        <tr
                          key={r.month}
                          className={r.month % 2 === 0 ? "bg-muted/30" : ""}
                          data-testid={`row-runway-${r.month}`}
                        >
                          <td className="py-1 pr-2 font-medium">{r.month}</td>
                          <td className="py-1 text-right">{r.projectedAdc}</td>
                          <td className="py-1 text-right">{fmtKAbbrev(r.monthlyRevenue)}</td>
                          <td className="py-1 text-right">{fmtKAbbrev(r.monthlyCost)}</td>
                          <td className={`py-1 text-right font-semibold ${pnlNeg ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                            {fmtKAbbrev(r.monthlyPnl)}
                          </td>
                          <td className={`py-1 text-right font-bold ${neg ? "text-destructive" : "text-foreground"}`}>
                            {fmtKAbbrev(r.cumulativeCash)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Profit Curve Chart */}
          <div>
            <Card className="spacing-card">
              <h2 className="text-base font-bold mb-4">Profit Curve — ADC 10 to 200</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curve} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
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
                        name === "Annual Profit" ? [fmtK(v), name] : [v.toFixed(1) + "%", name]
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
                    <ReferenceLine x={Math.round(metrics.breakevenAdc)} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "B/E", fontSize: 10, fill: "hsl(var(--destructive))" }} />
                    <ReferenceLine x={inputs.adc} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "You", fontSize: 10, fill: "hsl(var(--primary))" }} />
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
          </div>

          {/* Margin Curve */}
          <div>
            <Card className="spacing-card">
              <h2 className="text-base font-bold mb-4">Operating Margin by ADC</h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curve} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="adc"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: "ADC", position: "insideBottomRight", offset: -4, fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={(v) => v + "%"}
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
                    <ReferenceLine y={inputs.targetMargin * 100} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Target", fontSize: 10, fill: "hsl(var(--primary))" }} />
                    <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="margin" name="Margin %" stroke="#22c55e" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Staffing Table */}
          <div>
            <Card className="spacing-card">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold">Required Staffing at ADC {inputs.adc}</h2>
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
                    {metrics.staffing.map((r, i) => (
                      <tr key={r.role} className={i % 2 === 0 ? "bg-muted/30" : ""} data-testid={`row-staff-${i}`}>
                        <td className="py-1.5 pr-3">{r.role}</td>
                        <td className="py-1.5 text-right font-semibold">{r.autoFte}</td>
                        <td className="py-1.5 text-right text-muted-foreground">{fmt$(r.salary)}</td>
                        <td className="py-1.5 text-right font-semibold">{fmt$(r.annualCost)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-border font-bold">
                      <td className="py-2">Total Payroll</td>
                      <td />
                      <td />
                      <td className="py-2 text-right" data-testid="text-total-payroll">{fmtK(metrics.annualPayroll)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Conversion CTA */}
          <CoachingCTA className="no-print" />
        </div>
      </div>
      <LeadGateDialog gateState={gateState} />
    </div>
  );
}
