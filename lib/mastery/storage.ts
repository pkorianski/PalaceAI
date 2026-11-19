import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMasteryRepository } from "./repository";
const repository = createMasteryRepository(AsyncStorage);
export const loadMastery = repository.load;
export const recordMasteryRound = repository.record;
export const equipMasteryReward = repository.equip;
