import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Meter, palette } from "@/components/tour/ui";
import {
  levelFor,
  levelStart,
  type Mastery,
  type RoundProgress,
} from "@/lib/mastery/model";
export const m = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#15352D",
    gap: 14,
    borderWidth: 1,
    borderColor: "#315044",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  text: { color: palette.white, fontFamily: "Inter_600SemiBold", fontSize: 18 },
  body: {
    color: "#B9CEC1",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  eyebrow: {
    color: palette.gold,
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  caption: {
    color: "#A4B9AA",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  title: {
    color: palette.white,
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    lineHeight: 36,
  },
});
export function LevelBadge({
  level,
  size = 72,
}: {
  level: number;
  size?: number;
}) {
  return (
    <LinearGradient
      colors={["#F7DB8F", "#9E722F"]}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        padding: 3,
        flexShrink: 0,
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: size / 2,
          backgroundColor: "#122B25",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="sparkles" color="#EFC778" size={size * 0.22} />
        <Text
          maxFontSizeMultiplier={1}
          style={{
            color: "#FFE6A4",
            fontFamily: "Inter_700Bold",
            fontSize: size * 0.31,
          }}
        >
          {level}
        </Text>
      </View>
    </LinearGradient>
  );
}
export function XpMeter({ state }: { state: Mastery }) {
  const level = levelFor(state.xp),
    base = levelStart(level),
    next = levelStart(level + 1);
  return (
    <View style={{ gap: 8 }}>
      <Meter value={state.xp - base} total={next - base} />
      <Text style={m.caption}>
        {(state.xp - base).toLocaleString()} / {(next - base).toLocaleString()}{" "}
        XP to level {level + 1} · {state.xp.toLocaleString()} lifetime XP
      </Text>
    </View>
  );
}
export function RoundMastery({ progress }: { progress: RoundProgress | null }) {
  if (!progress || progress.duplicate) return null;
  const level = levelFor(progress.state.xp);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        m.card,
        { width: "100%", backgroundColor: "#203D32", borderColor: "#8E7545" },
      ]}
    >
      <View style={m.row}>
        <LevelBadge level={level} size={52} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={m.eyebrow}>
            {level > progress.beforeLevel
              ? "MASTERY LEVEL UP"
              : "EVERY HAND BUILDS YOUR STORY"}
          </Text>
          <Text style={m.text}>
            +{progress.xpGained.toLocaleString()} mastery XP
          </Text>
        </View>
      </View>
      <XpMeter state={progress.state} />
      {!!progress.quests.length && (
        <Text style={m.body}>
          {progress.quests.length} weekly{" "}
          {progress.quests.length === 1 ? "quest" : "quests"} completed ·
          rewards added.
        </Text>
      )}
      {!!progress.milestones.length && (
        <Text style={m.body}>
          {progress.milestones.length} new mastery{" "}
          {progress.milestones.length === 1 ? "milestone" : "milestones"}{" "}
          earned.
        </Text>
      )}
      {progress.seal && (
        <Text style={[m.text, { color: palette.gold }]}>
          Weekly seal collected. Yours to keep.
        </Text>
      )}
    </View>
  );
}
