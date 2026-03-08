import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { FadeIn, SlideUp } from "@/components/animations";
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
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  if (Math.abs(v) >= 1_000_000) return "$" + (v / 1_000_000).toFixed(2) + "M";
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

export default function BranchProfitability() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);

  function applyScenario(key: keyof typeof SCENARIOS) {
    const s = SCENARIOS[key];
    setInputs((prev) => ({ ...prev, scenario: key, ...s }));
  }

  function set(field: keyof typeof DEFAULT_INPUTS, value: number | string) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  const metrics = useMemo(() => computeMetrics(inputs), [inputs]);
  const curve = useMemo(() => simulateProfitCurve(inputs), [inputs]);

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
              onClick={() => window.print()}
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
          </Card>

          {/* ADC & LOS */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Census & Length of Stay</h2>
            <div>
              <Label htmlFor="adc" className="text-sm font-medium">Target ADC (patients)</Label>
              <Input
                id="adc"
                type="number"
                min={1}
                max={500}
                value={inputs.adc}
                onChange={(e) => set("adc", +e.target.value)}
                className="mt-1"
                data-testid="input-adc"
              />
            </div>
            <div>
              <Label htmlFor="los" className="text-sm font-medium">Avg Length of Stay (days)</Label>
              <Input
                id="los"
                type="number"
                min={1}
                value={inputs.los}
                onChange={(e) => set("los", +e.target.value)}
                className="mt-1"
                data-testid="input-los"
              />
            </div>
            <div>
              <Label htmlFor="targetMargin" className="text-sm font-medium">Target Operating Margin (%)</Label>
              <Input
                id="targetMargin"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={(inputs.targetMargin * 100).toFixed(1)}
                onChange={(e) => set("targetMargin", +e.target.value / 100)}
                className="mt-1"
                data-testid="input-target-margin"
              />
            </div>
          </Card>

          {/* Revenue */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Revenue Rates</h2>
            <div>
              <Label htmlFor="rhc1" className="text-sm font-medium">RHC Day 1–60 ($/day)</Label>
              <Input
                id="rhc1"
                type="number"
                step={0.01}
                value={inputs.rhc1}
                onChange={(e) => set("rhc1", +e.target.value)}
                className="mt-1"
                data-testid="input-rhc1"
              />
            </div>
            <div>
              <Label htmlFor="rhc2" className="text-sm font-medium">RHC Day 61+ ($/day)</Label>
              <Input
                id="rhc2"
                type="number"
                step={0.01}
                value={inputs.rhc2}
                onChange={(e) => set("rhc2", +e.target.value)}
                className="mt-1"
                data-testid="input-rhc2"
              />
            </div>
          </Card>

          {/* Variable Costs */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Variable Clinical Costs ($/day)</h2>
            {(
              [
                { key: "pharmacy", label: "Pharmacy" },
                { key: "dme", label: "DME" },
                { key: "supplies", label: "Supplies" },
                { key: "travel", label: "Travel" },
                { key: "other", label: "Other" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key}>
                <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
                <Input
                  id={key}
                  type="number"
                  step={0.01}
                  min={0}
                  value={inputs[key]}
                  onChange={(e) => set(key, +e.target.value)}
                  className="mt-1"
                  data-testid={`input-${key}`}
                />
              </div>
            ))}
          </Card>

          {/* Fixed Overhead */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Fixed Overhead</h2>
            <div>
              <Label htmlFor="overhead" className="text-sm font-medium">Monthly Non-Payroll Overhead ($)</Label>
              <p className="text-xs text-muted-foreground mb-1">Office, EMR, insurance, rent, phones</p>
              <Input
                id="overhead"
                type="number"
                step={100}
                min={0}
                value={inputs.overhead}
                onChange={(e) => set("overhead", +e.target.value)}
                className="mt-1"
                data-testid="input-overhead"
              />
            </div>
          </Card>

          {/* Sales */}
          <Card className="spacing-card space-y-4">
            <h2 className="text-base font-bold">Sales Assumptions</h2>
            <div>
              <Label htmlFor="admissionsPerMarketer" className="text-sm font-medium">Admissions per Marketer / Month</Label>
              <Input
                id="admissionsPerMarketer"
                type="number"
                min={1}
                value={inputs.admissionsPerMarketer}
                onChange={(e) => set("admissionsPerMarketer", +e.target.value)}
                className="mt-1"
                data-testid="input-admissions-per-marketer"
              />
            </div>
          </Card>
        </div>

        {/* ── RIGHT: RESULTS ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Key Metrics Row */}
          <FadeIn>
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
          </FadeIn>

          {/* Status & Summary */}
          <FadeIn delay={0.05}>
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
          </FadeIn>

          {/* Profit Curve Chart */}
          <FadeIn delay={0.1}>
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
                      tickFormatter={(v) => fmtK(v)}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      width={62}
                    />
                    <Tooltip
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
          </FadeIn>

          {/* Margin Curve */}
          <FadeIn delay={0.15}>
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
                    <Tooltip
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
          </FadeIn>

          {/* Staffing Table */}
          <FadeIn delay={0.2}>
            <Card className="spacing-card">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold">Required Staffing at ADC {inputs.adc}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-staffing">
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
          </FadeIn>

          {/* Conversion CTA */}
          <FadeIn delay={0.25}>
            <Card className="bg-primary/5 border-primary/20 no-print">
              <CardContent className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Building className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Need help closing the gap to break-even?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        The fastest path to target margin is census growth through disciplined sales execution — exactly what Spartan Coaching is built for.
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="font-bold flex-shrink-0" data-testid="button-branch-cta">
                    <Link href="/contact">Book a Discovery Call</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
