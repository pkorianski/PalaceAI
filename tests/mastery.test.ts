import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMastery,
  creditRound,
  hydrateMastery,
  rollWeek,
  levelFor,
  levelStart,
  TRACKS,
  TITLES,
  THEMES,
  questBoard,
  equipReward,
  themeAvailable,
} from "../lib/mastery/model";
const now = new Date("2026-11-18T12:00:00Z");
const win = { won: true, turns: 20, pickups: 0, burns: 3 };
const loss = { won: false, turns: 30, pickups: 4, burns: 2 };
test("legacy migration credits known stats, not invented dates or weekly progress", () => {
  const s = createMastery(
    {
      gamesPlayed: 500,
      wins: 200,
      losses: 300,
      totalBurns: 1000,
      cleanWins: 30,
      comebackWins: 20,
    },
    now,
  );
  assert.equal(s.stats.gamesPlayed, 500);
  assert.equal(s.stats.wins, 200);
  assert.ok(s.xp >= 500 * 35 + 200 * 45);
  assert.ok(s.milestones.includes("wins-0"));
  assert.deepEqual(s.days, []);
  assert.deepEqual(s.seals, []);
  assert.equal(s.weekly.games, 0);
  assert.deepEqual(hydrateMastery(JSON.parse(JSON.stringify(s)), now), s);
});
test("every completed game earns XP; losses are progress too", () => {
  const s = createMastery({}, now),
    a = creditRound(s, "a", loss, now.toISOString(), now);
  assert.equal(a.state.stats.losses, 1);
  assert.equal(a.state.stats.gamesPlayed, 1);
  assert.equal(a.xpGained, 45);
  assert.equal(a.state.days.length, 1);
  assert.equal(s.stats.gamesPlayed, 0);
  assert.deepEqual(s.receipts, []);
});
test("duplicate round IDs cannot mint stats, XP, quest rewards or days", () => {
  const first = creditRound(
    createMastery({}, now),
    "once",
    win,
    now.toISOString(),
    now,
  );
  const duplicate = creditRound(
    first.state,
    "once",
    win,
    now.toISOString(),
    now,
  );
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.xpGained, 0);
  assert.deepEqual(duplicate.state, first.state);
});
test("distinct days are UTC, non-consecutive, and counted only once", () => {
  let s = createMastery({}, now);
  for (const [i, date] of [
    "2026-11-16T23:59:59Z",
    "2026-11-17T00:00:00Z",
    "2026-11-17T22:00:00Z",
    "2026-11-20T10:00:00Z",
  ].entries())
    s = creditRound(s, `day-${i}`, win, date, now).state;
  assert.equal(s.days.length, 3);
  assert.equal(s.weekly.days.length, 3);
  assert.ok(s.weekly.rewarded.includes("days"));
});
test("a whole weekly board needs multiple days and awards one permanent seal", () => {
  let s = createMastery({}, now),
    serial = 0;
  for (let i = 0; i < 20; i++)
    s = creditRound(
      s,
      `same-${serial++}`,
      win,
      "2026-11-16T12:00:00Z",
      now,
    ).state;
  assert.equal(s.weekly.rewarded.length, 3);
  assert.equal(s.seals.length, 0);
  s = creditRound(s, `day-${serial++}`, win, "2026-11-17T12:00:00Z", now).state;
  const finish = creditRound(
    s,
    `day-${serial++}`,
    win,
    "2026-11-18T12:00:00Z",
    now,
  );
  assert.equal(finish.seal, true);
  s = finish.state;
  assert.deepEqual(s.seals, ["2026-11-16"]);
  assert.equal(s.weekly.rewarded.length, 4);
  assert.ok(s.milestones.includes("seals-0"));
  const extra = creditRound(s, "extra", win, now.toISOString(), now);
  assert.equal(extra.seal, false);
  assert.equal(extra.xpGained, 95);
});
test("weekly refresh preserves XP, lifetime stats, earned seals and equipment", () => {
  let s = createMastery({ gamesPlayed: 300, wins: 150 }, now);
  s = equipReward(s, "title", "regular");
  s = equipReward(s, "theme", "midnight-ink");
  s.seals = ["2026-11-09"];
  s.weekly.games = 9;
  const after = rollWeek(s, new Date("2026-11-23T00:00:00Z"));
  assert.equal(after.weekly.key, "2026-11-23");
  assert.equal(after.weekly.games, 0);
  assert.equal(after.xp, s.xp);
  assert.deepEqual(after.stats, s.stats);
  assert.deepEqual(after.seals, s.seals);
  assert.equal(after.title, "regular");
  assert.equal(after.theme, "midnight-ink");
});
test("late old-week results credit lifetime progress but not the new board", () => {
  const next = new Date("2026-11-23T01:00:00Z");
  const s = rollWeek(createMastery({}, now), next);
  const result = creditRound(
    s,
    "delayed",
    win,
    "2026-11-22T23:59:00Z",
    next,
  ).state;
  assert.equal(result.stats.wins, 1);
  assert.equal(result.weekly.games, 0);
  assert.equal(rollWeek(result, now).weekly.key, "2026-11-23");
});
test("new year weekly boundary remains Monday UTC", () => {
  const s = createMastery({}, new Date("2027-01-03T23:59:00Z"));
  assert.equal(s.weekly.key, "2026-12-28");
  assert.equal(
    rollWeek(s, new Date("2027-01-04T00:00:00Z")).weekly.key,
    "2027-01-04",
  );
});
test("weekly targets are deterministic and rotate across weeks", () => {
  const key = "2026-11-16";
  assert.deepEqual(
    questBoard(key).map((q) => q.target),
    questBoard(key).map((q) => q.target),
  );
  assert.equal(
    new Set(
      ["2026-11-16", "2026-11-23", "2026-11-30", "2026-12-07"].map(
        (w) => questBoard(w)[0].target,
      ),
    ).size > 1,
    true,
  );
});
test("mastery levels have consistent boundaries and continue beyond catalog rewards", () => {
  for (let level = 1; level <= 1000; level++) {
    assert.equal(levelFor(levelStart(level)), level);
    if (level > 1) assert.equal(levelFor(levelStart(level) - 1), level - 1);
  }
  assert.ok(levelFor(1000000) > TITLES[TITLES.length - 1].level);
});
test("locked equipment cannot be equipped and unlocked cosmetics persist", () => {
  const fresh = createMastery({}, now);
  assert.throws(() => equipReward(fresh, "title", "legend"));
  assert.throws(() => equipReward(fresh, "theme", "royal-aurora"));
  const advanced = {
    ...fresh,
    xp: levelStart(15),
    seals: ["2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09"],
  };
  for (const theme of THEMES)
    assert.equal(themeAvailable(advanced, theme.id), true);
  const equipped = equipReward(
    equipReward(advanced, "title", "ace"),
    "theme",
    "royal-aurora",
  );
  assert.equal(
    hydrateMastery(JSON.parse(JSON.stringify(equipped)), now).theme,
    "royal-aurora",
  );
  assert.equal(equipReward(equipped, "theme", null).theme, null);
});
test("corrupt and future saves are rejected; no manufactured reset", () => {
  for (const value of [
    null,
    {},
    { version: 2 },
    { ...createMastery({}, now), xp: -1 },
    { ...createMastery({}, now), days: ["not-a-date"] },
    { ...createMastery({}, now), receipts: ["same", "same"] },
  ])
    assert.throws(() => hydrateMastery(value, now));
  assert.throws(() =>
    creditRound(createMastery({}, now), "", win, now.toISOString(), now),
  );
  assert.throws(() =>
    creditRound(
      createMastery({}, now),
      "bad",
      { ...win, burns: -1 },
      now.toISOString(),
      now,
    ),
  );
});
test("the original starter goals stay separate from 35 long-term milestones", () => {
  assert.equal(
    TRACKS.reduce((n, track) => n + track.goals.length, 0),
    35,
  );
  assert.ok(TRACKS.find((t) => t.id === "days")!.goals.includes(365));
  assert.ok(TRACKS.find((t) => t.id === "seals")!.goals.includes(52));
});

