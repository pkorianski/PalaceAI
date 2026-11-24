import assert from "node:assert/strict";
import { test } from "node:test";
import { createMasteryRepository } from "../lib/mastery/repository";
import { createMastery, MASTERY_KEY, levelStart } from "../lib/mastery/model";
import { NOW, deferred } from "./helpers/fixtures";
const win = { won: true, turns: 12, pickups: 0, burns: 0 };
function store(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const writes: { key: string; value: string }[] = [];
  return {
    values,
    writes,
    async getItem(key: string) {
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      writes.push({ key, value });
      values.set(key, value);
    },
  };
}
test("unchanged loads perform no redundant disk writes", async () => {
  const db = store({ [MASTERY_KEY]: JSON.stringify(createMastery({}, NOW)) });
  const repo = createMasteryRepository(db);
  assert.deepEqual(await repo.load(NOW), createMastery({}, NOW));
  await repo.load(NOW);
  assert.deepEqual(db.writes, []);
});
for (const raw of ["null", "[]", "3", '"text"', "{"])
  test(`invalid legacy stats ${raw} are preserved without a manufactured save`, async () => {
    const db = store({ palace_stats: raw });
    await assert.rejects(createMasteryRepository(db).load(NOW));
    assert.deepEqual(db.writes, []);
    assert.equal(db.values.get("palace_stats"), raw);
    assert.equal(db.values.has(MASTERY_KEY), false);
  });
test("a broken existing mastery save does not fall back to legacy stats", async () => {
  const db = store({
    [MASTERY_KEY]: "{",
    palace_stats: JSON.stringify({ wins: 20 }),
  });
  await assert.rejects(createMasteryRepository(db).load(NOW));
  assert.equal(db.values.get(MASTERY_KEY), "{");
  assert.deepEqual(db.writes, []);
});
test("read failures propagate without a write or partial migration", async () => {
  const db = store();
  const repo = createMasteryRepository({
    ...db,
    async getItem() {
      throw Error("read unavailable");
    },
  });
  await assert.rejects(repo.load(NOW), /read unavailable/);
  assert.deepEqual(db.writes, []);
});
test("failed first migration leaves legacy data intact and can be retried", async () => {
  const db = store({
    palace_stats: JSON.stringify({ wins: 2, gamesPlayed: 2 }),
  });
  let fail = true;
  const repo = createMasteryRepository({
    ...db,
    async setItem(key, value) {
      if (fail) {
        fail = false;
        throw Error("disk full");
      }
      await db.setItem(key, value);
    },
  });
  await assert.rejects(repo.load(NOW), /disk full/);
  assert.equal(db.values.has(MASTERY_KEY), false);
  assert.equal((await repo.load(NOW)).stats.wins, 2);
  assert.equal(JSON.parse(db.values.get("palace_stats")!).wins, 2);
});
test("default-time repository load and equipment use a frozen clock", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: NOW.valueOf() });
  const db = store();
  const repo = createMasteryRepository(db);
  await repo.load();
  await assert.rejects(repo.equip("title", "legend"), /required mastery/);
  assert.equal(db.writes.length, 1);
  assert.equal((await repo.equip("title", "new-face")).title, "new-face");
  assert.equal(db.writes.length, 1);
  db.values.set(
    MASTERY_KEY,
    JSON.stringify({ ...createMastery({}, NOW), xp: levelStart(5) }),
  );
  assert.equal(
    (await repo.equip("theme", "midnight-ink")).theme,
    "midnight-ink",
  );
  assert.equal((await repo.equip("theme", null)).theme, null);
  assert.equal((await repo.equip("title", "regular")).title, "regular");
});
test("week rollover persists once; a subsequent load is read-only", async () => {
  const db = store({ [MASTERY_KEY]: JSON.stringify(createMastery({}, NOW)) });
  const repo = createMasteryRepository(db);
  const monday = new Date("2026-11-23T00:00:00Z");
  assert.equal((await repo.load(monday)).weekly.key, "2026-11-23");
  await repo.load(monday);
  assert.equal(db.writes.length, 1);
});
test("a queued duplicate waits for the first save and then returns the same credited state", async (t) => {
  const db = store({ [MASTERY_KEY]: JSON.stringify(createMastery({}, NOW)) });
  const entered = deferred(),
    release = deferred();
  t.after(() => release.resolve());
  let saves = 0;
  const repo = createMasteryRepository({
    ...db,
    async setItem(key, value) {
      saves++;
      entered.resolve();
      await release.promise;
      await db.setItem(key, value);
    },
  });
  const first = repo.record("same", win, NOW.toISOString(), NOW);
  await entered.promise;
  const duplicate = repo.record("same", win, NOW.toISOString(), NOW);
  assert.equal(saves, 1);
  assert.equal(db.writes.length, 0);
  release.resolve();
  const [a, b] = await Promise.all([first, duplicate]);
  assert.equal(a.duplicate, false);
  assert.equal(b.duplicate, true);
  assert.deepEqual(a.state, b.state);
  assert.equal(saves, 1);
  assert.equal(b.state.stats.gamesPlayed, 1);
});
