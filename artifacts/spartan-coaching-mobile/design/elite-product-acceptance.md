# Spartan Coaching Elite iOS Product Acceptance Standard

This document is the binding product quality gate for the Spartan Coaching iOS application. A passing build must satisfy the product, visual, interaction, privacy, accessibility, entitlement, and native routing requirements below. Passing unit tests alone is not sufficient evidence of product quality.

## 1. Universal clarity standard

A first time visitor must be able to answer these questions within ten seconds of opening the app:

1. What Spartan Coaching helps them accomplish.
2. Where to prepare for a conversation.
3. Where to practice or use a field tool.
4. What Standard includes.
5. What Elite adds.
6. How to subscribe through Apple.
7. That a Spartan account is not required before Apple purchase.
8. That company seats and human consulting are commercially separate from an individual Apple subscription.

A returning member must be able to reach the next useful action within three intentional taps from Home.

No screen may require the user to infer access level from hidden state, unexplained icons, or disabled controls without supporting copy.

## 2. Binding visual reference rule

The approved Figma frames are binding implementation targets, not visual inspiration. The public Home target is node `33:13`, Coach is node `35:202`, and Library is node `36:4` in file `p3WMv207TPMNY2XmGm0E0H`. Older generated screenshots in the repository are not binding.

For each approved major screen:

1. Capture the approved design reference.
2. Capture the implemented screen at the same device size and appearance.
3. Compare composition, logo treatment, typography, color, hierarchy, spacing, imagery, controls, and navigation directly.
4. Use overlay or opacity comparison where practical to reveal drift.
5. Correct visible drift before the screen is accepted.

A screen does not pass because it uses similar colors or approximately the same sections.

The Spartan helmet is a transparent red compact icon and is paired with the Spartan Coaching name where identity must be explicit. It never appears on a black tile or as a cropped substitute for the full logo. The distressed Spartan Coaching asset remains available for approved full logo placements.

## 3. Brand and visual system

Every screen must use one coherent visual system:

1. Midnight or deep navy branded surfaces rather than pure black.
2. Spartan crimson red for purposeful emphasis and primary actions.
3. Warm white or cool light surfaces with clear contrast in Light appearance.
4. Genuine System appearance that follows the iPhone setting.
5. Equal design attention in Light and Dark appearances.
6. Consistent typography, spacing, radii, borders, iconography, touch targets, input treatment, and result hierarchy.
7. Distressed brand texture used intentionally, never as decorative noise.
8. No repetitive wall of identical cards.
9. No stretched or redrawn primary logo.
10. No black rectangle surrounding the supplied logo artwork.

## 4. Navigation and product architecture

The permanent primary navigation is exactly:

1. Home
2. Coach
3. Explore
4. My Work
5. Account

Explore provides clear access to all tools and the native Library. My Work contains commitments, saved plans, approved outputs, and offline downloads. Organization Admin appears from Account and authorized shortcuts only after the appropriate admin entitlement exists.

Core product functionality must remain inside the iOS app. Support, privacy, terms, trust, Library content, and field results open inside the native app. External transitions are limited to destinations that genuinely require operating system or provider handling, including Apple subscription management and secure provider authorization.

The legacy core tool WebView bridge must not exist.

## 5. Visitor experience

A visitor may explore the app before account creation.

The visitor experience must provide:

1. Guided interactive tour.
2. Complete access map.
3. Safe fictional examples.
4. Standard and Elite comparison.
5. Apple subscription purchase before Spartan account creation.
6. Restore Purchases before sign in.
7. Native company and consulting request destinations.
8. Clear privacy and PHI boundaries.

After Apple purchase, account creation or account connection is explained as protecting and synchronizing the purchase and work. It must never imply another charge.

## 6. Home

Home is a personal field guide, not a CRM dashboard.

The approved public Home must match Figma node `33:13`. The signed in Home must preserve the same visual language and provide:

1. Transparent helmet identity paired with the Spartan Coaching name.
2. Personal greeting.
3. One clear preparation question.
4. One dominant conversation planning action.
5. Practice appropriate to Standard or Elite access.
6. Commitment continuity.
7. Guided tour access.
8. Complete access map entry.
9. Private commitment disclosure where applicable.
10. Role aware behavior without exposing unnecessary CRM metrics.

No sales pipeline statistics, meaningless activity counters, or generic dashboard widgets may dominate Home.

## 7. Guided tour

The guided tour must demonstrate the product instead of presenting marketing slides.

It must include a fictional hospice sales scenario and demonstrate:

1. Situation framing.
2. Conversation preparation.
3. Objection practice.
4. A member choice or interaction.
5. Coach style feedback.
6. A clear retry or improved language.
7. A commitment.
8. Where continuity appears in the app.
9. Privacy boundaries.
10. Standard and Elite access.
11. Company and consulting separation.
12. Apple membership comparison as the visitor completion destination.

No patient PHI is used in the tour.

