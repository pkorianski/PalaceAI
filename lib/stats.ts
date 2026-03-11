import AsyncStorage from "@react-native-async-storage/async-storage";

export interface GameStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
  winStreak: number;
  bestStreak: number;
}

const STATS_KEY = "palace_stats";

export async function getStats(): Promise<GameStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return { wins: 0, losses: 0, gamesPlayed: 0, winStreak: 0, bestStreak: 0 };
    return JSON.parse(raw);
  } catch {
    return { wins: 0, losses: 0, gamesPlayed: 0, winStreak: 0, bestStreak: 0 };
  }
}

export async function recordWin(): Promise<GameStats> {
  const stats = await getStats();
  const newStreak = stats.winStreak + 1;
  const updated: GameStats = {
    wins: stats.wins + 1,
    losses: stats.losses,
    gamesPlayed: stats.gamesPlayed + 1,
    winStreak: newStreak,
    bestStreak: Math.max(stats.bestStreak, newStreak),
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updated));
  return updated;
}

export async function recordLoss(): Promise<GameStats> {
  const stats = await getStats();
  const updated: GameStats = {
    wins: stats.wins,
    losses: stats.losses + 1,
    gamesPlayed: stats.gamesPlayed + 1,
    winStreak: 0,
    bestStreak: stats.bestStreak,
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updated));
  return updated;
}
