import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "@/lib/haptics";
import { getStats, type GameStats } from "@/lib/stats";
import { getDailyChallenge, type ActiveDailyChallenge } from "@/lib/daily-challenge";
import { MasteryHomeBanner } from "@/components/mastery/HomeBanner";
import { TourHomeBanner } from "@/components/tour/HomeBanner";
import { palette } from "@/components/tour/ui";
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [daily, setDaily] = useState<ActiveDailyChallenge | null>(null);
  const [error, setError] = useState(false);
  useFocusEffect(React.useCallback(() => {
    let active = true;
    void Promise.all([getStats(), getDailyChallenge()]).then(([s, d]) => {
      if (active) {
        setStats(s);
        setDaily(d);
        setError(false);
      }
    }).catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, []));
  const play = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/game");
  };
  return <View style={[s.screen, {
    paddingTop: insets.top
  }]}>
    <StatusBar barStyle="light-content" />
    <View style={s.header}>
      <View><Text accessibilityRole="header" style={s.logo}>PALACE</Text><Text style={s.tagline}>Your next great hand.</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push("/settings")} style={s.icon}><Ionicons name="settings-outline" size={24} color={palette.gold} /></Pressable>
    </View>
    <ScrollView contentContainerStyle={[s.content, {
      paddingBottom: insets.bottom + 24
    }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quick Play" accessibilityHint="Start a fresh single game." onPress={play} style={({
        pressed
      }) => [s.play, {
        opacity: pressed ? 0.8 : 1
      }]}>
        <View style={{
          flex: 1
        }}><Text style={s.playTitle}>Quick Play</Text><Text style={s.playCaption}>One game. Make it yours.</Text></View><Ionicons name="play" size={25} color={palette.bg} />
      </Pressable>
      <TourHomeBanner />
      <MasteryHomeBanner />
      <View style={s.links}>
        <Pressable accessibilityRole="button" accessibilityLabel="How to Play" onPress={() => router.push("/rules")} style={s.link}><Ionicons name="book-outline" size={20} color={palette.gold} /><Text style={s.linkText}>How to Play</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Statistics" onPress={() => router.push("/stats")} style={s.link}><Ionicons name="stats-chart-outline" size={20} color={palette.gold} /><Text style={s.linkText}>Statistics</Text></Pressable>
      </View>
      {stats && stats.gamesPlayed > 0 && <Text style={s.caption}>{stats.wins.toLocaleString()} wins · {Math.round(stats.wins / stats.gamesPlayed * 100)}% win rate · Best streak {stats.bestStreak}</Text>}
      {!!error && <Text accessibilityRole="alert" style={s.caption}>Your summary couldn’t load. Open Statistics or Progress to try again.</Text>}
      {daily && <Pressable accessibilityRole="button" accessibilityLabel={`Daily challenge: ${daily.title}. ${daily.progress} of ${daily.target}${daily.completed ? ', complete' : ''}. Quick Play.`} onPress={play} style={s.daily}>
        <View style={s.row}><Ionicons name={daily.completed ? "checkmark-circle" : "sunny-outline"} size={22} color={palette.gold} /><Text style={s.linkText}>{daily.completed ? "Daily challenge complete" : "Daily challenge"}</Text><Text style={s.caption}>{daily.progress}/{daily.target}</Text></View>
        <Text style={s.dailyTitle}>{daily.title}</Text><Text style={s.caption}>{daily.desc}</Text>
      </Pressable>}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg
  },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  logo: {
    fontFamily: "Inter_700Bold",
    fontSize: 29,
    color: palette.gold,
    letterSpacing: 4
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: palette.muted,
    marginTop: 3
  },
  icon: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
    width: "100%",
    maxWidth: 620,
    alignSelf: "center"
  },
  play: {
    minHeight: 76,
    borderRadius: 18,
    backgroundColor: palette.gold,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  playTitle: {
    color: palette.bg,
    fontSize: 23,
    fontFamily: "Inter_700Bold"
  },
  playCaption: {
    color: "#344332",
    fontSize: 13,
    marginTop: 3
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  link: {
    flexGrow: 1,
    minHeight: 52,
    padding: 12,
    borderRadius: 14,
    backgroundColor: palette.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  linkText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: palette.white,
    flexShrink: 1
  },
  caption: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.muted
  },
  daily: {
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    gap: 8
  },
  dailyTitle: {
    fontSize: 18,
    color: palette.white,
    fontFamily: "Inter_600SemiBold"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  }
});
