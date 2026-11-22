# Adaptive endgame board

Task: Make the player's currently playable palace cards as accessible as their hand, with a less crowded table center. Branch: `feat/adaptive-endgame-board`.

Acceptance criteria:
- When the hand empties, face-up palace cards move from the compact reserve into the main hand area, at 84 × 118 points.
- After the last face-up card, blind cards occupy the same main area. Their original positions and empty slots remain stable; ranks stay hidden until played.
- A pickup returns the hand to the main area and remaining palace cards to compact reserve. Rules and AI behavior remain unchanged.
- Center shows the turn (or burn event); one contextual instruction appears next to the active cards, with no duplicate last-move paragraph.
- Phase changes fade in briefly; reduced-motion skips the fade. Existing persistent bottom controls remain reachable.

Verified: all 58 model tests, TypeScript, Expo dependency alignment and web export. Browser review used the actual GameScreen in isolated endgame fixtures at 390 × 844, 375 × 667 and 320 × 568 points. Checked selection, hand-to-palace transition, pickup restoration, blind secrecy, failed flips and stable remaining positions. Screenshots are mobile-sized browser previews, not native iOS captures.

A reproducible `scripts/adaptive-board-smoke.cjs` is included for CI after web export. Direct local Chromium launch is unavailable in this environment, so browser checks here used the managed preview browser instead.

Revert this scoped change with its commit, without disturbing prior Tour/reward work.
