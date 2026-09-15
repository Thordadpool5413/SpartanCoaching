import { getCompetitionWarehouseStatus } from './competitionWarehouse';

export async function getCompetitionCoverageStatus() {
  const status = await getCompetitionWarehouseStatus();
  const complete = status?.status === 'complete';
  return {
    checkedAt: new Date().toISOString(),
    mode: complete ? 'national-competition-warehouse' : 'incremental-provider-centric-cache',
    providerIntelligence: { count: Number(status?.providerCount || 0), capped: false, inspectedPages: Number(status?.shardCount || 0) },
    providerZipFootprints: { count: Number(status?.providerCount || 0), capped: false, inspectedPages: Number(status?.shardCount || 0) },
    zipCollisionCells: { count: Number(status?.zipCount || 0), capped: false, inspectedPages: Number(status?.shardCount || 0) },
    nationallyComplete: complete,
    warehouse: status,
    caveat: complete ? 'National hospice ZIP competition indexes were fully built from CMS Hospice ZIP source rows.' : 'The national competition warehouse is still building. Until it completes, provider-centric caches remain the live fallback.',
  };
}
