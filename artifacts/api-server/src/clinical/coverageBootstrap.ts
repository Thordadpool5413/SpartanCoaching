import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { coverageSnapshots } from "@workspace/db";
import { db } from "../db";
import { sha256Value } from "../security/phiEncryption";

/** Provenance for the synthetic first-boot seed — never claim CMS_MCD. */
export const EDUCATIONAL_BASELINE_SOURCE = "EDUCATIONAL_BASELINE";
export const EDUCATIONAL_BASELINE_DOCUMENT_ID = "SPARTAN-HOSPICE-BASELINE";

/**
 * Public educational baseline for hospice LCD-oriented tools.
 * Used only when the coverage_snapshots table has no rows so PHI-mode tools
 * can run without a manual CMS sync on first deploy. Live CMS sync remains
 * preferred and is selected over this seed when present.
 */
const BASELINE_PAYLOAD = {
  source: EDUCATIONAL_BASELINE_SOURCE,
  documentType: "lcd",
  documentId: EDUCATIONAL_BASELINE_DOCUMENT_ID,
  title: "Hospice educational coverage baseline (public policy summary)",
  note:
    "Educational decision support only. Not a CMS LCD text, coverage determination, diagnosis, or admission decision. Replace with a live CMS MCD snapshot via /api/clinical/coverage/sync for production policy fidelity.",
  hospiceBenefitSummary: {
    benefit: "Medicare Hospice Benefit",
    prognosis:
      "Physician certification of terminal illness with life expectancy of six months or less if the illness runs its normal course.",
    election:
      "Patient (or representative) elects hospice and waives curative Medicare coverage for the terminal diagnosis while retaining coverage for unrelated conditions.",
    levelsOfCare: [
      "Routine home care",
      "Continuous home care",
      "Inpatient respite care",
      "General inpatient care",
    ],
    documentationThemes: [
      "Terminal diagnosis and related conditions",
      "Functional decline and performance status trends",
      "Weight loss / nutritional decline when relevant",
      "Symptom burden and hospitalization patterns",
      "Goals of care and informed election",
    ],
  },
} as const;

let bootstrapPromise: Promise<string | null> | null = null;

export function isEducationalBaselineSnapshot(snapshot: {
  source?: string | null;
  documentId?: string | null;
}): boolean {
  return (
    snapshot.source === EDUCATIONAL_BASELINE_SOURCE ||
    snapshot.documentId === EDUCATIONAL_BASELINE_DOCUMENT_ID
  );
}

export async function ensureBaselineCoverageSnapshot(): Promise<string | null> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        const [existing] = await db
          .select({ id: coverageSnapshots.id })
          .from(coverageSnapshots)
          .orderBy(desc(coverageSnapshots.fetchedAt))
          .limit(1);
        if (existing?.id) return existing.id;

        const contentHash = sha256Value(BASELINE_PAYLOAD);
        const [created] = await db
          .insert(coverageSnapshots)
          .values({
            source: EDUCATIONAL_BASELINE_SOURCE,
            documentType: "lcd",
            documentId: EDUCATIONAL_BASELINE_DOCUMENT_ID,
            version: "baseline-1",
            jurisdiction: "US",
            title: BASELINE_PAYLOAD.title,
            sourceUrl:
              "https://www.cms.gov/medicare/payment/fee-for-service-providers/hospice",
            contentHash,
            effectiveAt: new Date("2024-01-01T00:00:00.000Z"),
            payload: BASELINE_PAYLOAD,
          })
          .onConflictDoNothing()
          .returning({ id: coverageSnapshots.id });

        if (created?.id) return created.id;

        const [retry] = await db
          .select({ id: coverageSnapshots.id })
          .from(coverageSnapshots)
          .orderBy(desc(coverageSnapshots.fetchedAt))
          .limit(1);
        return retry?.id ?? null;
      } catch {
        // DB may be unavailable during unit tests without integration flag.
        return null;
      } finally {
        setTimeout(() => {
          bootstrapPromise = null;
        }, 30_000);
      }
    })();
  }
  return bootstrapPromise;
}

/**
 * Prefer live (non-educational) snapshots over the educational baseline.
 */
export async function loadLatestCoverageSnapshot() {
  await ensureBaselineCoverageSnapshot();

  const [preferred] = await db
    .select()
    .from(coverageSnapshots)
    .where(
      and(
        isNull(coverageSnapshots.retiredAt),
        ne(coverageSnapshots.source, EDUCATIONAL_BASELINE_SOURCE),
      ),
    )
    .orderBy(desc(coverageSnapshots.fetchedAt))
    .limit(1);
  if (preferred) return preferred;

  const [baseline] = await db
    .select()
    .from(coverageSnapshots)
    .where(
      and(
        isNull(coverageSnapshots.retiredAt),
        eq(coverageSnapshots.source, EDUCATIONAL_BASELINE_SOURCE),
      ),
    )
    .orderBy(desc(coverageSnapshots.fetchedAt))
    .limit(1);
  if (baseline) return baseline;

  const [any] = await db
    .select()
    .from(coverageSnapshots)
    .orderBy(desc(coverageSnapshots.fetchedAt))
    .limit(1);
  return any ?? null;
}

/** True when the only available snapshot is the educational seed. */
export async function coverageUsesEducationalBaseline(): Promise<boolean> {
  try {
    const [live] = await db
      .select({ id: coverageSnapshots.id })
      .from(coverageSnapshots)
      .where(
        and(
          isNull(coverageSnapshots.retiredAt),
          ne(coverageSnapshots.source, EDUCATIONAL_BASELINE_SOURCE),
        ),
      )
      .limit(1);
    if (live) return false;
    const latest = await loadLatestCoverageSnapshot();
    return latest ? isEducationalBaselineSnapshot(latest) : false;
  } catch {
    return false;
  }
}
