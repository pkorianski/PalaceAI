import assert from "node:assert/strict";
import { test } from "node:test";
import { getRivalMove } from "../lib/tour/ai";
import { card, player, playing, deepFreeze } from "./helpers/fixtures";
const styles = ["keeper", "aggressive", "tactician", "wildcard"] as const;
test("all rival policies pick up when off-turn, missing AI, or no visible move is legal", () => {
  for (const style of styles) {
    assert.deepEqual(
      getRivalMove(playing(), style, 0, () => 0.5),
      { type: "pickup" },
    );
    assert.deepEqual(
      getRivalMove(
        playing({ players: [player()], currentPlayerIndex: 0 }),
        style,
        0,
        () => 0.5,
      ),
      { type: "pickup" },
    );
    const blocked = playing({
      currentPlayerIndex: 1,
      pile: [card("A")],
      players: [player(), player({ isHuman: false, hand: [card("3")] })],
    });
    assert.deepEqual(
      getRivalMove(deepFreeze(blocked), style, 2, () => 0.5),
      { type: "pickup" },
    );
  }
});
test("wildcard choice and variation thresholds use an injected RNG", () => {
  const state = deepFreeze(
    playing({
      deck: [card("K")],
      currentPlayerIndex: 1,
      players: [
        player(),
        player({ isHuman: false, hand: [card("3"), card("8")] }),
      ],
    }),
  );
  assert.deepEqual(getRivalMove(state, "wildcard", 0, () => 0).cardIds, [
    "3-hearts",
  ]);
  assert.deepEqual(getRivalMove(state, "wildcard", 0, () => 0.9999).cardIds, [
    "8-hearts",
  ]);
  assert.deepEqual(getRivalMove(state, "keeper", 0, () => 0.139).cardIds, [
    "3-hearts",
  ]);
  assert.deepEqual(getRivalMove(state, "keeper", 0, () => 0.14).cardIds, [
    "3-hearts",
  ]);
  let calls = 0;
  const draws = [0.13, 0.99];
  assert.deepEqual(
    getRivalMove(state, "keeper", 0, () => draws[calls++]).cardIds,
    ["8-hearts"],
  );
  assert.equal(calls, 2);
});
test("a rival never randomizes away a legal whole-hand endgame win", () => {
  const state = deepFreeze(
    playing({
      deck: [],
      currentPlayerIndex: 1,
      players: [
        player(),
        player({ isHuman: false, hand: [card("8"), card("8", "clubs")] }),
      ],
    }),
  );
  for (const style of styles) {
    const move = getRivalMove(state, style, 2, () => {
      throw Error("RNG must not be needed");
    });
    assert.deepEqual(move.cardIds, ["8-hearts", "8-clubs"]);
  }
});
test("rivals use face-up cards after the hand and blind positions without ranking hidden cards", () => {
  const state = playing({
    currentPlayerIndex: 1,
    players: [
      player(),
      player({ isHuman: false, hand: [], faceUpPalace: [card("Q")] }),
    ],
  });
  assert.deepEqual(getRivalMove(state, "tactician", 1, () => 0.5).cardIds, [
    "Q-hearts",
  ]);
  state.players[1].faceUpPalace = [];
  state.players[1].faceDownPalace = [null, card("3"), card("A")];
  const a = getRivalMove(state, "tactician", 1, () => 0.5);
  state.players[1].faceDownPalace = [null, card("A"), card("3")];
  assert.deepEqual(
    getRivalMove(state, "tactician", 1, () => 0.5),
    a,
  );
  assert.deepEqual(a.cardIds, ["fd-1"]);
});
test("keeper spends a special when opponent is almost out, but saves it when safe", () => {
  const state = playing({
    deck: [card("K")],
    currentPlayerIndex: 1,
    players: [
      player({ hand: [card("4"), card("5"), card("6"), card("7")] }),
      player({ isHuman: false, hand: [card("3"), card("10")] }),
    ],
  });
  assert.deepEqual(getRivalMove(state, "keeper", 0, () => 0.5).cardIds, [
    "3-hearts",
  ]);
  state.players[0].hand = [];
  state.players[0].faceUpPalace = [card("Q")];
  assert.deepEqual(getRivalMove(state, "keeper", 0, () => 0.5).cardIds, [
    "10-hearts",
  ]);
});
