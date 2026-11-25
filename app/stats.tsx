import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Page } from "@/components/settings/Page";
import { palette } from "@/components/tour/ui";
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
  label: string;
  value: string;
  sub?: string;
}

function StatRow({ icon, label, value, sub }: StatRowProps) {
  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.iconWrap}>
        <Ionicons name={icon as any} size={18} color={palette.gold} />
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
    paddingVertical: 16,
    gap: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: `${palette.gold}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: palette.white,
  },
  valueWrap: { alignItems: "flex-end", gap: 3, maxWidth: "50%", flexShrink: 1 },
  value: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: palette.white,
    textAlign: "right",
  },
  sub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: palette.muted,
    lineHeight: 19,
    textAlign: "right",
  },
});

export default function StatsScreen() {
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);

  useFocusEffect(
    React.useCallback(() => {
      getStats().then(setStats);
    }, []),
  );

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.wins / stats.gamesPlayed) * 100)
      : 0;

  const lossRate = 100 - winRate;
  const hasPlayed = stats.gamesPlayed > 0;

  return (
    <Page title="Statistics">
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
              style={[styles.barWin, { flex: winRate > 0 ? winRate : 0.5 }]}
            />
            <View
              style={[styles.barLoss, { flex: lossRate > 0 ? lossRate : 0.5 }]}
            />
          </View>
        )}
      </View>

      {/* Detail rows */}
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Streaks
        </Text>
        <View style={styles.card}>
          <StatRow
            icon="flame"
            label="Current streak"
            value={stats.winStreak > 0 ? `${stats.winStreak}` : "—"}
            sub={stats.winStreak > 0 ? "wins in a row" : undefined}
          />
          <View style={styles.divider} />
          <StatRow
            icon="trophy-outline"
            label="Best streak"
            value={stats.bestStreak > 0 ? `${stats.bestStreak}` : "—"}
            sub={stats.bestStreak > 0 ? "wins in a row" : undefined}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Records
        </Text>
        <View style={styles.card}>
          <StatRow
            icon="flash-outline"
            label="Fastest win"
            value={stats.bestWinTurns > 0 ? `${stats.bestWinTurns}` : "—"}
            sub={stats.bestWinTurns > 0 ? "turns" : undefined}
          />
          <View style={styles.divider} />
          <StatRow
            icon="bonfire-outline"
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
          <Ionicons name="stats-chart-outline" size={40} color={palette.gold} />
          <Text style={styles.emptyText}>
            Play your first game to start tracking stats
          </Text>
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: palette.panel,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    gap: 20,
  },
  ringWrap: { alignItems: "center", justifyContent: "center" },
  ring: {
    minWidth: 120,
    minHeight: 120,
    padding: 16,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: palette.gold,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: `${palette.gold}0D`,
  },
  ringValue: { fontSize: 30, fontFamily: "Inter_700Bold", color: palette.gold },
  ringLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  heroStat: { alignItems: "center", gap: 6, flex: 1 },
  heroStatValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  heroStatLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: palette.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroStatDivider: { width: 1, height: 36, backgroundColor: palette.border },
  goldText: { color: palette.gold },
  greenText: { color: "#9ED9BB" },
  redText: { color: "#FFBFAC" },
  barWrap: {
    flexDirection: "row",
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    gap: 2,
  },
  barWin: { height: "100%", backgroundColor: "#9ED9BB", borderRadius: 3 },
  barLoss: { height: "100%", backgroundColor: "#FFBFAC", borderRadius: 3 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: palette.gold,
    textTransform: "uppercase",
    letterSpacing: 2,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: palette.panel,
    borderRadius: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: palette.border,
  },
  divider: { height: 1, backgroundColor: palette.border, marginLeft: 52 },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 24 },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: palette.muted,
    textAlign: "center",
    lineHeight: 23,
  },
});
