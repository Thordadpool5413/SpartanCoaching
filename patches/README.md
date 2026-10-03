# Dependency security patches

## node-forge 1.4.0 — CVE-2026-85393 / GHSA-86w9-cpqp-85rv

`node-forge@1.4.0.patch` adds nested DigestAlgorithm element-count validation
at the existing RSA PKCS#1 v1.5 verification boundary. The ASN.1 validator
otherwise accepts unconsumed nested children. The change follows the narrow
fix proposed in upstream https://github.com/digitalbazaar/forge/pull/1152,
reviewed against the installed source and upstream v1.4.0 commit
`fa385f92440879601240020f158bed68e444e83a`.

The version stays 1.4.0. This is a project-owned source patch, not a published
upstream fix or a vendor endorsement. pnpm 10.26.1 records the patch hash and
all three incoming locked edges (two Expo CLIs plus code-signing-certificates).
Frozen installation must apply the patch. Never edit installed node_modules as
a deployment mechanism. Remove this patch only after a reviewed fixed upstream
release passes the regression and signing checks.

`node scripts/forge-security.test.mjs` tests the actually resolved Node modules
used by both Expo CLI paths and the certificate package. It rejects nested
extra elements, unexpected parameter tags, duplicate NULL, extra outer elements
and trailing bytes; preserves SHA-256 with absent/NULL parameters, normal RSA,
OpenSSL interoperability and PSS; verifies Expo PEM roundtrip, X.509 self-signing,
CSR, manifest signing, and tampered payload/certificate rejection. All new keys
are generated in memory. No private keys, customer signatures or PHI are saved.
The regression was confirmed to fail on the unpatched package and pass on the
patched package. Upstream RSA tests on v1.4.0 plus the patch: 100 passed, four
upstream pending (not removed).

Scope is the Node source actually consumed by the locked Expo tooling. The
package's prebuilt browser dist files are not rebuilt or certified; repository
application code has no node-forge/dist imports. External `pnpm dlx eas-cli`,
remote EAS workers, deployed apps and App Store/TestFlight are not verified by
this local workspace patch. No store submission is authorized or performed.

## Audit status — deliberately still blocking

The unchanged `pnpm audit --audit-level high` reports the published 1.4.0 advisory
even after a source patch. Raw audit was rerun and remains exit 1 (one high).
No GHSA ignore, version spoof, audit threshold change, dev-dependency exclusion,
continue-on-error or alternate fork was introduced. CI now runs the regression
before the audit; the audit still executes if the regression fails, and either
failure blocks the job and aggregate. This mitigation does not claim a green
registry audit or authorize merge.

To remove the blocker requires either a fixed upstream release, or a separately
approved policy for independently attesting a patched artifact. Such a policy
would need exact installed source/patch hashes, complete dependency-resolution
coverage, regression/signing checks, transparent raw audit output, failure on any
other finding, expiry/owner and removal on an upstream release. A blanket
advisory ignore is not a substitute. Current instructions authorize no exception.

## Approved exact-artifact policy — 2026-10-02

The owner explicitly approved the exact-artifact policy after reviewing PR #182's
source mitigation and remaining raw audit failure. This supersedes the pending
approval statements above; it does not claim the registry finding disappeared.

`patches/forge-attestation.json` binds the reviewed complete package tree,
patch, lockfile, workspace configuration, pnpm store copy and Expo resolution
paths. The Node-only policy expires **2026-11-01 00:00 UTC**; Nicholas Lynch,
repository owner, owns replacement/removal or explicit renewal after review.
New direct application imports (including browser use) fail the guard. External
EAS/dlx installations remain outside this policy and require their own review.

Run `node scripts/security/patched-audit.mjs` with repository-pinned pnpm on PATH.
It captures `pnpm audit --json` without suppressing its raw findings, then checks
artifact identity, active approval, all locked Expo resolutions, mandatory exploit
and signing regressions, audit shape/counts/exit status, and the exact advisory,
CVE, version and covered paths. Only the reviewed high finding can be classified
as source-mitigated. Every other high/critical finding, unknown/malformed audit,
muted finding, subprocess/network failure, missing evidence, expired policy or
changed artifact blocks CI. Low/moderate findings remain visible under the
existing high threshold. Two pre-existing workspace ignore entries are unchanged;
any new configuration change invalidates this policy. No new ignore is added.

Raw JSON, stderr and policy decision are retained as CI artifacts for 30 days.
When the advisory reports a fixed version, the gate requires review/removal.
Prefer upgrading promptly to a reviewed upstream fix. Do not automatically renew
or update hashes to accommodate an install change: review the actual change,
rerun exploit/signing tests, and obtain owner approval for renewed scope.

## October 3 additional source repairs — approval pending

`braces@3.0.3.patch` and `http-cache-semantics@4.2.0.patch` mitigate
GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 and GHSA-ch52-4w7c-c8xp / CVE-2026-93748.
Versions remain unchanged. Provenance, exact hashes, negative controls, upstream
compatibility tests and the proposed bounded approval are recorded in
`docs/execplans/dependency-audit-oct03.md`. Run
`node scripts/security/dependency-regression.test.mjs` after frozen installation.

These patches are not covered by the existing forge-only approval. Its active
policy is deliberately unchanged and rejects the revised lock/workspace. Do not
merge while required checks fail or silently refresh approval metadata.
