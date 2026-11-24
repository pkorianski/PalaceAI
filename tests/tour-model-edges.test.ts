import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyCareer,
  nextRival,
  hydrateCareer,
  venueUnlocked,
  rivalUnlocked,
  themeUnlocked,
  startSeries,
  finishRound,
  circuitRival,
  type Tier,
} from "../lib/tour/model";
import { RIVALS, venueFor } from "../lib/tour/content";
import { WEEK, deepFreeze, playing } from "./helpers/fixtures";
const first = RIVALS[0].id;
test("next rival advances through unclaimed rivals, then higher tiers, and handles a fully mastered Tour", () => {
  const state = emptyCareer(WEEK);
  assert.equal(nextRival(state).id, first);
  state.trophies[first] = 1;
  assert.equal(nextRival(state).id, RIVALS[1].id);
  for (const rival of RIVALS) state.trophies[rival.id] = 1;
  assert.equal(nextRival(state).id, first);
  for (const rival of RIVALS) state.trophies[rival.id] = 3;
  assert.equal(nextRival(state).id, first);
  for (const rival of RIVALS) assert.equal(venueFor(rival).id, rival.venueId);
});
test("unknown venues/rivals/themes are unavailable and malformed challenge identities are rejected", () => {
  const state = deepFreeze(emptyCareer(WEEK));
  assert.equal(venueUnlocked(state, "future"), false);
  assert.equal(rivalUnlocked(state, "future"), false);
  assert.equal(themeUnlocked(state, "future"), false);
  assert.equal(themeUnlocked(state, "classic"), true);
  assert.throws(
    () => startSeries(state, "future", 0, "r", "tour", WEEK),
    /Unknown/,
  );
  assert.throws(
    () => startSeries(state, first, 3 as Tier, "r", "tour", WEEK),
    /Unknown/,
  );
});
test("missing Tour envelope fields are rejected, preserving the input bytes", () => {
  const original = emptyCareer(WEEK);
  for (const field of ["trophies", "circuit", "receipts"]) {
    const bad = { ...original, [field]: null };
    const before = JSON.stringify(bad);
    assert.throws(() => hydrateCareer(bad, WEEK), /could not be read/);
    assert.equal(JSON.stringify(bad), before);
  }
});
test("hydration clamps known trophies, preserves unknown content, and limits old receipts", () => {
  const state = emptyCareer(WEEK);
  state.trophies = { [first]: 9.7, [RIVALS[1].id]: -2, "future-rival": 7 };
  const receipt = {
    roundId: "old",
    rivalId: first,
    tier: 0 as Tier,
    mode: "tour" as const,
    won: true,
    wins: 1,
    losses: 0,
    complete: true,
    earned: true,
  };
  state.receipts = Array.from({ length: 140 }, (_, i) => ({
    ...receipt,
    roundId: `r-${i}`,
  }));
  const out = hydrateCareer(deepFreeze(state), WEEK);
  assert.equal(out.trophies[first], 3);
  assert.equal(out.trophies[RIVALS[1].id], 0);
  assert.equal(out.trophies["future-rival"], 7);
  assert.equal(out.receipts.length, 128);
  assert.equal(out.receipts[0].roundId, "r-12");
  assert.equal(state.receipts.length, 140);
});
test("removed rivals can retire an active series without losing earned trophies", () => {
  const state = startSeries(emptyCareer(WEEK), first, 0, "s", "tour", WEEK);
  state.active!.rivalId = "removed";
  state.trophies[first] = 1;
  const out = hydrateCareer(deepFreeze(state), WEEK);
  assert.equal(out.active, null);
  assert.equal(out.trophies[first], 1);
});
const invalidSeries: Record<string, unknown>[] = [
  { id: "" },
  { roundId: "" },
  { tier: 9 },
  { mode: "future" },
  { wins: -1 },
  { wins: 1.5 },
  { losses: -1 },
  { losses: 0.5 },
  { game: { players: [], deck: [], pile: [] } },
  { game: { players: [{}, {}], deck: null, pile: [] } },
  { game: { players: [{}, {}], deck: [], pile: null } },
];
for (const [index, change] of invalidSeries.entries())
  test(`invalid saved series case ${index} fails without overwriting its data`, () => {
    const state = startSeries(emptyCareer(WEEK), first, 0, "s", "tour", WEEK);
    Object.assign(state.active!, change);
    const before = JSON.stringify(state);
    assert.throws(() => hydrateCareer(state, WEEK), /invalid/);
    assert.equal(JSON.stringify(state), before);
  });
test("weekly circuit gates reject insufficient progress, wrong opponent, and completed circuits", () => {
  const state = emptyCareer(WEEK);
  const rival = circuitRival(state, WEEK).id;
  assert.throws(
    () => startSeries(state, rival, 0, "s", "circuit", WEEK),
    /unavailable/,
  );
  state.trophies[first] = 3;
  const wrong = RIVALS.find((r) => r.id !== rival)!.id;
  assert.throws(
    () => startSeries(state, wrong, 0, "s", "circuit", WEEK),
    /unavailable/,
  );
  state.circuit.wins = 18;
  assert.throws(
    () =>
      startSeries(state, circuitRival(state, WEEK).id, 0, "s", "circuit", WEEK),
    /unavailable/,
  );
});
test("finishing the 18th circuit win grants the final ribbon and prevents a 19th match", () => {
  let state = emptyCareer(WEEK);
  state.trophies[first] = 3;
  state.circuit = { week: WEEK, wins: 17, attempts: 20 };
  state = startSeries(
    state,
    circuitRival(state, WEEK).id,
    0,
    "last",
    "circuit",
    WEEK,
  );
  const out = finishRound(deepFreeze(state), "last:0", true);
  assert.equal(out.career.circuit.wins, 18);
  assert.equal(out.career.circuit.attempts, 21);
  assert.equal(out.career.ribbons[WEEK], 3);
  assert.equal(out.career.active, null);
  assert.equal(out.outcome.earned, true);
  assert.throws(() =>
    startSeries(
      out.career,
      circuitRival(out.career, WEEK).id,
      0,
      "next",
      "circuit",
      WEEK,
    ),
  );
});
test("a continuing series drops the old deal, retains metrics, and creates a fresh round ID", () => {
  let state = emptyCareer(WEEK);
  state.trophies[first] = 2;
  state = startSeries(state, first, 2, "gold", "tour", WEEK);
  state.active!.game = playing();
  state.active!.metrics = { turns: 12, pickups: 1, burns: 2 };
  const out = finishRound(deepFreeze(state), "gold:0", false);
  assert.equal(out.outcome.complete, false);
  assert.equal(out.career.active?.game, null);
  assert.equal(out.career.active?.roundId, "gold:1");
  assert.deepEqual(out.career.active?.metrics, state.active!.metrics);
  assert.equal(out.career.active?.losses, 1);
});
test("a new week ignores the previous circuit run when selecting its first opponent", () => {
  const old = emptyCareer(WEEK);
  old.circuit.wins = 17;
  assert.equal(
    circuitRival(old, "2026-11-23").id,
    circuitRival(emptyCareer("2026-11-23"), "2026-11-23").id,
  );
});
