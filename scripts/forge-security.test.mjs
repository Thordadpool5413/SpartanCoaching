import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { verify } from 'node:crypto';
import { verifyForgeSecurity } from './security/forge-regression.mjs';

const mobile = createRequire(new URL('../artifacts/spartan-coaching-mobile/package.json', import.meta.url));
const expo = createRequire(mobile.resolve('expo/package.json'));
// Both CLI resolutions are installed today: direct development CLI and Expo's CLI.
const cliPaths = new Set([mobile.resolve('@expo/cli/package.json'), expo.resolve('@expo/cli/package.json')]);
const forgePaths = new Set();
const signingPaths = new Set();
for (const cliPath of cliPaths) {
  const cli = createRequire(cliPath);
  forgePaths.add(cli.resolve('node-forge'));
  const signingPath = cli.resolve('@expo/code-signing-certificates');
  signingPaths.add(signingPath);
  forgePaths.add(createRequire(signingPath).resolve('node-forge'));
}
assert.ok(forgePaths.size > 0 && signingPaths.size > 0, 'SIGNING_DEPENDENCIES_MISSING');
const load = createRequire(import.meta.url);
for (const [index, path] of [...forgePaths].entries()) {
  test(`installed forge ${index + 1} rejects malformed DigestInfo and retains valid RSA/PSS`, () => {
    verifyForgeSecurity(load(path));
  });
}
for (const [index, path] of [...signingPaths].entries()) {
  test(`Expo signing ${index + 1}: PEM, certificate, CSR, signed manifest and tamper rejection`, () => {
    const signing = load(path);
    const forge = createRequire(path)('node-forge');
    const keyPair = signing.generateKeyPair();
    const pem = signing.convertKeyPairToPEM(keyPair);
    const roundTrip = signing.convertKeyPairPEMToKeyPair(pem);
    const now = Date.now();
    const cert = signing.generateSelfSignedCodeSigningCertificate({ keyPair: roundTrip,
      validityNotBefore: new Date(now - 60000), validityNotAfter: new Date(now + 3600000),
      commonName: 'synthetic.example.invalid' });
    const restored = signing.convertCertificatePEMToCertificate(signing.convertCertificateToCertificatePEM(cert));
    assert.doesNotThrow(() => signing.validateSelfSignedCertificate(restored, roundTrip));
    const csr = signing.convertCSRPEMToCSR(signing.convertCSRToCSRPEM(signing.generateCSR(roundTrip, 'synthetic.example.invalid')));
    assert.equal(csr.verify(), true);
    const manifest = Buffer.from('{"synthetic":true}');
    const signature = signing.signBufferRSASHA256AndVerify(roundTrip.privateKey, restored, manifest);
    assert.equal(verify('sha256', manifest, pem.publicKeyPEM, Buffer.from(signature, 'base64')), true);
    assert.equal(verify('sha256', Buffer.from('tampered'), pem.publicKeyPEM, Buffer.from(signature, 'base64')), false);
    restored.signature = '\x00'.repeat(restored.signature.length);
    assert.throws(() => signing.validateSelfSignedCertificate(restored, roundTrip));
    assert.equal(forge.pki.publicKeyToPem(csr.publicKey), pem.publicKeyPEM);
  });
}
