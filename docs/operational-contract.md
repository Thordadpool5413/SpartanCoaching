# Operational contract — updated 2026-10-02

Initial P01 baseline: `main` at `708b0522af3534a0066134d646f21f2a3cb8747c`.
P01 reconciled documentation only. P02/P03 updates below are based on main `44ec75b61a42b5d992fd7e11ee1ec7c39e994bd8` and their feature branches; they do not certify production deployment.
Architecture and packet source: [PR #174](https://github.com/Thordadpool5413/SpartanCoaching/pull/174), commit `3fb033fe5da32f673625bea4685587d437f37e05`. P01 does not merge that proposal or authorize production activation.

## Evidence and assertion changes

Paths below are repository-relative. Hashes and migration ordering are recorded in [operational-evidence.json](operational-evidence.json). Reproduce with `node scripts/operational-evidence.mjs`; verify with `node scripts/operational-evidence.mjs --check`.

| Superseded assertion | Inspected truth / required interpretation | Evidence | Classification |
|---|---|---|---|
| Push is the production apply path | Versioned migrate is primary; production push is prohibited. URL heuristics alone do not establish environment identity. | `lib/db/scripts/migrate.ts`, `lib/db/src/migrate-manifest.ts`, `.github/workflows/ci.yml` | Current code + operating rule |
| Migration coverage proves schema equivalence | Lexical CREATE names cover declared names and synthetic replay/upgrade checks pass. Full target-catalog comparison still reports 179 differences; historical upgrade provenance and production equivalence remain blocked. 0026 exists. | Inventory; `lib/db/src/schema/`, `lib/db/migrations/` | Synthetic evidence; P02 acceptance blocked |
| Backup drill proves recovery | P03 performs actual isolated synthetic dump/restore and verifies catalog, content, sequences, tenant isolation and recovery fixtures. The renamed count-simulation is not recovery proof. Cloud PITR, production scale, keys/roles and clinical deletion authority remain unverified. | `lib/db/scripts/backup-restore-drill.ts`; `lib/db/scripts/count-simulation.ts`; [recovery evidence](execplans/p03-synthetic-recovery-evidence.json) | Synthetic CI passed; owner/cloud gates remain |
| Sales/platform administration permits clinical review | Current code does allow this, but it violates the explicit-grant target. Clinical admin must not imply PHI read/review permission. | `artifacts/api-server/src/clinical/access.ts` | Architecture blocker, P04 |
| Independent sweeper guarantees deletion within 60 minutes | Scheduling uses API-process timers. Outages and untracked storage objects can delay cleanup. No absolute deletion guarantee. | `artifacts/api-server/src/auth/opsJobs.ts`, `clinical/ephemeral.ts`, `routes/patientReviewRoutes.ts` under the API source | Current code; P07/P08 gap |
| All clinical native screens have privacy cover/unlock | Dedicated patient-review path needs separate verification and correction; legacy-screen controls do not prove coverage. | `artifacts/spartan-coaching-mobile/app/ai-tools/patient-review.tsx` | P13 gap |
| DOCX accepted means hardened ingestion | Existing main XML metadata check does not establish archive expansion/page/pixel limits or isolated parsing. | `artifacts/api-server/src/clinical/patientExtraction.ts` | P07 gap |
| Classic generation is queued and drafts/results sync | Queue is retired; generated tool IDs are excluded from draft/result storage. Historical capability metadata disagrees and must not authorize storage. | Mobile `lib/offlineQueue.ts`, `generatedToolPrivacy.ts`, `toolDraftCache.ts` | Current code; metadata correction pending |
| OpenAPI is health-only | It includes auth and other routes. Route handlers/shared Zod remain the implementation evidence; no completeness claim. | `lib/api-spec/openapi.yaml` | Static observation |
| Mobile token uses AsyncStorage | Session-token transport uses SecureStore; clinical content must not be placed there. | `artifacts/spartan-coaching-mobile/lib/AuthContext.tsx` | Current code |
| Replit is the production clinical boundary | Google Cloud is the approved target; Replit is synthetic development only. No deployed cloud boundary was verified. | Architecture ADRs and target design in PR #174 | Target, not deployed evidence |
| Confirmation flags prove vendor readiness | Flags do not prove executed agreements, approved model/processor/region, retention or effective account settings. | Architecture deployment gates; patient-review activation checks | Owner evidence pending |

## Authority and retention

Source records remain authoritative. Extracted facts, normalized facts, AI inference and human-approved findings are distinct. Temporary review creates no durable chart/FHIR representation. Longitudinal storage requires a separately approved lifecycle and customer terms. Documentation here is an engineering contract, not newly approved customer-facing retention wording.

No real PHI or production schema exports belong in GitHub, CI, this workspace or implementation conversations. Production evidence must be gathered within the covered boundary and reduced to an approved, content-free discrepancy report.

## History and remaining work

[The August audit](repository-truth-audit.md) is retained as historical evidence, not an executable runbook. [Schema operations](schema-ops.md), [clinical controls](clinical-security-controls.md), [patient review](patient-record-review.md), [device storage](offline-device-storage.md), and `replit.md` now defer to this contract where prior claims disagree.

[The active ExecPlan](execplans/clinical-cloud-implementation.md) records packet boundaries, tests, blockers and owner actions. P01 does not repair authorization, migrations, parser isolation, jobs or device behavior. Keep PHI activation blocked until applicable packets and owner gates are verified.
