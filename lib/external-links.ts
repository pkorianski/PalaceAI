import { Linking } from "react-native";
export async function openExternal(url: string): Promise<boolean> {
  try { await Linking.openURL(url); return true; } catch { return false; }
}
