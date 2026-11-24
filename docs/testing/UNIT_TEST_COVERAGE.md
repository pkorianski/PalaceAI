# Unit test coverage and hardening

Task: measure line and branch coverage, add needed unit tests, and avoid flaky assertions.
Acceptance criteria: preserve production behavior; include untouched production files in the report; exercise rule, persistence and progression edge cases; repeat the suite with controlled inputs; publish coverage in CI.

## Measured results

Baseline: commit `b6bfe4406a0ae1607afec329a1f8ed8e95d09a82`, 58 tests. After: 164 tests (+106).
Measured locally with Node v24.22.3, c8 12.0.0 and tsx source maps. CI also runs on Node 22.

| Scope | Lines before | Lines after | Branches before | Branches after |
| --- | ---: | ---: | ---: | ---: |
| Whole client app | 17.44% (1484/8508) | 18.73% (1594/8508) | 84.69% (487/575) | 90.73% (666/734) |
| Critical logic | 91.93% (1300/1414) | 99.50% (1407/1414) | 91.31% (473/518) | 96.29% (649/674) |

**The app is still mostly uncovered by unit tests.** React Native routes/components are not mounted by this runner. Native storage wrappers, haptics, Linking and network adapters remain uncovered. Repository tests use injected storage and do not certify native disk behavior. Existing browser smoke tests run separately and do not contribute to these percentages.

Whole-app coverage includes all 51 production TS/TSX files under `app/`, `components/` and `lib/`, even when never imported. Tests, scripts, declarations, server code and dependencies are excluded. c8 synthesizes zero-coverage entries for unloaded files; V8 cannot enumerate their actual branches until they run. Thus the apparently high whole-app branch percentage must be read alongside the low line percentage. Runtime branch counts can increase as new paths execute. These are not condition/MC/DC metrics; TypeScript/JSX source maps also affect line counts.

Critical logic is explicitly listed in `scripts/unit-coverage-scope.cjs`: palace-engine, game-presentation, daily-progress, player-storage-queue, preferences-model, mastery/model, mastery/repository, tour/model and tour/ai. It excludes UI and native adapters; the full report still includes them.

## New protection

- Game legality, specials, refill order, palace transitions, pickup restoration, blind-card holes, win/burn/reset precedence and AI decisions.
- Every daily challenge type, thresholds, caps and duplicate receipts, including zero progress.
- Corrupt/future saves, legacy migration failure and retry, load failures, equipment gates, stale/duplicate rounds, weekly rollover and final circuit completion.
- FIFO persistence, concurrent duplicate settlement, synchronous/asynchronous failures and recovery.

No production gameplay code changed. Defensive/unreachable paths were not hidden with ignore directives or covered with fabricated invalid game states solely to raise percentages.

## Repeatability

The 164-test suite passed ten consecutive local runs (1640 test executions), alternating one/four file workers and cycling UTC, America/New_York and Pacific/Auckland. Fixed card fixtures, seeded deals, injected AI randomness and scoped Date mocks replace ambient inputs. Deferred promise gates assert concurrency ordering without sleeps. Each test owns its storage; blocked gates are released during cleanup. Repetition is evidence, not a guarantee against flakes.

## Run and inspect

```sh
npm ci
npm test
npm run test:coverage
npm run test:stability -- 10
```

Open `coverage/Palace-Unit-Test-Coverage.html` for the before/after report and filterable per-file table, or `coverage/index.html` for annotated missed lines/branches. Raw data includes `comparison.json`, `coverage-summary.json`, `coverage-final.json`, LCOV and JUnit XML. The baseline snapshot is committed as `docs/testing/unit-coverage-baseline.json`.

CI runs coverage, three additional stability runs, typecheck and Expo checks, and uploads the `palace-unit-coverage` artifact. The critical logic gate requires 95% lines and 90% branches; missing critical files also fail. This is intentionally not a whole-app gate. When files are added or removed, each snapshot retains its own scope and new/deleted file baselines display as unavailable.

Next useful work is component tests for menu navigation and board interaction, followed by native adapter integration tests. Keep browser/device verification for animation, layout, touch behavior and real persistence.
