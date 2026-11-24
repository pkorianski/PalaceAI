import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { loadCareer } from "@/lib/tour/storage";
import { emptyCareer, nextRival, trophyCount } from "@/lib/tour/model";
import { venueFor, rivalById, TIERS } from "@/lib/tour/content";
import { RivalPortrait, VenueScene } from "./Art";
import { palette } from "./ui";
export function TourHomeBanner() {
  const [career, set] = useState(emptyCareer());
  useFocusEffect(useCallback(() => {
    let active = true;
    loadCareer().then(c => {
      if (active) set(c);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []));
  const rival = (career.active && rivalById(career.active.rivalId)) || nextRival(career),
    venue = venueFor(rival),
    count = trophyCount(career);
  return <Pressable accessibilityRole="button" accessibilityLabel="Continue Palace Tour" onPress={() => router.push("/tour")} style={({
    pressed
  }) => [s.card, {
    opacity: pressed ? 0.9 : 1
  }]}>
      <View style={s.destination}>
        <View style={s.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <VenueScene venue={venue} height={144} />
          <LinearGradient colors={["transparent", "#112D26"]} style={StyleSheet.absoluteFill} />
          <View style={s.portrait}><RivalPortrait rival={rival} size={54} /></View>
        </View>
        <View style={s.body}>
          <Text style={s.eyebrow}>PALACE TOUR</Text>
          <Text style={s.title}>{rival.name}’s table</Text>
          <Text style={s.subtitle}>{career.active ? `${TIERS[career.active.tier].name} · ${career.active.wins}–${career.active.losses}` : venue.name}</Text>
          <View style={s.action}>
            <Text style={s.actionText}>{career.active ? "Resume Tour" : count ? "Continue Tour" : "Start Tour"}</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.white} />
          </View>
        </View>
      </View>
      <View style={s.prize}>
        <Ionicons name="trophy-outline" size={18} color={palette.gold} />
        <Text style={s.prizeText}>{count === 48 && !career.active ? "Tour mastered · Revisit any table" : career.active?.mode === "circuit" ? "Next goal: a weekly circuit win" : `Next prize: ${TIERS[career.active?.tier ?? Math.min(career.trophies[rival.id] || 0, 2)].name} trophy`}</Text>
      </View>
    </Pressable>;
}
const s = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#112D26",
    borderWidth: 1,
    borderColor: "#52704C",
    marginBottom: 0
  },
  destination: { flexDirection: "row" },
  art: { width: "30%", maxWidth: 112, minHeight: 132, overflow: "hidden" },
  portrait: {
    position: "absolute",
    bottom: 10,
    left: 12,
    borderWidth: 2,
    borderColor: "#DDBA76",
    borderRadius: 20
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 5
  },
  title: {
    color: palette.white,
    fontFamily: "Inter_700Bold",
    fontSize: 21,
    lineHeight: 26
  },
  eyebrow: { color: palette.gold, fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 1.6 },
  subtitle: { color: "#B9CEC1", fontSize: 13, lineHeight: 18 },
  action: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 7, minHeight: 32 },
  actionText: { color: palette.white, fontFamily: "Inter_600SemiBold", fontSize: 15, flexShrink: 1 },
  prize: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderColor: "#365346" },
  prizeText: { color: "#C5D7CB", fontSize: 13, lineHeight: 18, flex: 1 }
});
