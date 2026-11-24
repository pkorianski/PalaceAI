import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/components/tour/ui";

/** Shared menu navigation. A direct entry without a previous screen returns Home. */
export function MenuHeader({ title, eyebrow, trailing }: {
  title: string;
  eyebrow?: string;
  trailing?: React.ReactNode;
}) {
  return <View testID="menu-header" style={s.header}>
    <Pressable testID="menu-back" accessibilityRole="button" accessibilityLabel="Back"
      onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
      hitSlop={8} style={({ pressed }) => [s.back, pressed && { opacity: 0.65 }]}>
      <Ionicons name="arrow-back" size={22} color={palette.white} />
    </Pressable>
    <View style={s.words}>
      {!!eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
      <Text accessibilityRole="header" style={s.title}>{title}</Text>
    </View>
    {trailing}
  </View>;
}
const s = StyleSheet.create({
  header: { backgroundColor: palette.bg, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, gap: 12 },
  back: { width: 44, height: 44, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#FFFFFF08" },
  words: { flex: 1, gap: 2 },
  title: { color: palette.white, fontFamily: "Inter_700Bold", fontSize: 25, letterSpacing: -0.8 },
  eyebrow: { color: palette.gold, fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 2 },
});
