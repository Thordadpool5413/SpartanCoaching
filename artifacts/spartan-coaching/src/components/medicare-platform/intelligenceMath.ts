import type { AnyRow } from './types';
import { clamp, finite } from './utils';

export type GrowthInputs = {
  currentAdc: number;
  targetAdc: number;
  losDays: number;
  conversionPct: number;
  horizonDays?: number;
};

export type GrowthResult = {
  currentAdc: number;
  targetAdc: number;
  horizonDays: number;
  losDays: number;
  survival: number;
  projectedAdcWithoutAdmissions: number;
  netGrowthRequired: number;
  admissionsPerDay: number;
  admissionsPerMonth: number;
  referralsPerMonth: number;
  referralsPerWeek: number;
  referralsPerWorkday: number;
  formula: string;
};

export function solveGrowth(inputs: GrowthInputs): GrowthResult {
  const currentAdc = Math.max(0, Number(inputs.currentAdc) || 0);
  const targetAdc = Math.max(0, Number(inputs.targetAdc) || 0);
  const losDays = Math.max(1, Number(inputs.losDays) || 1);
  const conversionPct = clamp(Number(inputs.conversionPct) || 0, 1, 100);
  const horizonDays = Math.max(1, Number(inputs.horizonDays) || 90);
  const survival = Math.exp(-horizonDays / losDays);
  const projectedAdcWithoutAdmissions = currentAdc * survival;
  const denominator = losDays * (1 - survival);
  const admissionsPerDay = denominator > 0 ? Math.max(0, (targetAdc - projectedAdcWithoutAdmissions) / denominator) : 0;
  const admissionsPerMonth = admissionsPerDay * 30.4375;
  const referralsPerMonth = admissionsPerMonth / (conversionPct / 100);
  return {
    currentAdc,
    targetAdc,
    horizonDays,
    losDays,
    survival,
    projectedAdcWithoutAdmissions,
    netGrowthRequired: Math.max(0, targetAdc - currentAdc),
    admissionsPerDay,
    admissionsPerMonth,
    referralsPerMonth,
    referralsPerWeek: referralsPerMonth / 4.345,
    referralsPerWorkday: referralsPerMonth / 21.74,
    formula: 'Target census = current census × e^(-horizon/LOS) + daily admissions × LOS × (1 - e^(-horizon/LOS)). Referrals = required admissions ÷ conversion rate.',
  };
}

export type EvidenceAlignment = {
  status: 'ALIGNED' | 'DIRECTIONALLY COMPARABLE' | 'PERIOD MISMATCH' | 'PARTIAL VINTAGE';
  spanYears: number | null;
  confidencePenalty: number;
  sources: Array<{ name: string; period: string; year: number | null; core: boolean }>;
  explanation: string;
};

const yearsIn = (value: unknown) => [...String(value ?? '').matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1])).filter(Number.isFinite);
const latestYear = (value: unknown) => { const years = yearsIn(value); return years.length ? Math.max(...years) : null; };
const periodFromSource = (sources: AnyRow[], pattern: RegExp) => { const source = sources.find((row) => pattern.test(String(row.label || ''))); return String(source?.freshness || source?.temporal || source?.modified || source?.period || '').trim(); };

export function buildEvidenceAlignment(detail: AnyRow | null, intelligence: AnyRow | null, marketSources: AnyRow[] = [], ssvi?: AnyRow | null, hcris?: AnyRow | null): EvidenceAlignment {
  const pac = String(detail?.history?.at?.(-1)?.year || intelligence?.financial?.year || detail?.periods?.utilizationYears?.at?.(-1) || '').trim();
  const cahps = String(detail?.periods?.cahpsDate || '').trim();
  const quality = String(detail?.periods?.qualityDate || intelligence?.benchmarks?.find((row: AnyRow) => row.period)?.period || '').trim();
  const enrollment = periodFromSource(marketSources, /Medicare Monthly Enrollment/i);
  const hcrisPeriod = String(hcris?.latest?.fiscalEnd || hcris?.detail?.fiscalEnd || '').trim();
  const sources = [
    { name: 'PAC utilization', period: pac || 'Not resolved', year: latestYear(pac), core: true },
    { name: 'CAHPS family experience', period: cahps || 'Not resolved', year: latestYear(cahps), core: true },
    { name: 'Hospice quality / HCI', period: quality || 'Not resolved', year: latestYear(quality), core: true },
    { name: 'Monthly Medicare enrollment', period: enrollment || 'Not resolved', year: latestYear(enrollment), core: true },
    { name: 'SSVI', period: ssvi ? 'FY2025' : 'Not loaded in this context', year: ssvi ? 2025 : null, core: false },
    { name: 'HCRIS cost report', period: hcrisPeriod || 'Not loaded in this context', year: latestYear(hcrisPeriod), core: false },
  ];
  const coreYears = sources.filter((source) => source.core && source.year !== null).map((source) => source.year as number);
  if (coreYears.length < 2) return { status: 'PARTIAL VINTAGE', spanYears: null, confidencePenalty: 0, sources, explanation: 'Fewer than two core evidence periods resolve to a calendar year. Missing evidence already lowers evidence coverage, so no second speculative time penalty is applied.' };
  const spanYears = Math.max(...coreYears) - Math.min(...coreYears);
  if (spanYears <= 1) return { status: 'ALIGNED', spanYears, confidencePenalty: 0, sources, explanation: 'Core decision sources resolve within one calendar year of one another. No time-alignment penalty is applied.' };
  if (spanYears === 2) return { status: 'DIRECTIONALLY COMPARABLE', spanYears, confidencePenalty: 4, sources, explanation: 'Core evidence spans two calendar years. Directional comparison remains usable, while composite decision confidence is reduced by 4 points.' };
  return { status: 'PERIOD MISMATCH', spanYears, confidencePenalty: 8, sources, explanation: `Core evidence spans ${spanYears} calendar years. Composite decision confidence is reduced by 8 points until more closely aligned evidence is available.` };
}

export function evidenceConfidence(market: AnyRow, detail: AnyRow | null, geo: AnyRow | null, intel: AnyRow | null, physicianMeta: AnyRow, alignment: EvidenceAlignment) {
  const score = (status: unknown) => status === 'healthy' ? 95 : status === 'limited' ? 70 : status === 'degraded' ? 35 : 60;
  const marketConfidence = score(market?.dataQuality?.status);
  const providerConfidence = finite(detail?.confidence) ?? score(detail?.dataQuality?.status);
  const geographyConfidence = geo?.available === false ? 40 : geo ? Math.max(70, finite(geo.mappingCoveragePct) ?? 90) : 55;
  const intelligenceConfidence = score(intel?.dataQuality?.status);
  const physicianConfidence = physicianMeta?.partial ? 65 : physicianMeta?.physicians?.length ? 90 : 55;
  const base = clamp(Math.round(marketConfidence * .25 + providerConfidence * .30 + geographyConfidence * .15 + intelligenceConfidence * .20 + physicianConfidence * .10));
  return { base, adjusted: clamp(base - alignment.confidencePenalty) };
}
