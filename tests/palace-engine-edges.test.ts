import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDeck,
  shuffle,
  rankValue,
  isSpecialCard,
  getTopPileCard,
  getEffectiveTopCard,
  canPlayCard,
  canPlayCards,
  wouldBurn,
  getPlayerPhase,
  getCurrentPlayer,
  drawUpToThree,
  playCards,
  pickUpPile,
  getAIMove,
  confirmPalaceSetup,
  autoAISetupPalace,
} from "../lib/palace-engine";
import { card, player, playing, deepFreeze } from "./helpers/fixtures";

test("all ordinary ranks compare correctly; reset and ten are always legal", () => {
  const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ] as const;
  for (const rank of ranks) {
    assert.equal(canPlayCard(card(rank), []), true);
    assert.equal(isSpecialCard(rank), rank === "2" || rank === "10");
    for (const top of ranks)
      assert.equal(
        canPlayCard(card(rank), [card(top, "clubs")]),
        rank === "2" || rank === "10" || rankValue(rank) >= rankValue(top),
        `${rank} on ${top}`,
      );
  }
  assert.equal(getTopPileCard([]), null);
  assert.equal(getEffectiveTopCard([]), null);
  const pile = [card("K"), card("2")];
  assert.equal(getTopPileCard(pile), pile[1]);
  assert.equal(getEffectiveTopCard(pile), pile[1]);
  assert.equal(
    canPlayCards([card("8"), card("8", "clubs")], [card("7")]),
    true,
  );
});
test("deck has exactly one of each rank/suit; shuffle is a pure permutation at RNG boundaries", (t) => {
  const deck = deepFreeze(createDeck());
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck.map((c) => c.id)).size, 52);
  for (const value of [0, 0.999999]) {
    t.mock.method(Math, "random", () => value);
    const result = shuffle(deck);
    assert.notEqual(result, deck);
    assert.deepEqual(
      [...result].sort((a, b) => a.id.localeCompare(b.id)),
      [...deck].sort((a, b) => a.id.localeCompare(b.id)),
    );
    t.mock.restoreAll();
  }
  assert.deepEqual(shuffle([]), []);
  assert.deepEqual(shuffle([1]), [1]);
});
test("four-of-a-kind requires consecutive top cards and can span a multi-card play", () => {
  assert.equal(
    wouldBurn(
      [card("8", "clubs")],
      [card("8"), card("8", "spades"), card("8", "diamonds")],
    ),
    true,
  );
  assert.equal(
    wouldBurn(
      [card("8", "clubs"), card("8", "spades")],
      [card("8"), card("8", "diamonds")],
    ),
    true,
  );
  assert.equal(
    wouldBurn(
      [card("8", "clubs")],
      [card("8"), card("8", "spades"), card("9")],
    ),
    false,
  );
  assert.equal(
    wouldBurn([card("8")], [card("8", "clubs"), card("8", "spades")]),
    false,
  );
});
test("refill stops at three or deck exhaustion, preserving order and inputs", () => {
  for (const [hand, deck, expectedHand, remaining] of [
    [[], [card("3"), card("4")], [card("3"), card("4")], []],
    [
      [card("8")],
      [card("3"), card("4"), card("5")],
      [card("8"), card("3"), card("4")],
      [card("5")],
    ],
    [
      [card("8"), card("9"), card("J")],
      [card("3")],
      [card("8"), card("9"), card("J")],
      [card("3")],
    ],
  ]) {
    const input = deepFreeze(player({ hand }));
    deepFreeze(deck);
    const out = drawUpToThree(input, deck);
    assert.deepEqual(out.player.hand, expectedHand);
    assert.deepEqual(out.deck, remaining);
  }
});
test("playing the last hand card promotes face-up cards; picking up returns to hand", () => {
  const state = deepFreeze(
    playing({
      pile: [card("7", "clubs")],
      selectedCards: ["8-hearts"],
      lastBurned: true,
    }),
  );
  const next = playCards(state, 0, ["8-hearts"]);
  assert.equal(getPlayerPhase(next.players[0]), "faceup");
  assert.equal(next.currentPlayerIndex, 1);
  assert.equal(next.lastBurned, false);
  assert.deepEqual(next.selectedCards, []);
  const pickup = pickUpPile({ ...next, currentPlayerIndex: 0 }, 0);
  assert.equal(getPlayerPhase(pickup.players[0]), "hand");
  assert.deepEqual(pickup.players[0].hand, [card("7", "clubs"), card("8")]);
  assert.deepEqual(
    pickup.players[0].faceUpPalace,
    state.players[0].faceUpPalace,
  );
  assert.deepEqual(pickup.pile, []);
  assert.equal(pickup.currentPlayerIndex, 1);
});
test("last face-up play promotes blind cards without moving their positions or refilling", () => {
  const state = deepFreeze(
    playing({
      players: [
        player({ hand: [], faceUpPalace: [card("Q")] }),
        player({ isHuman: false }),
      ],
    }),
  );
  const next = playCards(state, 0, ["Q-hearts"]);
  assert.equal(getPlayerPhase(next.players[0]), "facedown");
  assert.deepEqual(next.players[0].faceDownPalace, [
    card("4"),
    null,
    card("9"),
  ]);
  assert.deepEqual(next.players[0].hand, []);
});
test("failed blind flip picks up that card and pile; other slots remain untouched", () => {
  const state = deepFreeze(
    playing({
      players: [
        player({ hand: [], faceUpPalace: [] }),
        player({ isHuman: false }),
      ],
      pile: [card("K", "clubs")],
      lastBurned: true,
    }),
  );
  const next = playCards(state, 0, ["fd-0"]);
  assert.deepEqual(next.players[0].hand, [card("K", "clubs"), card("4")]);
  assert.deepEqual(next.players[0].faceDownPalace, [null, null, card("9")]);
  assert.deepEqual(next.pile, []);
  assert.equal(next.currentPlayerIndex, 1);
  assert.equal(next.lastBurned, false);
  assert.equal(next.phase, "playing");
});
test("empty blind slot and an unknown visible ID are no-ops", () => {
  const blind = deepFreeze(
    playing({ players: [player({ hand: [], faceUpPalace: [] }), player()] }),
  );
  assert.equal(playCards(blind, 0, ["fd-1"]), blind);
  const hand = deepFreeze(playing());
  assert.equal(playCards(hand, 0, ["not-owned"]), hand);
  const up = deepFreeze(playing({ players: [player({ hand: [] }), player()] }));
  assert.equal(playCards(up, 0, ["not-owned"]), up);
});
for (const rank of ["9", "10", "2"] as const)
  test(`last blind ${rank} wins, including reset/burn priority`, () => {
    const state = deepFreeze(
      playing({
        players: [
          player({
            hand: [],
            faceUpPalace: [],
            faceDownPalace: [null, card(rank), null],
          }),
          player(),
        ],
        pile: [card("3", "clubs")],
      }),
    );
    const next = playCards(state, 0, ["fd-1"]);
    assert.equal(next.phase, "game_over");
    assert.equal(next.winner, "human");
    assert.deepEqual(next.players[0].faceDownPalace, [null, null, null]);
    assert.equal(next.lastBurned, rank === "10");
    assert.equal(next.pile.length, rank === "10" ? 0 : 2);
    assert.equal(next.burnPile.length, rank === "10" ? 2 : 0);
  });
