// P01 static evidence only. Does not connect to a database or prove schema equality.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(path.join(root, p), 'utf8');
const sha256 = p => createHash('sha256').update(readFileSync(path.join(root, p))).digest('hex');
const paths = readdirSync(path.join(root, 'lib/db/migrations')).filter(p => p.endsWith('.sql')).sort().map(p => `lib/db/migrations/${p}`);
paths.push('lib/hospice-sales-runtime/migrations/001_sales_workflow.sql');
const migrations = paths.map(p => ({ id: p.includes('hospice-sales-runtime') ? '0013_sales_workflow.sql' : path.basename(p), path: p, sha256: sha256(p) }));
if (new Set(migrations.map(m => m.id)).size !== migrations.length) throw new Error('Duplicate migration ledger ID');
const schemaPaths = readdirSync(path.join(root, 'lib/db/src/schema')).filter(p => p.endsWith('.ts')).sort().map(p => `lib/db/src/schema/${p}`);
const names = (paths, regex) => [...new Set(paths.flatMap(p => [...read(p).matchAll(regex)].map(m => m[1])))].sort();
const declared = names(schemaPaths, /^export\s+const\s+\w+\s*=\s*pgTable\(\s*["']([^"']+)["']/gm);
const created = names(paths, /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["']?([a-zA-Z_][a-zA-Z0-9_]*)/gi);
const evidencePaths = [
 'lib/db/src/migrate-manifest.ts', 'lib/db/scripts/migrate.ts',
 'lib/db/scripts/backup-restore-drill.ts', '.github/workflows/ci.yml',
 'lib/api-spec/openapi.yaml', 'artifacts/api-server/src/clinical/access.ts',
 'artifacts/api-server/src/auth/opsJobs.ts', 'artifacts/api-server/src/clinical/ephemeral.ts',
 'artifacts/api-server/src/clinical/patientExtraction.ts',
 'artifacts/spartan-coaching-mobile/app/ai-tools/patient-review.tsx',
 'artifacts/spartan-coaching-mobile/lib/offlineQueue.ts',
 'artifacts/spartan-coaching-mobile/lib/generatedToolPrivacy.ts',
 'artifacts/spartan-coaching-mobile/lib/toolDraftCache.ts',
];
for (const p of evidencePaths) if (!existsSync(path.join(root, p))) throw new Error(`Missing evidence path: ${p}`);
const evidence = {
 baselineMainSha: '708b0522af3534a0066134d646f21f2a3cb8747c',
 scope: 'Static lexical table-name inventory and source hashes; NOT PostgreSQL replay, full schema equivalence, restore, deployment or PHI certification.',
 ordering: 'lib/db filenames lexicographically sorted; external workflow ledger ID 0013 last',
 migrations,
 tables: { declared, created, declarationsWithoutCreate: declared.filter(n => !created.includes(n)), sqlOnly: created.filter(n => !declared.includes(n)) },
 sources: evidencePaths.map(p => ({ path: p, sha256: sha256(p) })),
};
const output = JSON.stringify(evidence, null, 2) + '\n';
const target = path.join(root, 'docs/operational-evidence.json');
if (process.argv.includes('--check')) {
 if (readFileSync(target, 'utf8') !== output) throw new Error('Evidence changed: inspect source and regenerate explicitly');
 console.log(`PASS: ${migrations.length} migrations; ${declared.length} declared table names; ${created.length} SQL table names; ${evidencePaths.length} evidence paths`);
} else writeFileSync(target, output);
