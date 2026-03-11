export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  faceUpPalace: Card[];
  faceDownPalace: (Card | null)[];
  isHuman: boolean;
}

export type GamePhase =
  | "setup"
  | "choose_palace"
  | "playing"
  | "game_over";

export interface GameState {
  deck: Card[];
  pile: Card[];
  burnPile: Card[];
  players: PlayerState[];
  currentPlayerIndex: number;
  phase: GamePhase;
  winner: string | null;
  message: string;
  lastBurned: boolean;
  selectedCards: string[];
}

const RANKS: Rank[] = [
  "2","3","4","5","6","7","8","9","10","J","Q","K","A",
];
const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

const RANK_VALUES: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export function rankValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}-${suit}` });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialGameState(): GameState {
  const deck = shuffle(createDeck());
  const players: PlayerState[] = [
    {
      id: "human",
      name: "You",
      hand: [],
      faceUpPalace: [],
      faceDownPalace: [null, null, null],
      isHuman: true,
    },
    {
      id: "ai",
      name: "Opponent",
      hand: [],
      faceUpPalace: [],
      faceDownPalace: [null, null, null],
      isHuman: false,
    },
  ];

  let deckIdx = 0;
  for (const player of players) {
    for (let i = 0; i < 3; i++) {
      player.faceDownPalace[i] = deck[deckIdx++];
    }
    for (let i = 0; i < 3; i++) {
      player.faceUpPalace.push(deck[deckIdx++]);
    }
    for (let i = 0; i < 6; i++) {
      player.hand.push(deck[deckIdx++]);
    }
  }

  const remainingDeck = deck.slice(deckIdx);

  return {
    deck: remainingDeck,
    pile: [],
    burnPile: [],
    players,
    currentPlayerIndex: 0,
    phase: "choose_palace",
    winner: null,
    message: "Choose 3 cards from your hand to place face-up on the table",
    lastBurned: false,
    selectedCards: [],
  };
}

export function getTopPileCard(pile: Card[]): Card | null {
  if (pile.length === 0) return null;
  return pile[pile.length - 1];
}

export function getEffectiveTopCard(pile: Card[]): Card | null {
  for (let i = pile.length - 1; i >= 0; i--) {
    if (pile[i].rank !== "3") return pile[i];
  }
  return null;
}

export function isSpecialCard(rank: Rank): boolean {
  return rank === "2" || rank === "10" || rank === "3";
}

export function canPlayCard(card: Card, pile: Card[]): boolean {
  const rank = card.rank;
  if (rank === "2" || rank === "10" || rank === "3") return true;
  const top = getEffectiveTopCard(pile);
  if (!top) return true;
  return RANK_VALUES[rank] >= RANK_VALUES[top.rank];
}

export function canPlayCards(cards: Card[], pile: Card[]): boolean {
  if (cards.length === 0) return false;
  const allSameRank = cards.every((c) => c.rank === cards[0].rank);
  if (!allSameRank) return false;
  return canPlayCard(cards[0], pile);
}

export function wouldBurn(cards: Card[], pile: Card[]): boolean {
  if (cards[0].rank === "10") return true;
  const newPile = [...pile, ...cards];
  const lastRank = newPile[newPile.length - 1].rank;
  if (lastRank === "3") {
    return false;
  }
  let count = 0;
  for (let i = newPile.length - 1; i >= 0; i--) {
    if (newPile[i].rank === lastRank) {
      count++;
    } else {
      break;
    }
  }
  return count >= 4;
}

export function getCurrentPlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex];
}

export function getPlayerPhase(
  player: PlayerState
): "hand" | "faceup" | "facedown" {
  if (player.hand.length > 0) return "hand";
  if (player.faceUpPalace.length > 0) return "faceup";
  return "facedown";
}

export function drawUpToSix(player: PlayerState, deck: Card[]): { player: PlayerState; deck: Card[] } {
  const newDeck = [...deck];
  const newHand = [...player.hand];
  while (newHand.length < 6 && newDeck.length > 0) {
    newHand.push(newDeck.shift()!);
  }
  return { player: { ...player, hand: newHand }, deck: newDeck };
}

export function playCards(
  state: GameState,
  playerIdx: number,
  cardIds: string[]
): GameState {
  let newState = { ...state };
  let player = { ...newState.players[playerIdx] };
  const playerPhase = getPlayerPhase(player);

  let playedCards: Card[] = [];

  if (playerPhase === "hand") {
    playedCards = player.hand.filter((c) => cardIds.includes(c.id));
    player = { ...player, hand: player.hand.filter((c) => !cardIds.includes(c.id)) };
  } else if (playerPhase === "faceup") {
    playedCards = player.faceUpPalace.filter((c) => cardIds.includes(c.id));
    player = { ...player, faceUpPalace: player.faceUpPalace.filter((c) => !cardIds.includes(c.id)) };
  } else {
    const fdIdx = parseInt(cardIds[0].replace("fd-", ""));
    const card = player.faceDownPalace[fdIdx];
    if (!card) return state;
    playedCards = [card];
    const newFd = [...player.faceDownPalace];
    newFd[fdIdx] = null;
    player = { ...player, faceDownPalace: newFd };

    if (!canPlayCard(card, newState.pile)) {
      const allPileCards = [...newState.pile, card];
      player = { ...player, hand: [...player.hand, ...allPileCards] };
      const newPlayers = [...newState.players];
      newPlayers[playerIdx] = player;
      const nextIdx = (playerIdx + 1) % newState.players.length;
      return {
        ...newState,
        players: newPlayers,
        pile: [],
        lastBurned: false,
        currentPlayerIndex: nextIdx,
        message: `${player.name} flipped a ${card.rank} and picked up the pile!`,
      };
    }
  }

  if (playedCards.length === 0) return state;

  const newPile = [...newState.pile, ...playedCards];
  let burned = false;
  let newDeck = [...newState.deck];

  if (wouldBurn(playedCards, newState.pile)) {
    burned = true;
    newState = { ...newState, burnPile: [...newState.burnPile, ...newPile], pile: [] };
  } else {
    newState = { ...newState, pile: newPile };
  }

  if (getPlayerPhase(player) === "hand" && player.hand.length < 6 && !burned) {
    const result = drawUpToSix(player, newDeck);
    player = result.player;
    newDeck = result.deck;
  } else if (getPlayerPhase(player) === "hand" && player.hand.length < 6 && burned) {
    const result = drawUpToSix(player, newDeck);
    player = result.player;
    newDeck = result.deck;
  }

  newState = { ...newState, deck: newDeck };

  const allEmpty =
    player.hand.length === 0 &&
    player.faceUpPalace.length === 0 &&
    player.faceDownPalace.every((c) => c === null);

  if (allEmpty) {
    const newPlayers = [...newState.players];
    newPlayers[playerIdx] = player;
    return {
      ...newState,
      players: newPlayers,
      phase: "game_over",
      winner: player.id,
      lastBurned: burned,
      message: `${player.name} wins! 🎉`,
    };
  }

  const newPlayers = [...newState.players];
  newPlayers[playerIdx] = player;
  newState = { ...newState, players: newPlayers };

  let nextIdx: number;
  let message: string;

  if (burned) {
    nextIdx = playerIdx;
    message = `Pile burned! ${player.name} plays again!`;
  } else {
    nextIdx = (playerIdx + 1) % newState.players.length;
    message = `${newState.players[nextIdx].name}'s turn`;
  }

  return {
    ...newState,
    currentPlayerIndex: nextIdx,
    lastBurned: burned,
    message,
    selectedCards: [],
  };
}

