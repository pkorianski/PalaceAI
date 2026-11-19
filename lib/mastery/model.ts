import type { GameResult, GameStats } from "../stats";
import { weekKey } from "../tour/model";
export const MASTERY_KEY = "palace_mastery_v1";
export const EMPTY_STATS: GameStats = {
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
export interface Mastery {
  version: 1;
  xp: number;
  stats: GameStats;
  days: string[];
  milestones: string[];
  seals: string[];
  receipts: string[];
  weekly: {
    key: string;
    games: number;
    wins: number;
    burns: number;
    days: string[];
    rewarded: string[];
  };
  title: string;
  theme: string | null;
}
export type Metric =
  | "wins"
  | "gamesPlayed"
  | "totalBurns"
  | "cleanWins"
  | "comebackWins"
  | "days"
  | "seals";
export const TRACKS: {
  id: Metric;
  name: string;
  icon: string;
  unit: string;
  goals: number[];
  detail: string;
}[] = [
  {
    id: "wins",
    name: "Victory road",
    icon: "trophy-outline",
    unit: "wins",
    goals: [100, 250, 500, 1000, 2500],
    detail: "Keep finding a way to win.",
  },
  {
    id: "gamesPlayed",
    name: "Table veteran",
    icon: "layers-outline",
    unit: "games",
    goals: [250, 500, 1000, 2500, 10000],
    detail: "Every completed hand counts—even a tough loss.",
  },
  {
    id: "totalBurns",
    name: "Keep the fire",
    icon: "bonfire-outline",
    unit: "pile burns",
    goals: [500, 1500, 3000, 7500, 20000],
    detail: "Pile burns across your games, by either player.",
  },
  {
    id: "cleanWins",
    name: "Clean craft",
    icon: "leaf-outline",
    unit: "clean wins",
    goals: [25, 75, 150, 300, 750],
    detail: "Win without picking up the pile.",
  },
  {
    id: "comebackWins",
    name: "Never out",
    icon: "trending-up-outline",
    unit: "comebacks",
    goals: [15, 40, 100, 250, 500],
    detail: "Win after picking up the pile at least three times.",
  },
  {
    id: "days",
    name: "A familiar face",
    icon: "calendar-outline",
    unit: "days played",
    goals: [7, 30, 90, 180, 365],
    detail:
      "Finish a game on different UTC days. Breaks never erase your progress.",
  },
  {
    id: "seals",
    name: "Weekly legend",
    icon: "ribbon-outline",
    unit: "weekly seals",
    goals: [1, 4, 12, 26, 52],
    detail: "Complete a weekly quest board. Your dated seals are permanent.",
  },
];
export const TITLES = [
  { id: "new-face", name: "New Face", level: 1 },
  { id: "regular", name: "The Regular", level: 3 },
  { id: "contender", name: "Contender", level: 6 },
  { id: "veteran", name: "Table Veteran", level: 10 },
  { id: "ace", name: "Palace Ace", level: 15 },
  { id: "legend", name: "House Legend", level: 25 },
  { id: "mythic", name: "Living Legend", level: 40 },
];
export const THEMES = [
  {
    id: "midnight-ink",
    name: "Midnight Ink",
    level: 5,
    seals: 0,
    table: "#101A30",
    card: "#243A66",
    accent: "#8CCBFF",
  },
  {
    id: "ember-hall",
    name: "Ember Hall",
    level: 1,
    seals: 4,
    table: "#301A20",
    card: "#713B3D",
    accent: "#FFBE8A",
  },
  {
    id: "royal-aurora",
    name: "Royal Aurora",
    level: 15,
    seals: 0,
    table: "#201733",
    card: "#4A3067",
    accent: "#D5B0FF",
  },
];
export function levelStart(level: number) {
  const n = Math.max(0, level - 1);
  return 150 * n + 75 * n * n;
}
export function levelFor(xp: number) {
  return Math.floor((Math.sqrt(22500 + 300 * xp) - 150) / 150) + 1;
}
export function metricValue(state: Mastery, metric: Metric): number {
  return metric === "days"
    ? state.days.length
    : metric === "seals"
      ? state.seals.length
      : state.stats[metric];
}
export function themeAvailable(state: Mastery, id: string) {
  const t = THEMES.find((t) => t.id === id);
  return !!t && levelFor(state.xp) >= t.level && state.seals.length >= t.seals;
}
export function equippedTitle(state: Mastery) {
  return TITLES.find((t) => t.id === state.title)?.name ?? "New Face";
}
export function questBoard(key: string) {
  const seed =
    [...key].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0) % 3;
  return [
    {
      id: "games",
      name: ["Take your seat", "One more hand", "Make a night of it"][seed],
      target: [10, 12, 14][seed],
      value: (s: Mastery) => s.weekly.games,
      unit: "games finished",
      icon: "layers-outline",
    },
    {
      id: "wins",
      name: ["A winning week", "Find your rhythm", "Raise your game"][seed],
      target: [4, 5, 6][seed],
      value: (s: Mastery) => s.weekly.wins,
      unit: "wins",
      icon: "trophy-outline",
    },
    {
      id: "burns",
      name: ["Heat at the table", "Feed the fire", "Turn up the heat"][seed],
      target: [18, 24, 30][seed],
      value: (s: Mastery) => s.weekly.burns,
      unit: "pile burns seen",
      icon: "bonfire-outline",
    },
    {
      id: "days",
      name: "A familiar table",
      target: 3,
      value: (s: Mastery) => s.weekly.days.length,
      unit: "different UTC days played",
      icon: "calendar-outline",
    },
  ];
}
function newWeek(key: string): Mastery["weekly"] {
  return { key, games: 0, wins: 0, burns: 0, days: [], rewarded: [] };
}
export function rollWeek(state: Mastery, now = new Date()): Mastery {
  const key = weekKey(now);
  // A delayed result or backwards clock must never rewind a newer board.
  return key > state.weekly.key ? { ...state, weekly: newWeek(key) } : state;
}
function awardMilestones(state: Mastery) {
  const next = { ...state, milestones: [...state.milestones] };
  for (const track of TRACKS)
    track.goals.forEach((goal, index) => {
      const id = `${track.id}-${index}`;
      if (
        metricValue(next, track.id) >= goal &&
        !next.milestones.includes(id)
      ) {
        next.milestones.push(id);
        next.xp += 150 * (index + 1);
      }
    });
  return next;
}
export function createMastery(
  stats: Partial<GameStats> = {},
  now = new Date(),
): Mastery {
  const merged = { ...EMPTY_STATS, ...stats };
  for (const value of Object.values(merged))
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(
        "Saved statistics are invalid. The original save has been kept.",
      );
  // Historical games/wins are known. Historical dates and weekly completions are not.
  return awardMilestones({
    version: 1,
    xp: merged.gamesPlayed * 35 + merged.wins * 45,
    stats: merged,
    days: [],
    milestones: [],
    seals: [],
    receipts: [],
    weekly: newWeek(weekKey(now)),
    title: "new-face",
    theme: null,
  });
}
function validDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const time = Date.parse(value + "T00:00:00Z");
  return (
    Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value
  );
}
function validStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((x) => typeof x === "string") &&
    new Set(value).size === value.length
  );
}
export function hydrateMastery(raw: unknown, now = new Date()): Mastery {
  const s = raw as Mastery;
  const fail = () => {
    throw new Error(
      "Your mastery save could not be read. The original save has been kept.",
    );
  };
  if (
    !s ||
    s.version !== 1 ||
    !Number.isSafeInteger(s.xp) ||
    s.xp < 0 ||
    !s.stats ||
    !s.weekly
  )
    return fail();
  for (const key of Object.keys(EMPTY_STATS) as (keyof GameStats)[])
    if (!Number.isSafeInteger(s.stats[key]) || s.stats[key] < 0) return fail();
  for (const list of [
    s.days,
    s.milestones,
    s.seals,
    s.receipts,
    s.weekly.days,
    s.weekly.rewarded,
  ])
    if (!validStrings(list)) return fail();
  if (
    !s.days.every(validDay) ||
    !s.seals.every(validDay) ||
    !s.weekly.days.every(validDay) ||
    !validDay(s.weekly.key)
  )
    return fail();
  if (
    ![s.weekly.games, s.weekly.wins, s.weekly.burns].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    typeof s.title !== "string" ||
    !(s.theme === null || typeof s.theme === "string")
  )
    return fail();
  return rollWeek(s, now);
}
export interface RoundProgress {
  state: Mastery;
  xpGained: number;
  milestones: string[];
  quests: string[];
  seal: boolean;
  duplicate: boolean;
  beforeLevel: number;
}
export function creditRound(
  state: Mastery,
  id: string,
  result: GameResult,
  completedAt: string,
  now = new Date(),
): RoundProgress {
  if (
    !id ||
    typeof id !== "string" ||
    !Number.isFinite(Date.parse(completedAt)) ||
    typeof result.won !== "boolean" ||
    ![result.turns, result.pickups, result.burns].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    )
  )
    throw new Error("Invalid completed round. Progress has not been changed.");
  let s = rollWeek(state, now);
  const before = s.xp,
    beforeLevel = levelFor(before);
  if (s.receipts.includes(id))
    return {
      state: s,
      xpGained: 0,
      milestones: [],
      quests: [],
      seal: false,
      duplicate: true,
      beforeLevel,
    };
  const day = new Date(completedAt).toISOString().slice(0, 10);
  const st = s.stats,
    streak = result.won ? st.winStreak + 1 : 0;
  s = {
    ...s,
    receipts: [...s.receipts, id],
    days: s.days.includes(day) ? s.days : [...s.days, day],
    xp: s.xp + 35 + (result.won ? 45 : 0) + Math.min(10, result.burns) * 5,
    stats: {
      wins: st.wins + +result.won,
      losses: st.losses + +!result.won,
      gamesPlayed: st.gamesPlayed + 1,
      winStreak: streak,
      bestStreak: Math.max(st.bestStreak, streak),
      totalBurns: st.totalBurns + result.burns,
      bestWinTurns: result.won
        ? st.bestWinTurns
          ? Math.min(st.bestWinTurns, result.turns)
          : result.turns
        : st.bestWinTurns,
      comebackWins: st.comebackWins + +(result.won && result.pickups >= 3),
      cleanWins: st.cleanWins + +(result.won && result.pickups === 0),
      maxBurnsInGame: Math.max(st.maxBurnsInGame, result.burns),
    },
  };
  const quests: string[] = [];
  let seal = false;
  if (weekKey(new Date(completedAt)) === s.weekly.key) {
    s = {
      ...s,
      weekly: {
        ...s.weekly,
        games: s.weekly.games + 1,
        wins: s.weekly.wins + +result.won,
        burns: s.weekly.burns + result.burns,
        days: s.weekly.days.includes(day)
          ? s.weekly.days
          : [...s.weekly.days, day],
        rewarded: [...s.weekly.rewarded],
      },
    };
    for (const quest of questBoard(s.weekly.key))
      if (
        quest.value(s) >= quest.target &&
        !s.weekly.rewarded.includes(quest.id)
      ) {
        s.weekly.rewarded.push(quest.id);
        quests.push(quest.name);
        s.xp += 150;
      }
    if (s.weekly.rewarded.length === 4 && !s.seals.includes(s.weekly.key)) {
      s = { ...s, seals: [...s.seals, s.weekly.key], xp: s.xp + 250 };
      seal = true;
    }
  }
  const previous = s.milestones;
  s = awardMilestones(s);
  return {
    state: s,
    xpGained: s.xp - before,
    beforeLevel,
    milestones: s.milestones.filter((id) => !previous.includes(id)),
    quests,
    seal,
    duplicate: false,
  };
}
export function equipReward(
  state: Mastery,
  type: "title" | "theme",
  id: string | null,
): Mastery {
  if (type === "title") {
    const title = TITLES.find((t) => t.id === id);
    if (!title || title.level > levelFor(state.xp))
      throw new Error("Reach the required mastery level to equip this title.");
    return { ...state, title: title.id };
  }
  if (id !== null && !themeAvailable(state, id))
    throw new Error(
      "Earn the required mastery level or weekly seals to equip this table.",
    );
  return { ...state, theme: id };
}
export function nextMilestone(state: Mastery) {
  return TRACKS.flatMap((track) => {
    const index = track.goals.findIndex(
      (_, i) => !state.milestones.includes(`${track.id}-${i}`),
    );
    return index < 0
      ? []
      : [
          {
            track,
            index,
            target: track.goals[index],
            value: metricValue(state, track.id),
          },
        ];
  }).sort((a, b) => b.value / b.target - a.value / a.target)[0];
}

export function nextReward(state: Mastery): string {
  const level = levelFor(state.xp);
  const candidates = [
    ...TITLES.filter((t) => t.level > level).map((t) => ({
      name: t.name,
      level: t.level,
    })),
    ...THEMES.filter((t) => !t.seals && t.level > level).map((t) => ({
      name: t.name,
      level: t.level,
    })),
  ].sort((a, b) => a.level - b.level);
  return candidates[0]
    ? `${candidates[0].name} at level ${candidates[0].level}`
    : `Another dated seal from your next weekly board`;
}
