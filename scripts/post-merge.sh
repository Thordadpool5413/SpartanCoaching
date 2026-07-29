#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
node artifacts/api-server/scripts/verify-ai-tools-schema.mjs
node artifacts/api-server/scripts/apply-sales-workflow-migration.mjs
