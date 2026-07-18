import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { FadeIn, SlideUp } from "@/components/animations";
import { LeadGateDialog } from "@/components/LeadGateDialog";
import { useLeadGate } from "@/hooks/use-lead-gate";
import type { EmailPdfPayload } from "@/lib/downloadPdf";
import {
  Activity,
  Calculator,
  Car,
  ChevronRight,
  DollarSign,
  Home,
  Plus,
  Printer,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  Users,
} from "lucide-react";

type CalculatorInputs = {
  baseSalary: number;
  benefitsLoad: number;
  annualMileage: number;
  otherFixedCosts: number;
  callsPerDay: number;
  workingDaysPerMonth: number;
  callsPerReferral: number;
  conversionRate: number;
};

type CommissionTier = {
  id: number;
  min: number;
  max: number;
  rate: number;
};

const mileageRate = 0.67;

const initialInputs: CalculatorInputs = {
  baseSalary: 90000,
  benefitsLoad: 42,
  annualMileage: 5400,
  otherFixedCosts: 15484,
  callsPerDay: 12,
  workingDaysPerMonth: 20,
  callsPerReferral: 8,
  conversionRate: 70,
};

const initialTiers: CommissionTier[] = [
  { id: 1, min: 1, max: 10, rate: 100 },
  { id: 2, min: 11, max: 20, rate: 125 },
  { id: 3, min: 21, max: 999, rate: 150 },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const whole = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0,
  );

