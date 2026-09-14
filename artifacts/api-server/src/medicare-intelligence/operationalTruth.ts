import { db } from './runtime';

type Tri = 'Yes' | 'No' | 'Unknown';
type Serviceability = 'Confirmed' | 'Conditional' | 'Hold' | 'Unknown';
type RelationshipContext = 'Open' | 'Existing' | 'Restricted' | 'Unknown';

export type OperationalTruth = {
  providerCcn: string;
  fips: string;
  areaName: string;
  serviceability: Serviceability;
  travelReady: Tri;
  staffingReady: Tri;
  sameDayReady: Tri;
  branch: string;
  owner: string;
  driveMinutes: number | null;
  relationshipContext: RelationshipContext;
  note: string;
  updatedAt: string;
};

type TruthHistory = {
  providerCcn: string;
  fips: string;
  areaName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changedFields: string[];
  before: OperationalTruth | null;
  after: OperationalTruth | null;
  createdAt: string;
};

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
const ccn = (value: unknown) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits || digits.length > 6) throw new Error('A valid hospice CCN is required.');
  return digits.padStart(6, '0');
};
const fips = (value: unknown) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!/^\d{5}$/.test(digits)) throw new Error('A five-digit county/equivalent FIPS is required.');
  return digits;
};
const table = (userId: string, providerCcn: string) => `operational-truth:${userId}:${ccn(providerCcn)}`;
const historyTable = (userId: string, providerCcn: string, areaFips: string) => `operational-truth-history:${userId}:${ccn(providerCcn)}:${fips(areaFips)}`;
const tri = (value: unknown): Tri => ['Yes', 'No', 'Unknown'].includes(String(value)) ? String(value) as Tri : 'Unknown';
const service = (value: unknown): Serviceability => ['Confirmed', 'Conditional', 'Hold', 'Unknown'].includes(String(value)) ? String(value) as Serviceability : 'Unknown';
const relationship = (value: unknown): RelationshipContext => ['Open', 'Existing', 'Restricted', 'Unknown'].includes(String(value)) ? String(value) as RelationshipContext : 'Unknown';

const changedFields = (before: OperationalTruth | null, after: OperationalTruth | null) => {
  const fields: Array<keyof OperationalTruth> = ['areaName', 'serviceability', 'travelReady', 'staffingReady', 'sameDayReady', 'branch', 'owner', 'driveMinutes', 'relationshipContext', 'note'];
  if (!before || !after) return fields.map(String);
  return fields.filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field])).map(String);
};

async function addHistory(userId: string, record: TruthHistory) {
  try {
    const [id] = await db.add(historyTable(userId, record.providerCcn, record.fips), [record]);
    if (!id) console.warn('operational_truth_history_write_failed', record.providerCcn, record.fips);
  } catch (error) {
    console.warn('operational_truth_history_write_failed', record.providerCcn, record.fips, error instanceof Error ? error.message : String(error));
  }
}

export async function listOperationalTruth(userId: string, providerCcn: string) {
  const page = await db.list<OperationalTruth>(table(userId, providerCcn), { limit: 250 });
  const records = page.items.sort((a, b) => String(a.areaName || a.fips).localeCompare(String(b.areaName || b.fips)));
  return { records, truncated: Boolean(page.nextToken), warning: page.nextToken ? 'More than 250 internal territory records exist for this hospice. The current operating layer is limited to the first stored page.' : '' };
}

export async function listOperationalTruthHistory(userId: string, providerCcn: string, fipsRaw: string) {
  const areaFips = fips(fipsRaw);
  const page = await db.list<TruthHistory>(historyTable(userId, providerCcn, areaFips), { limit: 100 });
  const records = page.items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { records, truncated: Boolean(page.nextToken), warning: page.nextToken ? 'More than 100 operating-evidence changes exist for this territory. The visible audit trail shows the newest stored page.' : '' };
}

