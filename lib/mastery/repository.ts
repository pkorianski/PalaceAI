import type { GameResult } from "../stats";
import { playerWrite } from "../player-storage-queue";
import {
  createMastery,
  hydrateMastery,
  creditRound,
  equipReward,
  MASTERY_KEY,
  type Mastery,
} from "./model";
interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
/** Stats and mastery settle in one saved envelope; the round receipt makes retries safe. */
export function createMasteryRepository(storage: Storage) {
  async function read(
    now: Date,
  ): Promise<{ state: Mastery; original: string | null }> {
    const original = await storage.getItem(MASTERY_KEY);
    if (original !== null)
      return { state: hydrateMastery(JSON.parse(original), now), original };
    const legacy = await storage.getItem("palace_stats");
    const stats = legacy !== null ? JSON.parse(legacy) : {};
    if (!stats || typeof stats !== "object" || Array.isArray(stats))
      throw new Error(
        "Saved statistics could not be read. The original save has been kept.",
      );
    return { state: createMastery(stats, now), original };
  }
  async function save(state: Mastery, original: string | null) {
    const serialized = JSON.stringify(state);
    if (serialized !== original) await storage.setItem(MASTERY_KEY, serialized);
  }
  return {
    load(now = new Date()) {
      return playerWrite(async () => {
        const { state, original } = await read(now);
        await save(state, original);
        return state;
      });
    },
    record(
      id: string,
      result: GameResult,
      completedAt = new Date().toISOString(),
      now = new Date(),
    ) {
      return playerWrite(async () => {
        const { state, original } = await read(now);
        const summary = creditRound(state, id, result, completedAt, now);
        await save(summary.state, original);
        return summary;
      });
    },
    equip(type: "title" | "theme", id: string | null) {
      return playerWrite(async () => {
        const { state, original } = await read(new Date());
        const next = equipReward(state, type, id);
        await save(next, original);
        return next;
      });
    },
  };
}
