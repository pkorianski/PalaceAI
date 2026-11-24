import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePreferences } from "@/components/settings/PreferencesProvider";
export const palette = {
  bg: "#0B201C",
  panel: "#142F29",
  gold: "#EFC778",
  white: "#FFF6E5",
  muted: "#A4B9AA",
  border: "#29483C",
};
export function useReducedMotion() {
  const { preferences } = usePreferences();
  const [reduced, set] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) set(value); }).catch(() => {});
    const s = AccessibilityInfo.addEventListener("reduceMotionChanged", set);
    return () => { active = false; s.remove(); };
  }, []);
  return reduced || preferences.reduceMotion;
}
export function Arrival({
  children,
  style,
}: React.PropsWithChildren<{ style?: ViewStyle }>) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const a = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      useNativeDriver: Platform.OS !== "web",
    });
    a.start();
    return () => a.stop();
  }, [reduced, progress]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
export function Eyebrow({
  children,
  color = palette.gold,
}: React.PropsWithChildren<{ color?: string }>) {
  return <Text style={[ui.eyebrow, { color }]}>{children}</Text>;
}
export function Action({
  label,
  onPress,
  secondary = false,
  disabled = false,
  icon = "arrow-forward",
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.action,
        secondary && ui.secondary,
        {
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[ui.actionText, secondary && { color: palette.white }]}>
        {label}
      </Text>
      <Ionicons
        name={icon}
        size={19}
        color={secondary ? palette.gold : palette.bg}
      />
    </Pressable>
  );
}
export function Meter({
  value,
  total,
  color = palette.gold,
}: {
  value: number;
  total: number;
  color?: string;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
      style={ui.track}
    >
      <LinearGradient
        colors={[color, color]}
        style={{
          height: "100%",
          width: `${Math.min(100, (value / total) * 100)}%`,
          borderRadius: 6,
        }}
      />
    </View>
  );
}
export const ui = StyleSheet.create({
  title: {
    color: palette.white,
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 38,
  },
  subtitle: {
    color: palette.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  eyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  panel: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 22,
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  action: {
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: palette.gold,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  secondary: {
    backgroundColor: "#1D3B32",
    borderWidth: 1,
    borderColor: "#3B5C49",
  },
  actionText: { color: palette.bg, fontFamily: "Inter_700Bold", fontSize: 15 },
  track: {
    height: 6,
    borderRadius: 6,
    backgroundColor: "#FFFFFF14",
    overflow: "hidden",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFFFFF0D",
    color: palette.gold,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  error: { color: "#FFBFAC", fontSize: 14, lineHeight: 21 },
});