const decimal = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    Number.isFinite(value) ? value : 0,
  );

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  help,
  displayValue,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  help?: string;
  displayValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
        <Input
          type="number"
          min="0"
          value={displayValue ?? value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          className={`${prefix ? "pl-7" : ""} ${suffix ? "pr-12" : ""}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">{suffix}</span>}
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  emphasis = false,
}: {
  label: string;
  value: string;
  description: string;
  emphasis?: boolean;
}) {
  return (
    <Card className={emphasis ? "border-primary/50 bg-primary/5" : ""}>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
        <p className={`mt-2 text-3xl font-black ${emphasis ? "text-primary" : "text-foreground"}`}>{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function RepCostCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>(initialInputs);
  const [tiers, setTiers] = useState<CommissionTier[]>(initialTiers);
  const { capture, gateState } = useLeadGate("Hospice Rep Cost Calculator");

  const result = useMemo(() => {
    const annualCalls = inputs.callsPerDay * inputs.workingDaysPerMonth * 12;
    const monthlyCalls = inputs.callsPerDay * inputs.workingDaysPerMonth;
    const monthlyReferrals = inputs.callsPerReferral > 0 ? monthlyCalls / inputs.callsPerReferral : 0;
    const annualReferrals = monthlyReferrals * 12;
    const monthlyAdmissions = monthlyReferrals * (inputs.conversionRate / 100);
    const annualAdmissions = monthlyAdmissions * 12;
    const monthlyLostAdmissions = Math.max(0, monthlyReferrals - monthlyAdmissions);
    const annualLostAdmissions = monthlyLostAdmissions * 12;
    const benefitsAndFixed =
      inputs.baseSalary * (inputs.benefitsLoad / 100) +
      inputs.annualMileage * mileageRate +
      inputs.otherFixedCosts;
    const fixedCost = inputs.baseSalary + benefitsAndFixed;
    const activeTier =
      tiers.find((tier) => monthlyAdmissions >= tier.min && monthlyAdmissions <= tier.max) ?? tiers[0];
    const monthlyCommission = monthlyAdmissions * activeTier.rate;
    const annualCommission = monthlyCommission * 12;
    const totalRepCost = fixedCost + annualCommission;
    const costPerCall = annualCalls > 0 ? fixedCost / annualCalls : 0;
    const costPerReferral = annualReferrals > 0 ? fixedCost / annualReferrals : 0;
    const costPerAdmit = annualAdmissions > 0 ? fixedCost / annualAdmissions : 0;
    const blendedCostPerAdmit = annualAdmissions > 0 ? totalRepCost / annualAdmissions : 0;
    const monthlyConversionLoss = monthlyLostAdmissions * costPerReferral;
    const annualConversionLoss = annualLostAdmissions * costPerReferral;

    return {
      annualCalls,
      monthlyCalls,
      monthlyReferrals,
      annualReferrals,
      monthlyAdmissions,
      annualAdmissions,
      monthlyLostAdmissions,
      annualLostAdmissions,
      benefitsAndFixed,
      fixedCost,
      activeTier,
      monthlyCommission,
      annualCommission,
      totalRepCost,
      costPerCall,
      costPerReferral,
      costPerAdmit,
      blendedCostPerAdmit,
      monthlyConversionLoss,
      annualConversionLoss,
    };
  }, [inputs, tiers]);

  const updateInput = (key: keyof CalculatorInputs, value: number) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const updateTier = (id: number, key: keyof Omit<CommissionTier, "id">, value: number) => {
    setTiers((current) => current.map((tier) => (tier.id === id ? { ...tier, [key]: value } : tier)));
  };

  const addTier = () => {
    setTiers((current) => {
      const last = current[current.length - 1];
      if (!last) return [{ id: Date.now(), min: 1, max: 999, rate: 0 }];
      if (last.max === 999) {
        const nextMin = last.min + 10;
        return [
          ...current.slice(0, -1),
          { ...last, max: nextMin - 1 },
          { id: Date.now(), min: nextMin, max: 999, rate: last.rate },
        ];
      }
      return [...current, { id: Date.now(), min: last.max + 1, max: 999, rate: last.rate }];
    });
  };

  const buildEmailPayload = (): EmailPdfPayload => ({
    title: "Hospice Rep Cost Calculator Report",
    filename: "spartan-hospice-rep-cost-calculator",
    subtitle: "Sales intelligence and rep cost economics",
    sections: [
      {
        heading: "Unit Economics",
        body: `Total annual rep cost: ${money(result.totalRepCost)}\nCost per sales call: ${money(result.costPerCall)}\nCost per referral: ${money(result.costPerReferral)}\nCost per admitted patient: ${money(result.costPerAdmit)}`,
      },
      {
        heading: "Activity and Conversion",
        body: `Monthly sales calls: ${whole(result.monthlyCalls)}\nMonthly referrals: ${decimal(result.monthlyReferrals)}\nMonthly admissions: ${decimal(result.monthlyAdmissions)}\nLost admissions per month: ${decimal(result.monthlyLostAdmissions)}\nAnnual conversion loss: ${money(result.annualConversionLoss)}`,
      },
      {
        heading: "Cost Mix",
        body: `Base salary: ${money(inputs.baseSalary)}\nBenefits, mileage, and fixed costs: ${money(result.benefitsAndFixed)}\nAnnual commission: ${money(result.annualCommission)}\nActive commission rate: ${money(result.activeTier.rate)} per admitted patient`,
      },
    ],
  });

  return (
    <div className="w-full" data-testid="section-rep-cost-calculator">
      <SEO
        title="Hospice Rep Cost Calculator | Spartan Coaching"
        description="Model fully loaded hospice sales rep cost per call, referral, admission, commission tier, and conversion loss."
        keywords="hospice sales cost calculator, cost per referral, cost per admission, hospice rep commission"
      />

      <section className="screen-only max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap" aria-label="Breadcrumb navigation">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors"><Home className="w-4 h-4" /> Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/tools" className="hover:text-foreground transition-colors">Tools</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Rep Cost Calculator</span>
        </nav>

        <SlideUp>
          <div className="max-w-4xl mb-10 sm:mb-14">
            <div className="flex items-center gap-4 mb-5">
              <img src="/hospice-sales-moneyball-logo.png" alt="Hospice Sales Moneyball" className="w-16 h-16 object-contain" />
              <div>
                <p className="text-sm font-bold tracking-widest uppercase text-primary">Hospice Sales Intelligence</p>
                <h1 className="text-h1 font-black text-foreground">Rep Cost Calculator</h1>
              </div>
            </div>
            <p className="text-body-lg text-muted-foreground leading-relaxed max-w-3xl">
              Model the fully loaded cost of sales activity, referrals, admissions, commissions, and conversion leakage for an individual hospice sales rep.
            </p>
          </div>
        </SlideUp>

        <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-8">
          <aside className="xl:sticky xl:top-24 h-fit space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Compensation</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <InputField label="Base Salary" value={inputs.baseSalary} onChange={(value) => updateInput("baseSalary", value)} prefix="$" />
                <InputField label="Benefits Load" value={inputs.benefitsLoad} onChange={(value) => updateInput("benefitsLoad", value)} suffix="%" />
                <InputField label="Annual Mileage" value={inputs.annualMileage} onChange={(value) => updateInput("annualMileage", value)} suffix="miles" />
                <InputField label="Other Fixed Costs" value={inputs.otherFixedCosts} onChange={(value) => updateInput("otherFixedCosts", value)} prefix="$" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Sales Activity</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <InputField label="Calls Per Day" value={inputs.callsPerDay} onChange={(value) => updateInput("callsPerDay", value)} />
                <InputField label="Working Days Per Month" value={inputs.workingDaysPerMonth} onChange={(value) => updateInput("workingDaysPerMonth", value)} />
                <InputField label="Calls Per Referral" value={inputs.callsPerReferral} onChange={(value) => updateInput("callsPerReferral", value)} />
                <InputField label="Referral to Admit" value={inputs.conversionRate} onChange={(value) => updateInput("conversionRate", value)} suffix="%" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Commission Tiers</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {tiers.map((tier) => {
                  const active = tier.id === result.activeTier.id;
                  return (
                    <div key={tier.id} className={`rounded-xl border p-3 ${active ? "border-primary bg-primary/5" : "border-border"}`}>
                      {active && <p className="mb-2 text-[10px] uppercase tracking-wider font-bold text-primary">Active tier</p>}
                      <div className="grid grid-cols-[1fr_12px_1fr_auto] gap-2 items-end">
                        <InputField label="From" value={tier.min} onChange={(value) => updateTier(tier.id, "min", value)} />
                        <span className="pb-2 text-center text-muted-foreground">-</span>
                        <InputField label="To" value={tier.max} displayValue={tier.max === 999 ? "" : String(tier.max)} onChange={(value) => updateTier(tier.id, "max", value || 999)} help={tier.max === 999 ? "No maximum" : undefined} />
                        <span className="pb-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Admits</span>
                      </div>
                      <div className="mt-3 flex items-end gap-2">
                        <div className="flex-1"><InputField label="Rate Per Admit" value={tier.rate} onChange={(value) => updateTier(tier.id, "rate", value)} prefix="$" /></div>
                        {tiers.length > 1 && <Button variant="ghost" size="icon" onClick={() => setTiers((current) => current.filter((item) => item.id !== tier.id))} aria-label="Remove commission tier"><Trash2 className="w-4 h-4" /></Button>}
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" className="w-full" onClick={addTier}><Plus className="w-4 h-4 mr-2" /> Add Commission Tier</Button>
              </CardContent>
            </Card>
          </aside>

          <main className="space-y-6">
            <FadeIn>
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
                <MetricCard label="Cost Per Sales Call" value={money(result.costPerCall)} description="salary and fixed costs" />
                <MetricCard label="Cost Per Referral" value={money(result.costPerReferral)} description="salary and fixed costs" />
                <MetricCard label="Cost Per Admitted Patient" value={money(result.costPerAdmit)} description="salary and fixed costs" emphasis />
                <MetricCard label="Annual Conversion Loss" value={money(result.annualConversionLoss)} description={`${decimal(result.annualLostAdmissions)} missed admits per year`} emphasis />
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                  <div><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Rep Cost Snapshot</CardTitle><p className="mt-1 text-sm text-muted-foreground">Annualized economics with the active commission tier.</p></div>
                  <Button onClick={() => capture(() => window.print(), buildEmailPayload)} data-testid="button-print-rep-cost"><Printer className="w-4 h-4 mr-2" /> Print Report</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="rounded-xl bg-muted/40 p-5"><p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Total Annual Rep Cost</p><p className="mt-2 text-4xl font-black text-foreground">{money(result.totalRepCost)}</p><p className="mt-2 text-sm text-muted-foreground">Salary, benefits, mileage, fixed costs, and commission.</p></div>
                    <div className="rounded-xl border border-border p-5"><p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Annual Commission</p><p className="mt-2 text-4xl font-black text-primary">{money(result.annualCommission)}</p><p className="mt-2 text-sm text-muted-foreground">{money(result.activeTier.rate)} per admitted patient in the active tier.</p></div>
                    <div className="rounded-xl border border-primary/25 bg-primary/5 p-5"><p className="text-xs uppercase tracking-wider font-bold text-primary">Blended Cost Per Admit</p><p className="mt-2 text-4xl font-black text-primary">{money(result.blendedCostPerAdmit)}</p><p className="mt-2 text-sm text-muted-foreground">including the active commission tier.</p></div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FadeIn delay={0.2}><Card className="h-full"><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Cost Composition</CardTitle></CardHeader><CardContent className="space-y-4">
                <CostRow label="Base Salary" value={inputs.baseSalary} total={result.totalRepCost} />
                <CostRow label="Benefits, Mileage & Fixed Costs" value={result.benefitsAndFixed} total={result.totalRepCost} />
                <CostRow label="Annual Commission" value={result.annualCommission} total={result.totalRepCost} primary />
              </CardContent></Card></FadeIn>
              <FadeIn delay={0.25}><Card className="h-full"><CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="w-5 h-5 text-primary" /> Activity and Conversion</CardTitle></CardHeader><CardContent className="space-y-0 divide-y divide-border">
                <SummaryRow label="Sales Calls" monthly={whole(result.monthlyCalls)} annual={whole(result.annualCalls)} />
                <SummaryRow label="Referrals Generated" monthly={decimal(result.monthlyReferrals)} annual={decimal(result.annualReferrals)} />
                <SummaryRow label="Admissions" monthly={decimal(result.monthlyAdmissions)} annual={decimal(result.annualAdmissions)} />
                <SummaryRow label="Lost Admissions" monthly={decimal(result.monthlyLostAdmissions)} annual={decimal(result.annualLostAdmissions)} danger />
                <SummaryRow label="Lost Conversion Cost" monthly={money(result.monthlyConversionLoss)} annual={money(result.annualConversionLoss)} danger />
              </CardContent></Card></FadeIn>
            </div>

            <FadeIn delay={0.3}><Card><CardHeader><CardTitle className="flex items-center gap-2"><Car className="w-5 h-5 text-primary" /> Model Assumptions</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg bg-muted/40 p-4"><p className="text-muted-foreground">Mileage rate</p><p className="mt-1 font-bold">{money(mileageRate)} per mile</p></div>
              <div className="rounded-lg bg-muted/40 p-4"><p className="text-muted-foreground">Active commission tier</p><p className="mt-1 font-bold">{whole(result.activeTier.min)} - {result.activeTier.max === 999 ? "Unlimited" : whole(result.activeTier.max)} admits</p></div>
              <div className="rounded-lg bg-muted/40 p-4"><p className="text-muted-foreground">Referral-to-admit rate</p><p className="mt-1 font-bold">{decimal(inputs.conversionRate)}%</p></div>
            </CardContent></Card></FadeIn>
          </main>
        </div>
      </section>

      <section className="print-report" aria-label="Printable Hospice Rep Cost Calculator report">
        <div className="print-header"><img src="/hospice-sales-moneyball-logo.png" alt="Hospice Sales Moneyball" /><div><p>Spartan Coaching | Hospice Sales Intelligence</p><h1>Hospice Rep Cost Calculator Report</h1></div><span>Generated {new Date().toLocaleDateString()}</span></div>
        <div className="print-metrics"><PrintMetric label="Total Rep Cost" value={money(result.totalRepCost)} /><PrintMetric label="Cost Per Call" value={money(result.costPerCall)} /><PrintMetric label="Cost Per Referral" value={money(result.costPerReferral)} /><PrintMetric label="Cost Per Admit" value={money(result.costPerAdmit)} /><PrintMetric label="Annual Conversion Loss" value={money(result.annualConversionLoss)} critical /></div>
        <div className="print-grid">
          <PrintPanel title="Annual Cost Stack"><PrintTable rows={[["Base Salary", money(inputs.baseSalary)], ["Benefits, Mileage & Fixed", money(result.benefitsAndFixed)], ["Annual Commission", money(result.annualCommission)], ["Total Annual Cost", money(result.totalRepCost)]]} /></PrintPanel>
          <PrintPanel title="Activity & Conversion"><PrintTable rows={[["Sales Calls", `${whole(result.monthlyCalls)} / mo`, whole(result.annualCalls)], ["Referrals", `${decimal(result.monthlyReferrals)} / mo`, decimal(result.annualReferrals)], ["Admissions", `${decimal(result.monthlyAdmissions)} / mo`, decimal(result.annualAdmissions)], ["Lost Admissions", `${decimal(result.monthlyLostAdmissions)} / mo`, decimal(result.annualLostAdmissions)], ["Conversion Loss", money(result.monthlyConversionLoss), money(result.annualConversionLoss)]]} columns={["Metric", "Monthly", "Annual"]} /></PrintPanel>
          <PrintPanel title="Commission Tiers"><PrintTable rows={tiers.map((tier) => [`${tier.id === result.activeTier.id ? "Active " : ""}Tier`, `${whole(tier.min)} - ${tier.max === 999 ? "Unlimited" : whole(tier.max)} admits`, `${money(tier.rate)} / admit`])} columns={["Tier", "Range", "Rate"]} /></PrintPanel>
          <PrintPanel title="Rep Model Assumptions"><PrintTable rows={[["Calls per day", whole(inputs.callsPerDay)], ["Working days per month", whole(inputs.workingDaysPerMonth)], ["Calls per referral", decimal(inputs.callsPerReferral)], ["Referral to admit", `${decimal(inputs.conversionRate)}%`], ["Mileage rate", `${money(mileageRate)} / mile`]]} /></PrintPanel>
        </div>
        <div className="print-footer"><span>Spartan Coaching</span><span>Confidential Sales Intelligence Report</span><span>Page 1 of 1</span></div>
      </section>

      <style>{`
        .print-report { display: none; }
        @media print {
          @page { size: letter landscape; margin: .28in; }
          body { background: #fff !important; color: #172033 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .screen-only, header, footer, [role="dialog"], [data-radix-popper-content-wrapper] { display: none !important; }
          .print-report { display: block !important; font-family: Arial, Helvetica, sans-serif; }
          .print-header { display: grid; grid-template-columns: .62in 1fr 1.25in; gap: .14in; align-items: center; padding-bottom: .07in; border-bottom: 2pt solid #c91d31; }
          .print-header img { width: .55in; height: .55in; object-fit: contain; }
          .print-header p { margin: 0; color: #667085; font-size: 7pt; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
          .print-header h1 { margin: .03in 0 0; color: #172033; font-family: Georgia, serif; font-size: 17pt; }
          .print-header > span { color: #667085; font-size: 7pt; text-align: right; }
          .print-metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: .06in; margin: .08in 0; }
          .print-metric { min-height: .55in; padding: .06in; border: 1pt solid #d7dce5; border-radius: 4pt; background: #f6f8fb; }
          .print-metric.critical { border-color: #c91d31; background: #fff4f5; }
          .print-metric label { display: block; color: #667085; font-size: 6.2pt; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
          .print-metric strong { display: block; margin-top: .03in; color: #172033; font-size: 12pt; }
          .print-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .07in; }
          .print-panel { border: 1pt solid #d7dce5; border-radius: 4pt; overflow: hidden; break-inside: avoid; }
          .print-panel h2 { margin: 0; padding: .055in .07in; background: #172033; color: #fff; font-size: 7pt; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
          .print-table { width: 100%; border-collapse: collapse; font-size: 7pt; }
          .print-table th, .print-table td { padding: .045in .07in; border-bottom: 1pt solid #e5e9ef; text-align: right; }
          .print-table th { background: #f0f3f7; color: #667085; font-size: 6pt; letter-spacing: .06em; text-transform: uppercase; }
          .print-table th:first-child, .print-table td:first-child { text-align: left; }
          .print-table tr:last-child td { border-bottom: 0; }
          .print-footer { display: flex; justify-content: space-between; margin-top: .08in; padding-top: .05in; border-top: 1pt solid #c91d31; color: #667085; font-size: 6.5pt; }
        }
      `}</style>
      <LeadGateDialog gateState={gateState} />
    </div>
  );
}

function CostRow({ label, value, total, primary = false }: { label: string; value: number; total: number; primary?: boolean }) {
  const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return <div><div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><span className={primary ? "font-bold text-primary" : "font-bold text-foreground"}>{money(value)}</span></div><div className="mt-2 h-2 rounded-full bg-muted overflow-hidden"><div className={primary ? "h-full bg-primary" : "h-full bg-foreground/70"} style={{ width: `${percentage}%` }} /></div></div>;
}

function SummaryRow({ label, monthly, annual, danger = false }: { label: string; monthly: string; annual: string; danger?: boolean }) {
  return <div className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 text-sm"><span className={danger ? "font-semibold text-primary" : "text-muted-foreground"}>{label}</span><span className={danger ? "font-bold text-primary" : "font-semibold text-foreground"}>{monthly}<span className="ml-1 text-xs text-muted-foreground">monthly</span></span><span className={danger ? "font-bold text-primary" : "font-semibold text-foreground"}>{annual}<span className="ml-1 text-xs text-muted-foreground">annual</span></span></div>;
}

function PrintMetric({ label, value, critical = false }: { label: string; value: string; critical?: boolean }) {
  return <div className={`print-metric${critical ? " critical" : ""}`}><label>{label}</label><strong>{value}</strong></div>;
}

function PrintPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="print-panel"><h2>{title}</h2>{children}</section>;
}

function PrintTable({ rows, columns }: { rows: string[][]; columns?: string[] }) {
  return <table className="print-table">{columns && <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>}<tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table>;
}