export async function upsertOperationalTruth(userId: string, fipsRaw: string, input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const providerCcn = ccn(body.providerCcn);
  const areaFips = fips(fipsRaw);
  const currentTable = table(userId, providerCcn);
  const page = await db.list<OperationalTruth>(currentTable, { limit: 250 });
  const existing = page.items.find((item) => item.fips === areaFips);
  const driveRaw = body.driveMinutes === null || body.driveMinutes === undefined || String(body.driveMinutes).trim() === '' ? null : Number(body.driveMinutes);
  const record: OperationalTruth = {
    providerCcn,
    fips: areaFips,
    areaName: clean(body.areaName, 120),
    serviceability: service(body.serviceability),
    travelReady: tri(body.travelReady),
    staffingReady: tri(body.staffingReady),
    sameDayReady: tri(body.sameDayReady),
    branch: clean(body.branch, 120),
    owner: clean(body.owner, 120),
    driveMinutes: driveRaw !== null && Number.isFinite(driveRaw) ? Math.max(0, Math.min(600, driveRaw)) : null,
    relationshipContext: relationship(body.relationshipContext),
    note: clean(body.note, 1200),
    updatedAt: new Date().toISOString(),
  };
  const before = existing ? Object.fromEntries(Object.entries(existing).filter(([key]) => key !== 'id')) as OperationalTruth : null;
  if (existing?.id) {
    const [ok] = await db.update(currentTable, [{ id: existing.id, record }]);
    if (!ok) throw new Error('Unable to update internal operating evidence.');
    await addHistory(userId, { providerCcn, fips: areaFips, areaName: record.areaName, action: 'UPDATE', changedFields: changedFields(before, record), before, after: record, createdAt: record.updatedAt });
    return { id: existing.id, ...record };
  }
  const [id] = await db.add(currentTable, [record]);
  if (!id) throw new Error('Unable to save internal operating evidence.');
  await addHistory(userId, { providerCcn, fips: areaFips, areaName: record.areaName, action: 'CREATE', changedFields: changedFields(null, record), before: null, after: record, createdAt: record.updatedAt });
  return { id, ...record };
}

export async function deleteOperationalTruth(userId: string, providerCcn: string, fipsRaw: string) {
  const currentTable = table(userId, providerCcn);
  const areaFips = fips(fipsRaw);
  const page = await db.list<OperationalTruth>(currentTable, { limit: 250 });
  const existing = page.items.find((item) => item.fips === areaFips);
  if (!existing?.id) return { deleted: false, fips: areaFips };
  const before = Object.fromEntries(Object.entries(existing).filter(([key]) => key !== 'id')) as OperationalTruth;
  const [ok] = await db.delete(currentTable, [existing.id]);
  if (ok) await addHistory(userId, { providerCcn: ccn(providerCcn), fips: areaFips, areaName: before.areaName, action: 'DELETE', changedFields: changedFields(before, null), before, after: null, createdAt: new Date().toISOString() });
  return { deleted: Boolean(ok), fips: areaFips };
}

export function applyOperationalTruth(deployment: any, records: any[]) {
  const byFips = new Map(records.map((record) => [String(record.fips), record]));
  const markets = (deployment?.markets || []).map((market: any) => {
    const truth = byFips.get(String(market.fips));
    if (!truth) return { ...market, publicGate: market.gate, effectiveGate: market.gate, operationalVerification: 'UNVERIFIED', operationalTruth: null };
    const hardHold = truth.serviceability === 'Hold' || truth.travelReady === 'No' || truth.staffingReady === 'No' || truth.sameDayReady === 'No';
    const fullyReady = truth.serviceability === 'Confirmed' && truth.travelReady === 'Yes' && truth.staffingReady === 'Yes' && truth.sameDayReady === 'Yes';
    const effectiveGate = hardHold ? 'HOLD' : fullyReady ? 'GO' : 'CONDITIONAL';
    return {
      ...market,
      publicGate: market.gate,
      gate: effectiveGate,
      effectiveGate,
      operationalVerification: fullyReady ? 'VERIFIED READY' : hardHold ? 'VERIFIED BLOCK' : 'PARTIALLY VERIFIED',
      operationalTruth: truth,
      decision: hardHold ? 'Internal operating evidence blocks deployment until the named constraint is resolved.' : fullyReady ? `${market.decision} Internal serviceability, travel, staffing and same-day readiness are verified for this user's operating context.` : `${market.decision} Internal operating evidence is incomplete, so the effective gate remains conditional.`,
    };
  });
  return {
    ...deployment,
    markets,
    operationalTruth: { records: records.length, verifiedMarkets: markets.filter((market: any) => market.operationalVerification === 'VERIFIED READY').length, blockedMarkets: markets.filter((market: any) => market.operationalVerification === 'VERIFIED BLOCK').length },
    caveat: `${deployment?.caveat || ''} Signed-in operational truth is private user-supplied evidence and is kept separate from CMS-measured data.`,
  };
}
