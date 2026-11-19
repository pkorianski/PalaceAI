import type { GameState } from "../palace-engine";
import { RIVALS, VENUES, TIERS, rivalById } from "./content";
export type Tier = 0 | 1 | 2;
export type CareerMode = "tour" | "circuit";
export interface Series {
  id: string;
  rivalId: string;
  tier: Tier;
  mode: CareerMode;
  week: string;
  wins: number;
  losses: number;
  roundId: string;
  game: GameState | null;
  metrics?: { turns: number; pickups: number; burns: number; completedAt?: string };
}
export interface Outcome {
  roundId: string;
  rivalId: string;
  tier: Tier;
  mode: CareerMode;
  won: boolean;
  wins: number;
  losses: number;
  complete: boolean;
  earned: boolean;
}
export interface Career {
  version: 1;
  trophies: Record<string, number>;
  equipped: string;
  active: Series | null;
  receipts: Outcome[];
  circuit: { week: string; wins: number; attempts: number };
  ribbons: Record<string, number>;
}
export function weekKey(date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export function emptyCareer(week = weekKey()): Career {
  return {
    version: 1,
    trophies: {},
    equipped: "classic",
    active: null,
    receipts: [],
    circuit: { week, wins: 0, attempts: 0 },
    ribbons: {},
  };
}
export function trophyCount(c: Career) {
  return Object.values(c.trophies).reduce((a, b) => a + b, 0);
}
export function venueMedals(c: Career, venueId: string) {
  return RIVALS.filter((r) => r.venueId === venueId).reduce(
    (sum, r) => sum + (c.trophies[r.id] || 0),
    0,
  );
}
export function venueUnlocked(c: Career, venueId: string): boolean {
  const index = VENUES.findIndex((v) => v.id === venueId);
  if (index < 0) return false;
  if (index === 0) return true;
  const previous = VENUES[index - 1];
  const boss = RIVALS.find((r) => r.venueId === previous.id && r.champion)!;
  return (
    venueUnlocked(c, previous.id) &&
    (c.trophies[boss.id] || 0) >= 1 &&
    venueMedals(c, previous.id) >= 6
  );
}
export function rivalUnlocked(c: Career, id: string): boolean {
  const r = rivalById(id);
  if (!r || !venueUnlocked(c, r.venueId)) return false;
  return (
    !r.champion ||
    RIVALS.filter((x) => x.venueId === r.venueId && !x.champion).every(
      (x) => (c.trophies[x.id] || 0) >= 1,
    )
  );
}
export function tierUnlocked(c: Career, id: string, tier: Tier) {
  return rivalUnlocked(c, id) && (c.trophies[id] || 0) >= tier;
}
export function themeUnlocked(c: Career, id: string) {
  return (
    id === "classic" ||
    RIVALS.some(
      (r) => r.venueId === id && r.champion && (c.trophies[r.id] || 0) > 0,
    )
  );
}
export function nextRival(c: Career) {
  return (
    RIVALS.find((r) => rivalUnlocked(c, r.id) && !(c.trophies[r.id] > 0)) ||
    RIVALS.find((r) => rivalUnlocked(c, r.id) && (c.trophies[r.id] || 0) < 3) ||
    RIVALS[0]
  );
}
export function circuitRival(c: Career, week = weekKey()) {
  const offset = Math.floor(Date.parse(week) / 604800000);
  const wins = c.circuit.week === week ? c.circuit.wins : 0;
  return RIVALS[(offset + wins) % RIVALS.length];
}
export function hydrateCareer(raw: unknown, week = weekKey()): Career {
  if (!raw || typeof raw !== "object" || (raw as Career).version !== 1)
    throw new Error(
      "Unrecognized Tour save. Your original save has been kept.",
    );
  const s = raw as Career;
  if (!s.trophies || !s.circuit || !Array.isArray(s.receipts))
    throw new Error(
      "Tour save could not be read. Your original save has been kept.",
    );
  const c: Career = {
    ...emptyCareer(week),
    ...s,
    trophies: {},
    ribbons: s.ribbons || {},
    receipts: s.receipts.slice(-128),
  };
  for (const r of RIVALS)
    c.trophies[r.id] = Math.max(
      0,
      Math.min(3, Math.floor(Number(s.trophies[r.id]) || 0)),
    );
  // Preserve unknown IDs so future content can be removed/re-added without losing progress.
  for (const id of Object.keys(s.trophies))
    if (!(id in c.trophies)) c.trophies[id] = s.trophies[id];
  if (!themeUnlocked(c, c.equipped)) c.equipped = "classic";
  if (c.circuit.week !== week) {
    c.circuit = { week, wins: 0, attempts: 0 };
    if (c.active?.mode === "circuit") c.active = null;
  }
  if (c.active) {
    const a = c.active;
    if (!rivalById(a.rivalId)) c.active = null;
    else if (
      !a.id ||
      !a.roundId ||
      ![0, 1, 2].includes(a.tier) ||
      !["tour", "circuit"].includes(a.mode) ||
      !Number.isInteger(a.wins) ||
      !Number.isInteger(a.losses) ||
      a.wins < 0 ||
      a.losses < 0 ||
      (a.game &&
        (!Array.isArray(a.game.players) ||
          a.game.players.length !== 2 ||
          !Array.isArray(a.game.deck) ||
          !Array.isArray(a.game.pile)))
    ) {
      throw new Error(
        "Saved series is invalid. Your original save has been kept.",
      );
    }
  }
  return c;
}
export function startSeries(
  c: Career,
  rivalId: string,
  tier: Tier,
  id: string,
  mode: CareerMode = "tour",
  week = weekKey(),
): Career {
  if (!rivalById(rivalId) || ![0, 1, 2].includes(tier))
    throw new Error("Unknown challenge.");
  if (c.active) throw new Error("Finish or abandon your current series first.");
  if (mode === "tour" && !tierUnlocked(c, rivalId, tier))
    throw new Error("This challenge is still locked.");
  if (
    mode === "circuit" &&
    (trophyCount(c) < 3 ||
      c.circuit.wins >= 18 ||
      circuitRival(c, week).id !== rivalId)
  )
    throw new Error("This circuit challenge is unavailable.");
  return {
    ...c,
    active: {
      id,
      rivalId,
      tier,
      mode,
      week,
      wins: 0,
      losses: 0,
      roundId: `${id}:0`,
      game: null,
    },
  };
}
export function finishRound(
  c: Career,
  roundId: string,
  won: boolean,
): { career: Career; outcome: Outcome } {
  const previous = c.receipts.find((r) => r.roundId === roundId);
  if (previous) return { career: c, outcome: previous };
  const s = c.active;
  if (!s || s.roundId !== roundId)
    throw new Error("This round is no longer active.");
  const target = s.mode === "circuit" ? 1 : TIERS[s.tier].target;
  const wins = s.wins + Number(won),
    losses = s.losses + Number(!won);
  const complete = wins >= target || losses >= target;
  const earned =
    complete &&
    won &&
    (s.mode === "circuit" || (c.trophies[s.rivalId] || 0) < s.tier + 1);
  const outcome: Outcome = {
    roundId,
    rivalId: s.rivalId,
    tier: s.tier,
    mode: s.mode,
    won,
    wins,
    losses,
    complete,
    earned,
  };
  const trophies = { ...c.trophies };
  if (s.mode === "tour" && earned)
    trophies[s.rivalId] = Math.max(trophies[s.rivalId] || 0, s.tier + 1);
  let circuit = { ...c.circuit },
    ribbons = { ...c.ribbons };
  if (s.mode === "circuit") {
    circuit.attempts++;
    circuit.wins = Math.min(18, circuit.wins + Number(won));
    ribbons[s.week] = Math.floor(circuit.wins / 6);
  }
  return {
    career: {
      ...c,
      trophies,
      circuit,
      ribbons,
      active: complete
        ? null
        : {
            ...s,
            wins,
            losses,
            game: null,
            roundId: `${s.id}:${wins + losses}`,
          },
      receipts: [...c.receipts.slice(-127), outcome],
    },
    outcome,
  };
}
