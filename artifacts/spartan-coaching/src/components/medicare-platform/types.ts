export type AnyRow = Record<string, any>;

export type Provider = {
  ccn: string;
  name: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  address?: string;
  phone?: string;
  ownership?: string;
  type?: string;
  year?: string;
  beneficiaries?: number | null;
  days?: number | null;
  adc?: number | null;
  payment?: number | null;
  daysPerBene?: number | null;
  originalParticipationDate?: string;
  staffing?: AnyRow;
  clinical?: AnyRow;
  diagnosis?: AnyRow;
};

export type County = {
  fips: string;
  name: string;
  state?: string;
  agedMedicare?: number | null;
  totalMedicare?: number | null;
  originalMedicare?: number | null;
  ma?: number | null;
  hospitals?: number | null;
  hospices?: number | null;
  snfs?: number | null;
  snfResidents?: number | null;
  opportunity?: number | null;
  evidenceScore?: number | null;
  signalCoveragePct?: number | null;
  enrollmentPeriod?: string;
};

export type DashboardData = {
  generatedAt: string;
  state: string;
  stateName: string;
  focusCcn: string;
  providers: Provider[];
  counties: County[];
  hospitals: AnyRow[];
  snfs: AnyRow[];
  sources: AnyRow[];
  warnings: string[];
  marketSummary: AnyRow;
  dataQuality: AnyRow;
  cache?: AnyRow;
};

export type ProviderDetail = {
  provider: Provider;
  utilization?: Provider;
  quality: AnyRow[];
  cahps: AnyRow[];
  cahpsSummary: AnyRow;
  qualitySummary: AnyRow;
  zips: AnyRow[];
  enrollments: AnyRow[];
  owners: AnyRow[];
  history: Provider[];
  periods: AnyRow;
  sources: AnyRow[];
  confidence: number;
  dataQuality: AnyRow;
  warnings?: string[];
  cache?: AnyRow;
};

export type User = {
  userId: string;
  email?: string;
  name?: string;
  scope?: string;
};

export type TabId = 'command'|'decision'|'intelligence'|'watchlist'|'growth'|'winloss'|'compare'|'hospice'|'territory'|'referral'|'network'|'sources';
