import AsyncStorage from "@react-native-async-storage/async-storage";

const TUTORIAL_KEY = "palace_tutorial_done";

export async function hasSeenTutorial(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(TUTORIAL_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function markTutorialSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(TUTORIAL_KEY, "true");
  } catch {}
}
