import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { seededRandom, NOW } from "./helpers/fixtures";
beforeEach((t) => {
  if (!("mock" in t)) throw new Error("Expected a test context");
  t.mock.method(Math, "random", seededRandom(18537));
  t.mock.timers.enable({ apis: ["Date"], now: NOW.valueOf() });
});
import { VENUES, RIVALS } from "../lib/tour/content";
import {
  emptyCareer,
  startSeries,
  finishRound,
  venueUnlocked,
  rivalUnlocked,
  tierUnlocked,
  themeUnlocked,
  hydrateCareer,
  trophyCount,
  weekKey,
  circuitRival,
  type Career,
  type Tier,
} from "../lib/tour/model";
import { getRivalMove } from "../lib/tour/ai";
import {
  createInitialGameState,
  autoAISetupPalace,
  confirmPalaceSetup,
  canPlayCards,
  getPlayerPhase,
  playCards,
  pickUpPile,
} from "../lib/palace-engine";
const week = "2026-11-16";
const first = RIVALS[0].id;
let serial = 0;
function winTitle(c: Career, id: string, tier: Tier) {
  c = startSeries(c, id, tier, `${id}-${tier}-${serial++}`);
  while (c.active) c = finishRound(c, c.active.roundId, true).career;
  return c;
}
function unlockFirstVenue() {
  let c = emptyCareer(week);
  for (const r of RIVALS.slice(0, 3)) c = winTitle(c, r.id, 0);
  c = winTitle(c, RIVALS[3].id, 0);
  return c;
}
test("content IDs are unique; four rivals and a champion per venue", () => {
  assert.equal(new Set(RIVALS.map((r) => r.id)).size, 16);
  for (const v of VENUES) {
    const rivals = RIVALS.filter((r) => r.venueId === v.id);
    assert.equal(rivals.length, 4);
    assert.equal(rivals.filter((r) => r.champion).length, 1);
  }
});
test("gates require local rival wins, championship and six medals", () => {
  let c = emptyCareer(week);
  assert.equal(rivalUnlocked(c, RIVALS[3].id), false);
  assert.equal(venueUnlocked(c, "velvet"), false);
  assert.throws(() => startSeries(c, RIVALS[3].id, 0, "blocked"));
  c = unlockFirstVenue();
  assert.equal(themeUnlocked(c, "quarter"), true);
  assert.equal(venueUnlocked(c, "velvet"), false);
  c = winTitle(c, RIVALS[0].id, 1);
  c = winTitle(c, RIVALS[1].id, 1);
  assert.equal(venueUnlocked(c, "velvet"), true);
  assert.equal(venueUnlocked(c, "harbor"), false);
});
test("Silver/Gold locked until previous title; earned trophies never regress", () => {
  let c = emptyCareer(week);
  assert.equal(tierUnlocked(c, first, 1), false);
  c = winTitle(c, first, 0);
  c = startSeries(c, first, 1, "silver");
  c = finishRound(c, c.active!.roundId, false).career;
  assert.equal(c.active?.losses, 1);
  c = finishRound(c, c.active!.roundId, false).career;
  assert.equal(c.active, null);
  assert.equal(c.trophies[first], 1);
  c = winTitle(c, first, 1);
  c = winTitle(c, first, 2);
  assert.equal(c.trophies[first], 3);
  c = winTitle(c, first, 0);
  assert.equal(c.trophies[first], 3);
});
test("a best-of-three survives JSON save/load and supports comeback", () => {
  let c = winTitle(emptyCareer(week), first, 0);
  c = startSeries(c, first, 1, "s");
  c = finishRound(c, "s:0", false).career;
  c = hydrateCareer(JSON.parse(JSON.stringify(c)), week);
  assert.equal(c.active?.losses, 1);
  c = finishRound(c, "s:1", true).career;
  assert.equal(c.active?.wins, 1);
  c = finishRound(c, "s:2", true).career;
  assert.equal(c.active, null);
  assert.equal(c.trophies[first], 2);
});
test("duplicate and stale result IDs cannot mint trophies or circuit wins", () => {
  let c = startSeries(emptyCareer(week), first, 0, "round");
  const finished = finishRound(c, "round:0", true);
  assert.equal(
    finishRound(finished.career, "round:0", true).career,
    finished.career,
  );
  assert.throws(() => finishRound(finished.career, "wrong", true));
  assert.equal(trophyCount(finished.career), 1);
});
test("cannot replace an active series without explicit abandonment", () => {
  const c = startSeries(emptyCareer(week), first, 0, "round");
  assert.throws(() => startSeries(c, RIVALS[1].id, 0, "other"));
});
test("week uses Monday UTC across Sunday, year boundary and local offsets", () => {
  assert.equal(weekKey(new Date("2026-11-22T23:59:59Z")), week);
  assert.equal(weekKey(new Date("2026-11-23T00:00:00Z")), "2026-11-23");
  assert.equal(weekKey(new Date("2027-01-01T06:00:00Z")), "2026-12-28");
});
test("weekly rollover clears only circuit run, keeps ribbons, trophies and normal series", () => {
  let c = unlockFirstVenue();
  c.circuit = { week, wins: 6, attempts: 9 };
  c.ribbons[week] = 1;
  c = startSeries(c, first, 1, "s");
  const next = hydrateCareer(c, "2026-11-23");
  assert.equal(next.active?.id, "s");
  assert.equal(next.circuit.wins, 0);
  assert.equal(next.ribbons[week], 1);
  assert.equal(trophyCount(next), 4);
});
test("circuit loss preserves wins; weekly ribbons granted once per division", () => {
  let c = unlockFirstVenue();
  c.circuit = { week, wins: 5, attempts: 7 };
  c = startSeries(c, circuitRival(c, week).id, 0, "c1", "circuit", week);
  c = finishRound(c, "c1:0", false).career;
  assert.equal(c.circuit.wins, 5);
  assert.equal(c.circuit.attempts, 8);
  c = startSeries(c, circuitRival(c, week).id, 0, "c2", "circuit", week);
  c = finishRound(c, "c2:0", true).career;
  assert.equal(c.circuit.wins, 6);
  assert.equal(c.ribbons[week], 1);
  assert.equal(trophyCount(c), 4);
  assert.equal(finishRound(c, "c2:0", true).career.circuit.wins, 6);
});
test("full tour is reachable without changing rules or paying; 48 mastery trophies", () => {
  let c = emptyCareer(week);
  for (const v of VENUES) {
    assert.equal(venueUnlocked(c, v.id), true);
    for (const r of RIVALS.filter((r) => r.venueId === v.id))
      for (const tier of [0, 1, 2] as Tier[]) c = winTitle(c, r.id, tier);
  }
  assert.equal(trophyCount(c), 48);
  assert.equal(c.active, null);
});
test("corrupt/unknown save is rejected instead of silently erasing progress", () => {
  assert.throws(() => hydrateCareer(null));
  assert.throws(() => hydrateCareer({ version: 7 }));
  const c = emptyCareer(week);
  c.equipped = "crown";
  assert.equal(hydrateCareer(c, week).equipped, "classic");
});
test("all rival policies play legal owned cards and do not mutate deals", () => {
  for (let deal = 0; deal < 30; deal++) {
    let s = createInitialGameState();
    s = confirmPalaceSetup(
      s,
      0,
      s.players[0].hand.slice(0, 3).map((c) => c.id),
    );
    s = autoAISetupPalace(s, 1);
    s.currentPlayerIndex = 1;
    const original = JSON.stringify(s);
    for (const style of [
      "aggressive",
      "keeper",
      "wildcard",
      "tactician",
    ] as const)
      for (const tier of [0, 1, 2]) {
        const move = getRivalMove(s, style, tier, () => 0.4);
        if (move.type === "play") {
          const cards = s.players[1].hand.filter((c) =>
            move.cardIds!.includes(c.id),
          );
          assert.equal(cards.length, move.cardIds!.length);
          assert.equal(canPlayCards(cards, s.pile), true);
        }
      }
    assert.equal(JSON.stringify(s), original);
  }
});
test("keeper saves a ten while aggressive spends it; hidden cards do not affect decisions", () => {
  const s = createInitialGameState();
  s.phase = "playing";
  s.currentPlayerIndex = 1;
  s.players[1].hand = [
    { id: "3-hearts", rank: "3", suit: "hearts" },
    { id: "10-hearts", rank: "10", suit: "hearts" },
  ];
  assert.deepEqual(getRivalMove(s, "keeper", 0, () => 0.5).cardIds, [
    "3-hearts",
  ]);
  assert.deepEqual(getRivalMove(s, "aggressive", 0, () => 0.5).cardIds, [
    "10-hearts",
  ]);
  const altered = structuredClone(s);
  altered.deck.reverse();
  altered.players[0].hand.reverse();
  altered.players[0].faceDownPalace.reverse();
  assert.deepEqual(
    getRivalMove(s, "tactician", 0, () => 0.5),
    getRivalMove(altered, "tactician", 0, () => 0.5),
  );
});
test("complete rival-vs-rival games conserve 52 cards and can finish", () => {
  let finished = 0;
  for (let n = 0; n < 12; n++) {
    let s = createInitialGameState();
    s = confirmPalaceSetup(
      s,
      0,
      s.players[0].hand.slice(0, 3).map((c) => c.id),
    );
    s = autoAISetupPalace(s, 1);
    for (let turn = 0; turn < 1200 && s.phase !== "game_over"; turn++) {
      const index = s.currentPlayerIndex;
      // Exchange isHuman flags to exercise the same policy for each seat.
      const aiState = {
        ...s,
        players: s.players.map((p, i) => ({ ...p, isHuman: i !== index })),
      };
      const move = getRivalMove(aiState, index ? "keeper" : "tactician", 2);
      if (move.type === "play") {
        if (getPlayerPhase(s.players[index]) !== "facedown") {
          const owned = [
            ...s.players[index].hand,
            ...s.players[index].faceUpPalace,
          ].filter((c) => move.cardIds!.includes(c.id));
          assert.equal(canPlayCards(owned, s.pile), true);
        }
        s = playCards(s, index, move.cardIds!);
      } else s = pickUpPile(s, index);
      const cards = [
        ...s.deck,
        ...s.pile,
        ...s.burnPile,
        ...s.players.flatMap((p) => [
          ...p.hand,
          ...p.faceUpPalace,
          ...p.faceDownPalace.filter((c) => c !== null),
        ]),
      ];
      assert.equal(cards.length, 52);
      assert.equal(new Set(cards.map((c) => c.id)).size, 52);
    }
    if (s.phase === "game_over") finished++;
  }
  assert.ok(finished >= 8, `Only ${finished}/12 games finished`);
});

test("saved current deal survives hydration and invalid series is preserved with an error", () => {
  let c = startSeries(emptyCareer(week), first, 0, "saved");
  c.active!.game = createInitialGameState();
  c.active!.metrics = { turns: 12, pickups: 2, burns: 3 };
  const restored = hydrateCareer(JSON.parse(JSON.stringify(c)), week);
  assert.deepEqual(restored.active, c.active);
  const invalid = structuredClone(c);
  (invalid.active as any).tier = 20;
  assert.throws(() => hydrateCareer(invalid, week));
  assert.equal((invalid.active as any).tier, 20);
});
test("old weekly active deal expires while earned weekly ribbon remains", () => {
  let c = unlockFirstVenue();
  c.ribbons[week] = 1;
  c = startSeries(c, circuitRival(c, week).id, 0, "old", "circuit", week);
  const next = hydrateCareer(c, "2026-11-23");
  assert.equal(next.active, null);
  assert.equal(next.ribbons[week], 1);
});
