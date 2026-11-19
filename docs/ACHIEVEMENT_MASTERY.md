# Palace mastery and weekly quests

## Why

The original 24 Bronze/Silver/Gold achievements are an onboarding collection, not enough for months of play. Keep their IDs, thresholds and unlocks, then add overlapping goals for one session, one week and many months. This adapts the layered event/quest pattern seen in King's published Candy Crush descriptions; it is a product hypothesis, not a claim of measured retention.

## Implemented layers

- **Starter badges:** the original 24, unchanged and still earnable.
- **Lifetime mastery:** seven tracks with five milestones each: wins, games completed, pile burns seen, clean wins, comebacks, different UTC days played and completed weekly boards. Goals include 365 non-consecutive days, 52 seals and 10,000 games; these are optional mastery goals, not gates on ordinary play.
- **Mastery XP:** every completed game earns 35 XP, plus 45 for a win and 5 per pile burn (up to 10 burns per round). Lifetime milestones grant 150 × their rank. Levels have no configured cap: XP at level L is `150*(L-1)+75*(L-1)^2`.
- **Weekly quest board:** deterministic rotating game/win/burn targets and three different UTC days of play. Each quest grants 150 XP once; completing all four adds 250 XP and one permanent dated seal. Boards refresh Monday 00:00 UTC. A break never removes lifetime progress; unfinished weekly quest progress refreshes, and XP from completed quests stays. The quest board is independent of the Tour circuit.
- **Equippable rewards:** seven player titles and three new cosmetic table/card-back palettes. Titles appear on Home and at the human player's seat. Midnight Ink unlocks at level 5, Ember Hall after four weekly seals, Royal Aurora at level 15. The existing Tour championship themes remain available.
- **Visible next step:** Home shows level progress, next reward, weekly progress and the nearest lifetime milestone. Round results report earned XP, levels, milestones, quests and seals.

All rewards are deterministic and earned in normal play. There are no paid rewards, energy meters, notification prompts, backend calls or competitive leaderboard claims.

## Data and migration

`palace_mastery_v1` is the canonical envelope for game statistics, XP, milestone IDs, dated activity, weekly state, earned seals, equipment and completed-round receipts. Initial migration reads the old `palace_stats` and credits known games/wins and eligible lifetime milestones. It never fabricates historical calendar days or weekly completions. The old stats and starter-badge storage are retained; stats readers use the new envelope after migration. Badges retain all their old IDs.

A completed round updates stats, XP, calendar activity and quests in one storage write with its stable round ID. Repeated settlement returns no new credit. Tour saves its final game and completion timestamp before settlement, so it can resume a pending result. Starter-badge and daily-challenge writes share the player write queue; daily challenge results also record round IDs to prevent duplicate increments.

Career, mastery, badge, daily-result and reset writes share a serial queue. A failed write rejects without replacing the previous mastery save. Invalid/future saves show a recoverable error and are not silently erased. Confirmed Settings reset removes mastery along with other game progress and preserves settings. Data stays on the device, including UTC activity dates. Device clocks are used; this is not a server-authoritative anti-cheat system.

## Expansion

Thresholds, weekly target rotations, title requirements and cosmetic palettes live in `lib/mastery/model.ts`. New content must use new stable IDs and preserve existing IDs, XP, seals and earned milestones. Never raise a requirement on an already-earned reward. Weekly boards continue generating after the current lifetime collection is mastered. Larger future content changes may use a versioned migration; old/unknown saves must never default to an empty career.

## Verification

Pure model/repository tests cover legacy credit, no invented dates, duplicate and concurrent round settlement, atomic save failures/retries, weekly/month/year boundaries, late results, equipment requirements, corruption preservation and reset ordering. Existing rules, AI and Tour tests remain. Browser checks exercise the four achievement tabs, a clearly labeled veteran migration fixture, preserved starter badges, equipment in actual gameplay, and reset/corrupt-save behavior. Browser fixture screenshots are development previews, not claims of genuine earned player progress or App Store device captures.

Native Expo Go/TestFlight validation remains useful for long play sessions, cold launch, background interruptions, readability and pacing. Actual retention should be evaluated with consenting testers; no analytics SDK has been added.
