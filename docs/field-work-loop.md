# Shared field-work loop

## Canonical product flow

| Handoff | Source | Destination | Server-owned facts | Client-visible recovery |
| --- | --- | --- | --- | --- |
| Access request | Public site | Access Desk / sign-in | Account existence, approval, evaluation, entitlement | Existing-account prompt; no second account |
| Onboarding | Sign-in | Workspace / iOS home | Member role, organization, entitlement, safe preferences | Retry without losing the selected preference |
| Tool use | Workspace or iOS | Tool endpoint | Tool access, tenant, approved input/output boundary | Local draft can remain `local_only`; failed requests can retry |
| Saved work | Tool result | `member-work` and My Work | Member/organization ownership, PHI check, status, next action | `pending`, `synced`, `completed`, or `failed`; POST retries use `Idempotency-Key` |
| Follow-up | Saved work | Command Center / reminder | Next action and notification eligibility | Deep link resolves to an internal route or a safe fallback |
| Review | Completed work | Workspace, iOS, admin analytics | Completion timestamp and allow-listed outcome metadata | Last-known mobile list remains readable when the network is unavailable |

The API is authoritative for entitlement, tenant/member ownership, privacy checks,
notification eligibility, and external side effects. The clients own presentation,
temporary drafts, and retry affordances. A saved-work ID is the stable cross-device
handle; free text, prompts, transcripts, drafts, PHI, and generated output do not
enter analytics or external integrations.

## Shared contract

The `field-work-contract` vocabulary distinguishes:

- `local_only`: content exists only on the device.
- `pending`: a client is retrying a server mutation.
- `synced`: the server accepted the item and it is available to both clients.
- `completed`: the server-accepted item has completed its field action.
- `failed`: the user can retry without creating a duplicate.

The next-move response can include `resumeWorkId` and a web/mobile URL with the
same saved-work ID. This avoids asking a member to reconstruct which draft or
recent result the recommendation referred to.

## Integration pilot decision

**Selected pilot: Calendly link-based consultation scheduling.**

| Candidate | Ownership and adoption | Privacy | Failure recovery | Decision |
| --- | --- | --- | --- | --- |
| Calendly | Familiar booking flow; Spartan owns the event types and fallback contact path | Share only name, email, organization, and time-zone details; no field-work content | Keep the internal inquiry as the source of truth; if embed/link fails, preserve the request and follow up manually | **Pilot** |
| Google Calendar | Strong availability control but requires broader account/calendar authorization and more ongoing admin ownership | Calendar scope is broader than the consultation handoff needs | OAuth expiry and calendar permission failures add recovery work | Defer |
| HubSpot | Useful only if Access Desk cannot provide the required lead/org handoff | Requires a new external lead copy and deletion/reconciliation policy | Duplicate lead, disconnected account, and partial-sync handling are not justified yet | Conditional review only |

This is a selection for a controlled pilot, not an immediate connection or data
migration. The first implementation should be a single owned Calendly event type
linked from the existing consultation path, with the existing Access Desk inquiry
remaining the fallback and system of record. No PHI or tool content is sent.

## Outcome measures

1. Public intent → correct destination: at least 90% of `workspace_handoff` events
   reach the intended access, workspace, app, or consultation route.
2. Access completion: measure request-to-approved-account and approved-account-to-
   first-tool rates, split by public source token.
3. Continuity: at least 70% of saved-work items opened on a second surface within
   seven days; track `cross_device_continuation` without content metadata.
4. Reliability: fewer than 1% duplicate saved-work records per 1,000 retried
   mutations; no tenant-crossing reads or writes.
5. Recovery: 100% of forced-offline test cases show a last-known list or an
   actionable retry, never a silent empty state.
6. Pilot health: booking completion, fallback-to-Access-Desk rate, and external
   scheduling failure rate. Do not count a booking as a product completion until
   the internal inquiry remains attributable.

## Rollout and rollback

1. **Instrument and shadow:** ship the handoff event, stable saved-work IDs,
   idempotent writes, and offline cache. Verify tenant isolation, redaction, and
   retry tests before enabling external booking.
2. **Internal pilot:** enable Calendly for one consultation event type and one
   owner. Review booking/fallback metrics weekly; keep the existing inquiry path
   visible.
3. **Expand carefully:** only expand when reliability and privacy measures meet
   the thresholds above and the owner confirms availability coverage.
4. **Rollback trigger:** disable the Calendly link/feature flag immediately for
   elevated booking failures, missing inquiry attribution, privacy-boundary
   findings, or any tenant/isolation defect. Existing contact and Access Desk
   flows remain available.
5. **Code rollback:** retain the additive `member-work` migration and idempotency
   records during a software rollback. They prevent retries from creating
   duplicates and do not require deleting member work.

## Ownership

- Product owner: owns the event type, adoption threshold, and rollout decision.
- Access Desk owner: owns inquiry review and manual recovery.
- API owner: owns tenant authorization, redaction, idempotency, and auditability.
- Web/iOS owners: own destination routing, offline explanations, and deep-link UX.
- Integration owner: owns the Calendly workspace, availability, and disconnect
  runbook; no external service becomes the source of truth for entitlement or work.