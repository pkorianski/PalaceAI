import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/components/tour/ui";
export function Page({ title, children }: React.PropsWithChildren<{ title: string }>) {
  const insets = useSafeAreaInsets();
  return <View style={[s.page, { paddingTop: insets.top }]}>
    <View style={s.navigation}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={s.back}><Ionicons name="chevron-back" color={palette.gold} size={24} /></Pressable>
      <Text accessibilityRole="header" style={s.navTitle}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 20 }}><View style={s.content}>{children}</View></ScrollView>
  </View>;
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.bg },
  navigation: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, minHeight: 56 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, textAlign: "center", color: palette.white, fontFamily: "Inter_600SemiBold", fontSize: 17 },
  content: { width: "100%", maxWidth: 620, alignSelf: "center", gap: 20 },
  hero: { gap: 10, paddingVertical: 10 },
  eyebrow: { color: palette.gold, fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 2 },
  title: { color: palette.white, fontFamily: "Inter_700Bold", fontSize: 30 },
  body: { color: "#BCCDC3", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24 },
  group: { backgroundColor: palette.panel, borderRadius: 20, overflow: "hidden" },
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { color: palette.white, fontFamily: "Inter_500Medium", fontSize: 16 },
  caption: { color: "#A4B9AA", fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  section: { gap: 10 },
  heading: { color: palette.white, fontFamily: "Inter_600SemiBold", fontSize: 20 },
  error: { color: "#FFBFAC", fontSize: 15, lineHeight: 22 },
});
