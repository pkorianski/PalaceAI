export const PREFERENCES_KEY = "palace_preferences_v1";
export interface Preferences { version: 1; haptics: boolean; reduceMotion: boolean }
export const DEFAULT_PREFERENCES: Preferences = { version: 1, haptics: true, reduceMotion: false };
export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return { ...DEFAULT_PREFERENCES };
  const value = JSON.parse(raw);
  if (value?.version !== 1 || typeof value.haptics !== "boolean" || typeof value.reduceMotion !== "boolean")
    throw new Error("Your settings could not be read. The original settings have been kept.");
  return { version: 1, haptics: value.haptics, reduceMotion: value.reduceMotion };
}
// Only game progress is reset. Preferences and unrelated storage are preserved.
export const PROGRESS_KEYS = ["palace_stats", "palace_achievements", "palace_daily_challenge", "palace_tutorial_done", "palace_tour_v1", "palace_mastery_v1"];
