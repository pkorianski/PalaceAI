import * as NativeHaptics from "expo-haptics";
export const ImpactFeedbackStyle = NativeHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = NativeHaptics.NotificationFeedbackType;
let enabled = false; // Wait for saved settings before sending any feedback.
export function setHapticsEnabled(value: boolean) { enabled = value; }
export async function impactAsync(style?: NativeHaptics.ImpactFeedbackStyle) {
  if (enabled) await NativeHaptics.impactAsync(style).catch(() => {});
}
export async function notificationAsync(type?: NativeHaptics.NotificationFeedbackType) {
  if (enabled) await NativeHaptics.notificationAsync(type).catch(() => {});
}
export async function selectionAsync() {
  if (enabled) await NativeHaptics.selectionAsync().catch(() => {});
}
