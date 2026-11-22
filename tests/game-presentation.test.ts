import test from "node:test";
import assert from "node:assert/strict";
import { createInitialGameState, type Card } from "../lib/palace-engine";
import { presentTurn } from "../lib/game-presentation";
const card = (rank: Card['rank'], suit: Card['suit'] = 'hearts'): Card => ({
  rank,
  suit,
  id: `${rank}-${suit}`
});
function playing() {
  const s = createInitialGameState();
  s.phase = 'playing';
  s.currentPlayerIndex = 0;
  s.pile = [card('K')];
  s.players[0].hand = [card('3'), card('A'), card('2'), card('10')];
  return s;
}
test('move guidance uses engine legality, including resets and burns', () => {
  const s = playing(),
    v = presentTurn(s);
  assert.deepEqual(v.playableIds, ['A-hearts', '2-hearts', '10-hearts']);
  assert.match(v.hint, /marked/);
  assert.equal(presentTurn(s, ['3-hearts']).canPlay, false);
  assert.match(presentTurn(s, ['3-hearts']).hint, /can’t play/);
  assert.equal(presentTurn(s, ['A-hearts']).canPlay, true);
});
test('same rank multiple play is explained; mixed or missing selections never enable Play', () => {
  const s = playing();
  s.players[0].hand.push(card('A', 'clubs'));
  assert.equal(presentTurn(s, ['A-hearts', 'A-clubs']).canPlay, true);
  assert.equal(presentTurn(s, ['A-hearts', '2-hearts']).canPlay, false);
  assert.equal(presentTurn(s, ['A-hearts', 'missing']).canPlay, false);
});
test('blind guidance never depends on unknown ranks and exposes no playable IDs', () => {
  const s = playing();
  s.players[0].hand = [];
  s.players[0].faceUpPalace = [];
  const a = presentTurn(s);
  s.players[0].faceDownPalace = [card('A'), card('2'), card('10')];
  assert.deepEqual(presentTurn(s), a);
  assert.deepEqual(a.playableIds, []);
  assert.equal(a.canPlay, false);
  assert.match(a.hint, /flip/);
});
test('face-up phase guides the visible palace, not the empty hand', () => {
  const s = playing();
  s.players[0].hand = [];
  s.players[0].faceUpPalace = [card('3')];
  assert.match(presentTurn(s).hint, /Pick up/);
  s.pile = [];
  assert.equal(presentTurn(s, ['3-hearts']).canPlay, true);
});
test('opponent turn never presents the human hand as playable', () => {
  const s = playing();
  s.currentPlayerIndex = 1;
  assert.deepEqual(presentTurn(s, ['A-hearts']).playableIds, []);
  assert.equal(presentTurn(s, ['A-hearts']).canPlay, false);
  assert.match(presentTurn(s).hint, /up next/);
});
