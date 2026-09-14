---
name: Shared field-work loop
description: Durable coordination rules for web, iOS, API, and consultation scheduling.
---

The shared field-work contract uses server-owned saved-work IDs to connect public
handoffs, workspace recommendations, iOS resume links, completion state, and
privacy-safe outcome metrics. Clients may cache and retry, but they do not decide
entitlement, tenant ownership, redaction, or notification eligibility.

**Why:** Separate web and mobile state made a recommendation lose the specific
draft/result it referred to, and retrying a save could create duplicate work.

**How to apply:** Extend `member-work` and the next-move response rather than
creating a second cross-device state model. Keep external integrations outside
the system of record.

For retry identity, the owner scope must be part of the database uniqueness
boundary, and the write must tolerate a concurrent duplicate by reading back
the owner-scoped winner. A read-before-insert check alone is not sufficient.

**Why:** Two clients can pass the initial duplicate lookup before either insert
commits, turning a valid retry into a unique-constraint error or duplicate item.

**How to apply:** Keep idempotency keys bounded to the authenticated
organization/member pair, use a database-level conflict-safe insert, and return
only the row selected with that same owner predicate.

Calendly is the selected consultation scheduling pilot as a link-based event
type, with the internal Access Desk inquiry retained as the fallback and source
of truth. Google Calendar is deferred because its authorization scope and
availability ownership are broader than the first handoff needs; HubSpot remains
conditional on the internal lead flow proving insufficient.

**Why:** A bounded booking link has lower privacy and recovery cost than calendar
OAuth while still testing consultation conversion.

**How to apply:** Do not send PHI, prompts, transcripts, drafts, or generated
outputs to the pilot. Disable the link on reliability, attribution, privacy, or
tenant-isolation regressions and preserve manual inquiry recovery.