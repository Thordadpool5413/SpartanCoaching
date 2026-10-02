# Decisions needed to finish the Actions repair

Baseline main: `48858c73764c4c5d7b82200102f6e92861980b19`. PR #180 fixes verification ordering; it does not waive either failing acceptance gate. The user authorized merge after verification. Production activation is separate.

## D1 — complete expected database catalog (approved 2026-10-02)

Evidence: PostgreSQL CI run 36963672982 reports 179 differences against the Drizzle-only export. The source omits existing SQL-owned `medicare_cache_objects`, `medicare_workspace_records`, `member_offboarding_lifecycle`, their sequence/ownership, three offboarding functions, two triggers, and four sales-workflow tenant policies. Constraint/index names and some index definitions also differ. These are not 179 confirmed application defects. The personalization default defect was corrected in migration 0030 and its preservation test passes.

**Approved decision:** retain Drizzle for application-declared relational shape and add an independently versioned expected SQL extension for the existing SQL-owned lifecycle/security objects. Preserve current tenant RLS, ownership, grants and offboarding behavior. Review and reconcile each remaining name/index/constraint difference; use additive migrations only where an actual defect is demonstrated. No historical SQL rewrite, dropped control, difference allowlist or auto-approved production baseline.

Alternative: represent all those SQL-owned objects in one separately reviewed schema-definition mechanism. That is a larger change; deleting the objects to match Drizzle is not acceptable.

User explicitly approved D1 on 2026-10-02. Implementation is on `fix/complete-schema-contract`, starting main `345ef9d422ee9fa7689ffdfa993b0457967b7a4f`. See `lib/db/schema-contract/README.md` for the reviewed reconciliation. Local PostgreSQL 16 suite passes 54/54 with zero differences. CI verification remains required.

Acceptance: implement the complete target, run empty replay/prefix upgrade/rerun/concurrency/checksum/rollback/isolation/catalog/recovery tests, and require zero unexplained differences. Production history adoption remains a separate decision requiring trusted deployment/schema evidence; current repository bytes cannot certify past SQL.

## D2 — node-forge dependency remediation (security/Expo compatibility review)

Evidence: the lockfile contains node-forge 1.4.0 through Expo CLI and Expo code-signing certificates. Registry `pnpm view node-forge version` returns 1.4.0. [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) affects <=1.4.0 and lists no patched version as checked 2026-10-02. Both local audit and CI fail at the existing high-severity threshold.

A standard version bump cannot currently resolve this. Prefer an upstream fixed release when available, with signing/Expo regression verification. If remediation must precede a release, require a reviewed source patch or compatible dependency replacement with vulnerability regression and signing tests. Do not falsify a version, remove needed signing code, add an audit ignore, lower severity, or skip dev dependencies merely to obtain green CI. A patched source still needs honest audit evidence; no exception is authorized here.

## Merge condition

All six gates must succeed: application tests/build, dependency audit, secret scan, migration equivalence, synthetic recovery and browser journeys. The existing required check aggregates them and rejects failure/cancellation/skip. The current repair cannot be merged as fully verified while D1/D2 remain unresolved. Actual cloud/PITR, PHI activation, customer rollout and native store submissions are not authorized by this repair.