## 8. Membership and Apple purchasing

Individual iOS membership uses StoreKit and Apple subscription controls.

Standard:

* Reference US price: $14.99 weekly.
* Home and planning.
* Core sales tools.
* Role play.
* Playbooks and research.
* Outreach and calculators.
* Weekly planning.
* Library and saved work.

Elite:

* Reference US price: $19.99 weekly.
* Everything in Standard.
* Private Spartan Coach.
* Voice rehearsal and transcription.
* Optional editable Coach memory.
* Advanced AI tools.
* Deidentified clinical education tools.
* Advanced leadership capabilities.

Purchase acceptance requires:

1. Products load from StoreKit.
2. Apple localized price is displayed when available.
3. Purchase can begin before Spartan account creation.
4. Purchase success is handled.
5. User cancellation is handled without an alarming error state.
6. Pending purchase is handled.
7. Purchase failure is recoverable.
8. Restore Purchases works before and after sign in.
9. Account claiming does not cause a second charge.
10. Standard to Elite upgrade preserves history, commitments, preferences, and saved work.
11. Individual subscription management routes through Apple.
12. No browser Stripe checkout is exposed for individual iOS membership.

## 9. Company memberships

Company access is separate from the Apple individual subscription and requires the approved provider agreement and contracted seats.

The app must communicate:

1. Contracted tier.
2. Seat status.
3. Organization identity.
4. Activation state.
5. Whether individual Apple billing may still be renewing.

When transitioning an individual member to a company seat:

1. Activate the company seat first.
2. Preserve the same Spartan account, history, preferences, and commitments.
3. Confirm company access.
4. Guide the member to Apple subscription management to end individual renewal where applicable.
5. Never promise that Spartan Coaching can automatically cancel an Apple subscription on the member's behalf.

## 10. Spartan Coach

Coach must feel like a complete private coaching product rather than a chat wrapper.

Acceptance includes:

1. Preparation mode.
2. Rehearsal mode.
3. Text and supported voice interaction.
4. Useful clarifying questions when context is missing.
5. Direct feedback tied to the member's objective.
6. Suggested retry language.
7. One clear commitment or next move.
8. Private history treatment.
9. Optional memory off by default.
10. Memory visible, editable, and deletable by the member.
11. Clear share controls.
12. Explicit privacy disclosure.
13. Safe interruption recovery.
14. No storage or continuation when prohibited PHI, legal risk, clinical decision making, or employee crisis requires rerouting.

Raw Coach conversations are hard deleted after 90 days.

## 11. Tools

Tools are organized by outcome, not by internal implementation names.

Every field tool must have:

1. Clear purpose.
2. When to use it.
3. Required context.
4. Native input experience.
5. Purpose built result presentation.
6. Save or continuity behavior where applicable.
7. Reopen behavior where applicable.
8. Copy, share, or export where appropriate.
9. Offline rule.
10. Membership state.
11. Loading state.
12. Empty state.
13. Error state.
14. Success state.
15. Accessibility support.

All catalog tools require approved native routes. Unknown universal search destinations must not be pushed into unowned routes or browser fallbacks.

## 12. Advanced AI tools

All advanced tools use a semantic result hierarchy.

When present, output is organized into meaningful groups such as:

1. Executive answer.
2. Field ready language.
3. Next actions.
4. Reasoning.
5. Evidence and review.
6. Supporting detail.

Generic JSON or object dump presentation is not acceptable.

Nonclinical runs may be saved to account history where appropriate. Clinical runs are ephemeral and must not create a surprise history archive.

Compatible outputs may continue into another approved tool through an in memory handoff.

## 13. Clinical education tools

Clinical tools are deidentified education and decision support only.

Acceptance requires:

1. PHI prohibition before entry.
2. Explicit deidentification confirmation.
3. No patient document upload.
4. Saved member jurisdiction context containing state and Medicare Administrative Contractor region.
5. Clinical execution blocked when required jurisdiction context is missing.
6. Jurisdiction context automatically attached server side to clinical execution.
7. No invented local rule when current approved source evidence is unavailable.
8. Visible evidence and review requirements.
9. Watermark where required.
10. Ephemeral run retention.

Approval requirements:

* Clinical guidance requires medical director and compliance approval.
* Regulatory or operational guidance requires compliance approval.
* Sales and nonclinical coaching guidance is labeled as suggested guidance and does not require clinical approval.

Approval records must be able to identify approver, role, date, source version, expiration, and required changes.

## 14. Library

Library is a native learning environment and must provide:

1. Native reading.
2. Native listening.
3. Saved items.
4. Downloads.
5. Search or discoverability.
6. Spartan Method.
7. Drills.
8. Quiz.
9. Manifesto.
10. Organization resources.
11. Review lifecycle where required.
12. Progress or continuation where appropriate.
13. Offline access to downloaded approved content.

Library must not use browser navigation as the normal content experience.

## 15. Consulting

