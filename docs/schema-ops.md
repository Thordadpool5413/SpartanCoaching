# Schema operations (F6 follow-through)

## Tenant IDs (auth int ↔ workflow UUID)

Product auth uses serial integers (`client_organizations.id`, `client_members.id`).
Sales Command Center tables use UUID `organization_id` / actor user ids.

**Canonical mapping only:** `@workspace/tenant-ids`  
Do not invent alternate UUID schemes. Changing the format requires a data migration
of all `sales_workflow_*` rows.

See also: `docs/repository-truth-audit.md` (Phase 1).

## Current model

- **Source of truth for table definitions:** Drizzle schemas in `lib/db/src/schema/`
- **Dev / Replit apply:** `pnpm --filter @workspace/db run push` (and `push-force` when intentional)
- **Versioned SQL (partial):**  
  - `lib/db/migrations/0001_spartan_ai_tools.sql`  
  - `lib/db/migrations/0002_ephemeral_clinical_tools.sql`  
  - `lib/db/migrations/0003_client_auth_billing.sql` — product auth + org billing columns (IF NOT EXISTS)  
  - `lib/db/migrations/0004_cms_content.sql` — articles, resources, podcasts, testimonials, case studies, inquiries, newsletter, resource leads

CI and Replit still use **`pnpm --filter @workspace/db run push`** as the primary apply path.
Numbered SQL is the **reviewed baseline / recovery** path and the target for future migrate-only deploys.

## Production rules

1. After `git pull` of schema changes, run push **before** smoke tests:
   ```bash
   pnpm --filter @workspace/db run push
   ```
2. Never rely on git alone — Replit Publish does not replace schema push.
3. Prefer generating a migration for **destructive** or multi-env changes:
   ```bash
   # When drizzle-kit generate is configured for the package:
   pnpm --filter @workspace/db exec drizzle-kit generate
   ```
4. Keep AI/clinical migrations as SQL files reviewed in PR.

## Target end-state (next ops phase)

- [x] Auth + billing tables represented as ordered SQL (`0003_client_auth_billing.sql`)  
- [x] CMS marketing content baseline (`0004_cms_content.sql`)  
- [ ] Roleplay / assessments / analytics migrations  
- [ ] CI job: fresh Postgres + migrate-only + smoke login/onboarding  
- [ ] Deprecate `push` for production deploys (local only)

Until then, treat **missing push after schema PR** as a release blocker.
