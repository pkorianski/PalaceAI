import AsyncStorage from "@react-native-async-storage/async-storage";
import { emptyCareer, hydrateCareer, type Career } from "./model";
import { PROGRESS_KEYS } from "../preferences-model";
const KEY = "palace_tour_v1";
import { playerWrite, waitForPlayerWrites } from "../player-storage-queue";
export function careerId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
async function read(): Promise<Career> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? hydrateCareer(JSON.parse(raw)) : emptyCareer();
}
export async function loadCareer() {
  await waitForPlayerWrites();
  return read();
}
export function updateCareer(
  change: (career: Career) => Career,
): Promise<Career> {
  return playerWrite(async () => {
    const next = change(await read());
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  });
}

export function resetPlayerProgress(): Promise<void> {
  return playerWrite(() => AsyncStorage.multiRemove(PROGRESS_KEYS));
}
