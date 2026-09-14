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
migration. The first implementation uses one owner-approved Calendly event type
linked after the existing consultation request is submitted, with the existing
Access Desk inquiry remaining the fallback and source of truth. The pilot is
disabled when its public URL or feature flag is absent, and can be switched off
without changing access requests, entitlements, notifications, or saved work.
No PHI or tool content is sent.

## Operator pause and resume

Consultation booking is controlled by the server-owned `consultation_booking`
client-config flag. The API environment variable is
`FF_CONSULTATION_BOOKING`; it defaults to `true` so the existing owner-approved
URL/build configuration remains the final safety gate.

To pause the external handoff without rebuilding iOS:

1. Record the operator, UTC timestamp, incident or reason, and deployment/change
   reference in the incident or release record.
2. Set `FF_CONSULTATION_BOOKING=false` in the API deployment environment and
   restart or redeploy the API.
3. Verify `GET /api/client-config` returns
   `flags.consultation_booking=false`. Use synthetic contact details to confirm
   web and mobile keep the Access Desk request path.

To resume, set `FF_CONSULTATION_BOOKING=true`, restart or redeploy the API, and
record the same evidence after verifying
`flags.consultation_booking=true`. Both clients fail closed to Access Desk when
the flag is paused, absent, or the client-config request fails. Pausing this
flag does not alter entitlements, notifications, saved work, or Access Desk
requests. The build-time Calendly URL and enable flags remain independent
guards, so restoring the server flag cannot bypass an unconfigured pilot.

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

The pilot uses fixed event names with source tokens only:
`consultation_booking_click`, `consultation_booking_success`,
`consultation_booking_fallback`, and `consultation_booking_failure`.
Calendly success/failure redirects return to the public contact route with the
fixed `consultation=booked` or `consultation=failed` token. Mobile success is
user-confirmed in the in-app schedule screen. No booking URL carries contact
form answers or field-work content.

## Release smoke: Calendly consultation recovery

Run this smoke after the public web deploy and again for every TestFlight build
that has consultation scheduling enabled. Use synthetic test contact details
only; never use PHI, prompts, transcripts, drafts, or generated tool output.
The Access Desk inquiry must remain the source of truth in every scenario.

### Owner configuration before the smoke

- Confirm the owner-approved Calendly event type is the configured
  `VITE_CALENDLY_CONSULTATION_URL` / `EXPO_PUBLIC_CALENDLY_CONSULTATION_URL`.
- Confirm Calendly's success redirect is exactly
  `https://spartanhospicecoaching.com/contact?consultation=booked`.
- Confirm Calendly's failure/cancel redirect is exactly
  `https://spartanhospicecoaching.com/contact?consultation=failed`.
- Confirm the event type is available for the test window. If it is not,
  disable the pilot rather than substituting an unapproved booking URL.

### Web scenarios

1. Submit the public contact form with synthetic details and confirm the
   resulting Access Desk request is visible and attributable.
2. Open Calendly from the submitted state and complete a test booking. Confirm
   the browser returns to `/contact` with exactly one query key,
   `consultation=booked`, and the success card says the Access Desk request
   remains the source of truth.
3. Repeat with a Calendly failure/cancel. Confirm the browser returns with
   exactly `consultation=failed`, the failure card offers the Access Desk
   recovery path, and the original inquiry is still attributable.
4. Run once with the web pilot disabled/unconfigured. Confirm the submitted
   state keeps Access Desk follow-up visible and does not show a dead booking
   link.
5. In the analytics request/queue evidence, verify only the fixed
   `source=public_contact` and the expected outcome token are present. Contact
   answers, email addresses, organization names, and field-work content must
   not be present.

### Mobile/TestFlight scenarios

1. With the configured URL, open Account → consulting → Calendly, complete the
   test booking, tap **I booked a time**, and confirm the completion message
   says the Access Desk request remains saved.
2. With a QA build where
   `EXPO_PUBLIC_CALENDLY_CONSULTATION_ENABLED=false` (or the URL is absent),
   confirm the screen shows **Scheduling is temporarily unavailable**, says
   the Access Desk request is saved, and returns to consulting.
3. With the URL configured, force a WebView load failure (for example, block
   the test host or use an offline test window). Confirm the same Access Desk
   recovery state appears and the user can return without losing the request.
4. Verify mobile analytics contains only
   `source=mobile_consulting_schedule` plus the fixed outcome token
   (`schedule_opened`, `user_confirmed`, `pilot_disabled_or_unconfigured`,
   `access_desk_selected`, `webview_error`, or `http_error`). It must never
   contain contact answers or field-work content.

Record the build/commit, Calendly event type, redirect result, disabled-link
result, WebView-failure result, and analytics-redaction result in the release
record. Any missing attribution, unexpected query parameter, privacy leak, or
booking failure that lacks recovery is a rollback trigger: disable the
Calendly URL/flag and keep Access Desk follow-up enabled.

## Admin handoff-health view

Platform administrators can read the aggregate-only endpoint
`GET /api/admin/analytics/field-work-health`. It accepts `days` (1–400) and an
optional numeric `organizationId` (`all` is the default). Tenant-scoped results
join authenticated events to the server-owned member organization; anonymous
public handoffs are omitted from an organization filter and appear only in the
all-tenant view. Organization names, member IDs, and member identity are not
returned.

The response groups only these allow-listed outcome names by UTC day and
normalized platform (`web`, `ios`, `android`, or `unknown`):
`workspace_handoff` / `field_work_handoff`, `save_retry_failure`,
`sync_unavailable`, `field_work_completion`, and
`consultation_booking_fallback` (with the documented compatibility aliases).
It returns counts and row rates; rates are the share of recorded health events
in that day/platform row, so counts remain the primary rollout signal. Raw
metadata is never returned or exported. Analytics rows are retained for 400
days by the existing scheduled sweep.

The admin table exports the aggregate rows as CSV. Set
`FIELD_WORK_HEALTH_ANALYTICS_ENABLED=false` (or `0` / `off`) to disable this
projection without changing access, saved work, sync, notifications, or the
consultation fallback path. A disabled response is explicit and empty, making
the flag safe for rollback and export jobs.

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