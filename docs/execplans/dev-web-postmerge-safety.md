# Spartan DEV Web Post-Merge Safety

## Starting point
- Main: 96081b675379f599ae91950b8e8c10c67940b864
- Branch: fix/dev-web-postmerge-safety
- Source: PR #194, merged with failing dependency-audit CI
- Deployment: Existing Cloud Run DEV services remain unchanged

## Objective
Preserve the working DEV frontend while correcting PR #194 review findings
and restoring required repository security checks.

## Authorized scope
- Align server and browser canonical metadata with the production SEO contract.
- Preserve DEV noindex behavior and production iPhone handoff links.
- Add focused frontend and server regression tests.
- Review the changed lockfile and existing patched-dependency attestation.
- Record verification, CI results, review findings, and owner decisions.

## Exclusions
No PHI, clinical feature changes, K1A/K1B/K2 changes, FHIR, migrations,
production deployment, IAM, secrets, or infrastructure modifications.
Do not disable security gates or silently renew attestation hashes.

## Acceptance
- Production canonical URLs remain consistent.
- DEV remains excluded from search indexing.
- Relevant regression tests and required CI pass.
- Existing patched dependencies retain verified identity and resolution.
- Any revised security attestation receives explicit owner approval.
- No merge while required checks fail.

## Stop conditions
Stop on unexplained dependency changes, security regressions, or missing
authorization. Keep the active PHI-readiness implementation separate.

## Completion evidence
Pending: reviewed diffs, test results, PR number, final CI, merge decision,
and outstanding owner actions.

## Final verification after PR #195
- Baseline: 37acab5ec19ce3df5c2829ec458ffab49b32078b.
- Website: 329/329 tests passed.
- Launch: 25/25 tests passed.
- TypeScript, live crawl and performance budgets passed.
- Security: 39/39 tests passed.
- Audit: pass-with-verified-source-mitigation.
- Raw findings: 0 critical, 3 mitigated high, 14 moderate, 1 low.
- DEV canonical and noindex checks: all three routes passed.
- Final local verification exit code: 0.
- GitHub CI for this branch: pending.
- PR #195 renewed attestation owner review: pending confirmation.
- Production deployment: not performed.
