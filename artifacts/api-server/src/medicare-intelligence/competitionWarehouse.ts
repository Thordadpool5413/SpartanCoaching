import { storage } from './runtime';
import { fetchJsonWithRetry } from './http';

const PDC = 'https://data.cms.gov/provider-data/api/1/datastore/query';
const PDC_META = 'https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items';
const DATASET_ID = '95rg-2usp';
const PAGE_SIZE = 1500;
const QUEUE = 'warehouse/competition/queue.json';
const STATUS = 'warehouse/competition/status.json';
const PROVIDERS = 'warehouse/competition/providers/';
const ZIPS = 'warehouse/competition/zips/';

type Row = Record<string, unknown>;
type Status = {
  status: 'queued' | 'building' | 'complete' | 'error';
  datasetId: string;
  sourceVersion: string;
  sourceModified: string;
  offset: number;
  rowsProcessed: number;
  totalRows: number;
  providerCount: number;
  zipCount: number;
  shardCount: number;
  updatedAt: string;
  verifiedAt?: string;
  error?: string;
};

const text = (value: unknown) => String(value ?? '').trim();
const hash = (value: string) => { let h = 2166136261; for (let i = 0; i < value.length; i += 1) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); };
const ccn = (value: unknown) => text(value).replace(/\D/g, '').slice(0, 6).padStart(6, '0');
const zip = (value: unknown) => text(value).replace(/\D/g, '').slice(0, 5);
const providerPath = (value: string) => `${PROVIDERS}${value}.json`;
const zipPath = (value: string) => `${ZIPS}${value}.json`;

async function readJson<T>(path: string) {
  const [file] = await storage.read([path]);
  if (!file?.content) return null;
  try { return JSON.parse(file.content) as T; } catch { return null; }
}

async function writeJson(path: string, value: unknown) {
  const [ok] = await storage.write([{ path, content: JSON.stringify(value), contentType: 'application/json' }]);
  if (!ok) throw new Error(`Unable to write ${path}`);
}

async function source() {
  const raw = await fetchJsonWithRetry(PDC_META, { timeout: 18000, retries: 2 }) as Row[];
  const item = raw.find((row) => text(row.identifier) === DATASET_ID);
  const modified = text(item?.modified);
  return { datasetId: DATASET_ID, modified, version: hash(`${DATASET_ID}|${modified}`) };
}

async function readStatus() {
  return readJson<Status>(STATUS);
}

async function writeStatus(status: Status) {
  await writeJson(STATUS, status);
}

async function readIndex(paths: string[]) {
  const files = await storage.read(paths);
  return new Map(files.map((file) => {
    try { return [file.path, file.content ? JSON.parse(file.content) as string[] : []] as const; } catch { return [file.path, []] as const; }
  }));
}

async function fetchPage(offset: number) {
  const url = new URL(`${PDC}/${DATASET_ID}/0`);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  const raw = await fetchJsonWithRetry(url.toString(), { timeout: 20000, retries: 2 }) as any;
  return { rows: Array.isArray(raw?.results) ? raw.results as Row[] : [], count: Number(raw?.count ?? raw?.total ?? 0) || 0 };
}

export async function seedNationalCompetitionWarehouse() {
  const src = await source();
  const existing = await readStatus();
  if (existing?.status === 'complete' && existing.sourceVersion === src.version) return existing;
  const next: Status = existing?.sourceVersion === src.version ? { ...existing, status: existing.status === 'error' ? 'queued' : existing.status, updatedAt: new Date().toISOString(), error: undefined } : { status: 'queued', datasetId: src.datasetId, sourceVersion: src.version, sourceModified: src.modified, offset: 0, rowsProcessed: 0, totalRows: 0, providerCount: 0, zipCount: 0, shardCount: 0, updatedAt: new Date().toISOString() };
  await Promise.all([writeStatus(next), writeJson(QUEUE, { queuedAt: new Date().toISOString(), sourceVersion: src.version })]);
  return next;
}

