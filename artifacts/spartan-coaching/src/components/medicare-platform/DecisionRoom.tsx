import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Database, Download, LockKeyhole, Save, ShieldCheck, Target, Trash2 } from 'lucide-react';
import { api } from './api';
import type { AnyRow, DashboardData, Provider, ProviderDetail, TabId, User } from './types';
import { buildEvidenceAlignment, evidenceConfidence } from './intelligenceMath';
import { apiError, clamp, csvDownload, num, pct, today } from './utils';

type Decision = { key: string; category: string; gate: 'GO'|'CONDITIONAL'|'HOLD'; priority: number; confidence: number; title: string; decision: string; why: string[]; next: string; success: string; stop: string; source: string; tab: TabId; physicianNpi?: string };

const plusDays = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); };

export default function DecisionRoom({ state, stateName, market, provider, detail, user, onSignIn, onNavigate }: { state: string; stateName: string; market: DashboardData; provider: Provider; detail: ProviderDetail | null; user: User | null; onSignIn: () => void; onNavigate: (tab: TabId, options?: { physicianNpi?: string }) => void }) {
  const [intel, setIntel] = useState<AnyRow | null>(null);
  const [geo, setGeo] = useState<AnyRow | null>(null);
  const [deployment, setDeployment] = useState<AnyRow | null>(null);
  const [physicianMeta, setPhysicianMeta] = useState<AnyRow>({});
  const [actions, setActions] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  const ccn = provider.ccn;

  const loadActions = async () => {
    if (!user) { setActions([]); return; }
    try { const response = await api.get(`/api/decision-actions?ccn=${encodeURIComponent(ccn)}`); setActions(response.data.records || []); }
    catch (requestError) { setError(apiError(requestError, 'Execution queue failed to load.')); }
  };

  useEffect(() => {
    let live = true;
    setLoading(true); setError(''); setIntel(null); setGeo(null); setDeployment(null); setPhysicianMeta({});
    void Promise.allSettled([
      api.get(`/api/intelligence?ccn=${encodeURIComponent(ccn)}&state=${encodeURIComponent(state)}`),
      api.get(`/api/service-geography/${encodeURIComponent(ccn)}`),
      api.get(`${user ? '/api/territory-deployment-private' : '/api/territory-deployment'}/${encodeURIComponent(ccn)}?state=${encodeURIComponent(state)}`),
      api.get(`/api/physicians/${encodeURIComponent(state)}?ccn=${encodeURIComponent(ccn)}`),
    ]).then((results) => {
      if (!live) return;
      if (results[0].status === 'fulfilled') setIntel(results[0].value.data);
      if (results[1].status === 'fulfilled') setGeo(results[1].value.data);
      if (results[2].status === 'fulfilled') setDeployment(results[2].value.data);
      if (results[3].status === 'fulfilled') setPhysicianMeta(results[3].value.data);
      const failures = results.filter((result) => result.status === 'rejected').length;
      if (failures) setError(`${failures} decision input${failures === 1 ? '' : 's'} could not be refreshed. Recommendations using those inputs are scoped.`);
    }).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [ccn, state, user?.userId]);
  useEffect(() => { void loadActions(); }, [user?.userId, ccn]);

  const alignment = useMemo(() => buildEvidenceAlignment(detail, intel, market.sources || []), [detail, intel, market.sources]);
  const confidence = useMemo(() => evidenceConfidence(market, detail, geo, intel, physicianMeta, alignment), [market, detail, geo, intel, physicianMeta, alignment]);
  const topThreat = intel?.threats?.[0];
  const topCounty = (deployment?.markets || []).find((row: AnyRow) => row.motion === 'DENSIFY') || (deployment?.markets || [])[0];
  const expansion = (deployment?.markets || []).find((row: AnyRow) => row.motion === 'ADJACENT EXPANSION');
  const topPhysician = physicianMeta?.physicians?.[0];
  const topSnf = market.snfs?.[0];

  const decisions = useMemo(() => {
    const rows: Decision[] = [];
    const adjusted = (value: number) => clamp(value - alignment.confidencePenalty);
    if (topCounty) rows.push({ key: `density:${topCounty.fips}`, category: 'TERRITORY', gate: (topCounty.effectiveGate || topCounty.gate || 'CONDITIONAL') as Decision['gate'], priority: 94, confidence: adjusted(Number(topCounty.evidenceCoveragePct) || confidence.base), title: `${topCounty.motion === 'DENSIFY' ? 'Densify' : 'Prioritize'} ${topCounty.name}`, decision: topCounty.motion === 'DENSIFY' ? 'Concentrate field attention inside demonstrated service geography before adding avoidable travel.' : 'Treat this county as the strongest current territory screen while preserving the operating gate.', why: [`County Demand / deployment score: ${num(topCounty.score)}/100 with ${num(topCounty.evidenceCoveragePct)}% evidence coverage.`, topCounty.served ? 'CMS service geography confirms observed patient-service activity in this county/equivalent.' : 'This area is not treated as current serviceability merely because the public demand signal is attractive.'], next: 'Build a named account map across SNFs, hospitals and serious-illness clinicians, then verify account ownership and response capacity.', success: 'Referral density improves without creating delayed admissions or unnecessary windshield time.', stop: 'Stop or change the motion if serviceability, staffing, same-day admission capacity or account density cannot support it.', source: topCounty.operationalTruth ? 'CMS market/geography evidence + private internal operational truth' : 'CMS market, service geography and Territory Deployment 3.0', tab: 'territory' });
    if (expansion) rows.push({ key: `expand:${expansion.fips}`, category: 'EXPANSION', gate: (expansion.effectiveGate || expansion.gate || 'CONDITIONAL') as Decision['gate'], priority: 78, confidence: adjusted(Number(expansion.evidenceCoveragePct) || confidence.base), title: `Screen ${expansion.name} for expansion`, decision: 'Investigate the adjacent market, but do not assign recurring field coverage until operating evidence clears the gate.', why: [`Territory Deployment score: ${num(expansion.score)}/100.`, 'Adjacency and demand can justify a screen, but they do not establish licensure, drive time, staffing or same-day capacity.'], next: 'Verify licensure/serviceability, drive time, staffing, intake coverage, referral density and competitive saturation.', success: 'A documented go/no-go expansion case with a named operating owner.', stop: 'Hold if any controlling internal readiness fact is No or serviceability is not confirmed.', source: expansion.operationalTruth ? 'CMS Territory Deployment 3.0 + private operational truth' : 'CMS Territory Deployment 3.0', tab: 'territory' });
    if (topThreat) rows.push({ key: `threat:${topThreat.ccn}`, category: 'COMPETITION', gate: intel?.serviceArea?.partial ? 'CONDITIONAL' : 'GO', priority: 90, confidence: adjusted(intel?.serviceArea?.partial ? 70 : 90), title: `Defend against ${topThreat.name}`, decision: 'Protect the referral channels where the measured service footprints collide.', why: [`${num(topThreat.shared)} shared service ZIPs and ${pct(topThreat.jaccardPct)} Jaccard overlap create direct public-market collision.`, `Threat Score V3: ${num(topThreat.threatScore)}/100. Missing scale or growth evidence is reweighted rather than scored as zero.`], next: 'Map overlapping accounts, recent losses, response-speed gaps and verifiable quality or capability proof points.', success: 'Fewer field losses in overlapping accounts and a specific counter-position for the team.', stop: 'Do not treat Threat Score as evidence of competitor misconduct, poor care or guaranteed win probability.', source: 'CMS Hospice ZIP + PAC peer comparison', tab: 'intelligence' });
    if (topSnf) rows.push({ key: `snf:${topSnf.ccn}`, category: 'ACCOUNT', gate: 'GO', priority: 84, confidence: adjusted(Number(topSnf.opportunityCoveragePct) || confidence.base), title: `Prioritize ${topSnf.name}`, decision: 'Place this SNF into the active account-development cadence based on reportable facility scale and surrounding market context.', why: [`CMS reports ${num(topSnf.residents, 1)} average residents per day and ${num(topSnf.beds)} certified beds.`, `The facility prospecting rank is ${num(topSnf.score)}/100 where evidence is reportable.`], next: 'Map administrator, DON, case management, current hospice relationships, response-time pain and decline-identification workflow.', success: 'A measurable referral relationship or a documented reason to deprioritize the account.', stop: 'High resident census is prospecting scale, never proof that a specific resident is hospice eligible.', source: 'CMS Nursing Home Provider Information', tab: 'referral' });
    if (topPhysician) rows.push({ key: `clinician:${topPhysician.npi}`, category: 'ACCOUNT', gate: topPhysician.inServiceArea ? 'GO' : 'CONDITIONAL', priority: 82, confidence: adjusted(Number(topPhysician.scoreCoveragePct) || confidence.base), title: `Develop ${topPhysician.name}`, decision: 'Prioritize an education-first clinician relationship based on Medicare panel scale, serious-illness mix and specialty relevance.', why: [`CMS reports ${num(topPhysician.beneficiaries)} Medicare beneficiaries and a ${num(topPhysician.score)}/100 confidence-adjusted prospecting rank.`, `${num(topPhysician.conditionCoveragePct)}% of modeled condition evidence is reportable.`, topPhysician.inServiceArea ? `${topPhysician.county || 'The approximated county'} sits inside the selected hospice's observed service geography.` : topPhysician.county ? `${topPhysician.county} is outside the selected hospice's observed service geography, so the account remains a serviceability screen.` : 'County-level fit could not be resolved from the published ZCTA crosswalk.'], next: topPhysician.inServiceArea ? 'Lead with decline patterns relevant to the specialty and make the referral conversation operationally simple.' : 'Verify serviceability and ownership before assigning recurring field coverage, then lead with specialty-relevant decline patterns.', success: 'The practice identifies appropriate hospice conversations earlier and knows exactly how to reach the hospice.', stop: 'Never infer that any specific patient is hospice eligible from clinician panel data.', source: 'CMS Physician & Other Practitioners + ZCTA county approximation + observed hospice service geography', tab: 'referral', physicianNpi: topPhysician.npi });
    return rows.sort((a, b) => b.priority - a.priority).slice(0, 7);
  }, [topCounty, expansion, topThreat, topSnf, topPhysician, alignment.confidencePenalty, confidence.base, intel]);

  const debt = useMemo(() => {
    const rows: string[] = [];
    if (!geo || geo.available === false) rows.push('Provider service geography is unresolved, so expansion remains a screen rather than a deployable territory decision.');
    if (detail?.dataQuality?.status !== 'healthy') rows.push('One or more provider evidence domains are limited or not reportable.');
    if (physicianMeta?.partial) rows.push('The live state clinician source reached its configured row ceiling while the checkpointed warehouse is incomplete.');
    if (alignment.status === 'PERIOD MISMATCH') rows.push(`Core source periods span ${alignment.spanYears} years, reducing composite evidence confidence by ${alignment.confidencePenalty} points.`);
    if (!user) rows.push('Private operating truth and field Win/Loss evidence are not available until the workspace is signed in.');
    return rows;
  }, [geo, detail, physicianMeta, alignment, user]);

  const queued = new Set(actions.filter((action) => action.status !== 'Complete').map((action) => action.recommendationKey));
  const commit = async (decision: Decision) => {
    if (!user) { onSignIn(); return; }
    setSaving(decision.key);
    try { await api.post('/api/decision-actions', { providerCcn: ccn, recommendationKey: decision.key, title: decision.title, category: decision.category, gate: decision.gate, priority: decision.priority, status: 'Committed', dueDate: plusDays(decision.gate === 'HOLD' ? 7 : 14), owner: '', note: '' }); await loadActions(); }
    catch (requestError) { setError(apiError(requestError, 'Unable to add decision to execution.')); }
    finally { setSaving(''); }
  };
  const saveAction = async (action: AnyRow) => { setSaving(action.id); try { await api.put(`/api/decision-actions/${encodeURIComponent(action.id)}`, { providerCcn: ccn, status: action.status, owner: action.owner, dueDate: action.dueDate, note: action.note }); await loadActions(); } catch (requestError) { setError(apiError(requestError, 'Unable to save execution action.')); } finally { setSaving(''); } };
  const removeAction = async (action: AnyRow) => { setSaving(action.id); try { await api.delete(`/api/decision-actions/${encodeURIComponent(action.id)}?ccn=${encodeURIComponent(ccn)}`); await loadActions(); } catch (requestError) { setError(apiError(requestError, 'Unable to remove execution action.')); } finally { setSaving(''); } };
  const patch = (id: string, key: string, value: string) => setActions((current) => current.map((action) => action.id === id ? { ...action, [key]: value } : action));
  const exportBrief = () => csvDownload(`decision-brief-${ccn}-${today()}.csv`, [['Expert Decision Brief', provider.name], ['CCN', ccn], ['Market', stateName], ['Decision confidence', `${confidence.adjusted}%`], ['Period alignment', alignment.status], [], ['Rank','Gate','Category','Decision','Confidence','Why','Next','Success','Stop','Evidence'], ...decisions.map((decision, index) => [index + 1, decision.gate, decision.category, decision.title, `${decision.confidence}%`, decision.why.join(' | '), decision.next, decision.success, decision.stop, decision.source]), [], ['Decision debt'], ...debt.map((item) => [item])]);

  return <section className='page'>
    <div className='hero'><div><span className='kicker'>EXPERT DECISION ROOM · {stateName.toUpperCase()}</span><h2>What should we do next, why, and what would make us change our mind?</h2><p>{provider.name} · CCN {ccn}. Intelligence is only useful when it changes a decision, action or resource allocation.</p></div><div className='hero-actions'><button onClick={exportBrief}><Download size={15}/>Export brief</button><button onClick={() => onNavigate('growth')}><ArrowUpRight size={15}/>Growth model</button></div></div>
    {error && <div className='alert'><AlertTriangle size={16}/>{error}</div>}
    <div className='executive-posture'><ShieldCheck size={24}/><div><span className='kicker'>EXECUTIVE DECISION POSTURE</span><h3>{detail?.dataQuality?.status === 'degraded' ? 'HOLD' : confidence.adjusted >= 80 ? 'GO' : 'CONDITIONAL'}</h3><p>Confidence is weighted evidence completeness after source-period alignment. It is not a probability of success.</p></div><div className='posture-stats'><span><b>{confidence.adjusted}%</b><small>decision confidence</small></span><span><b>{decisions.filter((decision) => decision.gate === 'GO').length}</b><small>go decisions</small></span><span><b>{debt.length}</b><small>open unknowns</small></span></div></div>
    <div className='decision-layout'>    <div className='decision-stack'>{loading && !decisions.length && <div className='panel empty'>Building decision evidence...</div>}{decisions.map((decision, index) => <article className={`decision-card ${decision.gate.toLowerCase()}`} key={decision.key}><div className='decision-rank'>{String(index + 1).padStart(2, '0')}</div><div className='decision-body'><div className='decision-meta'><span className='decision-gate'>{decision.gate}</span><span>{decision.category}</span><span>{decision.confidence}% EVIDENCE CONFIDENCE</span></div><h3>{decision.title}</h3><p className='decision-statement'>{decision.decision}</p><div className='decision-evidence'>{decision.why.map((why) => <span key={why}><CheckCircle2 size={14}/>{why}</span>)}</div><details className='evidence-ledger'><summary><Database size={14}/>Evidence ledger <span>{alignment.status}</span></summary><div><p><b>Evidence basis</b>{decision.source}</p>{decision.why.map((why) => <p key={why}><b>Supporting fact</b>{why}</p>)}<p><b>Period alignment</b>{alignment.status}{alignment.confidencePenalty ? ` · ${alignment.confidencePenalty}-point public-evidence adjustment` : ''}</p><p><b>Boundary</b>Evidence confidence is completeness, not future-success probability.</p></div></details><div className='decision-operating'><div><span>NEXT MOVE</span><p>{decision.next}</p></div><div><span>SUCCESS LOOKS LIKE</span><p>{decision.success}</p></div><div><span>STOP / CHANGE IF</span><p>{decision.stop}</p></div></div><div className='decision-actions'><button onClick={() => onNavigate(decision.tab, decision.physicianNpi ? { physicianNpi: decision.physicianNpi } : undefined)}>Open supporting intelligence <ArrowUpRight size={14}/></button><button className='primary' disabled={queued.has(decision.key) || saving === decision.key} onClick={() => void commit(decision)}>{queued.has(decision.key) ? 'In execution queue' : saving === decision.key ? 'Adding...' : 'Commit to execution'}</button></div></div></article>)}{!loading && !decisions.length && <div className='panel empty'>No defensible recommendation has enough evidence yet. The platform will not manufacture one to keep the screen busy.</div>}</div>
      <aside><div className='panel'><div className='panel-head'><div><span className='kicker'>DECISION DEBT</span><h3>What we still do not know</h3></div><AlertTriangle size={17}/></div><div className='debt-list'>{debt.length ? debt.map((item) => <p key={item}>{item}</p>) : <p><CheckCircle2 size={14}/>No material decision gaps detected in the current evidence set.</p>}</div></div><div className='panel alignment-mini'><span className='kicker'>SOURCE PERIOD ALIGNMENT</span><h3>{alignment.status}</h3><p>{alignment.explanation}</p></div></aside>
    </div>

    <section className='panel execution-queue'><div className='panel-head'><div><span className='kicker'>EXECUTION QUEUE · PRIVATE</span><h3>Turn decisions into accountable work</h3><p>Assign an owner, due date, status and operating note. No patient PHI belongs here.</p></div>{user ? <span className='pill'>{actions.length} TRACKED</span> : <LockKeyhole size={18}/>}</div>{!user ? <div className='auth-lock'><LockKeyhole size={25}/><div><b>Sign in to own the decisions.</b><p>Public intelligence stays public. Commitments and execution notes stay in your private workspace.</p></div><button className='primary' onClick={onSignIn}>Sign in</button></div> : actions.length ? <div className='execution-list'>{actions.map((action) => <div className='execution-row' key={action.id}><div><b>{action.title}</b><small>{action.category} · {action.gate}</small></div><label><span>Status</span><select value={action.status} onChange={(event) => patch(action.id, 'status', event.target.value)}>{['Committed','In progress','Blocked','Complete','Deferred'].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Owner</span><input value={action.owner || ''} onChange={(event) => patch(action.id, 'owner', event.target.value)} placeholder='Owner'/></label><label><span>Due</span><input type='date' value={action.dueDate || ''} onChange={(event) => patch(action.id, 'dueDate', event.target.value)}/></label><label className='wide'><span>Execution note</span><input value={action.note || ''} onChange={(event) => patch(action.id, 'note', event.target.value)} placeholder='What changed, what is blocked, what happens next?'/></label><div className='row-actions'><button disabled={saving === action.id} onClick={() => void saveAction(action)}><Save size={14}/>Save</button><button disabled={saving === action.id} onClick={() => void removeAction(action)}><Trash2 size={14}/>Remove</button></div></div>)}</div> : <div className='empty'>No committed decisions yet.</div>}</section>
  </section>;
}