export function pickUpPile(state: GameState, playerIdx: number): GameState {
  const player = { ...state.players[playerIdx] };
  const newHand = [...player.hand, ...state.pile];
  const newPlayer = { ...player, hand: newHand };
  const newPlayers = [...state.players];
  newPlayers[playerIdx] = newPlayer;
  const nextIdx = (playerIdx + 1) % state.players.length;
  return {
    ...state,
    players: newPlayers,
    pile: [],
    lastBurned: false,
    currentPlayerIndex: nextIdx,
    message: `${player.name} picked up the pile`,
    selectedCards: [],
  };
}

export function getAIMove(state: GameState): {
  type: "play" | "pickup";
  cardIds?: string[];
} {
  const ai = state.players.find((p) => !p.isHuman)!;
  const aiIdx = state.players.findIndex((p) => !p.isHuman);
  if (state.currentPlayerIndex !== aiIdx) return { type: "pickup" };

  const phase = getPlayerPhase(ai);

  if (phase === "facedown") {
    const availableIdx = ai.faceDownPalace.findIndex((c) => c !== null);
    if (availableIdx >= 0) {
      return { type: "play", cardIds: [`fd-${availableIdx}`] };
    }
    return { type: "pickup" };
  }

  const candidates = phase === "hand" ? ai.hand : ai.faceUpPalace;

  const grouped: Record<string, Card[]> = {};
  for (const card of candidates) {
    if (!grouped[card.rank]) grouped[card.rank] = [];
    grouped[card.rank].push(card);
  }

  let bestPlay: Card[] | null = null;
  let bestScore = -999;

  for (const rank of Object.keys(grouped)) {
    const group = grouped[rank];
    const playable = canPlayCards(group, state.pile);
    if (!playable) {
      if (canPlayCards([group[0]], state.pile)) {
        const single = [group[0]];
        const score = scorePlay(single, state.pile);
        if (score > bestScore) {
          bestScore = score;
          bestPlay = single;
        }
      }
      continue;
    }
    const score = scorePlay(group, state.pile);
    if (score > bestScore) {
      bestScore = score;
      bestPlay = group;
    }
  }

  if (bestPlay) {
    return { type: "play", cardIds: bestPlay.map((c) => c.id) };
  }

  return { type: "pickup" };
}

