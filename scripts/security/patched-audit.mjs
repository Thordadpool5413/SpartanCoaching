import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, realpathSync, lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
export function treeHash(dir) {
  const entries = [];
  function walk(path) {
    for (const name of readdirSync(path).sort()) {
      const file = resolve(path, name);
      const stat = lstatSync(file);
      assert.ok(!stat.isSymbolicLink(), 'ARTIFACT_SYMLINK');
      if (stat.isDirectory()) walk(file);
      else { assert.ok(stat.isFile(), 'ARTIFACT_NOT_FILE'); entries.push([relative(dir, file), hash(file)]); }
    }
  }
  walk(dir);
  return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}
export function attest(policy, now = new Date()) {
  assert.ok(now >= new Date(policy.approvedAt) && now < new Date(policy.expiresAt), 'POLICY_EXPIRED_OR_NOT_ACTIVE');
  assert.ok(policy.owner && policy.advisory === 'GHSA-86w9-cpqp-85rv', 'POLICY_IDENTITY');
  for (const [file, expected] of Object.entries(policy.files)) assert.equal(hash(resolve(root, file)), expected, `ARTIFACT_CHANGED: ${file}`);
  // Pin the complete lock and workspace configuration. Any resolution/configuration
  // change needs renewed review, even when it looks unrelated to this exception.
  const store = resolve(root, 'node_modules/.pnpm');
  const copies = readdirSync(store).filter(p => p.startsWith('node-forge@'));
  assert.deepEqual(copies, [policy.storeEntry], 'UNREVIEWED_FORGE_COPY');
  const packageRoot = resolve(store, copies[0], 'node_modules/node-forge');
  assert.equal(treeHash(packageRoot), policy.packageTreeSha256, 'INSTALLED_PACKAGE_CHANGED');
  const mobile = createRequire(resolve(root, 'artifacts/spartan-coaching-mobile/package.json'));
  const expo = createRequire(mobile.resolve('expo/package.json'));
  const clis = [mobile.resolve('@expo/cli/package.json'), expo.resolve('@expo/cli/package.json')];
  for (const cliPath of clis) {
    const cli = createRequire(cliPath);
    for (const req of [cli, createRequire(cli.resolve('@expo/code-signing-certificates'))]) {
      assert.equal(realpathSync(req.resolve('node-forge')), realpathSync(resolve(packageRoot, 'lib/index.js')), 'UNATTESTED_RESOLUTION');
    }
  }
  // Browser bundles are deliberately not covered. Reject new direct consumers in
  // application/package source. Tests for the patch live under scripts/security.
  for (const parent of ['artifacts', 'lib']) {
    function scan(dir) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.git', 'dist', 'build', '.expo'].includes(entry.name)) continue;
        const path = resolve(dir, entry.name);
        assert.ok(!entry.isSymbolicLink(), 'UNREVIEWED_SOURCE_SYMLINK');
        if (entry.isDirectory()) scan(path);
        else if (/\.(?:[cm]?[jt]sx?|json|html)$/.test(entry.name)) assert.ok(!/node-forge|forge\.min\.js/.test(readFileSync(path, 'utf8')), 'NEW_DIRECT_FORGE_CONSUMER');
      }
    }
    scan(resolve(root, parent));
  }
  return true;
}
export function evaluateAudit(report, status, policy, attested) {
  assert.equal(attested, true, 'ATTESTATION_REQUIRED');
  assert.ok(status === 0 || status === 1, 'AUDIT_PROCESS_FAILED');
  assert.ok(report && !report.error && report.advisories && !Array.isArray(report.advisories), 'AUDIT_FORMAT');
  assert.ok(Array.isArray(report.muted) && report.muted.length === 0, 'MUTED_FINDINGS');
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  let accepted = 0;
  for (const advisory of Object.values(report.advisories)) {
    assert.ok(Object.hasOwn(counts, advisory.severity), 'UNKNOWN_SEVERITY');
    assert.ok(Array.isArray(advisory.findings) && advisory.findings.length > 0, 'FINDINGS_MISSING');
    counts[advisory.severity] += advisory.findings.length;
    if (!['high', 'critical'].includes(advisory.severity)) continue;
    assert.equal(advisory.github_advisory_id, policy.advisory, 'UNMITIGATED_ADVISORY');
    assert.equal(advisory.module_name, 'node-forge', 'ADVISORY_PACKAGE');
    assert.equal(advisory.severity, 'high', 'ADVISORY_SEVERITY_CHANGED');
    assert.deepEqual(advisory.cves, ['CVE-2026-85393'], 'ADVISORY_IDENTITY_CHANGED');
    assert.equal(advisory.patched_versions, '<0.0.0', 'UPSTREAM_FIX_AVAILABLE_REVIEW_REQUIRED');
    assert.ok(Array.isArray(advisory.findings) && advisory.findings.length > 0, 'FINDINGS_MISSING');
    for (const finding of advisory.findings) {
      assert.equal(finding.version, '1.4.0', 'UNREVIEWED_VERSION');
      assert.ok(Array.isArray(finding.paths) && finding.paths.length > 0, 'PATHS_MISSING');
      for (const path of finding.paths) assert.ok(policy.auditPaths.includes(path), 'UNREVIEWED_AUDIT_PATH');
    }
    accepted++;
  }
  assert.deepEqual(report.metadata?.vulnerabilities, counts, 'AUDIT_COUNTS_INCONSISTENT');
  assert.equal(status, Object.values(counts).some(n => n > 0) ? 1 : 0, 'AUDIT_EXIT_INCONSISTENT');
  assert.equal(accepted, 1, 'ADVISORY_CHANGED_REVIEW_POLICY');
  return { decision: 'pass-with-verified-source-mitigation', advisory: policy.advisory, rawVulnerabilities: counts, expiresAt: policy.expiresAt };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(root, 'test-results/dependency-audit');
  mkdirSync(dir, { recursive: true });
  // Capture the unchanged registry response even if later attestation fails.
  const audit = spawnSync('pnpm', ['audit', '--json'], { cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 20 * 1024 * 1024 });
  writeFileSync(resolve(dir, 'raw-audit.json'), audit.stdout || '');
  writeFileSync(resolve(dir, 'raw-audit.stderr.txt'), audit.stderr || '');
  console.log(audit.stdout || 'AUDIT_RETURNED_NO_REPORT');
  try {
    assert.ok(!audit.error && !audit.signal, 'AUDIT_EXECUTION_FAILED');
    const policy = JSON.parse(readFileSync(resolve(root, 'patches/forge-attestation.json'), 'utf8'));
    const attested = attest(policy);
    const regression = spawnSync(process.execPath, ['scripts/forge-security.test.mjs'], { cwd: root, stdio: 'inherit', timeout: 120000 });
    assert.equal(regression.status, 0, 'SIGNING_REGRESSION_FAILED');
    const decision = evaluateAudit(JSON.parse(audit.stdout), audit.status, policy, attested);
    writeFileSync(resolve(dir, 'decision.json'), JSON.stringify(decision, null, 2) + '\n');
    console.log(JSON.stringify(decision));
  } catch (error) {
    writeFileSync(resolve(dir, 'decision.json'), JSON.stringify({ decision: 'fail', reason: error.message }, null, 2) + '\n');
    console.error(error.message);
    process.exitCode = 1;
  }
}
