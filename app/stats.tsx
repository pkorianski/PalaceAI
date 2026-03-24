import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getStats, type GameStats } from "@/lib/stats";

const DEFAULT_STATS: GameStats = {
  wins: 0,
  losses: 0,
  gamesPlayed: 0,
  winStreak: 0,
  bestStreak: 0,
  totalBurns: 0,
  bestWinTurns: 0,
  comebackWins: 0,
  cleanWins: 0,
  maxBurnsInGame: 0,
};

interface StatRowProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
}

function StatRow({ icon, iconColor, label, value, sub }: StatRowProps) {
  return (
    <View style={rowStyles.container}>
      <View style={[rowStyles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.valueWrap}>
        <Text style={rowStyles.value}>{value}</Text>
        {sub ? <Text style={rowStyles.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "rgba(254,253,248,0.75)",
  },
  valueWrap: {
    alignItems: "flex-end",
    gap: 1,
  },
  value: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#FEFDF8",
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.35)",
  },
});

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);

  useFocusEffect(
    React.useCallback(() => {
      getStats().then(setStats);
    }, [])
  );

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.wins / stats.gamesPlayed) * 100)
      : 0;

  const lossRate = 100 - winRate;
  const hasPlayed = stats.gamesPlayed > 0;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? insets.top + 67 : 0 },
      ]}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Win rate ring card */}
        <View style={styles.heroCard}>
          <View style={styles.ringWrap}>
            <View style={styles.ring}>
              <Text style={styles.ringValue}>{winRate}%</Text>
              <Text style={styles.ringLabel}>Win Rate</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, styles.goldText]}>
                {stats.gamesPlayed}
              </Text>
              <Text style={styles.heroStatLabel}>Games</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, styles.greenText]}>
                {stats.wins}
              </Text>
              <Text style={styles.heroStatLabel}>Wins</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, styles.redText]}>
                {stats.losses}
              </Text>
              <Text style={styles.heroStatLabel}>Losses</Text>
            </View>
          </View>

          {/* Win/loss bar */}
          {hasPlayed && (
            <View style={styles.barWrap}>
              <View
                style={[
                  styles.barWin,
                  { flex: winRate > 0 ? winRate : 0.5 },
                ]}
              />
              <View
                style={[
                  styles.barLoss,
                  { flex: lossRate > 0 ? lossRate : 0.5 },
                ]}
              />
            </View>
          )}
        </View>

        {/* Detail rows */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.card}>
            <StatRow
              icon="flame"
              iconColor="#E67E22"
              label="Current streak"
              value={stats.winStreak > 0 ? `${stats.winStreak}` : "—"}
              sub={stats.winStreak > 0 ? "wins in a row" : undefined}
            />
            <View style={styles.divider} />
            <StatRow
              icon="trophy-outline"
              iconColor="#D4AF37"
              label="Best streak"
              value={stats.bestStreak > 0 ? `${stats.bestStreak}` : "—"}
              sub={stats.bestStreak > 0 ? "wins in a row" : undefined}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Records</Text>
          <View style={styles.card}>
            <StatRow
              icon="flash-outline"
              iconColor="#3498DB"
              label="Fastest win"
              value={stats.bestWinTurns > 0 ? `${stats.bestWinTurns}` : "—"}
              sub={stats.bestWinTurns > 0 ? "turns" : undefined}
            />
            <View style={styles.divider} />
            <StatRow
              icon="bonfire-outline"
              iconColor="#E74C3C"
              label="Total burns"
              value={stats.totalBurns > 0 ? `${stats.totalBurns}` : "—"}
              sub={
                stats.totalBurns > 0
                  ? `${(stats.totalBurns / Math.max(stats.gamesPlayed, 1)).toFixed(1)} per game`
                  : undefined
              }
            />
          </View>
        </View>

        {!hasPlayed && (
          <View style={styles.emptyState}>
            <Ionicons
              name="stats-chart-outline"
              size={40}
              color="rgba(254,253,248,0.15)"
            />
            <Text style={styles.emptyText}>
              Play your first game to start tracking stats
            </Text>
          </View>
        )}
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
    padding: 16,
    gap: 8,
  },
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.07)",
  },
  ringValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#D4AF37",
    lineHeight: 30,
  },
  ringLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "rgba(254,253,248,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  heroStat: {
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  heroStatValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  heroStatLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  goldText: { color: "#D4AF37" },
  greenText: { color: "#2ECC71" },
  redText: { color: "#E74C3C" },
  barWrap: {
    flexDirection: "row",
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    gap: 2,
  },
  barWin: {
    height: "100%",
    backgroundColor: "#2ECC71",
    borderRadius: 3,
  },
  barLoss: {
    height: "100%",
    backgroundColor: "#E74C3C",
    borderRadius: 3,
  },
  section: {
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.35)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 52,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.3)",
    textAlign: "center",
    lineHeight: 20,
  },
});
