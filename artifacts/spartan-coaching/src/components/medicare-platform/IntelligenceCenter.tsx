import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bell, Building2, CheckCircle2, CircleDollarSign, Database, Download, FileSpreadsheet, History, LoaderCircle, MapPin, Network, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from './api';
import type { AnyRow, Provider, ProviderDetail, User } from './types';
import { buildEvidenceAlignment } from './intelligenceMath';
import { apiError, csvDownload, money, num, pct, statusClass } from './utils';

export default function IntelligenceCenter({ state, stateName, provider, detail, marketSources, user, onSignIn, onOpenProvider }: { state: string; stateName: string; provider: Provider; detail: ProviderDetail | null; marketSources: AnyRow[]; user: User | null; onSignIn: () => void; onOpenProvider: (ccn: string) => void; }) {
  const [intel, setIntel] = useState<AnyRow | null>(null);
  const [ssvi, setSsvi] = useState<AnyRow | null>(null);
  const [hcris, setHcris] = useState<AnyRow | null>(null);
  const [geo, setGeo] = useState<AnyRow | null>(null);
  const [white, setWhite] = useState<AnyRow | null>(null);
  const [capabilities, setCapabilities] = useState<AnyRow | null>(null);
  const [history, setHistory] = useState<AnyRow | null>(null);
  const [watched, setWatched] = useState<AnyRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [error, setError] = useState('');
  const seq = useRef(0);
  const ccn = provider.ccn;

  const load = async (force = false) => {
    const id = ++seq.current;
    setLoading(true);
    setError('');
    const suffix = force ? '&force=1' : '';
    const settled = await Promise.allSettled([
      api.get(`/api/intelligence?ccn=${encodeURIComponent(ccn)}&state=${encodeURIComponent(state)}${suffix}`),
      api.get(`/api/ssvi/${encodeURIComponent(ccn)}${force ? '?force=1' : ''}`),
      api.get(`/api/hcris/${encodeURIComponent(ccn)}${force ? '?force=1' : ''}`),
      api.get(`/api/service-geography/${encodeURIComponent(ccn)}${force ? '?force=1' : ''}`),
      api.get(`/api/white-space/${encodeURIComponent(ccn)}?state=${encodeURIComponent(state)}${suffix}`),
      api.get(`/api/capabilities/${encodeURIComponent(ccn)}`),
      api.get(`/api/provider-history/${encodeURIComponent(ccn)}`),
    ]);
    if (id !== seq.current) return;
    const values = settled.map((result) => result.status === 'fulfilled' ? result.value.data : null);
    setIntel(values[0]); setSsvi(values[1]); setHcris(values[2]); setGeo(values[3]); setWhite(values[4]); setCapabilities(values[5]); setHistory(values[6]);
    const failures = settled.filter((result) => result.status === 'rejected');
    if (failures.length) setError(`${failures.length} intelligence source${failures.length === 1 ? '' : 's'} could not be refreshed. Successful evidence remains visible.`);
    if (user) {
      try { const response = await api.get(`/api/watchlist?ccn=${encodeURIComponent(ccn)}`); if (id === seq.current) setWatched(response.data.records?.[0] || null); } catch {}
    } else setWatched(null);
    setLoading(false);
  };

  useEffect(() => { setIntel(null); setSsvi(null); setHcris(null); setGeo(null); setWhite(null); setCapabilities(null); setHistory(null); setWatched(null); void load(); }, [ccn, state, user?.userId]);

  const alignment = useMemo(() => buildEvidenceAlignment(detail, intel, marketSources, ssvi, hcris), [detail, intel, marketSources, ssvi, hcris]);
  const threats = intel?.threats || [];
  const whiteRows = white?.counties || [];
  const ssviReportable = ssvi?.fy2025?.reportable === true && ssvi?.fy2025?.totalScore !== null && ssvi?.fy2025?.totalScore !== undefined;
  const adcHistory = (detail?.history || []).filter((row) => row.adc !== null && row.adc !== undefined).slice(-3);
  const growth = adcHistory.length >= 2 && Number(adcHistory[0].adc) > 0 ? (Number(adcHistory[adcHistory.length - 1]?.adc) / Number(adcHistory[0].adc) - 1) * 100 : null;

  const toggleWatch = async () => {
    if (!user) { onSignIn(); return; }
    try {
      if (watched) { await api.delete(`/api/watchlist/${encodeURIComponent(watched.id)}`); setWatched(null); }
      else { const response = await api.post('/api/watchlist', { ccn, state: provider.state || state, label: provider.name }); setWatched(response.data); }
    } catch (requestError) { setError(apiError(requestError, 'Watchlist update failed.')); }
  };

  const deepenHcris = async () => {
    setDeepLoading(true);
    try { const response = await api.get(`/api/hcris/${encodeURIComponent(ccn)}?detail=1`); setHcris(response.data); const caps = await api.get(`/api/capabilities/${encodeURIComponent(ccn)}?deep=1`); setCapabilities(caps.data); }
    catch (requestError) { setError(apiError(requestError, 'Detailed HCRIS extraction failed.')); }
    finally { setDeepLoading(false); }
  };

  const exportCsv = () => csvDownload(`hospice-intelligence-${ccn}.csv`, [
    ['Provider 360', provider.name], ['CCN', ccn], ['State', stateName], ['Evidence coverage', detail?.confidence ?? 'NR'], ['CAHPS summary star', detail?.cahpsSummary?.summaryStar ?? 'NR'], ['Visits near death', detail?.qualitySummary?.visitsNearDeath ?? 'NR'],
  ]);

  return <section className='page'>
    <div className='hero'><div><span className='kicker'>PROVIDER 360 · NATIONAL INTELLIGENCE</span><h2>{provider.name}</h2><p>{provider.city}, {provider.state} · CCN {ccn} · market position, quality, source-period alignment and public/private evidence context.</p></div><div className='hero-actions'><button className='ghost' onClick={exportCsv}><Download size={16}/>Export evidence</button><button className='ghost' onClick={() => void load(true)} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''}/>Refresh source validation</button><button onClick={() => void toggleWatch()} className={watched ? 'selected' : ''}>{watched ? 'Remove watch' : 'Watch provider'}</button></div></div>
    {error && <div className='alert'><AlertTriangle size={16}/>{error}</div>}

    <div className='evidence-readiness panel'>
      <div className='panel-head'><div><span className='kicker'>EVIDENCE READINESS</span><h3>Missing evidence lowers evidence coverage rather than being silently scored as zero.</h3><p>The platform preserves unsupported states and reporting boundaries.</p></div>{loading ? <LoaderCircle className='spin' size={18}/> : <CheckCircle2 size={18}/>}</div>
      <div className='readiness-grid'>
        <div><Database size={18}/><span><small>PROVIDER EVIDENCE</small><b>{String(detail?.dataQuality?.status || 'loading').toUpperCase()}</b><p>{detail?.dataQuality?.limitations?.[0] || 'Current provider evidence is available.'}</p></span></div>
        <div><FileSpreadsheet size={18}/><span><small>SSVI FY2025</small><b>{loading && !ssvi ? 'CHECKING' : ssviReportable ? num(ssvi?.fy2025?.totalScore) : 'NOT REPORTABLE'}</b><p>{ssvi?.fy2025?.reportable === false ? 'Oversight context is not reportable for this provider.' : 'Oversight and variation context.'}</p></span></div>
        <div><CircleDollarSign size={18}/><span><small>HCRIS OPERATING EVIDENCE</small><b>{hcris?.available ? 'REPORT FOUND' : 'NOT RESOLVED'}</b><p>{hcris?.available ? `${hcris.costReportBasis || 'Cost report'} · ${hcris.fiscalYear || 'FY NR'}` : 'Cost-report validation may be unavailable.'}</p></span></div>
      </div>
    </div>

    <div className={`alignment panel ${statusClass(alignment.status)}`}><div className='panel-head'><div><span className='kicker'>SOURCE PERIOD ALIGNMENT</span><h3>{alignment.status}</h3><p>{alignment.explanation}</p></div><ShieldCheck size={18}/></div><div className='align-stats'><span><b>{alignment.confidencePenalty}%</b><small>confidence penalty</small></span><span><b>{alignment.spanYears ?? 'NR'}</b><small>span years</small></span><span><b>{alignment.sources.length}</b><small>period anchors</small></span></div></div>

    <div className='metrics six'>
      <Metric label='CAHPS summary star' value={detail?.cahpsSummary?.summaryStar ? `${detail.cahpsSummary.summaryStar}/5` : 'NR'} sub={detail?.periods?.cahpsDate || 'Published period NR'}/>
      <Metric label='Hospice Care Index' value={num(detail?.qualitySummary?.hci, 1)} sub={detail?.periods?.qualityDate || 'Claims-based quality'}/>
      <Metric label='SSVI FY2025' value={ssviReportable ? num(ssvi?.fy2025?.totalScore) : 'NOT REPORTABLE'} sub='Oversight / variation context'/>
      <Metric label='Patient-service ZIPs' value={num(intel?.serviceArea?.focusZipCount)} sub='Observed CMS footprint'/>
      <Metric label='County footprint' value={num(geo?.counties?.length)} sub={geo?.mappingCoveragePct !== undefined ? `${pct(geo.mappingCoveragePct)} ZCTA mapping` : 'Census mapping'}/>
      <Metric label='Recent ADC trend' value={growth === null ? 'INSUFFICIENT HISTORY' : pct(growth)} sub={adcHistory.length ? `${adcHistory[0].year} to ${adcHistory[adcHistory.length - 1]?.year}` : 'PAC history unavailable'}/>
    </div>

    {intel && <div className='grid-2'>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>EXECUTIVE READOUT</span><h3>What matters first</h3></div><ShieldCheck size={18}/></div><div className='insight-list'>
        {threats[0] && <div><b>Competitive collision</b><p>{threats[0].name} is the highest measured collision at {num(threats[0].threatScore)}/100 with {num(threats[0].shared)} shared service ZIPs.</p></div>}
        {whiteRows[0] && <div><b>Growth geography</b><p>{whiteRows[0].name} leads the current local-relative White Space screen at {num(whiteRows[0].whiteSpaceScore)}/100. Serviceability and operating truth still govern execution.</p></div>}
        <div><b>Evidence boundary</b><p>Provider evidence coverage is {detail?.confidence ?? 'NR'}%. Reporting periods remain separate, and missing inputs are not converted to zero.</p></div>
      </div></div>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>CHANGE INTELLIGENCE</span><h3>Stored provider history</h3></div><History size={18}/></div><div className='change-list'>{(history?.records || history?.changes || []).slice(0, 5).map((row: AnyRow) => <div key={String(row.id || row.timestamp || row.key)}><b>{row.label || row.changeType || 'Update'}</b><p>{row.detail || row.description || (row.percentDelta === null || row.percentDelta === undefined ? 'Historical provider event' : `${row.from} → ${row.to} (${row.percentDelta > 0 ? '+' : ''}${Number(row.percentDelta).toFixed(1)}%)`)}</p></div>)}</div></div>
    </div>}

    <div className='grid-2'>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>THREAT SCORE V3</span><h3>Who actually collides?</h3><p>Service-area collision plus peer Medicare scale and local pressure.</p></div><Network size={18}/></div><div className='table'>{(intel?.threats || []).slice(0, 5).map((row: AnyRow) => <div key={row.ccn || row.name}><span>{row.name}</span><b>{num(row.threatScore)}/100</b></div>)}</div></div>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>QUALITY BATTLECARD</span><h3>Provider vs state vs U.S.</h3></div><ShieldCheck size={18}/></div><div className='table'>{(intel?.qualityBattlecard || []).slice(0, 5).map((row: AnyRow) => <div key={row.code || row.label}><span>{row.label}</span><b>{num(row.provider)} · {num(row.state)} · {num(row.national)}</b></div>)}</div></div>
    </div>

    <div className='grid-2'>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>HCRIS COST REPORT INTELLIGENCE</span><h3>Provider-reported operating context</h3></div><CircleDollarSign size={18}/></div><div className='table'><div><span>Fiscal year</span><b>{hcris?.fiscalYear || 'NR'}</b></div><div><span>Operating basis</span><b>{hcris?.costReportBasis || 'NR'}</b></div><div><span>Report status</span><b>{hcris?.available ? 'AVAILABLE' : 'UNAVAILABLE'}</b></div></div><button className='ghost' onClick={() => void deepenHcris()} disabled={deepLoading}>{deepLoading ? <LoaderCircle className='spin' size={16}/> : <RefreshCw size={16}/>}Deepen HCRIS extraction</button></div>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>CMS OBSERVED CAPABILITIES</span><h3>What public evidence supports</h3></div><Database size={18}/></div><div className='insight-list'>{(capabilities?.supported || []).slice(0, 6).map((row: AnyRow) => <div key={row.label}><b>{row.label}</b><p>{row.detail}</p></div>)}</div></div>
    </div>

    <div className='grid-2'>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>WHITE SPACE 2.2</span><h3>Demand minus local service-area saturation</h3></div><MapPin size={18}/></div><div className='insight-list'>{whiteRows.slice(0, 5).map((row: AnyRow) => <div key={row.fips}><b>{row.name}</b><p>{num(row.whiteSpaceScore)}/100 · {row.reason || 'screened'}</p></div>)}</div></div>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>ENTERPRISE 360</span><h3>PECOS legal and enrollment context</h3></div><Network size={18}/></div><div className='insight-list'>{(intel?.enterprise?.relatedEnrollments || []).slice(0, 5).map((row: AnyRow) => <div key={row.enrollmentId}><b>{row.organizationName || row.dba || row.enrollmentId}</b><p>{row.city}, {row.state} · {row.ccn || 'CCN NR'}</p></div>)}</div></div>
    </div>
  </section>;
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className='metric'><span>{label}</span><b>{value}</b><small>{sub}</small></div>; }
