// Synthetic cryptographic regression; keys are generated in memory and never persisted.
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';

export function verifyForgeSecurity(forge) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048, publicExponent: 3,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  const key = forge.pki.privateKeyFromPem(privateKey);
  const pub = forge.pki.publicKeyFromPem(publicKey);
  const bytes = 'synthetic signature regression';
  const md = forge.md.sha256.create().update(bytes);
  const digest = md.digest().getBytes();
  const a = forge.asn1;
  const make = (type, constructed, value) => a.create(a.Class.UNIVERSAL, type, constructed, value);
  const oid = () => make(a.Type.OID, false, a.oidToDer(forge.pki.oids.sha256).getBytes());
  const nil = () => make(a.Type.NULL, false, '');
  const junk = () => make(a.Type.OCTETSTRING, false, 'synthetic extra bytes');
  const info = (algorithm, extra = []) => a.toDer(make(a.Type.SEQUENCE, true, [
    make(a.Type.SEQUENCE, true, algorithm), make(a.Type.OCTETSTRING, false, digest), ...extra,
  ])).getBytes();
  const signDer = (der) => key.sign(der, 'NONE');
  // SHA-256 AlgorithmIdentifier allows an absent or explicit NULL parameter.
  for (const algorithm of [[oid()], [oid(), nil()]]) {
    assert.equal(pub.verify(digest, signDer(info(algorithm))), true);
  }
  for (const der of [
    info([oid(), nil(), junk()]),
    info([oid(), junk()]),
    info([oid(), nil(), nil()]),
    info([oid(), nil()], [junk()]),
    info([oid(), nil()]) + '\x00',
  ]) {
    assert.throws(() => pub.verify(digest, signDer(der)), undefined,
      'FORGE_MALFORMED_DIGEST_INFO_ACCEPTED');
  }
  const valid = key.sign(forge.md.sha256.create().update(bytes));
  assert.equal(pub.verify(digest, valid), true);
  assert.equal(verify('sha256', Buffer.from(bytes), publicKey, Buffer.from(valid, 'binary')), true);
  assert.equal(pub.verify(forge.md.sha256.create().update('tampered').digest().getBytes(), valid), false);
  const pss = () => forge.pss.create({ md: forge.md.sha256.create(),
    mgf: forge.mgf.mgf1.create(forge.md.sha256.create()), saltLength: 32 });
  assert.equal(pub.verify(digest, key.sign(forge.md.sha256.create().update(bytes), pss()), pss()), true);
  return { key, pub };
}
