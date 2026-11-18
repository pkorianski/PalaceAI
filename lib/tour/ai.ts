import {
  canPlayCards,
  getAIMove,
  getPlayerPhase,
  rankValue,
  wouldBurn,
  type Card,
  type GameState,
} from "../palace-engine";
import type { RivalStyle } from "./content";
// This policy only reads its own available cards, the public pile and opponent
// card COUNTS. It never looks at the deck or hidden opponent card identities.
export function getRivalMove(
  state: GameState,
  style: RivalStyle,
  mastery = 0,
  random = Math.random,
): ReturnType<typeof getAIMove> {
  const index = state.players.findIndex((p) => !p.isHuman);
  const ai = state.players[index];
  if (!ai || state.currentPlayerIndex !== index) return { type: "pickup" };
  const phase = getPlayerPhase(ai);
  if (phase === "facedown") return getAIMove(state);
  const cards = phase === "hand" ? ai.hand : ai.faceUpPalace;
  const groups = new Map<string, Card[]>();
  cards.forEach((c) => groups.set(c.rank, [...(groups.get(c.rank) || []), c]));
  const legal = [...groups.values()].filter((g) => canPlayCards(g, state.pile));
  if (!legal.length) return { type: "pickup" };
  const opponent = state.players.find((p) => p.isHuman)!;
  const danger = opponent.hand.length + opponent.faceUpPalace.length <= 3;
  const score = (g: Card[]) => {
    const rank = g[0].rank,
      value = rankValue(rank);
    const burn = wouldBurn(g, state.pile);
    const special = rank === "2" || rank === "10";
    const endgame = state.deck.length === 0 && cards.length <= 3;
    let n = g.length * 24 - value;
    if (style === "aggressive") n += special ? 38 : value * 2;
    if (style === "keeper") n += special && !danger && !endgame ? -120 : 0;
    if (style === "tactician") n += danger ? value * 3 : special ? -35 : 0;
    if (burn) n += 70;
    if (mastery > 0 && danger) n += value * (2 + mastery);
    if (endgame && g.length === cards.length) n += 200;
    return n;
  };
  // Occasional alternative legal plays avoid deterministic pickup/return cycles.
  // Never pass up shedding the entire remaining hand in the endgame.
  const canShedAll =
    state.deck.length === 0 && legal.some((g) => g.length === cards.length);
  const vary = !canShedAll && legal.length > 1 && random() < 0.14;
  const choice =
    (style === "wildcard" && mastery === 0) || vary
      ? legal[Math.min(legal.length - 1, Math.floor(random() * legal.length))]
      : legal.sort((a, b) => score(b) - score(a))[0];
  return { type: "play", cardIds: choice.map((c) => c.id) };
}
