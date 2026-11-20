import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { rewardPreview } from "@/lib/mastery/model";
import { m, LevelBadge } from "./ui";
export function RewardPreview({ reward }: { reward: ReturnType<typeof rewardPreview> }) {
  if (!reward) return <Text style={m.caption}>Next keepsake: a dated seal from your weekly quests.</Text>;
  return <View style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 12, borderRadius: 14, backgroundColor: "#0B201C" }}>
    {reward.kind === "theme" ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 68, height: 52, borderRadius: 10, backgroundColor: reward.table, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 3 }}>
      {[0, 1, 2].map(i => <View key={i} style={{ width: 16, height: 29, borderRadius: 3, borderWidth: 1, borderColor: reward.accent, backgroundColor: reward.card, transform: [{ rotate: `${(i - 1) * 9}deg` }], alignItems: "center", justifyContent: "center" }}><Text style={{ color: reward.accent }}>◆</Text></View>)}
    </View> : <LevelBadge level={reward.level} size={48} />}
    <View style={{ flex: 1, gap: 3 }}><Text style={m.eyebrow}>NEXT TO EARN</Text><Text style={m.text}>{reward.name}</Text><Text style={m.caption}>{reward.kind === "theme" ? "Table style" : "Player title"} · Level {reward.level}</Text></View>
    <Ionicons name="chevron-forward" color="#EFC778" size={16} />
  </View>;
}
