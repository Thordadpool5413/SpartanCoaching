export type ThreatInput = {
  ccn: string;
  focusCoveragePct: number;
  competitorCoveragePct?: number | null;
  jaccardPct?: number | null;
  shared?: number;
  adc: number | null;
  growthPct: number | null;
  [key: string]: unknown;
};

export type ThreatComponent = {
  name: string;
  value: number;
  weight: number;
  basis: string;
};

export type GeoCounty = {
  fips: string;
  name: string;
  competitors: number;
  serviceZips: number;
  [key: string]: unknown;
};

export type DemandCounty = {
  fips: string;
  opportunity: number | null;
  agedMedicare?: number | null;
  snfResidents?: number | null;
  hospitals?: number | null;
  [key: string]: unknown;
};

export function percentileRank(values: Array<number | null | undefined>, value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const xs = values.filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v)).sort((a, b) => a - b);
  if (!xs.length) return null;
  const below = xs.filter((v) => v < value).length;
  const equal = xs.filter((v) => v === value).length;
  return Math.round(((below + equal * 0.5) / xs.length) * 1000) / 10;
}

export function buildThreatScores<T extends ThreatInput>(rows: T[]) {
  const scaleValues = rows.map((row) => row.adc);
  const growthValues = rows.map((row) => row.growthPct);
  const scalePeerCount = scaleValues.filter((value) => value !== null && value !== undefined && Number.isFinite(value)).length;
  const growthPeerCount = growthValues.filter((value) => value !== null && value !== undefined && Number.isFinite(value)).length;
  return rows.map((row) => {
    const collision = Math.max(0, Math.min(100, Number(row.focusCoveragePct) || 0));
    const scalePercentile = percentileRank(scaleValues, row.adc);
    const growthPercentile = percentileRank(growthValues, row.growthPct);
    const parts: ThreatComponent[] = [
      { name: 'Service-area collision', value: collision, weight: 50, basis: 'Share of the selected hospice patient-service ZIP footprint also served by this competitor' },
      ...(scalePercentile === null ? [] : [{ name: 'Peer Medicare scale', value: scalePercentile, weight: 30, basis: `Estimated Medicare ADC percentile among ${scalePeerCount} deeply evaluated overlapping hospices` }]),
      ...(growthPercentile === null ? [] : [{ name: 'Peer recent ADC growth', value: growthPercentile, weight: 20, basis: `Recent ADC-growth percentile among ${growthPeerCount} overlapping hospices with reportable history` }]),
    ];
    const availableWeight = parts.reduce((sum, part) => sum + part.weight, 0);
    const evidenceCoveragePct = Math.round(availableWeight / 100 * 1000) / 10;
    const threatScore = Math.round(parts.reduce((sum, part) => sum + part.value * part.weight, 0) / Math.max(1, availableWeight));
    const threatBand = threatScore >= 75 ? 'High collision pressure' : threatScore >= 55 ? 'Material collision' : threatScore >= 35 ? 'Moderate collision' : 'Watch';
    const competitivePosture = collision >= 60 && (scalePercentile ?? 0) >= 60 && (growthPercentile ?? 0) >= 60 ? 'DEFEND NOW' : collision >= 45 && growthPercentile !== null && growthPercentile < 40 ? 'SHARE CAPTURE' : collision >= 45 ? 'DIRECT COLLISION' : threatScore >= 55 ? 'WATCH CLOSELY' : 'MONITOR';
    const growthRead = row.growthPct === null || row.growthPct === undefined ? 'Recent competitor growth is not reportable, so the score does not invent a growth component.' : Number(row.growthPct) > 5 ? `The competitor's recent reportable ADC trend is positive at ${Number(row.growthPct).toFixed(1)}%.` : Number(row.growthPct) < -5 ? `The competitor's recent reportable ADC trend is negative at ${Number(row.growthPct).toFixed(1)}%.` : `The competitor's recent reportable ADC trend is relatively flat at ${Number(row.growthPct).toFixed(1)}%.`;
    const strategicRead = `${row.shared ?? 0} shared service ZIPs overlap ${collision.toFixed(1)}% of the selected hospice footprint${row.competitorCoveragePct === null || row.competitorCoveragePct === undefined ? '' : ` and ${Number(row.competitorCoveragePct).toFixed(1)}% of the competitor footprint`}. ${scalePercentile === null ? 'Competitor Medicare scale is not reportable.' : `Its estimated Medicare scale ranks at the ${scalePercentile.toFixed(1)}th percentile within the deeply evaluated collision peer set.`} ${growthRead}`;
    const fieldMotion = competitivePosture === 'DEFEND NOW' ? 'Protect the shared geography first. Identify the highest-value accounts inside overlapping ZIPs, test response-time and relationship vulnerabilities, and compare measurable quality proof before expanding rep coverage elsewhere.' : competitivePosture === 'SHARE CAPTURE' ? 'The collision is meaningful while recent public growth is weaker. Validate account-level dissatisfaction and service gaps inside the shared ZIPs before assigning a share-capture plan.' : competitivePosture === 'DIRECT COLLISION' ? 'Treat this as a direct local competitor. Build an account-by-account battlecard inside the shared ZIPs and differentiate on verified service, quality, response reliability and relationship evidence.' : competitivePosture === 'WATCH CLOSELY' ? 'The competitor has material public pressure but less direct footprint overlap. Monitor growth and expanding ZIP collision before reallocating major field capacity.' : 'Keep this competitor on the watchlist, but prioritize providers with stronger direct service-area collision before spending recurring field time.';
    return { ...row, scalePercentile, growthPercentile, threatScore, threatBand, competitivePosture, evidenceCoveragePct, components: parts, peerSetSize: rows.length, strategicRead, fieldMotion, formula: growthPercentile === null ? 'Available evidence reweighted across service-area collision and peer Medicare scale; growth history unavailable' : '50% service-area collision + 30% peer Medicare scale percentile + 20% peer ADC-growth percentile' };
  }).sort((a, b) => b.threatScore - a.threatScore);
}