export async function processCompetitionWarehouseStep(maxPages = 1) {
  const [queued, src] = await Promise.all([readJson<{ queuedAt: string; sourceVersion: string }>(QUEUE), source()]);
  if (!queued) return { processed: false, reason: 'no queued warehouse', status: { status: 'complete' } };
  let status = await readStatus();
  if (!status || status.sourceVersion !== src.version) status = await seedNationalCompetitionWarehouse();
  try {
    for (let page = 0; page < Math.max(1, maxPages); page += 1) {
      const current = status!;
      const pulled = await fetchPage(current.offset);
      const byProvider = new Map<string, Set<string>>(), byZip = new Map<string, Set<string>>();
      for (const row of pulled.rows) {
        const providerCcn = ccn(row.cms_certification_number_ccn);
        const serviceZip = zip(row.zip_code);
        if (!/^\d{6}$/.test(providerCcn) || !/^\d{5}$/.test(serviceZip)) continue;
        byProvider.set(providerCcn, new Set([...(byProvider.get(providerCcn) || []), serviceZip]));
        byZip.set(serviceZip, new Set([...(byZip.get(serviceZip) || []), providerCcn]));
      }
      const providerPaths = [...byProvider.keys()].map(providerPath), zipPaths = [...byZip.keys()].map(zipPath);
      const [providerExisting, zipExisting] = await Promise.all([providerPaths.length ? readIndex(providerPaths) : new Map<string, string[]>(), zipPaths.length ? readIndex(zipPaths) : new Map<string, string[]>()]);
      const writes: Array<{ path: string; content: string; contentType: string }> = [];
      let newProviders = 0, newZips = 0;
      for (const [providerCcn, values] of byProvider.entries()) {
        const path = providerPath(providerCcn), existing = providerExisting.get(path) || [];
        if (!existing.length) newProviders += 1;
        writes.push({ path, content: JSON.stringify([...new Set([...existing, ...values])].sort()), contentType: 'application/json' });
      }
      for (const [serviceZip, values] of byZip.entries()) {
        const path = zipPath(serviceZip), existing = zipExisting.get(path) || [];
        if (!existing.length) newZips += 1;
        writes.push({ path, content: JSON.stringify([...new Set([...existing, ...values])].sort()), contentType: 'application/json' });
      }
      if (writes.length) {
        const results = await storage.write(writes);
        if (results.some((ok) => !ok)) throw new Error('Competition warehouse index write failed');
      }
      const offset = current.offset + pulled.rows.length, totalRows = Math.max(current.totalRows, pulled.count);
      status = { ...current, status: offset >= totalRows || pulled.rows.length < PAGE_SIZE ? 'complete' : 'building', offset, rowsProcessed: offset, totalRows, providerCount: current.providerCount + newProviders, zipCount: current.zipCount + newZips, shardCount: current.shardCount + 1, updatedAt: new Date().toISOString(), verifiedAt: offset >= totalRows || pulled.rows.length < PAGE_SIZE ? new Date().toISOString() : current.verifiedAt, error: undefined };
      await writeStatus(status);
      if (status.status === 'complete') {
        await storage.delete([QUEUE]);
        break;
      }
    }
    return { processed: true, status };
  } catch (error) {
    status = { ...(status as Status), status: 'error', updatedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) };
    await writeStatus(status);
    return { processed: true, status };
  }
}

export async function getCompetitionWarehouseStatus() {
  const seeded = await seedNationalCompetitionWarehouse();
  return (await readStatus()) || seeded;
}

export async function readCompetitionWarehouseProviderZips(providerCcn: string) {
  const status = await readStatus();
  if (status?.status !== 'complete') return null;
  return { zips: (await readJson<string[]>(providerPath(ccn(providerCcn)))) || [], status };
}

export async function readCompetitionWarehouseProvidersByZip(zips: string[]) {
  const status = await readStatus();
  if (status?.status !== 'complete') return null;
  const normalized = zips.map(zip).filter((value) => /^\d{5}$/.test(value));
  if (!normalized.length) return { byZip: new Map<string, string[]>(), status };
  const files = await storage.read(normalized.map(zipPath));
  const byZip = new Map<string, string[]>();
  for (const file of files) {
    const key = file.path.replace(ZIPS, '').replace(/\.json$/, '');
    try { byZip.set(key, file.content ? JSON.parse(file.content) as string[] : []); } catch { byZip.set(key, []); }
  }
  return { byZip, status };
}
