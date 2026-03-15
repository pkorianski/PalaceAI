import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GameStats, GameResult } from "./stats";

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

const ACHIEVEMENTS_KEY = "palace_achievements";

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_win",
    title: "First Victory",
    desc: "Win your first game",
    icon: "trophy-outline",
  },
  {
    id: "clean_sweep",
    title: "Clean Sweep",
    desc: "Win without picking up the pile",
    icon: "sparkles-outline",
  },
  {
    id: "pyromaniac",
    title: "Pyromaniac",
    desc: "Burn the pile 5 times in one game",
    icon: "bonfire-outline",
  },
  {
    id: "comeback",
    title: "Comeback Kid",
    desc: "Win after picking up the pile 3+ times",
    icon: "trending-up-outline",
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    desc: "Win in 15 or fewer turns",
    icon: "flash-outline",
  },
  {
    id: "hot_streak_3",
    title: "Hot Streak",
    desc: "Win 3 games in a row",
    icon: "flame-outline",
  },
  {
    id: "hot_streak_5",
    title: "On Fire",
    desc: "Win 5 games in a row",
    icon: "flame",
  },
  {
    id: "veteran",
    title: "Veteran",
    desc: "Play 10 games",
    icon: "medal-outline",
  },
  {
    id: "champion",
    title: "Champion",
    desc: "Win 10 games",
    icon: "ribbon-outline",
  },
  {
    id: "dedicated",
    title: "Dedicated",
    desc: "Play 25 games",
    icon: "medal",
  },
];

function isNowUnlocked(id: string, stats: GameStats, result: GameResult): boolean {
  switch (id) {
    case "first_win":     return result.won && stats.wins === 1;
    case "clean_sweep":   return result.won && result.pickups === 0;
    case "pyromaniac":    return result.burns >= 5;
    case "comeback":      return result.won && result.pickups >= 3;
    case "speed_demon":   return result.won && result.turns <= 15;
    case "hot_streak_3":  return stats.winStreak >= 3;
    case "hot_streak_5":  return stats.winStreak >= 5;
    case "veteran":       return stats.gamesPlayed >= 10;
    case "champion":      return stats.wins >= 10;
    case "dedicated":     return stats.gamesPlayed >= 25;
    default:              return false;
  }
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
): Promise<Achievement[]> {
  const alreadyUnlocked = await getUnlockedIds();
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ALL_ACHIEVEMENTS) {
    if (
      !alreadyUnlocked.includes(achievement.id) &&
      isNowUnlocked(achievement.id, stats, result)
    ) {
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    const updated = [...alreadyUnlocked, ...newlyUnlocked.map((a) => a.id)];
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated));
  }

  return newlyUnlocked;
}