export function buildWhiteSpaceScores(geo: GeoCounty[], demand: DemandCounty[]) {
  const demandByFips = new Map(demand.map((county) => [String(county.fips), county]));
  const competitors = geo.map((county) => Number(county.competitors)).filter(Number.isFinite);
  const rows = geo.map((county) => {
    const demandCounty = demandByFips.get(String(county.fips));
    const demandSignal = demandCounty?.opportunity === null || demandCounty?.opportunity === undefined ? null : Number(demandCounty.opportunity);
    const saturationPercentile = percentileRank(competitors, Number(county.competitors));
    const whiteSpaceScore = demandSignal === null || saturationPercentile === null ? null : Math.round(demandSignal * 0.7 + (100 - saturationPercentile) * 0.3);
    return { ...county, demand: demandSignal, saturationPercentile, whiteSpaceScore, agedMedicare: demandCounty?.agedMedicare ?? null, snfResidents: demandCounty?.snfResidents ?? null, hospitals: demandCounty?.hospitals ?? null };
  }).filter((row) => row.whiteSpaceScore !== null).sort((a, b) => Number(b.whiteSpaceScore) - Number(a.whiteSpaceScore));
  return { modelVersion: '2.2', scope: 'provider-local-relative', formula: '70% state demand potential + 30% inverse competitor-count percentile within the provider mapped service footprint', nationallyComparable: false, peerCountyCount: geo.length, counties: rows };
}

export function buildExpansionScreening(counties: Array<DemandCounty & { name?: string; hospices?: number | null; totalMedicare?: number | null }>, servedFips: string[]) {
  const served = new Set(servedFips.map(String));
  const demandValues = counties.map((county) => county.opportunity);
  const hqValues = counties.map((county) => county.hospices ?? null);
  const rows = counties.filter((county) => county.fips && !served.has(String(county.fips))).map((county) => {
    const demandPercentile = percentileRank(demandValues, county.opportunity);
    const hqPercentile = percentileRank(hqValues, county.hospices ?? null);
    const score = demandPercentile === null ? null : Math.round(demandPercentile * 0.85 + (100 - (hqPercentile ?? 50)) * 0.15);
    return { ...county, demandPercentile, hqPercentile, expansionScore: score };
  }).filter((row) => row.expansionScore !== null).sort((a, b) => Number(b.expansionScore) - Number(a.expansionScore));
  return { modelVersion: '1.0', scope: 'unserved-state-county-screening', formula: '85% county demand percentile + 15% inverse hospice-headquarters percentile', serviceCompetitionIncluded: false, adjacencyIncluded: false, driveTimeIncluded: false, caveat: 'Expansion Screening 1.0 identifies unserved counties with strong demand and lighter hospice-headquarters context. Headquarters are not service-area competition. Adjacency, drive time and true service saturation remain separate next-stage inputs.', counties: rows };
}
