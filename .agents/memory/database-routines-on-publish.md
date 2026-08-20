---
name: Database routines on publish
description: Production publishing does not include PostgreSQL function and trigger DDL in the schema diff.
---

PostgreSQL functions and triggers defined in tracked raw SQL migrations must not be assumed to reach production through the standard Replit Publish schema diff.

**Why:** The observed development-to-production schema diff included tables, columns, indexes, and foreign keys from the offboarding-retention migration but omitted its function and trigger definitions. A production background job consequently logged that its retention function did not exist.

**How to apply:** Keep the development raw-SQL migration runner in post-merge setup. Before enabling or relying on a routine-dependent production job, add a post-publish verification and use an approved production rollout path; never add startup-time DDL or a deploy-build database push as a workaround.