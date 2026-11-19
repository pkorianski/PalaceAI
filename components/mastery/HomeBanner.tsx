import React, { useState } from "react";
import { View, Text, Pressable, AppState } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { loadMastery } from "@/lib/mastery/storage";
import {
  equippedTitle,
  levelFor,
  nextMilestone,
  nextReward,
  type Mastery,
} from "@/lib/mastery/model";
import { LevelBadge, XpMeter, m } from "./ui";
export function MasteryHomeBanner() {
  const [state, setState] = useState<Mastery | null>(null),
    [error, setError] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const refresh = () => {
        void loadMastery()
          .then((s) => {
            if (active) {
              setState(s);
              setError(false);
            }
          })
          .catch(() => {
            if (active) setError(true);
          });
      };
      refresh();
      const timer = setInterval(refresh, 60000);
      const sub = AppState.addEventListener("change", (s) => {
        if (s === "active") refresh();
      });
      return () => {
        active = false;
        clearInterval(timer);
        sub.remove();
      };
    }, []),
  );
  const next = state ? nextMilestone(state) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Achievements and mastery"
      onPress={() => router.push("/achievements")}
      style={({ pressed }) => ({
        width: "100%",
        marginBottom: 16,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <LinearGradient
        colors={["#254A3B", "#142F29"]}
        style={[m.card, { borderColor: "#887341", gap: 16 }]}
      >
        <View style={m.row}>
          <LevelBadge level={state ? levelFor(state.xp) : 1} size={60} />
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={m.eyebrow}>YOUR PALACE LEGACY</Text>
            <Text style={m.text}>
              {state ? equippedTitle(state) : "Your next chapter"}
            </Text>
            <Text style={m.caption}>
              Mastery, weekly quests & earned rewards
            </Text>
          </View>
          <Ionicons name="chevron-forward" color="#EFC778" size={18} />
        </View>
        {state && (
          <>
            <XpMeter state={state} />
            <Text style={[m.caption, { color: "#EFC778" }]}>
              Next reward: {nextReward(state)}
            </Text>
          </>
        )}
        {error ? (
          <Text style={m.body}>
            Progress couldn’t load. Open to retry; your save is kept.
          </Text>
        ) : (
          state && (
            <View style={{ gap: 6 }}>
              <Text style={m.body}>
                Weekly quests · {state.weekly.rewarded.length}/4 complete ·{" "}
                {state.seals.length} permanent seals
              </Text>
              {next && (
                <Text style={m.caption}>
                  Next: {next.track.name} · {next.value.toLocaleString()} /{" "}
                  {next.target.toLocaleString()} {next.track.unit}
                </Text>
              )}
            </View>
          )
        )}
      </LinearGradient>
    </Pressable>
  );
}
