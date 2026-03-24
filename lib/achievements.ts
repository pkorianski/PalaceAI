import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GameStats, GameResult } from "./stats";

const ACHIEVEMENTS_KEY = "palace_achievements";

export interface AchievementTier {
  id: string;
  title: string;
  desc: string;
  threshold: number;
  icon: string;
}

export interface AchievementGroup {
  key: string;
  label: string;
  progressLabel: (progress: number) => string;
  tiers: [AchievementTier, AchievementTier, AchievementTier];
}

export const ACHIEVEMENT_GROUPS: AchievementGroup[] = [
  {
    key: "wins",
    label: "Victories",
    progressLabel: (n) => `${n} wins`,
    tiers: [
      { id: "wins_bronze", title: "First Victory", desc: "Win 1 game", threshold: 1, icon: "trophy-outline" },
      { id: "wins_silver", title: "Contender", desc: "Win 10 games", threshold: 10, icon: "trophy-outline" },
      { id: "wins_gold", title: "Champion", desc: "Win 50 games", threshold: 50, icon: "trophy" },
    ],
  },
  {
    key: "streak",
    label: "Win Streak",
    progressLabel: (n) => `Best streak: ${n}`,
    tiers: [
      { id: "streak_bronze", title: "Hot Streak", desc: "Win 3 in a row", threshold: 3, icon: "flame-outline" },
      { id: "streak_silver", title: "On Fire", desc: "Win 5 in a row", threshold: 5, icon: "flame-outline" },
      { id: "streak_gold", title: "Unstoppable", desc: "Win 10 in a row", threshold: 10, icon: "flame" },
    ],
  },
  {
    key: "burns",
    label: "Pyro",
    progressLabel: (n) => `${n} total burns`,
    tiers: [
      { id: "burns_bronze", title: "Fire Starter", desc: "Burn the pile 10 times total", threshold: 10, icon: "bonfire-outline" },
      { id: "burns_silver", title: "Pyromaniac", desc: "Burn the pile 50 times total", threshold: 50, icon: "bonfire-outline" },
      { id: "burns_gold", title: "Scorched Earth", desc: "Burn the pile 200 times total", threshold: 200, icon: "bonfire" },
    ],
  },
  {
    key: "blazer",
    label: "Single-Game Burns",
    progressLabel: (n) => n > 0 ? `Best: ${n} in one game` : "No burns yet",
    tiers: [
      { id: "blazer_bronze", title: "Spark", desc: "Burn 3 times in one game", threshold: 3, icon: "sparkles-outline" },
      { id: "blazer_silver", title: "Blaze", desc: "Burn 5 times in one game", threshold: 5, icon: "sparkles-outline" },
      { id: "blazer_gold", title: "Inferno", desc: "Burn 8 times in one game", threshold: 8, icon: "sparkles" },
    ],
  },
  {
    key: "speed",
    label: "Speed Run",
    progressLabel: (n) => n > 0 ? `Best: ${n} turns` : "No wins yet",
    tiers: [
      { id: "speed_bronze", title: "Quick Draw", desc: "Win in 25 turns or less", threshold: 25, icon: "flash-outline" },
      { id: "speed_silver", title: "Speed Demon", desc: "Win in 15 turns or less", threshold: 15, icon: "flash-outline" },
      { id: "speed_gold", title: "Lightning", desc: "Win in 10 turns or less", threshold: 10, icon: "flash" },
    ],
  },
  {
    key: "veteran",
    label: "Veteran",
    progressLabel: (n) => `${n} games played`,
    tiers: [
      { id: "veteran_bronze", title: "Rookie", desc: "Play 10 games", threshold: 10, icon: "medal-outline" },
      { id: "veteran_silver", title: "Seasoned", desc: "Play 50 games", threshold: 50, icon: "medal-outline" },
      { id: "veteran_gold", title: "Legend", desc: "Play 200 games", threshold: 200, icon: "medal" },
    ],
  },
  {
    key: "clean",
    label: "Clean Wins",
    progressLabel: (n) => `${n} clean wins`,
    tiers: [
      { id: "clean_bronze", title: "Spotless", desc: "Win without picking up the pile", threshold: 1, icon: "leaf-outline" },
      { id: "clean_silver", title: "Immaculate", desc: "Win cleanly 5 times", threshold: 5, icon: "leaf-outline" },
      { id: "clean_gold", title: "Untouchable", desc: "Win cleanly 20 times", threshold: 20, icon: "leaf" },
    ],
  },
  {
    key: "comeback",
    label: "Comeback",
    progressLabel: (n) => `${n} comeback wins`,
    tiers: [
      { id: "comeback_bronze", title: "Comeback Kid", desc: "Win after picking up 3+ times", threshold: 1, icon: "trending-up-outline" },
      { id: "comeback_silver", title: "Never Give Up", desc: "Comeback win 3 times", threshold: 3, icon: "trending-up-outline" },
      { id: "comeback_gold", title: "Resilient", desc: "Comeback win 10 times", threshold: 10, icon: "trending-up" },
    ],
  },
];

export type Achievement = AchievementTier;
export const ALL_ACHIEVEMENTS: AchievementTier[] = ACHIEVEMENT_GROUPS.flatMap((g) => g.tiers);

export function getGroupProgress(group: AchievementGroup, stats: GameStats): number {
  switch (group.key) {
    case "wins":     return stats.wins;
    case "streak":   return stats.bestStreak;
    case "burns":    return stats.totalBurns;
    case "blazer":   return stats.maxBurnsInGame;
    case "speed":    return stats.bestWinTurns;
    case "veteran":  return stats.gamesPlayed;
    case "clean":    return stats.cleanWins;
    case "comeback": return stats.comebackWins;
    default:         return 0;
  }
}

export function isTierUnlocked(
  tier: AchievementTier,
  group: AchievementGroup,
  stats: GameStats
): boolean {
  const progress = getGroupProgress(group, stats);
  if (group.key === "speed") {
    return stats.bestWinTurns > 0 && stats.bestWinTurns <= tier.threshold;
  }
  return progress >= tier.threshold;
}

export async function getUnlockedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function checkAndUnlockAchievements(
  stats: GameStats,
  result: GameResult
): Promise<AchievementTier[]> {
  const alreadyUnlocked = await getUnlockedIds();
  const newlyUnlocked: AchievementTier[] = [];

  for (const group of ACHIEVEMENT_GROUPS) {
    for (const tier of group.tiers) {
      if (
        !alreadyUnlocked.includes(tier.id) &&
        isTierUnlocked(tier, group, stats)
      ) {
        newlyUnlocked.push(tier);
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    const updated = [...alreadyUnlocked, ...newlyUnlocked.map((t) => t.id)];
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated));
  }

  return newlyUnlocked;
}
