# K0 repository and knowledge inventory

Baseline: main `3ac00d6a6edcdae63bb599f4c7d3fdf0f936b3de`, inspected 2026-10-03.
Scope: source inspection, not live clinical deployment or source-content validation.
The uploaded mandate is preserved in `00-mandate.md`. No AGENTS.md or .agent/PLANS.md
existed at baseline; this packet adds concise permanent rules and plan pointers.

## Canonical implementations and gaps

| Capability | Classification | Evidence and consequence |
|---|---|---|
| Responses API and structured outputs | IMPLEMENTED | `lib/spartan-ai-tools/src/server.ts`: server client, Zod format, store:false; preserve registry and client |
| Tool registry and eligibility/documentation/LCD tools | IMPLEMENTED | `lib/spartan-ai-tools/src/registry.ts`, `tools/*`; implementation is not clinical accuracy certification |
| Citation fields and mandatory review | PARTIALLY_IMPLEMENTED | `clinical-contract.ts` has document/version/hash/locator and literal human review; no comprehensive independent span/authority validator |
| Confidence semantics | STALE | `clinicalConfidenceSchema` and five clinical tool schemas/prompts still use numeric 0–1 model confidence; compatibility migration belongs K19/K22, not this packet |
| Public coverage version storage | PARTIALLY_IMPLEMENTED | `lib/db/src/schema/aiTools.ts` coverageSnapshots; migration 0001; unique source/type/document/version, JSON payload and hash; missing raw-byte/parser lineage, licenses, reviewer approval and activation |
| CMS sync | PARTIALLY_IMPLEMENTED | `aiToolRoutes.ts` coverage/sync checks CMS host, fetches JSON and upserts same version; metadata is caller supplied, payload schema is not source-version validated; same-version content may change |
| Applicability | PARTIALLY_IMPLEMENTED | `clinical/patientPolicy.ts` tests source/current/nonretired; `coverageBootstrap.ts` selects latest; no complete payer/MAC/service-date resolver |
| Educational policy baseline | IMPLEMENTED | `coverageBootstrap.ts` explicitly labels EDUCATIONAL_BASELINE; must never be upgraded into approved patient authority implicitly |
| Curated policy and Spartan corpus | PARTIALLY_IMPLEMENTED | `knowledge/policyIntelligence.ts`, `spartanCorpus.ts`; static guidance and links/keyword retrieval, not reviewed versioned clinical sources |
| Policy freshness descriptions | STALE | policy brief `checkedAt` uses snapshot fetchedAt or current time for static reference URLs; this does not establish retrieval/review of each reference |
| NPI lookup/provider brief | IMPLEMENTED | `knowledge/npiLookup.ts`, `providerIntelligence.ts`, tests; preserve non-PHI provider intelligence |
| CMS market/source health | IMPLEMENTED | `medicare-intelligence/sourceContracts.ts`, runtime/cache/warehouse/physicianData; schema health and caching exist for market data, not clinical authority |
| HOPE and payment references | PARTIALLY_IMPLEMENTED | static regulatory summaries in `medicare-intelligence/cmsIntelligence.ts`; no HOPE base+errata composition or temporal payment service; substantive statements not independently verified in K0 |
| PDF/image/DOCX/TXT extraction | PARTIALLY_IMPLEMENTED | `clinical/patientExtraction.ts` uses signature checks, DOCX XML, OpenAI transcription; no approved page-aware OCR provenance, total archive expansion or isolated parser budgets |
| GCS and scanner | REQUIRES_EXTERNAL_CONFIGURATION | `clinical/storage.ts`, `ephemeral.ts`, tests; configuration flags are not vendor/deployment evidence |
| Clinical auth and PHI gates | PARTIALLY_IMPLEMENTED | `clinical/access.ts` retains platform-admin canAdmin and canReview-or-canAdmin bypass; existing P04 blocker, do not activate PHI |
| Temporary patient sessions | IMPLEMENTED | `routes/patientReviewRoutes.ts`; no durable patient graph/FHIR evidence store established by this route |
| Clinical cloud/FHIR | ARCHITECTURE_ONLY | clinical-cloud ADRs and target design; no canonical deployed FHIR integration found |
| Approved clinical evaluation program | MISSING | unit/contract suites exist; no independently adjudicated holdout/safety/temporal evaluation suite found in inspected code/scripts |
| CI/recovery/dependency policy | IMPLEMENTED | `.github/workflows/ci.yml`, DB catalog/recovery tests, exact-artifact forge policy; PR182 main CI passed, production recovery not established |
| Historical operational documentation | STALE | `repository-truth-audit.md` is explicitly historical; clinical ExecPlan headline still described unresolved D2 although PR182 resolved it; corrected headline in this packet |

