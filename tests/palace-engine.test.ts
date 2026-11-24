import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { seededRandom } from "./helpers/fixtures";
beforeEach((t) => {
  if (!("mock" in t)) throw new Error("Expected a test context");
  t.mock.method(Math, "random", seededRandom(4401));
});
import {
  createInitialGameState,
  confirmPalaceSetup,
  autoAISetupPalace,
  canPlayCards,
  wouldBurn,
  playCards,
  type Card,
} from "../lib/palace-engine";
const card = (rank: Card["rank"], suit: Card["suit"] = "hearts"): Card => ({
  rank,
  suit,
  id: `${rank}-${suit}`,
});

test("dealing and palace selection preserve all 52 unique cards", () => {
  let state = createInitialGameState();
  const original = JSON.stringify(state);
  const ids = state.players[0].hand.slice(0, 3).map((c) => c.id);
  state = autoAISetupPalace(confirmPalaceSetup(state, 0, ids), 1);
  assert.equal(state.phase, "playing");
  assert.equal(state.currentPlayerIndex, 0);
  const cards = [
    ...state.deck,
    ...state.players.flatMap((p) => [
      ...p.hand,
      ...p.faceUpPalace,
      ...p.faceDownPalace.filter((c) => c !== null),
    ]),
  ];
  assert.equal(new Set(cards.map((c) => c.id)).size, 52);
  assert.equal(JSON.parse(original).players[0].hand.length, 6);
});
test("legal plays, resets, tens and four-of-a-kind burns", () => {
  assert.equal(canPlayCards([card("3")], [card("A")]), false);
  assert.equal(canPlayCards([card("2")], [card("A")]), true);
  assert.equal(canPlayCards([card("10")], [card("A")]), true);
  assert.equal(canPlayCards([], []), false);
  assert.equal(canPlayCards([card("3"), card("4")], []), false);
  assert.equal(wouldBurn([card("10")], [card("A")]), true);
  assert.equal(
    wouldBurn(
      [card("4", "spades")],
      [card("4"), card("4", "diamonds"), card("4", "clubs")],
    ),
    true,
  );
});
test("a ten burns the pile, refills the hand and retains the turn", () => {
  const initial = createInitialGameState();
  initial.phase = "playing";
  initial.players[0].hand = [card("10")];
  initial.pile = [card("A")];
  const next = playCards(initial, 0, [card("10").id]);
  assert.equal(next.pile.length, 0);
  assert.equal(next.burnPile.length, 2);
  assert.equal(next.players[0].hand.length, 3);
  assert.equal(next.currentPlayerIndex, 0);
  assert.equal(initial.pile.length, 1);
});
