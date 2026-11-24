import assert from "node:assert/strict";
import { test } from "node:test";
import { playerWrite, waitForPlayerWrites } from "../lib/player-storage-queue";
import { deferred } from "./helpers/fixtures";
test("writes are FIFO and waiting does not finish while a write is blocked", async (t) => {
  const entered = deferred(),
    release = deferred();
  t.after(() => release.resolve());
  const events: string[] = [];
  const first = playerWrite(async () => {
    events.push("first:start");
    entered.resolve();
    await release.promise;
    events.push("first:end");
    return 1;
  });
  await entered.promise;
  const second = playerWrite(async () => {
    events.push("second");
    return 2;
  });
  let waited = false;
  const barrier = waitForPlayerWrites().then(() => {
    waited = true;
  });
  assert.deepEqual(events, ["first:start"]);
  assert.equal(waited, false);
  release.resolve();
  assert.deepEqual(await Promise.all([first, second]), [1, 2]);
  await barrier;
  assert.deepEqual(events, ["first:start", "first:end", "second"]);
  assert.equal(waited, true);
});
test("a rejected write is visible to its caller and does not poison later writes or waiters", async () => {
  const job = playerWrite(async () => {
    throw new Error("disk failed");
  });
  await assert.rejects(job, /disk failed/);
  await waitForPlayerWrites();
  assert.equal(await playerWrite(async () => 42), 42);
});
test("synchronous work failures are also recoverable", async () => {
  await assert.rejects(
    playerWrite(() => {
      throw new Error("sync failed");
    }),
    /sync failed/,
  );
  assert.equal(await playerWrite(async () => "recovered"), "recovered");
});
