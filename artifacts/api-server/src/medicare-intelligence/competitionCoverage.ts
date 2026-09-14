import { storage } from './runtime';

async function countPrefix(prefix: string, maxPages = 6) {
  let nextToken: string | undefined;
  let count = 0;
  let pages = 0;
  do {
    const page = await storage.list({ prefix, limit: 500, nextToken });
    count += page.paths.length;
    nextToken = page.nextToken;
    pages += 1;
  } while (nextToken && pages < maxPages);
  return { count, capped: Boolean(nextToken), inspectedPages: pages };
}

export async function getCompetitionCoverageStatus() {
  const [providerIntelligence, providerZipFootprints, zipCollisionCells] = await Promise.all([
    countPrefix('cms-cache/intelligence-v10/'),
    countPrefix('cms-cache/provider-zips/'),
    countPrefix('cms-cache/hospice-zip/'),
  ]);
  return {
    checkedAt: new Date().toISOString(),
    mode: 'incremental-provider-centric-cache',
    providerIntelligence,
    providerZipFootprints,
    zipCollisionCells,
    nationallyComplete: false,
    caveat: 'These counts describe cached competitive evidence created as providers and ZIPs are evaluated. They are not a completed national hospice-competition warehouse. Capped counts are lower bounds, never assumed totals.',
  };
}
