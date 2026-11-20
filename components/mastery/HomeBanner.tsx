import React, { useState } from "react";
import { View, Text, Pressable, AppState } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { loadMastery } from "@/lib/mastery/storage";
import { equippedTitle, levelFor, levelStart, rewardPreview, type Mastery } from "@/lib/mastery/model";
import { Meter } from "@/components/tour/ui";
import { RewardPreview } from "./RewardPreview";
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
  return <Pressable accessibilityRole="button" accessibilityLabel="Achievements and mastery" onPress={() => router.push("/achievements")} style={({
    pressed
  }) => ({
    width: "100%",
    marginBottom: 0,
    opacity: pressed ? 0.85 : 1
  })}>
      <LinearGradient colors={["#254A3B", "#142F29"]} style={[m.card, {
      borderColor: "#887341",
      gap: 10, padding: 16
    }]}>
        <View style={m.row}>
          <LevelBadge level={state ? levelFor(state.xp) : 1} size={46} />
          <View style={{
          flex: 1,
          gap: 5
        }}>
            <Text style={m.eyebrow}>PROGRESS</Text>
            <Text style={m.text}>
              {state ? equippedTitle(state) : "Achievements & rewards"}
            </Text>
            <Text style={m.caption}>
              Your collection · Weekly quests
            </Text>
          </View>
          <Ionicons name="chevron-forward" color="#EFC778" size={18} />
        </View>
        {state && <View style={{ gap: 5 }}><Meter value={state.xp - levelStart(levelFor(state.xp))} total={levelStart(levelFor(state.xp) + 1) - levelStart(levelFor(state.xp))} /><Text style={m.caption}>{(levelStart(levelFor(state.xp) + 1) - state.xp).toLocaleString()} XP to level {levelFor(state.xp) + 1}</Text></View>}
        {state && <RewardPreview reward={rewardPreview(state)} />}
        {error ? <Text style={m.body}>
            Progress couldn’t load. Open to retry; your save is kept.
          </Text> : state && <Text style={m.caption}>Weekly quests · {state.weekly.rewarded.length}/4 complete</Text>}
      </LinearGradient>
    </Pressable>;
}
