import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMastery,
  hydrateMastery,
  creditRound,
  nextMilestone,
  nextReward,
  metricValue,
  equippedTitle,
  themeAvailable,
  TRACKS,
  levelStart,
} from "../lib/mastery/model";
import { NOW, deepFreeze } from "./helpers/fixtures";
const win = { won: true, turns: 20, pickups: 0, burns: 0 };
test("invalid migrated stat values are rejected before allocating progress", () => {
  for (const gamesPlayed of [
    -1,
    0.1,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])
    assert.throws(() => createMastery({ gamesPlayed }, NOW), /invalid/);
});
const invalid: Record<string, unknown>[] = [
  { xp: 0.2 },
  { stats: {} },
  { weekly: null },
  { days: ["2026-02-30"] },
  { days: ["2026-13-01"] },
  { days: [2] },
  { milestones: ["a", "a"] },
  { seals: "bad" },
  { receipts: [null] },
  { title: 3 },
  { theme: 4 },
];
for (const [index, change] of invalid.entries())
  test(`mastery hydration validates envelope case ${index}`, () => {
    const bad = { ...createMastery({}, NOW), ...change };
    const before = JSON.stringify(bad);
    assert.throws(() => hydrateMastery(bad, NOW), /could not be read/);
    assert.equal(JSON.stringify(bad), before);
  });
for (const change of [
  { games: -1 },
  { wins: 0.5 },
  { burns: Infinity },
  { key: "2026-02-30" },
  { days: ["2026-02-30"] },
  { rewarded: ["games", "games"] },
])
  test(`mastery weekly data rejects ${Object.keys(change)[0]} corruption`, () => {
    const start = createMastery({}, NOW);
    assert.throws(
      () =>
        hydrateMastery(
          { ...start, weekly: { ...start.weekly, ...change } },
          NOW,
        ),
      /could not be read/,
    );
  });
test("round validation rejects malformed timestamps, result types and counters without changing progress", () => {
  const state = deepFreeze(createMastery({}, NOW));
  assert.throws(
    () => creditRound(state, "r", win, "not-a-date", NOW),
    /Invalid/,
  );
  for (const change of [
    { won: "yes" },
    { turns: -1 },
    { pickups: 0.5 },
    { burns: Infinity },
  ])
    assert.throws(
      () =>
        creditRound(
          state,
          "r",
          { ...win, ...change } as typeof win,
          NOW.toISOString(),
          NOW,
        ),
      /Invalid/,
    );
  assert.equal(state.stats.gamesPlayed, 0);
  assert.equal(state.xp, 0);
});
test("wins update clean/comeback boundaries and losses reset only the current streak", () => {
  let state = createMastery({}, NOW);
  state = creditRound(state, "one", win, NOW.toISOString(), NOW).state;
  state = creditRound(
    state,
    "two",
    { ...win, turns: 19, pickups: 2 },
    NOW.toISOString(),
    NOW,
  ).state;
  state = creditRound(
    state,
    "three",
    { ...win, turns: 25, pickups: 3 },
    NOW.toISOString(),
    NOW,
  ).state;
  assert.equal(state.stats.cleanWins, 1);
  assert.equal(state.stats.comebackWins, 1);
  assert.equal(state.stats.bestWinTurns, 19);
  assert.equal(state.stats.bestStreak, 3);
  const lost = creditRound(
    deepFreeze(state),
    "lost",
    { won: false, turns: 4, pickups: 0, burns: 1 },
    NOW.toISOString(),
    NOW,
  ).state;
  assert.equal(lost.stats.winStreak, 0);
  assert.equal(lost.stats.bestStreak, 3);
  assert.equal(lost.stats.bestWinTurns, 19);
  assert.equal(lost.stats.cleanWins, 1);
});
test("burn XP is capped without capping recorded burns", () => {
  const out = creditRound(
    createMastery({}, NOW),
    "many",
    { ...win, burns: 11 },
    NOW.toISOString(),
    NOW,
  );
  assert.equal(out.xpGained, 130);
  assert.equal(out.state.stats.totalBurns, 11);
  assert.equal(out.state.stats.maxBurnsInGame, 11);
});
test("the next milestone is the closest remaining goal and disappears after all tracks are earned", () => {
  const state = createMastery({ gamesPlayed: 249 }, NOW);
  const next = nextMilestone(state)!;
  assert.equal(next.track.id, "gamesPlayed");
  assert.equal(next.value, 249);
  assert.equal(next.target, 250);
  state.milestones = TRACKS.flatMap((t) =>
    t.goals.map((_, i) => `${t.id}-${i}`),
  );
  assert.equal(nextMilestone(state), undefined);
});
test("identity, metric and reward helpers handle fallback identities and exhausted catalogs", () => {
  const state = createMastery({}, NOW);
  state.title = "removed-title";
  state.days = ["2026-11-17", "2026-11-18"];
  state.seals = ["2026-11-16"];
  assert.equal(equippedTitle(state), "New Face");
  assert.equal(metricValue(state, "days"), 2);
  assert.equal(metricValue(state, "seals"), 1);
  assert.equal(metricValue(state, "wins"), 0);
  assert.equal(themeAvailable(state, "unknown"), false);
  assert.equal(
    nextReward({ ...state, xp: levelStart(40) }),
    "Another dated seal from your next weekly board",
  );
});
