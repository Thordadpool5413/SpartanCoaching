# Spartan Coaching iOS Redesign QA

## Final result

Blocked for final visual approval.

The implementation is structurally verified and builds for Expo web. Final visual approval still requires the same screen state on a physical iPhone or iOS simulator, followed by a side by side comparison with the approved dark and light references.

## Automated verification

1. Mobile TypeScript check passed.

2. Mobile Jest suite passed with 18 suites and 87 tests.

3. Expo web export passed with the production API configuration.

4. Git diff integrity passed.

## Design contract verification

1. The primary navigation is Today, Coach, Practice, and Library.

2. Command and Account remain reachable as utility routes.

3. System, Light, and Dark appearance choices are persisted locally.

4. Light and Dark use distinct surface, text, border, signal, and status colors.

5. Coach uses the selected Field Briefing structure and mission signal.

6. Typed rehearsal uses the live private Coach API.

7. Saved commitments use private Coach memory and appear in Today.

8. The rehearsal control explicitly states that audio is not recorded.

9. No generated Spartan helmet is used. The new Coach surface uses a text wordmark so an incorrect helmet cannot enter production.

## Remaining visual checks

1. Verify the hero crop on the smallest supported iPhone.

2. Verify Dynamic Type at the largest supported setting.

3. Verify Light appearance in direct daylight.

4. Verify Dark appearance in a low light room.

5. Verify native tab contrast with Reduce Transparency enabled.

6. Compare spacing, typography, borders, and image crop against both approved references at the same viewport.

7. Run VoiceOver through Read, Practice, Commit, Save, and Today.

## External blockers

1. The current Figma Starter plan allows one variable mode, so the Figma file cannot hold genuine Light and Dark modes yet.

2. No iOS simulator is available in this workspace.

3. No browser was selected for a web comparison capture.

4. A physical iPhone TestFlight check has not been run for this branch.