test("reset retains the turn; an ordinary follow-up can play on the two", () => {
  const state = deepFreeze(
    playing({
      players: [player({ hand: [card("2"), card("3")] }), player()],
      pile: [card("A", "clubs")],
    }),
  );
  const reset = playCards(state, 0, ["2-hearts"]);
  assert.equal(reset.currentPlayerIndex, 0);
  assert.equal(reset.lastBurned, false);
  assert.equal(canPlayCard(card("3"), reset.pile), true);
  assert.equal(playCards(reset, 0, ["3-hearts"]).currentPlayerIndex, 1);
});
test("last visible hand card refills before checking victory", () => {
  const state = deepFreeze(
    playing({
      players: [
        player({ faceUpPalace: [], faceDownPalace: [null, null, null] }),
        player(),
      ],
      deck: [card("3", "clubs")],
    }),
  );
  const next = playCards(state, 0, ["8-hearts"]);
  assert.equal(next.phase, "playing");
  assert.deepEqual(next.players[0].hand, [card("3", "clubs")]);
  assert.equal(next.winner, null);
});
test("setup rejects short, duplicate and unknown selections without changing the deal", () => {
  const state = deepFreeze(
    playing({
      phase: "choose_palace",
      players: [
        player({
          hand: [card("3"), card("K"), card("A"), card("2")],
          faceUpPalace: [],
        }),
        player({ faceUpPalace: [] }),
      ],
    }),
  );
  for (const ids of [
    [],
    ["3-hearts"],
    ["3-hearts", "3-hearts", "K-hearts"],
    ["3-hearts", "K-hearts", "unknown"],
  ])
    assert.equal(confirmPalaceSetup(state, 0, ids), state);
  const next = confirmPalaceSetup(state, 0, [
    "K-hearts",
    "A-hearts",
    "2-hearts",
  ]);
  assert.equal(next.phase, "choose_palace");
  assert.equal(next.currentPlayerIndex, 1);
  assert.deepEqual(next.players[0].hand, [card("3")]);
});
test("AI palace setup saves its three highest cards without sorting the input hand", () => {
  const state = deepFreeze(
    playing({
      phase: "choose_palace",
      players: [
        player({ faceUpPalace: [card("3"), card("4"), card("5")] }),
        player({
          id: "ai",
          isHuman: false,
          hand: [
            card("3", "clubs"),
            card("A", "clubs"),
            card("K", "clubs"),
            card("10", "clubs"),
          ],
          faceUpPalace: [],
        }),
      ],
    }),
  );
  const next = autoAISetupPalace(state, 1);
  assert.deepEqual(next.players[1].faceUpPalace.map((c) => c.rank).sort(), [
    "10",
    "A",
    "K",
  ]);
  assert.equal(next.phase, "playing");
  assert.equal(next.currentPlayerIndex, 0);
});
test("Quick Play AI obeys turn, selects blind positions, and picks up when blocked", () => {
  assert.deepEqual(getAIMove(playing()), { type: "pickup" });
  const state = playing({ currentPlayerIndex: 1 });
  state.players[1] = player({
    id: "ai",
    isHuman: false,
    hand: [],
    faceUpPalace: [],
    faceDownPalace: [null, card("9"), null],
  });
  assert.deepEqual(getAIMove(state), { type: "play", cardIds: ["fd-1"] });
  state.players[1].faceDownPalace = [null, null, null];
  assert.deepEqual(getAIMove(state), { type: "pickup" });
  state.players[1].hand = [card("3")];
  state.pile = [card("A")];
  assert.deepEqual(getAIMove(state), { type: "pickup" });
});
test("Quick Play AI prefers a burn, then a reset, and groups equal playable cards", () => {
  const state = playing({ currentPlayerIndex: 1 });
  state.players[1].hand = [card("3"), card("2"), card("10")];
  assert.deepEqual(getAIMove(state).cardIds, ["10-hearts"]);
  state.players[1].hand = [card("3"), card("2")];
  assert.deepEqual(getAIMove(state).cardIds, ["2-hearts"]);
  state.players[1].hand = [];
  state.players[1].faceUpPalace = [card("8"), card("8", "clubs"), card("9")];
  assert.deepEqual(getAIMove(state).cardIds, ["8-hearts", "8-clubs"]);
  state.players[1].faceUpPalace = [card("8", "clubs"), card("2")];
  state.pile = [card("8"), card("8", "spades"), card("8", "diamonds")];
  assert.deepEqual(getAIMove(state).cardIds, ["8-clubs"]);
});

test("turn lookup follows pickup rotation in both seats", () => {
  const state = playing({ currentPlayerIndex: 1, pile: [card("3", "spades")] });
  assert.equal(getCurrentPlayer(state).id, "ai");
  const next = pickUpPile(deepFreeze(state), 1);
  assert.equal(getCurrentPlayer(next).id, "human");
  assert.equal(next.currentPlayerIndex, 0);
});
