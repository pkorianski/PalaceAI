# First-release UX polish

Tracks #21. Preserve all rules, AI behavior, Tour saves, mastery and reward IDs.

## Changes

- Home leads with Quick Play, followed by a compact illustrated Tour and Progress. Statistics and rules have explicit destinations. The daily challenge remains playable.
- Existing Tour screens are dismissed back to instead of duplicated by replacement. Direct-entry exits have a Home fallback. Leaving an active Tour round still saves it; Quick Play retains its existing discard warning.
- Blind palace cards always show their backs and position-only accessibility names until the player chooses one. Move guidance considers only visible hand/face-up cards and uses engine legality, including 2s and 10s. No AI or engine rule changes.
- Checkmarked visible cards can play. Invalid selections explain the problem. The human seat explicitly says You, with the equipped title underneath.
- Play/Pick Up and Confirm sit in a persistent bottom action area. The board can scroll on compact/enlarged-text screens; cards retain their original size. Opponent hand art condenses on short screens. Palace groups wrap if needed.
- First-game coaching lives in the board flow rather than covering cards. Skip is always available when a coaching step is shown. Important board labels are larger and brighter.
- Results lead with the next action, then compact earned XP/rewards. Round/series details expand on request. Save failures show a retry in the result modal; navigation stays disabled until settlement finishes. Existing receipt-based settlement remains idempotent.
- Menu actions have explicit accessibility roles; native rules/menu/leave overlays isolate content and move focus to headings, then return to the game-menu control when dismissed. Game updates announce for screen readers. Device and in-app reduced motion remain respected.
- Mastery explanations expand on request; all original goals and progress remain available.

## Verification

Model tests cover visible legal moves, invalid/multi-card selections, blind-information independence, face-up transitions and opponent turns, alongside the existing engine, AI, persistence and release tests.

CI runs the previous end-to-end browser checks and a new compact UX flow at 320x568, 375x667 and 390x844. It verifies visible Home actions, fixed bottom actions, guide/selection, rules round-trip, hidden blind ranks, failed-result retry and single-back Tour return. Screenshots marked fixture use seeded QA states, not genuine player progress. Browser coverage is not native iOS accessibility certification.

Native release checks remain: VoiceOver reading/focus order, system Dynamic Type, small physical iPhones, long hand scrolling, background/cold restart and extended play. Existing native Expo Go/TestFlight workflow stays unchanged; no dependencies, paid services or backend were added. Quick Play process-death resume remains a separate product task, not part of this visual/navigation pass.
