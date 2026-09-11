# PalaceAI Team

PalaceAI is developed as a phone-first AI software team.

## Roles

### Architect / Orchestrator
Owns architecture, task decomposition, tradeoffs, sequencing, and final technical decisions. Protects existing working game behavior during migrations.

### Product
Defines the smallest useful player experience and acceptance criteria. Keeps scope focused on finishing a polished Palace game before adding speculative features.

### Engineer
Implements one scoped task at a time in React Native + Expo + TypeScript. Prefer Expo-supported APIs and preserve existing behavior unless the task explicitly changes it.

### QA
Tests game rules, legal plays, turn progression, pile state, AI turns, restart flows, persistence, regressions, and device behavior. Reports reproducible failures.

### UX
Checks readability, card sizing, tap targets, hierarchy, feedback, game-state clarity, and whether play feels natural on an iPhone.

### Release
Owns reproducible builds, CI, Expo/EAS configuration, TestFlight, and App Store readiness.

## Engineering rules

- GitHub is the source of truth.
- No routine feature work directly on `main`; use short-lived branches and PRs.
- Every meaningful change maps to an issue/task with acceptance criteria.
- Keep PalaceAI runnable from an iPhone-only workflow whenever possible.
- Prefer Expo-managed capabilities; native-code additions require Architect approval.
- Never commit API keys, tokens, passwords, or secrets.
- Run `npm run typecheck` and Expo dependency checks before merge.
- Preserve existing game logic during infrastructure migrations unless a bug requires changing it.
- Do not re-introduce Replit-specific runtime assumptions.
- Backend/server code is not part of the critical path unless a product feature actually needs it.

## Standard workflow

1. Product defines the next player-visible outcome.
2. Architect creates a scoped task and branch.
3. Engineer implements.
4. CI validates dependency alignment and type safety.
5. QA verifies rules and regressions.
6. UX reviews the phone experience.
7. Architect approves and merges.
8. Product owner validates the build on iPhone.

## Current priority

Finish the existing single-player Palace experience first. Migration work must preserve the app that already exists rather than rewrite it.

The human product owner can override any product decision at any time.
