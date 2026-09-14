import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Database, FileSpreadsheet, LoaderCircle, Network, RefreshCw, Server, ShieldCheck, Timer } from 'lucide-react';
import { api } from './api';
import type { AnyRow, Provider } from './types';
import { apiError, num, pct, statusClass } from './utils';

export default function DataLab({ state, provider, providerStatus }: { state: string; provider: Provider; providerStatus: string }) {
  const [sourceHealth, setSourceHealth] = useState<AnyRow | null>(null);
  const [warehouse, setWarehouse] = useState<AnyRow | null>(null);
  const [hcrisRouting, setHcrisRouting] = useState<AnyRow | null>(null);
  const [competition, setCompetition] = useState<AnyRow | null>(null);
  const [diagnostics, setDiagnostics] = useState<AnyRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [error, setError] = useState('');
  const ccn = provider.ccn;

  const load = async (force = false) => {
    setLoading(true); setError('');
    const settled = await Promise.allSettled([
      api.get(`/api/source-health${force ? '?force=1' : ''}`),
      api.get('/api/physician-warehouse-status'),
      api.get(`/api/hcris-routing/${encodeURIComponent(ccn)}`),
      api.get('/api/competition-coverage-status'),
    ]);
    const values = settled.map((result) => result.status === 'fulfilled' ? result.value.data : null);
    setSourceHealth(values[0]); setWarehouse(values[1]); setHcrisRouting(values[2]); setCompetition(values[3]);
    const failures = settled.filter((result) => result.status === 'rejected').length;
    if (failures) setError(`${failures} completeness/source control${failures === 1 ? '' : 's'} could not be refreshed. Missing status is not treated as zero.`);
    setLoading(false);
  };
  useEffect(() => { setDiagnostics(null); void load(false); }, [ccn, state]);

  const runDiagnostics = async () => {
    setDiagLoading(true); setError('');
    try { const response = await api.get(`/api/system-diagnostics?state=${encodeURIComponent(state)}&ccn=${encodeURIComponent(ccn)}`); setDiagnostics(response.data); }
    catch (requestError) { setError(apiError(requestError, 'System diagnostics could not complete.')); }
    finally { setDiagLoading(false); }
  };

  const readiness: Array<[string,'operational'|'scoped',string]> = [
    ['Expert decision operating layer','operational','Decision Room turns evidence into GO / CONDITIONAL / HOLD recommendations with confidence, guardrails, evidence ledger and private execution.'],
    ['CMS evidence + source-contract layer','operational','Core CMS APIs and external source contracts expose failures, reporting boundaries and missing evidence instead of converting them to zero.'],
    ['HCRIS Operating Model 2.0','operational','Freestanding CMS-1984-14 operating evidence is normalized with explicit accounting guardrails and provider-specific form-routing status.'],
    ['Territory Deployment 3.0','operational','County demand, observed service geography, Census adjacency and private operating truth create a transparent territory gate.'],
    ['Internal deployment truth','operational','Private serviceability, travel, staffing, same-day admission and relationship evidence can change the effective gate and now retains an audit trail.'],
    ['Physician Opportunity 3.0','operational','Clinician ranking uses peer Medicare volume, serious-illness evidence, service intensity and specialty relevance with evidence coverage.'],
    ['National physician warehouse pipeline','operational','Checkpointed ingestion is implemented; actual completion is reported below rather than assumed from the architecture.'],
    ['National competition precompute','scoped','Provider/ZIP competitive evidence is cached incrementally. A completed all-provider national competition warehouse is not claimed.'],
    ['Based-provider financial normalization','scoped','Freestanding hospice HCRIS is normalized. Hospital- and HHA-based parent cost-report models remain scoped until validated.'],
    ['Native executive document generation','scoped','Print and CSV workflows are available. Native server-generated PDF/XLSX/PPTX intelligence books are not part of this runtime.'],
  ];

  return <section className='page'>
    <div className='hero'><div><span className='kicker'>DATA LAB · SYSTEM TRUST</span><h2>Know what is connected, what is current, and what is still bounded.</h2><p>Source confidence is part of the product. A green badge does not get to substitute for completed evidence.</p></div><div className='hero-actions'><button onClick={() => void load(true)} disabled={loading}>{loading ? <LoaderCircle className='spin' size={15}/> : <RefreshCw size={15}/>}Validate sources</button><button onClick={() => void runDiagnostics()} disabled={diagLoading}>{diagLoading ? <LoaderCircle className='spin' size={15}/> : <Activity size={15}/>}Run diagnostics</button></div></div>
    {error && <div className='alert'><AlertTriangle size={16}/>{error}</div>}

    <div className='panel'><div className='panel-head'><div><span className='kicker'>NATIONAL COMPLETENESS CONTROL</span><h3>What is actually complete, what is building, and what is deliberately unresolved</h3><p>These statuses come from live checkpoints or provider-specific routing, not from the existence of code.</p></div><ShieldCheck size={18}/></div><div className='completeness-grid'>
      <article><Database size={20}/><div><small>NATIONAL PHYSICIAN WAREHOUSE</small><h4>{warehouse ? `${num(warehouse.completeStates)} / ${num(warehouse.totalStates)} COMPLETE` : 'STATUS UNAVAILABLE'}</h4><p>{warehouse ? `${num(warehouse.buildingStates)} building · ${num(warehouse.queuedStates)} queued · ${num(warehouse.errorStates)} error · ${num(warehouse.rowsStored)} stored rows · ${pct(warehouse.completionPct)} completion.` : 'Checkpoint status was not returned.'}</p><em>{warehouse?.lastWorkerRun ? `Last worker checkpoint ${new Date(warehouse.lastWorkerRun).toLocaleString()}` : 'No worker checkpoint is currently recorded.'}</em></div></article>
      <article><FileSpreadsheet size={20}/><div><small>HCRIS FORM ROUTING · CCN {ccn}</small><h4>{hcrisRouting?.status || 'STATUS UNAVAILABLE'}</h4><p>{hcrisRouting?.nextStep || 'Provider-specific routing status was not returned.'}</p><em>{hcrisRouting ? `${hcrisRouting.controllingForm} · provider type: ${hcrisRouting.providerType}` : ''}</em></div></article>
      <article><Network size={20}/><div><small>COMPETITION EVIDENCE CACHE</small><h4>{competition?.mode ? 'INCREMENTAL · PROVIDER-CENTRIC' : 'STATUS UNAVAILABLE'}</h4><p>{competition ? `${num(competition.providerIntelligence?.count)} Provider 360 caches · ${num(competition.providerZipFootprints?.count)} competitor footprint caches · ${num(competition.zipCollisionCells?.count)} ZIP collision cells.` : 'Cache coverage was not returned.'}</p><em>{competition?.caveat || ''}</em></div></article>
    </div></div>

    <div className='panel'><div className='panel-head'><div><span className='kicker'>SOURCE CONTRACT HEALTH</span><h3>{String(sourceHealth?.overall || 'loading').toUpperCase()}</h3><p>{sourceHealth?.checkedAt ? `Validated ${new Date(sourceHealth.checkedAt).toLocaleString()}` : 'Loading source health...'}</p></div><span className={`pill ${statusClass(sourceHealth?.overall)}`}>{sourceHealth?.liveValidation ? 'LIVE VALIDATION' : 'CACHED VALIDATION'}</span></div><div className='source-grid'>{(sourceHealth?.sources || []).map((source: AnyRow) => <div key={source.name} className={statusClass(source.status)}>{source.status === 'healthy' ? <CheckCircle2 size={15}/> : <AlertTriangle size={15}/>}<span><b>{source.name}</b><small>{String(source.status || '').toUpperCase()} · {source.detail || source.modified || source.temporal || 'Source contract checked'}</small></span></div>)}{!sourceHealth?.sources?.length && <p className='empty'>Source-contract status is still loading.</p>}</div></div>

    <div className='panel'><div className='panel-head'><div><span className='kicker'>SYSTEM DIAGNOSTICS</span><h3>Selected provider stack</h3><p>Checks the current market/provider stack, cache mode, latency, stale recovery and scheduled-run evidence.</p></div>{diagnostics ? <span className={`pill ${statusClass(diagnostics.overall)}`}>{String(diagnostics.overall).toUpperCase()}</span> : <Server size={18}/>}</div>{diagnostics ? <><div className='diagnostic-grid'>{(diagnostics.checks || []).map((check: AnyRow) => <div key={check.label} className={statusClass(check.status)}>{check.status === 'healthy' ? <CheckCircle2 size={15}/> : <AlertTriangle size={15}/>}<span><b>{check.label}</b><small>{check.cacheMode} · {num(check.ms)} ms{check.stale ? ' · stale recovery' : ''}</small>{check.detail && <em>{check.detail}</em>}</span></div>)}</div><div className='scheduled-grid'><div><Server size={16}/><span><b>Source-health scheduler</b><small>{diagnostics.scheduled?.sourceHealth?.checkedAt ? `Last recorded ${new Date(diagnostics.scheduled.sourceHealth.checkedAt).toLocaleString()} · ${diagnostics.scheduled.sourceHealth.overall || 'recorded'}` : 'No scheduled source-health run recorded yet.'}</small></span></div><div><Timer size={16}/><span><b>Provider monitor scheduler</b><small>{diagnostics.scheduled?.monitoring?.checkedAt ? `Last recorded ${new Date(diagnostics.scheduled.monitoring.checkedAt).toLocaleString()} · ${diagnostics.scheduled.monitoring.processed || 0} processed · ${diagnostics.scheduled.monitoring.failed || 0} failed` : 'No monitor run recorded yet.'}</small></span></div><div><Database size={16}/><span><b>Physician warehouse scheduler</b><small>{diagnostics.scheduled?.physicianWarehouse?.checkedAt ? `Last recorded ${new Date(diagnostics.scheduled.physicianWarehouse.checkedAt).toLocaleString()} · ${diagnostics.scheduled.physicianWarehouse.status || 'recorded'}` : 'No physician warehouse run recorded yet.'}</small></span></div></div></> : <p className='empty'>Run diagnostics to test the selected provider stack. App architecture is not treated as runtime proof.</p>}</div>

    <div className='panel'><div className='panel-head'><div><span className='kicker'>SYSTEM READINESS</span><h3>Operational versus deliberately scoped</h3><p>Current provider evidence status: {providerStatus.toUpperCase()}.</p></div></div><div className='readiness-list'>{readiness.map(([title,status,detail]) => <div key={title} className={status}><span>{status.toUpperCase()}</span><b>{title}</b><p>{detail}</p></div>)}</div></div>
  </section>;
}
