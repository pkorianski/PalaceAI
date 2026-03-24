import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GameResult } from "./stats";

const DAILY_KEY = "palace_daily_challenge";

export interface DailyChallengeTemplate {
  type: string;
  title: string;
  desc: string;
  target: number;
  icon: string;
}

export interface ActiveDailyChallenge extends DailyChallengeTemplate {
  date: string;
  progress: number;
  completed: boolean;
}

const CHALLENGE_TEMPLATES: DailyChallengeTemplate[] = [
  { type: "win1",     title: "Victorious",    desc: "Win a game",                        target: 1, icon: "trophy-outline" },
  { type: "play3",    title: "Dedicated",     desc: "Play 3 games",                      target: 3, icon: "medal-outline" },
  { type: "burn5",    title: "Pyromaniac",    desc: "Burn the pile 5 times",             target: 5, icon: "bonfire-outline" },
  { type: "clean",    title: "Clean Sweep",   desc: "Win without picking up the pile",   target: 1, icon: "leaf-outline" },
  { type: "win2",     title: "Double Up",     desc: "Win 2 games",                       target: 2, icon: "trophy-outline" },
  { type: "blazer3",  title: "On Fire",       desc: "Burn the pile 3 times in one game", target: 1, icon: "flame-outline" },
  { type: "speed20",  title: "Speed Racer",   desc: "Win in 20 turns or fewer",          target: 1, icon: "flash-outline" },
  { type: "comeback", title: "Never Say Die", desc: "Win after picking up 2+ times",     target: 1, icon: "trending-up-outline" },
  { type: "burn8",    title: "Inferno",       desc: "Burn the pile 8 times",             target: 8, icon: "bonfire-outline" },
  { type: "win3",     title: "Hat Trick",     desc: "Win 3 games",                       target: 3, icon: "trophy-outline" },
  { type: "play5",    title: "Grinder",       desc: "Play 5 games",                      target: 5, icon: "medal-outline" },
  { type: "blazer5",  title: "Blaze of Glory",desc: "Burn the pile 5 times in one game", target: 1, icon: "sparkles-outline" },
];

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTodayTemplateIndex(): number {
  const today = todayString();
  const [y, m, d] = today.split("-").map(Number);
  const start = new Date(y, 0, 0);
  const current = new Date(y, m - 1, d);
  const dayOfYear = Math.floor((current.getTime() - start.getTime()) / 86400000);
  return dayOfYear % CHALLENGE_TEMPLATES.length;
}

export async function getDailyChallenge(): Promise<ActiveDailyChallenge> {
  const today = todayString();
  const idx = getTodayTemplateIndex();
  const template = CHALLENGE_TEMPLATES[idx];

  try {
    const raw = await AsyncStorage.getItem(DAILY_KEY);
    if (raw) {
      const stored: ActiveDailyChallenge = JSON.parse(raw);
      if (stored.date === today && stored.type === template.type) {
        return stored;
      }
    }
  } catch {}

  const fresh: ActiveDailyChallenge = {
    ...template,
    date: today,
    progress: 0,
    completed: false,
  };
  await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(fresh));
  return fresh;
}

function getProgressDelta(type: string, result: GameResult): number {
  switch (type) {
    case "win1":
    case "win2":
    case "win3":
      return result.won ? 1 : 0;
    case "play3":
    case "play5":
      return 1;
    case "burn5":
    case "burn8":
      return result.burns;
    case "clean":
      return result.won && result.pickups === 0 ? 1 : 0;
    case "comeback":
      return result.won && result.pickups >= 2 ? 1 : 0;
    case "blazer3":
      return result.burns >= 3 ? 1 : 0;
    case "blazer5":
      return result.burns >= 5 ? 1 : 0;
    case "speed20":
      return result.won && result.turns <= 20 ? 1 : 0;
    default:
      return 0;
  }
}

export async function updateDailyChallenge(
  result: GameResult
): Promise<{ challenge: ActiveDailyChallenge; justCompleted: boolean }> {
  const challenge = await getDailyChallenge();

  if (challenge.completed) {
    return { challenge, justCompleted: false };
  }

  const delta = getProgressDelta(challenge.type, result);
  const newProgress = Math.min(challenge.progress + delta, challenge.target);
  const justCompleted = newProgress >= challenge.target;

  const updated: ActiveDailyChallenge = {
    ...challenge,
    progress: newProgress,
    completed: justCompleted,
  };

  await AsyncStorage.setItem(DAILY_KEY, JSON.stringify(updated));
  return { challenge: updated, justCompleted };
}
