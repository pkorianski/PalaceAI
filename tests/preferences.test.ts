import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePreferences, DEFAULT_PREFERENCES, PREFERENCES_KEY, PROGRESS_KEYS } from "../lib/preferences-model";
test("first install has haptics and device-following motion defaults", () => {
  const a = parsePreferences(null), b = parsePreferences(null);
  assert.deepEqual(a, DEFAULT_PREFERENCES);
  a.haptics = false;
  assert.equal(b.haptics, true);
});
test("saved accessibility and feedback choices survive reload", () => {
  assert.deepEqual(parsePreferences(JSON.stringify({ version: 1, haptics: false, reduceMotion: true })), { version: 1, haptics: false, reduceMotion: true });
});
test("corrupt or future preferences are rejected without manufacturing defaults", () => {
  for (const raw of ['{', 'null', '{"version":2,"haptics":true,"reduceMotion":false}', '{"version":1,"haptics":"false","reduceMotion":false}']) assert.throws(() => parsePreferences(raw));
});
test("reset targets all current progress and preserves preferences and unrelated keys", () => {
  assert.ok(PROGRESS_KEYS.includes("palace_tour_v1"));
  assert.ok(PROGRESS_KEYS.includes("palace_tutorial_done"));
  assert.ok(!PROGRESS_KEYS.includes(PREFERENCES_KEY));
  const storage = new Map([...PROGRESS_KEYS, PREFERENCES_KEY, "unrelated"].map(key => [key, "saved"]));
  for (const key of PROGRESS_KEYS) storage.delete(key);
  assert.deepEqual([...storage.keys()], [PREFERENCES_KEY, "unrelated"]);
});
