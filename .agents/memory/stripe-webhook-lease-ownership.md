---
name: Stripe webhook lease ownership
description: Durable idempotency and concurrency rule for Stripe delivery processing.
---

Use Stripe's event ID as the durable delivery key, and fence every processed or failed update with the claim's attempt number.

Claim each billing notification bundle by Stripe event ID and notification category *before* contacting the email provider. A retry must treat an existing claim as already attempted, even if the worker could not persist the post-send result.

**Why:** A recovery worker can reclaim a stale delivery while an earlier worker is still finishing. Without claim ownership, the older worker can overwrite the ledger state and permit repeated billing side effects. A final-ledger failure after an email provider accepts a request has the same duplicate-email risk.

**How to apply:** Keep ledger migrations additive for the established event-ID key shape, return the claim attempt when work starts, and condition finalization on that same attempt. Preserve stale-worker and post-send-persistence-failure regression tests whenever the lease policy changes.