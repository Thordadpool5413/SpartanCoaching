# App Store screenshot shot list

Capture the current five destination iPhone experience. Never upload legacy generated mockups in `store/screenshots` or `store/screenshots/6.7`.

## Marketing screenshots

Capture five real screens at 1320 by 2868 from iPhone 17 Pro Max. Use a demo account with fictional company and facility names. Do not show patient information, private Coach history, email addresses, phone numbers, or real customer data.

| Order | File | Current screen and state | Public message | Required proof |
| --- | --- | --- | --- | --- |
| 1 | `01-home-next-move.png` | Home with an active membership and one current commitment | Know what to do next | Three clear starts, current commitment, five destination tab bar |
| 2 | `02-private-spartan-coach.png` | Coach in Prepare or Review using fictional, deidentified context | Practice the conversation privately | Privacy cue, clear action, no raw history or real transcript |
| 3 | `03-explore.png` | Explore at its initial state | Everything in one place | Library, My Work, access map, complete native tool catalog |
| 4 | `04-my-work.png` | My Work with fictional saved work | Pick up where you left off | Commitment, saved work, offline item, no private customer data |
| 5 | `05-library.png` | Library on Read with a complete native field note | Read less. Use more. | Search, current content, Read selected, no loading or error state |

Recommended captions:

1. Know what to do next
2. Practice the conversation privately
3. Find every tool and resource
4. Pick up where you left off
5. Read less. Use more.

## Subscription review screenshot

Capture one additional real screen named `review/subscription-choice.png`.

The screen must show Account, Choose Your Access, Standard, Elite, both weekly prices, and the native Apple purchase disclosure. Select Standard and capture it. Then select Elite and confirm the localized StoreKit price changes before capturing a second optional image named `review/subscription-elite.png`.

Use these review images for the corresponding subscriptions in App Store Connect. They are not part of the public marketing sequence.

## Capture rules

1. Use the production API with a dedicated review or screenshot account.
2. Use only fictional account names and fictional facility names.
3. Never display patient PHI, raw private Coach history, real transcripts, private commitments, real email addresses, or phone numbers.
4. Confirm the helmet app icon and launch screen before capture.
5. Set the iPhone appearance to System and capture the marketing set in Light first. Capture a Dark alternate only after the Light set passes.
6. Wait for all remote content to load. Do not capture skeletons, spinners, empty error cards, alerts, keyboards, or debug banners.
7. Keep the status bar clean and the tab bar visible on Home, Coach, Explore, My Work, and Account. Library is reached through Explore.
8. Use real simulator or device captures. Do not generate, redraw, or compose product UI screenshots.
9. Review every image at full size for clipping, Dynamic Island collisions, incorrect safe area, broken type wrapping, and accidental private data.
10. Keep the original captures. Do not resize the 6.9 inch set before upload.

## Device sizes

The required primary set is iPhone 17 Pro Max at 1320 by 2868. A dedicated iPhone 15 Plus set at 1290 by 2796 is optional. App Store Connect can use the 6.9 inch set as the fallback for smaller current iPhone slots.
