# October 3 dependency security repair

## Approved repair packet

User requested investigation and needed fixes for failing GitHub Actions on 2026-10-03.
Starting main: `3ac00d6a6edcdae63bb599f4c7d3fdf0f936b3de`.
Clean status, fetch/prune, checkout main, fast-forward pull and SHA verified.
Branch: `fix/dependency-audit-oct03`. PR183 knowledge work is preserved separately.

Objective: mitigate the two newly reported high findings blocking CI.
In scope: reproducible patches, exploit/compatibility tests, dependency lock wiring,
CI regression step and evidence. Out of scope: clinical changes, DB/infrastructure,
production activation, new advisory exclusions or unapproved audit-policy expansion.
Dependencies: published braces3.0.3 and http-cache-semantics4.2.0; existing forge policy.
Inspected: workspace/lock, all affected package source, mockup plugin, mobile ngrok,
CI workflow, security audit code/tests, D2 history, clinical architecture/security ADRs.
Repository instructions on PR183 were read before returning to main.
Required implementation: patch all locked incoming edges, preserve package versions,
verify original-package negative controls and installed-package positive controls.
Security: no PHI/secrets; no lower thresholds, removed tests or silent hash refresh.
Tests: frozen install, regression tests, upstream suites, forge signing, application
CI checks and fresh raw audit. Acceptance: patches applied and tests pass; merge only
once owner-approved policy or upstream fixed releases make required checks pass.
Stop condition: return audit-policy approval to owner; do not bypass the failing gate.
Owner-only: approve exact-artifact scope renewal, or require upstream fixed releases.

## Failure and implementation

PR183 run37090594767 passed five non-audit jobs. Audit correctly rejected new
GHSA-ch52-4w7c-c8xp (http-cache-semantics) and GHSA-vfj7-8cjw-p6xm (braces).
Registry latest remains4.2.0 and3.0.3; neither advisory lists a fixed version.
Braces is consumed by micromatch (including Jest/Metro) and chokidar; removing the
mockup direct dependency would not eliminate the vulnerable package.

`patches/braces@3.0.3.patch` backports the five library-file changes proposed in
https://github.com/micromatch/braces/pull/72 at
`d0d575e55e74a4e0218e5248fafb79efc3e54ebb` (open/unmerged when inspected).
Bounds combined brace/parenthesis parser nesting and compile/expand/stringify AST
recursion at100, allows stricter bounds, prevents larger-option bypass. Direct ASTs
and cycles are covered. This is project-maintained, not a published upstream fix.

`patches/http-cache-semantics@4.2.0.patch` addresses the upstream report
https://github.com/kornelski/http-cache-semantics/issues/56 against release source
`f01112e954b83cfa8765b633ba880e5e980aa54c`. Distinguishes cache reuse prohibitions
from ordinary expiry. Non-storable/no-cache/must-revalidate/Vary:* and shared
proxy-revalidate/non-public non-immutable Set-Cookie entries cannot be served through
max-stale, stale-while-revalidate or stale-if-error. Existing explicit public and
private-cache behavior is preserved. No clinical route uses a newly introduced cache.

pnpm10.26.1 patch-commit records both patches and all incoming lock edges. No version
spoofing or upgrades. Workspace formatting churn from pnpm was removed; only two
patchedDependencies entries added. Existing forge patch/tree/resolutions unchanged.
Installed package copies left over from prior installs were moved to scratch before
verification; a fresh CI installation verifies the committed frozen graph.

## Exact local evidence

- Original installed tarballs: new suite1/8 passed,7/8 failed (negative control).
- `node scripts/security/dependency-regression.test.mjs`:8/8 passed after patches.
- Upstream braces master `e53730e6f935498326c72d768889ac194eedc0e0` + same patch:
  `npm test`:894 passed. Dependencies installed isolated with scripts disabled.
- Upstream cache `f01112e954b83cfa8765b633ba880e5e980aa54c` + same patch:
  Mocha:125 passed. No upstream tests removed/rewritten.
- `node scripts/forge-security.test.mjs`:2/2 passed.
- `pnpm install --frozen-lockfile`:passed using pinned10.26.1.
- `node scripts/security/patched-audit.test.mjs`:18/19 passed; exact artifact case
  intentionally fails ARTIFACT_CHANGED:pnpm-lock.yaml because approval pins old graph.
- `node scripts/security/patched-audit.mjs`:exit1; fresh raw audit retains
  1low/20moderate/3high/0critical. Existing attestation correctly rejects changed lock.
- Initial root build without CI domain exited1 at mobile build; rerun with synthetic
  EXPO_PUBLIC_DOMAIN uses existing CI configuration. Final build/mobile/CI results
  to be recorded below or in linked PR before handoff.

No DB migration, infrastructure, model/prompt/clinical schema or clinical-eval change.
No production operation performed. No clinical or production certification claimed.

## Concrete owner decision (pending; not activated)

