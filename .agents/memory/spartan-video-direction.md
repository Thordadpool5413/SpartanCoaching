---
name: Spartan video art direction
description: What video treatments this user rejects vs. accepts for Spartan Coaching video artifacts
---

## Rejected repeatedly (do not retry)
Kinetic-typography-led treatments for the hospice culture video: giant text on black/red, ember particles, glitch/slash effects, grunge noise, and slate/broadcast text-only slates. The user rejected three such attempts as generic, "trash," and disconnected from the content and brand.

## Accepted direction
"Dignified cinematic documentary": real photographic imagery (hospice professionals, patient-care moments, environment shots) as scene foundations, restrained serif+sans typography over them, slow Ken Burns pushes, film grain, warm charcoal/off-white/amber palette with Spartan red as a small accent, stamped Spartan logo end card.

**Why:** The user wants visuals that depict the subject matter (hospice sales culture) — typography-with-effects reads as "no design" to them regardless of polish.

**How to apply:** Any future video work for this project should lead with real imagery/assets and use type as a supporting layer. The approved Scene0–Scene6 script wording is fixed copy — never alter it.

## Verification gotcha
Screenshots of a video artifact always capture scene 0 (each page load restarts the loop), so later scenes can't be spot-checked via screenshot without a temporary dev-only `?scene=N` override — which must be removed before finishing. Pair it with a temporary `?snap=1` flag that collapses animation delays to ~0.05s so delayed text is visible in the screenshot; otherwise late-arriving lines look missing.

## Sequential text must fully exit before the next line
Twice-rejected failure mode: staggered lines that only fade in (never out) pile into unreadable overlap. Gate each message in an explicit time window with enter AND exit animation (AnimatePresence-style), windows non-overlapping, so only one message can ever be on screen. Screenshot every beat, not just scene start.

## Content must match visuals literally
User rejected a technically polished cut because imagery didn't depict the words over it: a stat about unserved patients over an empty bedroom "makes no sense"; a leader portrait under challenge questions read as blaming the person pictured. Every line must sit over an image that shows exactly what it says (unserved family for the stat; leadership praising the donut call for the callout; real clinical selling for the pivot). Also keep one consistent text layout across scenes (slate top-left, message lower third) — mixed placements read as broken formatting.

## Two-act structure (Howdy Doody commercial, accepted)
Bright warm satire (Act 1) → cold cinematic urgency (Act 2) worked where uniform dark grading failed. Keys: fully exposed Act 1 photography with light vignette; visible on-screen color-drain transition at the turn; photograph-led every scene (no text-on-black); label the satire target explicitly on screen; brand close ~10s with big stamp and no dead air.