function scorePlay(cards: Card[], pile: Card[]): number {
  const rank = cards[0].rank;
  if (rank === "10") return 100;
  if (wouldBurn(cards, pile)) return 90;
  if (rank === "2") return 50;
  if (rank === "3") return 30;
  const top = getEffectiveTopCard(pile);
  const topVal = top ? RANK_VALUES[top.rank] : 0;
  const val = RANK_VALUES[rank as Rank];
  const playScore = cards.length * 20 - (val - topVal);
  return playScore;
}

export function confirmPalaceSetup(
  state: GameState,
  playerIdx: number,
  chosenCardIds: string[]
): GameState {
  if (chosenCardIds.length !== 3) return state;
  const player = { ...state.players[playerIdx] };
  const chosenCards = player.hand.filter((c) => chosenCardIds.includes(c.id));
  if (chosenCards.length !== 3) return state;

  player.faceUpPalace = chosenCards;
  player.hand = player.hand.filter((c) => !chosenCardIds.includes(c.id));

  const newPlayers = [...state.players];
  newPlayers[playerIdx] = player;

  let newState = { ...state, players: newPlayers };

  const allSetup = newState.players.every((p) => p.faceUpPalace.length === 3);

  if (allSetup) {
    return {
      ...newState,
      phase: "playing",
      currentPlayerIndex: 0,
      message: "Your turn — play a card to start!",
    };
  }

  return {
    ...newState,
    currentPlayerIndex: playerIdx + 1,
    message: "Opponent choosing face-up cards...",
  };
}

export function autoAISetupPalace(state: GameState, aiIdx: number): GameState {
  const ai = { ...state.players[aiIdx] };
  const sorted = [...ai.hand].sort(
    (a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]
  );
  const chosen = sorted.slice(0, 3).map((c) => c.id);
  return confirmPalaceSetup(state, aiIdx, chosen);
}
