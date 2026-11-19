import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { loadCareer } from "@/lib/tour/storage";
import { emptyCareer, nextRival, trophyCount } from "@/lib/tour/model";
import { venueFor } from "@/lib/tour/content";
import { RivalPortrait, VenueScene } from "./Art";
import { Eyebrow, palette, ui } from "./ui";
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
  const rival = nextRival(career),
    venue = venueFor(rival),
    count = trophyCount(career);
  return <Pressable accessibilityRole="button" accessibilityLabel="Continue Palace Tour" onPress={() => router.push("/tour")} style={({
    pressed
  }) => [s.card, {
    opacity: pressed ? 0.9 : 1
  }]}>
      <View style={s.art}>
        <VenueScene venue={venue} height={100} />
        <LinearGradient colors={["transparent", "#112D26"]} style={StyleSheet.absoluteFill} />
        <View style={s.badge}>
          <Eyebrow color="#FCEDC3">A SEAT AMONG LEGENDS</Eyebrow>
        </View>
        <View style={s.portrait}>
          <RivalPortrait rival={rival} size={58} />
        </View>
      </View>
      <View style={s.body}>
        <View style={ui.row}>
          <Eyebrow>THE PALACE TOUR</Eyebrow>
          <Text style={ui.pill}>◆ {count} / 48</Text>
        </View>
        <Text style={s.title}>
          {count ? "Your next chapter." : "The Palace Tour"}
        </Text>
        <Text style={[ui.subtitle, {
        fontSize: 14,
        lineHeight: 21
      }]}>
          {career.active ? "Your unfinished series is waiting." : `${rival.name} is waiting in ${venue.name}.`}
        </Text>
        <View style={s.button}>
          <Text style={ui.actionText}>
            {career.active ? "Resume your tour" : count ? "Continue the adventure" : "Start your adventure"}
          </Text>
          <Ionicons name="arrow-forward" size={19} color={palette.bg} />
        </View>
      </View>
    </Pressable>;
}
const s = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#112D26",
    borderWidth: 1,
    borderColor: "#52704C",
    marginBottom: 0
  },
  art: {
    height: 92,
    overflow: "hidden"
  },
  badge: {
    position: "absolute",
    top: 17,
    left: 18
  },
  portrait: {
    position: "absolute",
    bottom: -7,
    right: 22,
    transform: [{
      rotate: "6deg"
    }],
    borderWidth: 2,
    borderColor: "#DDBA76",
    borderRadius: 23
  },
  body: {
    padding: 16,
    gap: 8
  },
  title: {
    color: palette.white,
    fontFamily: "Inter_700Bold",
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.8
  },
  button: {
    backgroundColor: palette.gold,
    borderRadius: 13,
    padding: 15,
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  }
});
