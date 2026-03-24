import AsyncStorage from "@react-native-async-storage/async-storage";

export interface GameStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
  winStreak: number;
  bestStreak: number;
  totalBurns: number;
  bestWinTurns: number;
  comebackWins: number;
  cleanWins: number;
  maxBurnsInGame: number;
}

export interface GameResult {
  won: boolean;
  turns: number;
  pickups: number;
  burns: number;
}

const STATS_KEY = "palace_stats";

const DEFAULT_STATS: GameStats = {
  wins: 0,
  losses: 0,
  gamesPlayed: 0,
  winStreak: 0,
  bestStreak: 0,
  totalBurns: 0,
  bestWinTurns: 0,
  comebackWins: 0,
  cleanWins: 0,
  maxBurnsInGame: 0,
};

export async function getStats(): Promise<GameStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export async function recordGameResult(result: GameResult): Promise<GameStats> {
  const stats = await getStats();
  const newStreak = result.won ? stats.winStreak + 1 : 0;
  const bestWinTurns =
    result.won
      ? stats.bestWinTurns === 0
        ? result.turns
        : Math.min(stats.bestWinTurns, result.turns)
      : stats.bestWinTurns;

  const updated: GameStats = {
    wins: stats.wins + (result.won ? 1 : 0),
    losses: stats.losses + (result.won ? 0 : 1),
    gamesPlayed: stats.gamesPlayed + 1,
    winStreak: newStreak,
    bestStreak: Math.max(stats.bestStreak, newStreak),
    totalBurns: stats.totalBurns + result.burns,
    bestWinTurns,
    comebackWins: stats.comebackWins + (result.won && result.pickups >= 3 ? 1 : 0),
    cleanWins: stats.cleanWins + (result.won && result.pickups === 0 ? 1 : 0),
    maxBurnsInGame: Math.max(stats.maxBurnsInGame, result.burns),
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updated));
  return updated;
}
