import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { FadeIn, SlideUp } from "@/components/animations";
import { Calculator, TrendingUp, DollarSign, Users, ArrowRight, Home, ChevronRight, Printer } from "lucide-react";

function formatCurrency(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
}

function formatPercent(value: number): string {
  return value.toFixed(1) + "%";
}

export default function ROICalculator() {
  const [reps, setReps] = useState(3);
  const [referrals, setReferrals] = useState(15);
  const [conversion, setConversion] = useState(65);
  const [los, setLos] = useState(45);
  const [rppd, setRppd] = useState(200);
  const totalReferrals = reps * referrals;
  const conversionRate = conversion / 100;
  const monthlyAdmissions = totalReferrals * conversionRate;
  const revenuePerAdmission = los * rppd;
  const monthlyRevenue = monthlyAdmissions * revenuePerAdmission;
  const annualRevenue = monthlyRevenue * 12;

  const projectedReferrals = totalReferrals * 1.4;
  const projectedConversionRate = Math.min(conversion + 15, 95) / 100;
  const projectedAdmissions = projectedReferrals * projectedConversionRate;
  const projectedLos = los * 1.25;
  const projectedRevenuePerAdmission = projectedLos * rppd;
  const projectedMonthlyRevenue = projectedAdmissions * projectedRevenuePerAdmission;
  const projectedAnnualRevenue = projectedMonthlyRevenue * 12;

  const additionalMonthlyRevenue = projectedMonthlyRevenue - monthlyRevenue;
  const additionalAnnualRevenue = projectedAnnualRevenue - annualRevenue;
  const revenueIncreasePercent = monthlyRevenue > 0 ? ((projectedMonthlyRevenue - monthlyRevenue) / monthlyRevenue) * 100 : 0;
  const additionalPatients = projectedAdmissions - monthlyAdmissions;

  function clampAndSet(setter: (v: number) => void, min: number, max: number) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value === "" ? min : Number(e.target.value);
      setter(Math.max(min, Math.min(max, val)));
    };
  }

  return (
    <div className="w-full" data-testid="section-roi-calculator">
      <SEO
        title="ROI Calculator | Spartan Coaching"
        description="Calculate the potential return on investment from Spartan Coaching for your hospice organization. Estimate revenue growth, increased referrals, and improved conversion rates."
        keywords="ROI calculator, hospice ROI, sales coaching ROI, revenue calculator, hospice revenue growth"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap" data-testid="breadcrumb-roi" aria-label="Breadcrumb navigation">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors" aria-label="Go to home page">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/tools" className="hover:text-foreground transition-colors" aria-label="Go to tools page">
            Tools
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">ROI Calculator</span>
        </nav>

        <SlideUp>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center shadow-lg">
                <Calculator className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-h1 font-black text-foreground mb-4" data-testid="text-roi-title">
              ROI Calculator
            </h1>
            <p className="text-body-lg text-muted-foreground">
              See the potential impact of Spartan Coaching on your hospice organization's performance and revenue
            </p>
          </div>
        </SlideUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <FadeIn>
            <Card className="h-fit">
              <CardContent className="p-6 sm:p-8">
                <CardTitle className="text-h3 mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  Your Current Metrics
                </CardTitle>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="input-reps" className="text-sm font-semibold text-foreground mb-2 block">
                      Number of Sales Reps
                    </Label>
                    <Input
                      id="input-reps"
                      data-testid="input-reps"
                      type="number"
                      value={reps}
                      onChange={clampAndSet(setReps, 1, 50)}
                      min={1}
                      max={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="input-referrals" className="text-sm font-semibold text-foreground mb-2 block">
                      Current Monthly Referrals (per rep)
                    </Label>
                    <Input
                      id="input-referrals"
                      data-testid="input-referrals"
                      type="number"
                      value={referrals}
                      onChange={clampAndSet(setReferrals, 1, 100)}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="input-conversion" className="text-sm font-semibold text-foreground mb-2 block">
                      Current Conversion Rate (%)
                    </Label>
                    <Input
                      id="input-conversion"
                      data-testid="input-conversion"
                      type="number"
                      value={conversion}
                      onChange={clampAndSet(setConversion, 10, 100)}
                      min={10}
                      max={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="input-los" className="text-sm font-semibold text-foreground mb-2 block">
                      Average Length of Stay (days)
                    </Label>
                    <Input
                      id="input-los"
                      data-testid="input-los"
                      type="number"
                      value={los}
                      onChange={clampAndSet(setLos, 7, 365)}
                      min={7}
                      max={365}
                    />
                  </div>
                  <div>
                    <Label htmlFor="input-rppd" className="text-sm font-semibold text-foreground mb-2 block">
                      Medicare Hospice Per-Diem Rate ($)
                    </Label>
                    <Input
                      id="input-rppd"
                      data-testid="input-rppd"
                      type="number"
                      value={rppd}
                      onChange={clampAndSet(setRppd, 100, 500)}
                      min={100}
                      max={500}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on the CMS Medicare hospice routine home care per-diem rate. Adjust for your specific payer mix.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <CardTitle className="text-h3 mb-6 flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-muted-foreground" />
                    Current Performance
                  </CardTitle>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-body text-muted-foreground">Total Monthly Referrals</span>
                      <span className="text-lg font-bold text-foreground">{totalReferrals}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-body text-muted-foreground">Monthly Admissions</span>
                      <span className="text-lg font-bold text-foreground">{monthlyAdmissions.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-body text-muted-foreground">Revenue Per Admission</span>
                      <span className="text-lg font-bold text-foreground" data-testid="text-revenue-per-admission">{formatCurrency(revenuePerAdmission)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-body text-muted-foreground">Monthly Revenue</span>
                      <span className="text-lg font-bold text-foreground" data-testid="text-current-revenue">{formatCurrency(monthlyRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-border">
                      <span className="text-body font-semibold text-foreground">Annual Revenue</span>
                      <span className="text-xl font-black text-foreground">{formatCurrency(annualRevenue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/30">
                <CardContent className="p-6 sm:p-8">
                  <CardTitle className="text-h3 mb-6 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">With Spartan Coaching</span>
                  </CardTitle>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-body text-muted-foreground">Projected Monthly Referrals</span>
                      <span className="text-lg font-bold text-primary">{projectedReferrals.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-body text-muted-foreground">Projected Conversion Rate</span>
                      <span className="text-lg font-bold text-primary">{formatPercent(projectedConversionRate * 100)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-body text-muted-foreground">Projected Monthly Admissions</span>
                      <span className="text-lg font-bold text-primary">{projectedAdmissions.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-body text-muted-foreground">Projected Revenue Per Admission</span>
                      <span className="text-lg font-bold text-primary" data-testid="text-projected-revenue-per-admission">{formatCurrency(projectedRevenuePerAdmission)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-body text-muted-foreground">Projected Monthly Revenue</span>
                      <span className="text-lg font-bold text-primary" data-testid="text-projected-revenue">{formatCurrency(projectedMonthlyRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-border">
                      <span className="text-body font-semibold text-foreground">Projected Annual Revenue</span>
                      <span className="text-xl font-black text-primary">{formatCurrency(projectedAnnualRevenue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/5 to-red-600/10 border-primary/20">
                <CardContent className="p-6 sm:p-8">
                  <CardTitle className="text-h3 mb-6 flex items-center gap-3">
                    <ArrowRight className="w-6 h-6 text-primary" />
                    Impact Summary
                  </CardTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Additional Monthly Revenue</p>
                      <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent" data-testid="text-revenue-increase">
                        {formatCurrency(additionalMonthlyRevenue)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Additional Annual Revenue</p>
                      <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                        {formatCurrency(additionalAnnualRevenue)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Revenue Increase</p>
                      <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                        {formatPercent(revenueIncreasePercent)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Additional Patients / Month</p>
                      <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent" data-testid="text-additional-patients">
                        +{additionalPatients.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Revenue calculations are based on the average Medicare hospice routine home care per-diem rate (~$200/day). Actual rates vary by region, level of care, and payer mix. Projections are estimates based on average improvements observed across Spartan Coaching clients. Individual results may vary based on market conditions, team experience, and implementation.
              </p>

              <Button onClick={() => window.print()} variant="outline" className="w-full gap-2" data-testid="button-print-roi">
                <Printer className="w-4 h-4" />
                Print Results
              </Button>

              <Card className="bg-primary/5 border-primary/20 no-print" data-testid="card-roi-conversion">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3 mb-3">
                    <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-base font-bold text-foreground">Ready to close the gap?</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        These projections reflect improvements Spartan Coaching clients consistently achieve. The difference between your current numbers and these results is exactly what the coaching process is designed to close.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full font-bold mt-1" data-testid="button-roi-book-call">
                    <Link href="/contact">Book a Discovery Call</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">No commitment. 30 minutes with Nick to assess your situation.</p>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        </div>
      </div>

      <style>{`
        @media print {
          nav, [data-testid="breadcrumb-roi"], .no-print { display: none !important; }
          [data-testid="section-roi-calculator"] .lg\\:col-span-1 { display: none !important; }
          [data-testid="section-roi-calculator"] .lg\\:grid-cols-2 { grid-template-columns: 1fr !important; }
          [data-testid="button-print-roi"] { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: letter portrait; margin: 0.75in; }
        }
      `}</style>
    </div>
  );
}