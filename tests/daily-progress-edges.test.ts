import assert from "node:assert/strict";
import { test } from "node:test";
import { applyDailyResult } from "../lib/daily-progress";
import type { ActiveDailyChallenge } from "../lib/daily-challenge";
import { DAY, deepFreeze } from "./helpers/fixtures";
const result = { won: true, turns: 20, pickups: 0, burns: 3 };
const challenge = (type: string, target = 5): ActiveDailyChallenge => ({
  type,
  target,
  date: DAY,
  title: "Goal",
  desc: "Goal",
  icon: "trophy-outline",
  progress: 0,
  completed: false,
});
const cases: [string, Partial<typeof result>, number][] = [
  ["win1", {}, 1],
  ["win2", { won: false }, 0],
  ["win3", {}, 1],
  ["play3", { won: false }, 1],
  ["play5", {}, 1],
  ["burn5", { burns: 4 }, 4],
  ["burn8", { burns: 7 }, 7],
  ["clean", {}, 1],
  ["clean", { pickups: 1 }, 0],
  ["clean", { won: false }, 0],
  ["comeback", { pickups: 2 }, 1],
  ["comeback", { pickups: 1 }, 0],
  ["comeback", { won: false, pickups: 3 }, 0],
  ["blazer3", { burns: 2 }, 0],
  ["blazer3", { burns: 3 }, 1],
  ["blazer5", { burns: 4 }, 0],
  ["blazer5", { burns: 5 }, 1],
  ["speed20", { turns: 20 }, 1],
  ["speed20", { turns: 21 }, 0],
  ["speed20", { won: false, turns: 10 }, 0],
  ["future-goal", {}, 0],
];
for (const [index, [type, change, delta]] of cases.entries())
  test(`daily ${type} boundary ${index}: credits ${delta}`, () => {
    const start = deepFreeze(challenge(type, 20));
    const out = applyDailyResult(start, { ...result, ...change }, "round", DAY);
    assert.equal(out.challenge.progress, delta);
    assert.equal(out.justCompleted, false);
    assert.equal(start.progress, 0);
    assert.deepEqual(out.challenge.receipts, ["round"]);
  });
test("overshooting a daily goal caps progress and celebrates exactly once", () => {
  const start = deepFreeze({ ...challenge("burn5"), progress: 4 });
  const out = applyDailyResult(start, { ...result, burns: 8 }, "r", DAY);
  assert.equal(out.challenge.progress, 5);
  assert.equal(out.justCompleted, true);
  assert.equal(out.challenge.completed, true);
  assert.deepEqual(applyDailyResult(out.challenge, result, "new", DAY), {
    challenge: out.challenge,
    justCompleted: false,
  });
});
test("a zero-delta round still gets a receipt, so retrying with a different result cannot mint progress", () => {
  const once = applyDailyResult(
    challenge("win2"),
    { ...result, won: false },
    "r",
    DAY,
  );
  assert.equal(
    applyDailyResult(once.challenge, result, "r", DAY).challenge,
    once.challenge,
  );
});
test("legacy calls without a round ID preserve existing receipt state", () => {
  const start = deepFreeze({ ...challenge("play3"), receipts: ["older"] });
  const out = applyDailyResult(start, result, undefined, DAY);
  assert.equal(out.challenge.progress, 1);
  assert.equal(out.challenge.receipts, start.receipts);
  assert.equal(
    applyDailyResult(challenge("play3"), result, undefined, DAY).challenge
      .receipts,
    undefined,
  );
});
