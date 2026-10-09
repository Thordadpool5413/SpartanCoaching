# K1B-PERSIST implementation ExecPlan

## Approved objective and boundary

Implement the owner-approved K1B-PERSIST packet: durable knowledge authority,
the authenticated `/api/knowledge-control` mutation and metadata surface,
one-scope transactions, receipts, immutable audit, transactional outbox,
numbered migrations, P02 equivalence and P03 independent recovery. K1A's
contracts, canonical serializer, witnesses, rights identity and temporal policy
remain authoritative. This is an implementation plan, not a new architecture
decision. No K2, external ingestion, patient data, PHI, FHIR, clinical AI,
production migrations or production activation is authorized.

## Starting evidence

- Exact main: `e63d4d8a95d053dae7778e03d638b64d57aab2ac`.
- Exact-main CI: `37862677556`; all seven mandatory jobs succeeded.
- Implementation branch: `feat/k1b-persist-authority`, created from that SHA.
- Migration allocation: `0031_knowledge_authority.sql`; catalog highest is 0030.
- Governing files: AGENTS.md, .agent/PLANS.md, knowledge mandate/foundation/
  correction/repair decisions, K1A completion plan, DB migration runner and
  inventory, independent SQL-owned catalog, P02 and P03, canonical auth/session,
  K1A contracts/reducer/state validation, API request-security and mandatory CI.

## Environment and verification limits

The native checkout and dependencies are now restored. Native fetch succeeded;
all changes are on the bounded local feature branch. `pnpm install
--frozen-lockfile` passed without changing the lockfile. A system PostgreSQL
installation failed on host permissions; a workspace package download succeeded,
but this process cannot switch to an unprivileged PostgreSQL server user.
Real PostgreSQL, P02 and P03 local execution remain unverified. Their existing
mandatory CI jobs will run against PostgreSQL 16. No production database is used.

## Implementation checklist

1. [x] Verify exact main and CI; restore governing source; create bounded branch.
2. [ ] Add 18 approved tables, scope-qualified constraints, indexes, immutable
       guards, non-owner privilege installation, schema exports and migration inventory.
3. [ ] Add explicit temporal codecs and bounded dependency projection; preserve
       exact K1A identity, lineage, manifest, CAS and authority semantics.
4. [ ] Implement one checked-out canonical-pool connection, five-second total
       deadline, scope-first deterministic locks, locked current auth, replay authority,
       delta persistence, atomic receipt/audit/outbox and commit-uncertainty outcomes.
5. [ ] Implement private bounded pure-evaluation workers and API build entry.
6. [ ] Implement disabled-by-default control plane, strict duplicate-key JSON,
       trusted Actor derivation, no-store bounded responses and authorized metadata.
7. [ ] Align identity writers with organization/member/session lock ordering.
8. [ ] Implement outbox lease CAS, retry/dead-letter, consumer deduplication and
       internal expiry event persistence; do not activate a scheduler or destination.
9. [ ] Add mandatory API PostgreSQL constraints/parity/command/concurrency/
       idempotency/deadline/outbox/auth/security/identity-writer regressions.
10. [ ] Extend independent P02 and P03 without excluding catalog differences or
        reducing existing recovery/security checks.
11. [ ] Review complete diff; publish scoped commits and PR; require current-head
        mandatory CI; refresh main and merge normally; verify exact-main post-merge CI.

## Evidence ledger

The schema, adapter, control plane, outbox and recovery extensions are drafted.
Root typecheck passed. Focused K1A/control/auth/session/request-security tests:
5 files, 674 tests passed. Database integration is not yet verified. No commits,
PR, migration application, merge, activation or completion claim exists yet.
Every test result, concurrency scenario, P02/P03 result, commit, PR/head/run,
merge SHA and exact-main result must be added here before declaring completion.

## Stop conditions and owner actions

Stop only after approved K1B is implemented and merged with exact-main CI green.
If repository evidence prevents an approved requirement, record an
`ARCHITECTURE BLOCKER` with affected code/evidence/options and stop only dependent
work. Production role provisioning, secret/configuration changes, migration
application, knowledge activation and future source/clinical programs remain
owner-only and are outside this branch. Historical K1A evidence is preserved.
