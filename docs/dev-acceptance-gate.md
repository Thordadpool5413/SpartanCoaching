# DEV identity and Coach acceptance gate

## Scope

This gate uses the real Express API, synthetic PostgreSQL fixtures, and Supertest. It does **not** connect to DEV Cloud SQL, make OpenAI calls, create Stripe purchases, or contain customer records. Run it on an isolated local PostgreSQL database with the repository's numbered migrations. The test fails closed if the test flag is enabled without a synthetic migration environment, localhost database URL, or allowlisted test database name.

File: `artifacts/api-server/src/routes/devAcceptance.integration.test.ts`

### Covered by automated CI

- Anonymous and invalid bearer-token access denied to private API routes
- Login, cookie/Bearer parity, onboarding access, logout and revoked-session rejection
- Expired session denial
- Standard membership cannot use Elite-only Coach; expired membership cannot use Coach
- Billing status remains scoped to the signed-in organization
- Same-company different-member and cross-organization Coach history/preference separation
- Conversation creation, owner-only retrieval, and owner-only deletion
- Transactional Coach turn persistence, idempotent message rows, custom title retention and refreshed conversation ordering

The existing `app-checks` GitHub CI job applies numbered synthetic migrations, then runs the API tests. This file is included in the API package's required `test` script; any assertion failure fails the required CI aggregate check.

### Local synthetic test (never run against Cloud SQL)

Use a separately created local database named `ci`, `test`, or `spartan_test`. Do not supply DEV, production, or other cloud database credentials.

```bash
MIGRATION_ENVIRONMENT=synthetic \
DATABASE_URL=postgres://ci:ci@127.0.0.1:5432/ci \
pnpm --filter @workspace/db run migrate

MIGRATION_ENVIRONMENT=synthetic \
RUN_POSTGRES_INTEGRATION=true \
DATABASE_URL=postgres://ci:ci@127.0.0.1:5432/ci \
pnpm --filter @workspace/api-server exec vitest run src/routes/devAcceptance.integration.test.ts
```

### Not covered by this CI gate

- Live IAP/load-balancer authorization, actual DEV account recovery email delivery, real Stripe or Apple subscription payment flows
- A human visual walkthrough of the website or native TestFlight app
- Real OpenAI Coach generation/transcription or cross-device iOS UI parity
- Production readiness, clinical PHI activation, or customer data migration

Those require separate, expressly authorized acceptance checks. Do not turn off IAP, use production credentials in CI, or treat synthetic database success as production sign-off.

### Post-deploy DEV evidence

The earlier manual DEV check verified Coach history persistence after a refresh on Cloud Run revision `spartan-api-dev-00007-2x4`. Keep this separate from CI's synthetic evidence. For subsequent DEV releases, record the GitHub commit, exact CI run, Cloud Run revision and image digest, API health, authenticated seat tests, UI parity, and rollback revision.
