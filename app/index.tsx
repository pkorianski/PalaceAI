import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getStats, type GameStats } from "@/lib/stats";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<GameStats>({
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    winStreak: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/game");
  };

  const handleRules = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/rules");
  };

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.wins / stats.gamesPlayed) * 100)
      : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.suitRow}>
          <Text style={styles.suitSymbol}>♠</Text>
          <Text style={[styles.suitSymbol, styles.redSuit]}>♥</Text>
          <Text style={styles.suitSymbol}>♣</Text>
          <Text style={[styles.suitSymbol, styles.redSuit]}>♦</Text>
        </View>
        <Text style={styles.appName}>PALACE</Text>
        <Text style={styles.tagline}>The Card Game</Text>
      </View>

      <View style={styles.cardPreview}>
        <View style={[styles.previewCard, styles.previewCard1]}>
          <Text style={styles.previewRank}>K</Text>
          <Text style={styles.previewSuit}>♠</Text>
        </View>
        <View style={[styles.previewCard, styles.previewCard2]}>
          <Text style={[styles.previewRank, styles.red]}>A</Text>
          <Text style={[styles.previewSuit, styles.red]}>♥</Text>
        </View>
        <View style={[styles.previewCard, styles.previewCard3]}>
          <Text style={styles.previewRank}>10</Text>
          <Text style={styles.previewSuit}>♣</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.playButton,
          pressed && styles.playButtonPressed,
        ]}
        onPress={handlePlay}
      >
        <Text style={styles.playButtonText}>Play</Text>
        <Ionicons name="play" size={22} color="#0d2b1a" />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.secondaryButtonPressed,
        ]}
        onPress={handleRules}
      >
        <Ionicons name="book-outline" size={18} color="#D4AF37" />
        <Text style={styles.secondaryButtonText}>How to Play</Text>
      </Pressable>

      {stats.gamesPlayed > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Played</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.greenStat]}>{stats.wins}</Text>
              <Text style={styles.statLabel}>Won</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.redStat]}>{stats.losses}</Text>
              <Text style={styles.statLabel}>Lost</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.goldStat]}>{winRate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>
          {stats.bestStreak > 0 && (
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={14} color="#D4AF37" />
              <Text style={styles.streakText}>Best streak: {stats.bestStreak}</Text>
              {stats.winStreak > 0 && (
                <Text style={styles.activeStreak}> · Current: {stats.winStreak}</Text>
              )}
            </View>
          )}
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
        <Text style={styles.footerText}>Single Player vs AI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d2b1a",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  suitRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  suitSymbol: {
    fontSize: 20,
    color: "rgba(254, 253, 248, 0.4)",
  },
  redSuit: {
    color: "rgba(192, 57, 43, 0.5)",
  },
  appName: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    color: "#D4AF37",
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(254, 253, 248, 0.5)",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: 2,
  },
  cardPreview: {
    width: 180,
    height: 120,
    position: "relative",
    marginBottom: 32,
    marginTop: 8,
  },
  previewCard: {
    position: "absolute",
    width: 72,
    height: 100,
    backgroundColor: "#FEFDF8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8E4D8",
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  previewCard1: {
    left: 0,
    top: 10,
    transform: [{ rotate: "-15deg" }],
  },
  previewCard2: {
    left: 54,
    top: 0,
    zIndex: 2,
    transform: [{ rotate: "2deg" }],
  },
  previewCard3: {
    left: 110,
    top: 12,
    transform: [{ rotate: "18deg" }],
  },
  previewRank: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    lineHeight: 26,
  },
  previewSuit: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  red: {
    color: "#C0392B",
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4AF37",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    gap: 10,
    width: "100%",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  playButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  playButtonText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#0d2b1a",
    letterSpacing: 1,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.35)",
    width: "100%",
    marginBottom: 28,
  },
  secondaryButtonPressed: {
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#D4AF37",
  },
  statsCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
  },
  statsTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254, 253, 248, 0.45)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FEFDF8",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(254, 253, 248, 0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  greenStat: { color: "#2ECC71" },
  redStat: { color: "#E74C3C" },
  goldStat: { color: "#D4AF37" },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(254, 253, 248, 0.55)",
  },
  activeStreak: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#D4AF37",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(254, 253, 248, 0.25)",
    letterSpacing: 1,
  },
});
