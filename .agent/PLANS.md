# Execution plans

Active knowledge packet: `docs/execplans/knowledge-k1b-persist.md`.
The owner-approved K1B-PERSIST implementation packet is recorded in the active
plan's scope and implementation checklist. K1A completion history remains at
`docs/execplans/knowledge-k1a-correct.md`.
Approved correction decisions and implementation packet:
`docs/architecture/knowledge-2026-10-03/04-k1a-repair.md`.
Prior K1A-CORRECT decisions: `docs/architecture/knowledge-2026-10-03/03-k1a-correct.md`.
K0/K1 history: `docs/execplans/knowledge-foundation-k0-k1.md`.
Clinical-cloud history/dependencies: `docs/execplans/clinical-cloud-implementation.md`.

Each plan records objective, in/out scope, dependencies, inspected code, required
implementation/security/tests, acceptance, stop conditions and owner-only work.
Record starting main SHA, progress, evidence, exact commands/results, blockers,
commits/PR/CI, and the next bounded packet. Historical failed runs remain historical;
identify the verified commit/run instead of treating an old failure as current state.
Do not expose patient data or credentials in plans. A green CI run is not clinical
validation or production activation authority. Work on one packet at a time.
