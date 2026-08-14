# Craft analytics events (G6)

Use existing `trackMobileEvent` / product outcomes where possible.

| Event name | When | Metadata (safe keys only) |
|------------|------|---------------------------|
| `mission_cta_tap` | Primary mission button | `kind` (login/subscribe/role/checklist/command/activation) |
| `paywall_view` | Locked shell / PaywallCard mount | `org_status` |
| `paywall_cta_tap` | Subscribe / Account CTA | `destination` |
| `activation_step_open` | Open activation CTA | `step_id` |
| `activation_step_done` | Mark done / skip | `step_id`, `skipped` |
| `tool_generate_success` | Tool result OK | `tool_id` |
| `entitlement_refresh` | Focus refresh after billing | `allowed` |
| `web_handoff_tap` | Open website for admin/billing | `path` |

No free-text PHI in metadata. Fire-and-forget; never block UI.
