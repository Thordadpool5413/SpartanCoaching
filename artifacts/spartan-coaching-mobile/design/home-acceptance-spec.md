# Spartan Coaching Home Acceptance Specification

## Approved target

The binding visual target is `design/references/home-option-2-approved.png` at 853 by 1844 pixels. It represents the signed in Home experience in light appearance.

## Product purpose

Home is a personal field guide. It is not a CRM, a feature directory, an administration dashboard, or a subscription advertisement. A member should understand the next useful action within ten seconds and reach it within three taps.

## Required information hierarchy

1. Exact distressed Spartan Coaching stamp
2. Personal account control
3. Greeting
4. “Your field guide is ready.”
5. “What are you walking into?”
6. Primary preparation action
7. Objection practice action
8. Commitment continuation action
9. Guided tour entry
10. Five destination native tab bar

## Brand rules

The distressed stamp is the primary logo. It must use `assets/images/brand-stamp.png` without redraw, replacement text, or a visible rectangular background.

The supplied helmet is a compact icon only. It must not replace the primary stamp.

The light appearance uses warm white, deep navy, Spartan crimson, charcoal, and restrained cool gray. The dark appearance retains the same hierarchy using the approved deep navy palette. Pure black is not the primary app surface.

## Layout rules

The hero uses the real texture asset at `assets/images/field-guide-navy-texture.png`. The selected separator is stored at `assets/images/field-guide-hero-separator.png`. The primary action uses `assets/images/field-guide-crimson-texture.png`.

The logo is centered in the hero. The Account control remains visually secondary. The greeting is centered and must not compete with the logo.

The white body begins with one short crimson rule and one outcome question. The primary action is visually dominant. The two supporting actions use native rows with lightweight separation. The guided tour remains visible without dominating the screen.

No access inventory, price comparison, administrator analytics, clinical disclaimer, or marketing paragraph appears in the initial Home viewport.

## Behavior rules

The preparation action opens the native Playbook experience. Objection practice opens the native Objection experience or private Coach when the member has Elite access. Commitment continuation opens Coach or the native Weekly Plan based on access.

The Account control opens Account. The guided tour remains available after onboarding. Every pressable control provides native feedback and an accessibility label or readable text.

## Acceptance gate

The coded Home screen must be captured at the same viewport and state as the approved target. The reference and capture must be reviewed together. Any material mismatch in logo treatment, hierarchy, spacing, typography, color, cropping, navigation, or action behavior blocks acceptance.

Automated tests support the gate but do not replace visual comparison on the rendered app.
