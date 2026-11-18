import AsyncStorage from "@react-native-async-storage/async-storage";
import { emptyCareer, hydrateCareer, type Career } from "./model";
import { PROGRESS_KEYS } from "../preferences-model";
const KEY = "palace_tour_v1";
let queue: Promise<unknown> = Promise.resolve();
export function careerId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
async function read(): Promise<Career> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? hydrateCareer(JSON.parse(raw)) : emptyCareer();
}
export async function loadCareer() {
  await queue.catch(() => {});
  return read();
}
export function updateCareer(
  change: (career: Career) => Career,
): Promise<Career> {
  const job = queue
    .catch(() => {})
    .then(async () => {
      const next = change(await read());
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  queue = job;
  return job;
}

export function resetPlayerProgress(): Promise<void> {
  const job = queue.catch(() => {}).then(() => AsyncStorage.multiRemove(PROGRESS_KEYS));
  queue = job;
  return job;
}
