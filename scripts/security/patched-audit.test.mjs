import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { attest, evaluateAudit, root } from './patched-audit.mjs';
const policy = JSON.parse(readFileSync(`${root}/patches/forge-attestation.json`));
const now = new Date('2026-10-03T00:00:00Z');
const advisory = { github_advisory_id: policy.advisory, module_name: 'node-forge', severity: 'high', cves: ['CVE-2026-85393'], patched_versions: '<0.0.0', findings: [{ version: '1.4.0', paths: [policy.auditPaths[0]] }] };
const report = () => ({ advisories: { synthetic: structuredClone(advisory) }, muted: [], metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0 } } });
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
