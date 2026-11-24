import test from "node:test";
import { NOW } from "./helpers/fixtures";
import assert from "node:assert/strict";
import {
  rewardPreview,
  nextReward,
  levelStart,
  createMastery,
} from "../lib/mastery/model";
test("reward preview follows progression boundaries without advertising already earned rewards", () => {
  const state = createMastery({}, NOW);
  for (const level of [1, 3, 4, 5, 6, 15, 39, 40, 60]) {
    const s = { ...state, xp: levelStart(level) };
    const preview = rewardPreview(s);
    if (preview) {
      assert.ok(preview.level > level);
      assert.equal(nextReward(s), `${preview.name} at level ${preview.level}`);
    } else assert.ok(nextReward(s).includes("seal"));
  }
  assert.equal(rewardPreview({ ...state, xp: levelStart(3) })?.kind, "theme");
  assert.equal(
    rewardPreview({ ...state, xp: levelStart(5) })?.name,
    "Contender",
  );
  assert.equal(rewardPreview({ ...state, xp: levelStart(40) }), null);
});
