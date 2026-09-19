---
name: Medicare request budgets
description: Reliability rules for the CMS Medicare Intelligence workspace's layered request deadlines and cancellation.
---

Browser GET deadlines for Medicare evidence reads must leave margin above the longest valid server response time. Do not use one short deadline for both evidence-heavy reads and ordinary write actions.

**Why:** Production responses have completed successfully just after a shorter browser cutoff, causing users to see a timeout even though the server returned valid data. Separately, a server-side waiting budget can reject its wrapper while the underlying CMS fetch continues consuming resources.

**How to apply:** When changing Medicare pipelines, keep browser, route, feed, retry, and individual HTTP deadlines intentionally ordered. Preserve a finite browser deadline, measure real response times, and propagate cancellation through paged CMS fetches rather than relying only on `Promise.race`. Shared refreshes must be reference-counted: one disconnected subscriber must not cancel work another subscriber still needs, but the upstream request must stop when the last subscriber leaves. Request-level cancellation must escape evidence-warning and stale-cache wrappers so abandoned work cannot write degraded cache entries.