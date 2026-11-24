import type { Card, GameState, PlayerState } from "../../lib/palace-engine";
export const NOW = new Date("2026-11-18T12:00:00.000Z");
export const DAY = "2026-11-18";
export const WEEK = "2026-11-16";
export const card = (
  rank: Card["rank"],
  suit: Card["suit"] = "hearts",
): Card => ({ rank, suit, id: `${rank}-${suit}` });
export function player(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: "human",
    name: "You",
    isHuman: true,
    hand: [card("8")],
    faceUpPalace: [card("Q")],
    faceDownPalace: [card("4"), null, card("9")],
    ...overrides,
  };
}
export function playing(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "playing",
    currentPlayerIndex: 0,
    players: [
      player(),
      player({
        id: "ai",
        name: "Opponent",
        isHuman: false,
        hand: [card("J", "clubs")],
      }),
    ],
    deck: [],
    pile: [],
    burnPile: [],
    selectedCards: [],
    winner: null,
    message: "Your turn",
    lastBurned: false,
    ...overrides,
  };
}
export function seededRandom(seed: number) {
  return () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
}
export function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
