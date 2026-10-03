import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, unlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { attest, evaluateAudit, root, coveredAdvisories, attestAdditional, treeHash } from './patched-audit.mjs';
const policy = JSON.parse(readFileSync(`${root}/patches/forge-attestation.json`));
const now = new Date('2026-10-03T11:00:00Z');
const advisory = { github_advisory_id: policy.advisory, module_name: 'node-forge', severity: 'high', cves: ['CVE-2026-85393'], patched_versions: '<0.0.0', findings: [{ version: '1.4.0', paths: [policy.auditPaths[0]] }] };
const report = () => ({ advisories: Object.fromEntries(coveredAdvisories(policy).map((p, i) => [i === 0 ? 'synthetic' : p.module_name, {
  github_advisory_id: p.advisory, module_name: p.module_name, severity: 'high', cves: p.cves,
  patched_versions: '<0.0.0', findings: [{ version: p.version, paths: [p.auditPaths[0]] }],
}])), muted: [], metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 3, critical: 0 } } });
test('current installed artifact attests and only exact advisory is mitigated', () => {
  assert.equal(attest(policy, now), true);
  assert.equal(evaluateAudit(report(), 1, policy, true).decision, 'pass-with-verified-source-mitigation');
});
for (const [name, change] of [
  ['different advisory', r => r.advisories.synthetic.github_advisory_id = 'GHSA-other'],
  ['different package', r => r.advisories.synthetic.module_name = 'other'],
  ['critical escalation', r => r.advisories.synthetic.severity = 'critical'],
  ['different version', r => r.advisories.synthetic.findings[0].version = '1.3.0'],
  ['unreviewed path', r => r.advisories.synthetic.findings[0].paths.push('new>node-forge')],
  ['missing paths', r => r.advisories.synthetic.findings[0].paths = []],
  ['missing findings', r => r.advisories.synthetic.findings = []],
  ['upstream fix available', r => r.advisories.synthetic.patched_versions = '>=1.4.1'],
  ['unknown severity', r => r.advisories.synthetic.severity = 'unknown'],
  ['inconsistent counts', r => r.metadata.vulnerabilities.high = 0],
  ['muted finding', r => r.muted.push({ id: 'synthetic' })],
  ['registry error', r => r.error = 'unavailable'],
  ['additional high', r => r.advisories.other = { ...structuredClone(advisory), github_advisory_id: 'other' }],
  ['malformed document', r => delete r.advisories],
]) test(`rejects ${name}`, () => { const r = report(); change(r); assert.throws(() => evaluateAudit(r, 1, policy, true)); });
test('requires successful attestation and meaningful audit exit', () => {
  for (const status of [null, 2, 127, 0]) assert.throws(() => evaluateAudit(report(), status, policy, true));
  assert.throws(() => evaluateAudit(report(), 1, policy, false));
});
test('expiry and future approval fail closed', () => {
  for (const date of ['2026-11-01T00:00:00Z', '2026-10-01T00:00:00Z']) assert.throws(() => attest(policy, new Date(date)));
});
test('changed patch, lock, workspace, package or installed copy fails', () => {
  for (const file of Object.keys(policy.files)) {
    const p = structuredClone(policy); p.files[file] = 'invalid'; assert.throws(() => attest(p, now));
  }
  for (const key of ['packageTreeSha256', 'storeEntry']) {
    const p = structuredClone(policy); p[key] = 'invalid'; assert.throws(() => attest(p, now));
  }
});
test('multiple versions of lower-severity findings retain original threshold and counts', () => {
  const r = report(); r.advisories.other = { severity: 'moderate', findings: [{}, {}] }; r.metadata.vulnerabilities.moderate = 2;
  assert.equal(evaluateAudit(r, 1, policy, true).rawVulnerabilities.moderate, 2);
});

for (const artifact of policy.additionalArtifacts) {
  for (const [name, change] of [
    ['version', a => a.findings[0].version = '0.0.0'],
    ['path', a => a.findings[0].paths.push('unreviewed>dependency')],
    ['identity', a => a.cves = ['CVE-other']],
    ['severity', a => a.severity = 'critical'],
    ['upstream fix', a => a.patched_versions = '>=9.0.0'],
  ]) test(`rejects changed ${artifact.module_name} ${name}`, () => {
    const r = report(); change(r.advisories[artifact.module_name]);
    assert.throws(() => evaluateAudit(r, 1, policy, true));
  });
  test(`rejects missing or duplicate ${artifact.module_name} finding`, () => {
    const r = report(); delete r.advisories[artifact.module_name]; r.metadata.vulnerabilities.high--;
    assert.throws(() => evaluateAudit(r, 1, policy, true));
    const duplicate = report(); duplicate.advisories.duplicate = structuredClone(duplicate.advisories[artifact.module_name]);
    duplicate.metadata.vulnerabilities.high++;
    assert.throws(() => evaluateAudit(duplicate, 1, policy, true));
  });
  for (const key of ['packageTreeSha256', 'storeEntry', 'incomingStoreEntries']) {
    test(`rejects changed ${artifact.module_name} ${key}`, () => {
      const p = structuredClone(policy);
      const a = p.additionalArtifacts.find(x => x.module_name === artifact.module_name);
      a[key] = key === 'incomingStoreEntries' ? [] : 'invalid';
      assert.throws(() => attest(p, now));
    });
  }
}
test('removing an artifact from approved coverage fails closed', () => {
  const p = structuredClone(policy); p.additionalArtifacts.pop();
  assert.throws(() => attest(p, now));
  assert.throws(() => evaluateAudit(report(), 1, p, true));
});

test('installed graph rejects diverted links, duplicate copies and tampered files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'spartan-artifact-test-'));
  try {
    const target = join(dir, 'braces@3.0.3_patch_hash=synthetic', 'node_modules/braces');
    const parent = join(dir, 'micromatch@4.0.8', 'node_modules');
    mkdirSync(target, { recursive: true }); mkdirSync(parent, { recursive: true });
    writeFileSync(join(target, 'index.js'), 'module.exports = {};');
    const link = join(parent, 'braces'); symlinkSync(target, link);
    const artifact = { module_name: 'braces', storeEntry: 'braces@3.0.3_patch_hash=synthetic', packageTreeSha256: treeHash(target), incomingStoreEntries: ['micromatch@4.0.8'] };
    assert.doesNotThrow(() => attestAdditional(artifact, dir));
    unlinkSync(link); symlinkSync(tmpdir(), link);
    assert.throws(() => attestAdditional(artifact, dir), /UNATTESTED_RESOLUTION/);
    unlinkSync(link); symlinkSync(target, link);
    mkdirSync(join(dir, 'braces@3.0.3'));
    assert.throws(() => attestAdditional(artifact, dir), /UNREVIEWED_PACKAGE_COPY/);
    rmSync(join(dir, 'braces@3.0.3'), { recursive: true });
    writeFileSync(join(target, 'index.js'), 'changed');
    assert.throws(() => attestAdditional(artifact, dir), /INSTALLED_PACKAGE_CHANGED/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