Existing capabilities above are preserved. No duplicate authoritative knowledge
registry/resolver was found. Related concepts overlap in the educational baseline,
static policy guide and Spartan corpus, but they are not interchangeable clinical
authorities. Do not delete these educational/sales surfaces as “duplicates.”
Patient/legacy AI routes also duplicate extraction paths; consolidate only under
K16/P07 compatibility and security review. Market HCPCS/source health must not be
repurposed as patient coding or clinical licensing approval.

## K0–K23 mapping (baseline, before this packet)

| Packet | Baseline status | Reuse / remaining dependency |
|---|---|---|
| K0 inventory | MISSING | This audit and plan establish a current knowledge-specific baseline |
| K1 foundations | MISSING | Reuse backend knowledge namespace, Zod, canonical DB design; safe contracts implemented in this PR |
| K2 coverage | PARTIALLY_IMPLEMENTED | Extend coverageSnapshots/sync; require reviewed MAC, payer and historical date mapping |
| K3 federal regulation | MISSING | Existing links only; eCFR/GovInfo/Federal Register adapters absent |
| K4 CMS manuals/OIG | PARTIALLY_IMPLEMENTED | Curated references; controlled version ingestion absent |
| K5 HOPE/HQRP | MISSING | No composition service despite market-level mentions |
| K6 ICD-10-CM | MISSING | No official temporal code+guideline service found |
| K7 HCPCS/payment | PARTIALLY_IMPLEMENTED | Market analytics exist, patient billing/payment edition service absent; proprietary content REQUIRES_LICENSE |
| K8 LOINC/UCUM | MISSING | No controlled terminology/conversion service found |
| K9 RxNorm/DailyMed | MISSING | No medication identity/label adapter found |
| K10 SNOMED/UMLS | REQUIRES_LICENSE | No verified rights or deployed terminology service |
| K11 pharmacology | REQUIRES_LICENSE | Vendor/clinical validation and explicit selection required |
| K12 scales | REQUIRES_LICENSE | Narrative scale mentions are not licensed scoring implementations |
| K13 PubMed/guidelines | MISSING | No approved literature/guideline registry found |
| K14 Spartan protocols | ARCHITECTURE_ONLY | Sales corpus is not a clinically approved symptom protocol |
| K15 patient/FHIR tools | ARCHITECTURE_ONLY | P04/P06/P09 and retained-mode approval dependencies |
| K16 extraction/provenance | PARTIALLY_IMPLEMENTED | Existing extraction, signatures and storage; hardened lineage pipeline incomplete |
| K17 unified gateway | MISSING | Existing narrow routes are not a knowledge authority gateway |
| K18 orchestration | PARTIALLY_IMPLEMENTED | Responses/Zod canonical runtime exists; authoritative tool orchestration absent |
| K19 validation/review | PARTIALLY_IMPLEMENTED | Citation shape/human-review flags; substantive finding review and validated spans incomplete |
| K20 evaluations | MISSING | Requires independent qualified experts and hidden holdout custody |
| K21 health/revocation | PARTIALLY_IMPLEMENTED | Market-source health exists; clinical source lifecycle not implemented |
| K22 web/iOS presentation | PARTIALLY_IMPLEMENTED | Existing clinical screens; no versioned knowledge/review contract UI |
| K23 staging/readiness | REQUIRES_EXTERNAL_CONFIGURATION | Synthetic local/CI gates exist; covered staging/vendor/licenses/clinical signoff absent |

No external clinical API or licensed dataset was fetched or activated by this
packet. API availability, medical correctness, agreements and source rights are
unverified. Owner-only dependencies are listed in the active ExecPlan.
