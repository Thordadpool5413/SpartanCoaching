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
