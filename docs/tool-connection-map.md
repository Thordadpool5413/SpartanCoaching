# Tool and Resource Connection Map

## Continuous Sales Command Center

The Sales Command Center is the durable account workflow. Its injected runtime
already connects:

1. Pre-Call Planner, Discovery Coach, and Objection Coach into one approved
   plan.
2. Roleplay Scenario Coach and Adaptive Roleplay Response into one resumable
   practice session.
3. Call Performance Coach and Coaching Feedback after a completed-call
   transaction.
4. Approved coaching and next actions into Email Optimizer drafts and the next
   scheduled call.
5. Account/contact history and NPI lookup context into plan preparation.

Those connections use organization-scoped workflow records and deliberate user
approval before external side effects.

## Advanced AI Tool Library

The advanced library uses typed in-memory handoffs. A completed result can
prefill the next compatible tool on web and iOS without copying it into logs,
URLs, analytics, local storage, or device storage.

| Source | Connected destination | Purpose |
| --- | --- | --- |
| Content Generator | Content Categorizer | Classify and tag a new draft |
| Content Categorizer | Content Recommender | Seed recommendations from classification |
| Content Recommender | Content Generator | Produce the recommended next asset |
| Content Gap Analyzer | Content Generator | Fill the highest-priority content gap |
| Territory Account Discovery | Email Optimizer | Draft outreach from account context |
| Email Optimizer | Content Categorizer | Classify a reusable outreach draft |
| Development Plan Generator | Microlearning Generator | Create the next practice |
| Microlearning Generator | Development Plan Generator | Update development priorities |
| Family Meeting Simulator | Development Plan Generator | Turn feedback into a coaching plan |
| Medical Record LCD Verifier | Documentation Gap Analyzer | Review missing documentation |
| Documentation Gap Analyzer | Admission Eligibility | Prepare evidence for qualified review |
| Admission Eligibility | Medicare LCD Advisor | Ask the next evidence-bound question |
| Medicare LCD Advisor | Documentation Gap Analyzer | Convert guidance into a checklist |
| Medicare LCD Advisor | LCD Policy Sales Playbook | Create compliant field education |
| LCD Policy Sales Playbook | Medicare LCD Advisor | Verify playbook statements |

## Safety boundaries

- Clinical handoffs remain ephemeral and in memory.
- Clinical output is not automatically handed to a saved sales/content run,
  because that could move protected or sensitive content into a nonclinical
  history table.
- AI never sends email, writes to a CRM/calendar, changes an account, or makes
  an admission/coverage decision. Deterministic application code and explicit
  user approval control side effects.
- PHI-mode document processing remains disabled until the complete BAA,
  permission, MFA, encrypted storage, scanner, evidence, and deletion controls
  are enabled.
