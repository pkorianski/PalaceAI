import { canPlayCards, getPlayerPhase, type GameState } from "./palace-engine";
/** Uses only the player's currently visible cards. Blind-card ranks never inform guidance. */
export function presentTurn(state: GameState, selected: string[] = []) {
  const player = state.players[0],
    phase = getPlayerPhase(player);
  const active = state.phase === "playing" && state.players[state.currentPlayerIndex].isHuman;
  const visible = phase === "hand" ? player.hand : phase === "faceup" ? player.faceUpPalace : [];
  const playableIds = active ? visible.filter(card => canPlayCards([card], state.pile)).map(card => card.id) : [];
  const cards = visible.filter(card => selected.includes(card.id));
  const canPlay = active && cards.length > 0 && cards.length === selected.length && canPlayCards(cards, state.pile);
  let heading = "Choose your palace",
    hint = "Choose three cards from your hand to keep for the endgame.";
  if (state.phase === "game_over") {
    heading = state.winner === "human" ? "You win!" : "Round finished";
    hint = "Your result is being saved.";
  } else if (state.phase === "playing") {
    heading = active ? "Your turn" : `${state.players[state.currentPlayerIndex].name}’s turn`;
    if (!active) hint = "You’re up next.";
    else if (phase === "facedown") hint = "Tap a face-down card to flip it.";
    else if (!playableIds.length) hint = "No playable cards. Pick up the pile to continue.";
    else if (selected.length && !canPlay) hint = "This selection can’t play. Choose a marked card or pick up the pile.";
    else if (canPlay) hint = `Ready to play ${cards.length === 1 ? 'your card' : `${cards.length} cards`}.`;
    else hint = "Select a marked card, then tap Play.";
  }
  return {
    active,
    phase,
    playableIds,
    canPlay,
    heading,
    hint
  };
}