import { createMasteryRepository } from "../lib/mastery/repository";
import { playerWrite } from "../lib/player-storage-queue";
import { PROGRESS_KEYS } from "../lib/preferences-model";
function memoryStore() {
  const values = new Map<string, string>();
  let fail = false;
  return {
    values,
    failNext: () => {
      fail = true;
    },
    async getItem(key: string) {
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      if (fail) {
        fail = false;
        throw Error("disk unavailable");
      }
      values.set(key, value);
    },
  };
}
test("repository migration retains original badges and legacy data; repeat load does not re-award", async () => {
  const db = memoryStore();
  db.values.set(
    "palace_stats",
    JSON.stringify({ gamesPlayed: 300, wins: 100, losses: 200 }),
  );
  db.values.set("palace_achievements", '["wins_gold"]');
  const repository = createMasteryRepository(db),
    first = await repository.load(now),
    again = await repository.load(now);
  assert.equal(first.stats.gamesPlayed, 300);
  assert.deepEqual(again, first);
  assert.equal(db.values.get("palace_achievements"), '["wins_gold"]');
  assert.equal(JSON.parse(db.values.get("palace_stats")!).gamesPlayed, 300);
});
test("concurrent/retried round writes serialize and keep one stats/XP receipt", async () => {
  const db = memoryStore(),
    repository = createMasteryRepository(db);
  await Promise.all([
    repository.record("same", win, now.toISOString(), now),
    repository.record("same", win, now.toISOString(), now),
    repository.record("other", loss, now.toISOString(), now),
  ]);
  const s = await repository.load(now);
  assert.equal(s.stats.gamesPlayed, 2);
  assert.equal(s.receipts.length, 2);
  assert.equal(s.stats.wins, 1);
  assert.equal(s.xp, 140);
});
test("a failed save leaves no partial stats/XP and can be retried once", async () => {
  const db = memoryStore(),
    repository = createMasteryRepository(db);
  const original = await repository.load(now);
  db.failNext();
  await assert.rejects(repository.record("retry", win, now.toISOString(), now));
  assert.deepEqual(await repository.load(now), original);
  await repository.record("retry", win, now.toISOString(), now);
  assert.equal(
    (await repository.record("retry", win, now.toISOString(), now)).duplicate,
    true,
  );
  assert.equal((await repository.load(now)).stats.gamesPlayed, 1);
});
test("corrupt persistent mastery is retained without overwriting its bytes", async () => {
  for (const value of ['{"version":99}', '']) {
    const db = memoryStore();
    db.values.set("palace_mastery_v1", value);
    const repository = createMasteryRepository(db);
    await assert.rejects(repository.load(now));
    assert.equal(db.values.get("palace_mastery_v1"), value);
  }
  const db = memoryStore();
  db.values.set("palace_stats", "");
  await assert.rejects(createMasteryRepository(db).load(now));
  assert.equal(db.values.has("palace_mastery_v1"), false);
  assert.equal(db.values.get("palace_stats"), "");
});
test("confirmed reset waits for pending player writes and includes mastery", async () => {
  const db = memoryStore(),
    repository = createMasteryRepository(db);
  db.values.set("palace_preferences_v1", "keep");
  const writing = repository.record("last", win, now.toISOString(), now);
  const reset = playerWrite(async () => {
    for (const key of PROGRESS_KEYS) db.values.delete(key);
  });
  await Promise.all([writing, reset]);
  assert.equal(db.values.has("palace_mastery_v1"), false);
  assert.equal(db.values.get("palace_preferences_v1"), "keep");
});

import { applyDailyResult } from "../lib/daily-progress";
const daily = {
  date: "2026-11-18",
  type: "play3",
  title: "Dedicated",
  desc: "Play 3 games",
  target: 3,
  icon: "medal-outline",
  progress: 0,
  completed: false,
};
test("retrying the same completed round cannot duplicate legacy daily progress", () => {
  const once = applyDailyResult(daily, win, "same", daily.date);
  assert.equal(once.challenge.progress, 1);
  assert.deepEqual(
    applyDailyResult(once.challenge, win, "same", daily.date).challenge,
    once.challenge,
  );
  assert.equal(
    applyDailyResult(once.challenge, win, "different", daily.date).challenge
      .progress,
    2,
  );
});
test("late rounds do not advance a new day's challenge", () => {
  assert.equal(
    applyDailyResult(daily, win, "late", "2026-11-17").challenge.progress,
    0,
  );
});
test("completed legacy daily challenges remain earned without repeated celebration", () => {
  const complete = { ...daily, progress: 3, completed: true };
  assert.equal(
    applyDailyResult(complete, win, "again", daily.date).justCompleted,
    false,
  );
  assert.deepEqual(
    applyDailyResult(complete, win, "again", daily.date).challenge,
    complete,
  );
});
