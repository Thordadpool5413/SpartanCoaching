#!/bin/bash
set -e
pnpm install --frozen-lockfile
# Raw SQL migrations create database functions and triggers that Drizzle's
# schema push cannot infer. This is the project's non-interactive primary
# migration path; do not follow it with Drizzle's interactive push command.
pnpm --filter @workspace/db run migrate
node artifacts/api-server/scripts/verify-ai-tools-schema.mjs
node artifacts/api-server/scripts/apply-sales-workflow-migration.mjs