Existing `patches/README.md` requires owner approval for renewed artifact scope.
Proposed scope: retain the forge controls and2026-11-01 expiry; additionally attest
only the two exact new patched artifacts and corresponding GHSA/CVE identities.
Require complete package-tree, patch, lock and workspace hashes; all locked incoming
resolutions; mandatory regression/signing tests; raw audit retention; fail closed on
other high/critical advisories, changed versions/paths/artifacts, missing evidence,
expired approval, malformed audit, or upstream fixed release availability.
No generic ignore list or development-dependency exclusion. Approval must be explicit
before changing the active policy; current repair does not claim green audit or merge.

Reviewed SHA-256 values:

| Artifact | SHA-256 |
|---|---|
| pnpm-lock.yaml | 9932a06b4620b87458dbee0d3cf63cbd285cf8d123cc6eefbed46dfc52ea6405 |
| pnpm-workspace.yaml | 8e75ac09d3c6250b813bd5002217c2abf5f7e8790ef91c552d9763946a64a89c |
| braces patch | 37f95f7d660c05bfd44d4b429ca49ceeede99dcff68389f81ee9b995a8ea24d2 |
| braces installed tree | 3b72c3267233849975ea9b7936d8ca27fde74548a17d1f555d59e14e1d7ce8dc |
| cache patch | ea91cbabfa1f7991c05483aa9e5b35e17439e0ef02db41d09d6bb7a0e941f7f7 |
| cache installed tree | 313b9465cbe90259a4db5bdf781c3f817fa2fa847597b11168010327c7de8a3f |
| unchanged forge tree | b6025640b7c1159d25d97624337458fd99323d091d30e189ecfd074c0a34d617 |

No architecture blocker to implementing source mitigations. The remaining blocker is
security-policy approval, not an application architecture replacement. External EAS
workers, live ngrok connectivity, production and device behavior remain unverified.

## Final local verification before publication

`EXPO_PUBLIC_DOMAIN=spartan-coaching-ci.invalid pnpm run build`:exit0, including
workspace typecheck, all web/API builds and Metro mobile export.
`pnpm --filter @workspace/spartan-coaching-mobile exec jest --runInBand`:exit0,
60 suites/298 tests passed (existing delayed-exit warning; process subsequently exited0).
`git diff --check`:passed. All changed files reviewed; no generated build output staged.
Broader API/web/DB/browser/recovery/release suites are delegated to the existing CI
workflow on the published repair commit, not claimed locally.

## Approved policy implementation — October 3

Owner explicitly approved the concrete PR184 policy proposal at2026-10-03T10:15:49Z.
This supersedes the pending owner decision above; no repeat approval needed.
Recreated the reset scratch checkout, synchronized main (still3ac00d6), and continued
on the existing clean PR184 branch. No human work was overwritten.

Prior runtime1ea1863 CI37092806502 passed all five non-audit jobs: AI94/API315/web328/
mobile298/DB54, browser51passed1skipped, build/typecheck/performance/release suites,
full-history secrets and synthetic recovery. The sole audit-policy block is addressed
by this approved extension. Patches/lock/workspace remain byte-identical to reviewed
PR184 artifacts; forge source and its tree are unchanged.

Extended existing policy rather than creating a second audit system. Added complete
additional artifact/patch hashes, exact GHSA/CVE/version/path identities, all installed
incoming edge realpath checks, duplicate-copy/altered-artifact rejection, and mandatory
dependency regression invocation inside the gate. All original failure checks retained.
Owner/expiry unchanged; no ignore entry, threshold change or production activation.

Local frozen install passed. Policy tests39/39; security regression8/8; forge/signing2/2.
`PATH=/tmp/spartan-pnpm/node_modules/.bin:$PATH node scripts/security/patched-audit.mjs`
exited0: pass-with-verified-source-mitigation; raw1low/20moderate/3high/0critical retained.
The tests cover missing/duplicate advisories, changed identities/paths/versions, upstream
fix availability, policy expiry, real diverted symlinks, duplicate installed copies and
modified package content. Broad CI will run on the published commit; exact final run,
merge and main SHA will be recorded in PR184. Then synchronize/verify PR183 separately.
No DB/infrastructure/clinical-eval changes. No architecture blockers or new owner tasks
before verified merge. Owner must replace/remove or explicitly review policy before
November1; external EAS, live ngrok, production and devices remain outside verification.

## Verified repair merge

PR184 https://github.com/Thordadpool5413/SpartanCoaching/pull/184 merged after
CI37116214069 passed all seven jobs on7efdb079d99e5c0c04f94efea9376ff5b9eafdce.
Merge/main SHA:a5e746088b377fd1bc0dc6d8094974f69803b5eb.
Policy39, new regression8, signing2 passed; application, browser, full-history
secrets, migration equivalence and synthetic recovery all passed. Previous failing
run37092806502 is superseded. Approved policy is active; no bypass or repeat approval.
