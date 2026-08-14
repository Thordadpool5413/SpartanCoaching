# Mission state machine (G2)

**Rule:** Never show activation checklist and Command mission as equal primary CTAs.

| Auth | Entitlement | Activation | Primary |
|------|-------------|------------|---------|
| Out | — | — | Dual doors |
| In | Locked | — | Paywall / Account subscribe |
| In | Allowed | Has next required step (not skipped) | **Activation next step** |
| In | Allowed | Activated or skipped | **useMission primary** (role → checklist → Command) |
| In | Allowed | Checklist complete | Command today / plan next visit |

## Implementation

- `useMission()` owns entitled/locked/logged-out primary.  
- Activation is folded into Home **or** into `useMission` when `activation.nextStep` present — **one** MissionCard.  
- Checklist UI below fold only (progress, not second hero).  
