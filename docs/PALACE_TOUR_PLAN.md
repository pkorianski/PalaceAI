# Palace Tour — release plan (#9)

## Outcome

Keep Quick Play and existing game rules. Add a premium solo career with four
illustrated venues, sixteen named rivals, three mastery tiers per rival, a trophy
cabinet, earned cosmetics and a repeatable weekly solo circuit. All logic and
progress run locally; no paid services, server or LLM calls.

## Tasks and acceptance

1. Content/model: stable IDs, four venues, rival strategy/dialogue, explicit unlock
   gates, Bronze single game / Silver best-of-three / Gold best-of-five. Earned
   trophies never regress. Replaying a completed tier grants no duplicate trophy.
2. Persistence: versioned AsyncStorage record, serial writes, resume series and
   current deal, idempotent round IDs, explicit errors/retry when saving fails.
3. Visuals: preserve green/gold identity; illustrated venue panoramas, custom
   portraits, winding map, large phone tap targets, rival introduction, trophy
   reveal, visible next unlock. Respect reduced motion; no forced wait/energy.
4. Gameplay: career uses existing deal/play/pickup rules. Rival policies only see
   their hand and public pile/opponent counts, never hidden opponent cards.
5. Collection: unlock a card/table palette by each venue championship, equip and
   preview earned themes, persist selection, apply in Quick Play and Tour.
6. Weekly solo circuit: deterministic UTC week and rotating lineup, three win
   targets / divisions, persistent run progress; label explicitly solo/local.
   No fabricated leaderboard, online competition or recurring notifications.
7. QA/release: tests for gates, series failure/retry, duplicate results, hydration,
   weekly rollover, cosmetic eligibility and legal AI actions; existing tests,
   typecheck, SDK checks, iOS/web export; phone-sized screenshots and interaction
   smoke test. PR, passing GitHub CI, merge to main, one-command Codespace update.

## Scope and expansion

Definitions live in lib/tour/content.ts. New venues/rivals append stable IDs and
prerequisite IDs. Save model is independent of screen layout. Three tiers create
48 title goals, not a guaranteed number of days. Retention needs playtesting;
track player feedback about difficulty/repetition before adding more grinding.
Future: additional venues, authored alternate rules, richer audio/illustration,
cloud saves and multiplayer. None are implied by the local solo circuit.

## Checkpoints

- [x] Career model and storage
- [x] Tour, collection and rival UI
- [x] Gameplay and rewards integration
- [x] Automated checks (native visual QA remains a device check)
- [x] PR #10 and CI/browser previews (merge tracked on GitHub)

## Validation status

27 tests, typecheck, SDK alignment, Doctor 20/20 and iOS export pass.
Web export compiles. Real browser screenshot launch is blocked by sandbox Unix
socket restrictions; browser download fallback failed. GitHub Actions provides an alternate Chromium capture path; browser previews
are available as workflow artifacts. Physical iPhone validation remains required. Native haptics/layout remain device checks.

DOM smoke checks using the actual exported web bundle pass: Home → map → rival
→ game, initial deal persistence, restored completed-round fixture → victory UI
→ exactly one Bronze trophy, and trophy room after reload. DOM mocks cannot
verify layout, animation smoothness or native interactions.

The optional lint command is blocked by the existing ESLint dependency import of
`zod-validation-error/v4` against a package without that export. Required tests,
typecheck and Expo checks pass; no lint success is claimed.

GitHub Chromium smoke job passes and captures eight phone-sized web previews.
The victory capture uses an explicitly documented completed-round fixture.
