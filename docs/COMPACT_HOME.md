# Compact Home menu

Task: implement the approved home-menu concept without changing gameplay, saved progress, or navigation destinations.

Acceptance criteria:
- Quick Play is the only solid gold action.
- Tour uses a compact illustrated destination, a Start/Continue/Resume text action, the actual series score, and the next trophy/circuit goal.
- Progress uses one row with level, XP bar, and the next earned title/table preview. Collection, detailed XP, trophies and weekly quests remain in their existing screens.
- The daily goal is above How to Play and Statistics, shows its actual requirement and progress, and still starts Quick Play.
- Navigation stays usable on small phones; content can scroll and text can wrap. No new assets, dependencies or persistence changes.

Validation: TypeScript, Expo alignment, model tests and web export. Actual Home components were reviewed at 390x844, 375x667 and 320x568 in a mobile-size browser wrapper. Verified Progress/Statistics navigation, daily entry to Quick Play, and an actual saved Tour returning as Resume Tour. Native iPhone safe-area and Dynamic Type testing remains a device check.

The existing CI compact UI flow also verifies the daily goal is above utility links and utility navigation after scrolling. Preview wrappers are excluded from production source.

## Spacing refinement

Task: give Home breathing room after the compact layout felt like a uniform list.
- Increase space around Quick Play and between Tour, progress and utilities.
- Group Progress and Daily Challenge with softer surfaces and no bright panel outlines.
- Separate utility links with a larger gap and a quiet divider, rather than more boxed cards.
- Allow a little scrolling instead of requiring every utility to fit above the fold. Quick Play and Tour remain immediately reachable on compact phones.
- Existing UI regression checks verify utility navigation after scrolling. Gameplay and persistence are unchanged.