Consulting is a separate contracted human service and must remain inside the app through request confirmation.

The native journey includes:

1. Service selection.
2. Explanation of scope.
3. Preferred availability.
4. Intake.
5. PHI warning.
6. Submission.
7. In app confirmation.
8. Explicit commercial separation from Standard and Elite.

## 16. Organization Admin

Organization Admin is visible only to properly entitled administrators.

Native capabilities include:

1. Contract and seat status.
2. Members.
3. Invitations.
4. Member and administrator roles.
5. Branch assignment.
6. Team assignment.
7. Manager assignment.
8. Seat disable and restore.
9. Offboarding.
10. Aggregate usage counts and trends.
11. Last activity.
12. Audit history.
13. Explicitly shared summaries and commitments where supported.

Hard privacy boundary:

Organization administrators never receive raw Coach prompts, drafts, recordings, transcripts, or unshared outputs.

## 17. Offboarding and retention

Company offboarding must:

1. Revoke company access immediately.
2. Clear active company sessions where appropriate.
3. Preserve the privacy boundary around raw Coach content.
4. Support a 30 day former member window to preserve eligible personal commitments into an individual account.
5. Retain shared summaries for 12 months after departure unless a legal or company policy requires another lawful period.
6. Hard delete retained shared summaries after that period when no lawful exception applies.

Commitments remain until completed or deleted by the member unless a defined retention rule requires otherwise.

## 18. Account

Account is the native source of truth for:

1. Identity.
2. Membership and entitlement.
3. Company access.
4. Apple subscription controls.
5. Complete access map.
6. System, Light, and Dark appearance.
7. Field role and non patient context.
8. State and Medicare contractor context for Elite clinical education tools.
9. Privacy controls.
10. Coach memory controls where applicable.
11. Support.
12. Legal destinations.
13. Guided tour replay.
14. Sign out.
15. Account deletion.

## 19. Offline behavior

Offline behavior is explicit rather than accidental.

Allowed offline when previously downloaded or saved:

1. Downloaded Library content.
2. Approved nonclinical outputs.
3. Commitments.
4. Selected planning.

Requires a secure connection:

1. Coach generation.
2. Voice transcription processing.
3. Clinical tools.
4. Billing and StoreKit server synchronization.
5. Sharing.
6. Organization Admin.
7. Consulting submission.

The app must show a useful offline state instead of a generic network failure where the product knows the difference.

## 20. Interaction quality

Every major action must have appropriate reaction and recovery behavior.

Review includes:

1. Press state.
2. Haptic where it adds meaning.
3. Loading feedback.
4. Skeleton state for content that takes meaningful time.
5. Success confirmation.
6. Recoverable error copy.
7. Disabled state explanation where needed.
8. Keyboard behavior.
9. Safe area behavior.
10. Predictable back navigation.
11. Interruption recovery.
12. Reduced motion respect where motion is used.

Motion supports understanding and never delays access to the work.

## 21. Accessibility

Before release, each major journey is checked for:

1. VoiceOver labels and order.
2. Dynamic Type.
3. Large accessibility text sizes.
4. Contrast in Light and Dark appearances.
5. Minimum practical touch targets.
6. Non color only status communication.
7. Reduced Motion behavior.
8. Smaller supported iPhones.
9. Current large iPhones.

## 22. Required state matrix

Major experiences are reviewed in every relevant state:

1. Visitor.
2. Standard member.
3. Elite member.
4. Company Standard member.
5. Company Elite member.
6. Organization Admin.
7. Platform Admin.
8. Loading.
9. Empty.
10. Offline.
11. Locked.
12. Error.
13. Success.
14. Expired or revoked access.
15. Light.
16. Dark.
17. System.

## 23. Release evidence

No TestFlight release is considered visually approved until the product team has reviewed physical iPhone evidence.

Required evidence includes:

1. Actual device screenshots for every major screen.
2. Light appearance.
3. Dark appearance.
4. System appearance.
5. Visitor purchase flow.
6. Standard flow.
7. Elite flow.
8. Company flow.
9. Admin flow.
10. Guided tour.
11. Core field tool result.
12. Advanced AI result.
13. Clinical jurisdiction gate and ephemeral result.
14. Library reader and player.
15. Consulting confirmation.
16. Offline examples.
17. Error and recovery examples.

Actual device screenshots are compared directly with approved visual references before visual acceptance.

## 24. Definition of complete

A feature is not complete merely because its route opens.

A feature counts as complete only when:

1. The member understands why it exists.
2. Access state is obvious.
3. The primary action works.
4. The result is useful and purpose built.
5. Loading and failure are handled.
6. Data saves correctly when persistence is promised.
7. The member can find saved work again.
8. Privacy and entitlement rules are enforced server side.
9. Offline behavior is deliberate.
10. Accessibility has been reviewed.
11. The implemented iPhone experience has passed visual review.

Anything less remains work in progress.
