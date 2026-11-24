import React, { useState } from "react";
import { View, Text, Pressable, AppState } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { loadMastery } from "@/lib/mastery/storage";
import { levelFor, levelStart, rewardPreview, type Mastery } from "@/lib/mastery/model";
import { Meter } from "@/components/tour/ui";
import { LevelBadge, m } from "./ui";
export function MasteryHomeBanner() {
  const [state, setState] = useState<Mastery | null>(null),
    [error, setError] = useState(false);
  useFocusEffect(React.useCallback(() => {
    let active = true;
    const refresh = () => {
      void loadMastery().then(s => {
        if (active) {
          setState(s);
          setError(false);
        }
      }).catch(() => {
        if (active) setError(true);
      });
    };
    refresh();
    const timer = setInterval(refresh, 60000);
    const sub = AppState.addEventListener("change", s => {
      if (s === "active") refresh();
    });
    return () => {
      active = false;
      clearInterval(timer);
      sub.remove();
    };
  }, []));
  const level = state ? levelFor(state.xp) : 1;
  const reward = state ? rewardPreview(state) : null;
  return <Pressable accessibilityRole="button" accessibilityLabel="Achievements and mastery"
    accessibilityHint={error ? "Progress could not load. Open to retry; your save is kept." : state ? `Level ${level}. ${(levelStart(level + 1) - state.xp).toLocaleString()} XP to the next level. Collection and weekly quests.` : "Open your collection and weekly quests."}
    onPress={() => router.push("/achievements")}
    style={({ pressed }) => ({ width: "100%", opacity: pressed ? 0.85 : 1 })}>
    <LinearGradient colors={["#17372D", "#112A23"]} style={{ borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <LevelBadge level={level} size={44} />
      <View style={{ flex: 1, gap: 7 }}>
        <Text style={m.text}>Your progress</Text>
        {state && <Meter value={state.xp - levelStart(level)} total={levelStart(level + 1) - levelStart(level)} />}
        <Text style={[m.caption, { fontSize: 13 }]}>{error ? "Couldn’t load · Tap to retry" : !state ? "Loading your collection…" : reward ? `Next: ${reward.name}${reward.kind === "theme" ? " table" : " title"}` : "Next: a weekly keepsake"}</Text>
      </View>
      {reward?.kind === "theme" && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 30, height: 36, borderRadius: 6, backgroundColor: reward.table, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: reward.accent }}><View style={{ width: 15, height: 23, borderRadius: 3, backgroundColor: reward.card, borderWidth: 1, borderColor: reward.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ color: reward.accent, fontSize: 10 }}>◆</Text></View></View>}
      <Ionicons name="chevron-forward" color="#EFC778" size={18} />
    </LinearGradient>
  </Pressable>;
}
