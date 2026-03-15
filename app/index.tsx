import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getStats, type GameStats } from "@/lib/stats";
import {
  getUnlockedIds,
  ALL_ACHIEVEMENTS,
  type Achievement,
} from "@/lib/achievements";

const DEFAULT_STATS: GameStats = {
  wins: 0,
  losses: 0,
  gamesPlayed: 0,
  winStreak: 0,
  bestStreak: 0,
  totalBurns: 0,
  bestWinTurns: 0,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      getStats().then(setStats);
      getUnlockedIds().then(setUnlockedIds);
    }, [])
  );

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/game");
  };

  const handleRules = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/rules");
  };

  const handleAchievements = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/achievements");
  };

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.wins / stats.gamesPlayed) * 100)
      : 0;

  const unlockedCount = unlockedIds.length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  const recentAchievements: Achievement[] = ALL_ACHIEVEMENTS.filter((a) =>
    unlockedIds.includes(a.id)
  ).slice(-3).reverse();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop:
            insets.top + (Platform.OS === "web" ? 67 : 0),
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.cardSectionTitle}>Your Stats</Text>
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

            <View style={styles.statsSecondRow}>
              {stats.bestStreak > 0 && (
                <View style={styles.miniStat}>
                  <Ionicons name="flame" size={13} color="#D4AF37" />
                  <Text style={styles.miniStatText}>
                    Best streak: <Text style={styles.miniStatBold}>{stats.bestStreak}</Text>
                  </Text>
                  {stats.winStreak > 0 && (
                    <Text style={styles.miniStatBold}> · Active: {stats.winStreak}</Text>
                  )}
                </View>
              )}
              {stats.totalBurns > 0 && (
                <View style={styles.miniStat}>
                  <Ionicons name="bonfire-outline" size={13} color="#D4AF37" />
                  <Text style={styles.miniStatText}>
                    Total burns: <Text style={styles.miniStatBold}>{stats.totalBurns}</Text>
                  </Text>
                </View>
              )}
              {stats.bestWinTurns > 0 && (
                <View style={styles.miniStat}>
                  <Ionicons name="flash-outline" size={13} color="#D4AF37" />
                  <Text style={styles.miniStatText}>
                    Best win: <Text style={styles.miniStatBold}>{stats.bestWinTurns} turns</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {totalCount > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.achievementsCard,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleAchievements}
          >
            <View style={styles.achievementsHeader}>
              <Text style={styles.cardSectionTitle}>Achievements</Text>
              <View style={styles.achievementsHeaderRight}>
                <View style={styles.achievementsBadge}>
                  <Text style={styles.achievementsBadgeText}>
                    {unlockedCount}/{totalCount}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(254,253,248,0.3)" />
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(unlockedCount / totalCount) * 100}%` },
                ]}
              />
            </View>

            {recentAchievements.length > 0 ? (
              <View style={styles.recentAchievements}>
                {recentAchievements.map((a) => (
                  <View key={a.id} style={styles.achievementRow}>
                    <View style={styles.achievementIcon}>
                      <Ionicons
                        name={a.icon as any}
                        size={16}
                        color="#D4AF37"
                      />
                    </View>
                    <View style={styles.achievementText}>
                      <Text style={styles.achievementTitle}>{a.title}</Text>
                      <Text style={styles.achievementDesc}>{a.desc}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noAchievementsText}>
                Win your first game to unlock achievements
              </Text>
            )}

            {unlockedCount < totalCount && (
              <Text style={styles.moreAchievements}>
                {totalCount - unlockedCount} more to unlock
              </Text>
            )}
            {unlockedCount === totalCount && (
              <Text style={styles.allUnlocked}>All achievements unlocked!</Text>
            )}
          </Pressable>
        )}

        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
          ]}
        >
          <Text style={styles.footerText}>Single Player vs AI</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d2b1a",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
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
    marginBottom: 24,
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
    marginBottom: 16,
    gap: 12,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254, 253, 248, 0.4)",
    letterSpacing: 2,
    textTransform: "uppercase",
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
    flex: 1,
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
  statsSecondRow: {
    gap: 6,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  miniStatText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.5)",
  },
  miniStatBold: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.75)",
  },
  achievementsCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
    marginBottom: 16,
    gap: 12,
  },
  achievementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  achievementsHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  achievementsBadge: {
    backgroundColor: "rgba(212,175,55,0.15)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  achievementsBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#D4AF37",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 2,
    minWidth: 4,
  },
  recentAchievements: {
    gap: 10,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  achievementIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "rgba(212,175,55,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  achievementText: {
    flex: 1,
    gap: 1,
  },
  achievementTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#FEFDF8",
  },
  achievementDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.45)",
  },
  noAchievementsText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.35)",
    textAlign: "center",
    paddingVertical: 4,
  },
  moreAchievements: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.3)",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  allUnlocked: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#D4AF37",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  footer: {
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
