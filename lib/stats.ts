import { loadMastery, recordMasteryRound } from "./mastery/storage";
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
  try { return (await loadMastery()).stats; }
  catch {
    try {
      const raw = await AsyncStorage.getItem(STATS_KEY);
      return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS };
    } catch { return { ...DEFAULT_STATS }; }
  }
}

export async function recordGameResult(result: GameResult, roundId = `${Date.now()}-${Math.random()}`): Promise<GameStats> {
  return (await recordMasteryRound(roundId, result)).state.stats;
}
