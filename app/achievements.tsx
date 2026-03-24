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
import {
  ACHIEVEMENT_GROUPS,
  ALL_ACHIEVEMENTS,
  getGroupProgress,
  isTierUnlocked,
  getUnlockedIds,
  type AchievementGroup,
  type AchievementTier,
} from "@/lib/achievements";
import { getStats, type GameStats } from "@/lib/stats";

const TIER_COLORS = ["#CD7F32", "#A8A9AD", "#D4AF37"];
const TIER_LABELS = ["BRONZE", "SILVER", "GOLD"];
const DEFAULT_STATS: GameStats = {
  wins: 0, losses: 0, gamesPlayed: 0, winStreak: 0,
  bestStreak: 0, totalBurns: 0, bestWinTurns: 0,
  comebackWins: 0, cleanWins: 0, maxBurnsInGame: 0,
};

function TierRow({
  tier,
  group,
  tierIndex,
  stats,
  unlockedIds,
  isNext,
}: {
  tier: AchievementTier;
  group: AchievementGroup;
  tierIndex: number;
  stats: GameStats;
  unlockedIds: string[];
  isNext: boolean;
}) {
  const unlocked = unlockedIds.includes(tier.id);
  const tierColor = TIER_COLORS[tierIndex];
  const tierLabel = TIER_LABELS[tierIndex];
  const progress = getGroupProgress(group, stats);

  let progressPct = 0;
  let progressText = "";

  if (isNext && !unlocked) {
    if (group.key === "speed") {
      progressPct = stats.bestWinTurns > 0
        ? Math.min(1, (tier.threshold / stats.bestWinTurns))
        : 0;
      progressText = stats.bestWinTurns > 0 ? `Best: ${stats.bestWinTurns} turns` : "No wins yet";
    } else {
      progressPct = Math.min(1, progress / tier.threshold);
      progressText = group.progressLabel(progress) + ` / ${tier.threshold}`;
    }
  }

  return (
    <View style={[styles.tierRow, unlocked && styles.tierRowUnlocked]}>
      <View style={[styles.tierBadge, { backgroundColor: unlocked ? tierColor + "22" : "rgba(255,255,255,0.04)" }]}>
        <Text style={[styles.tierLabel, { color: unlocked ? tierColor : "rgba(254,253,248,0.2)" }]}>
          {tierLabel}
        </Text>
      </View>

      <View style={[styles.tierIcon, { backgroundColor: unlocked ? tierColor + "18" : "rgba(255,255,255,0.04)" }]}>
        <Ionicons
          name={(unlocked ? tier.icon : "lock-closed") as any}
          size={18}
          color={unlocked ? tierColor : "rgba(254,253,248,0.15)"}
        />
      </View>

      <View style={styles.tierText}>
        <Text style={[styles.tierTitle, !unlocked && styles.tierTitleLocked]}>
          {tier.title}
        </Text>
        <Text style={[styles.tierDesc, !unlocked && styles.tierDescLocked]}>
          {tier.desc}
        </Text>
        {isNext && !unlocked && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct * 100}%`, backgroundColor: tierColor }]} />
            </View>
            <Text style={[styles.progressText, { color: tierColor }]}>{progressText}</Text>
          </View>
        )}
      </View>

      {unlocked && (
        <Ionicons name="checkmark-circle" size={20} color={tierColor} />
      )}
    </View>
  );
}

function GroupCard({ group, stats, unlockedIds }: { group: AchievementGroup; stats: GameStats; unlockedIds: string[] }) {
  const unlockedCount = group.tiers.filter((t) => unlockedIds.includes(t.id)).length;
  const nextTierIndex = unlockedCount < 3 ? unlockedCount : -1;
  const allDone = unlockedCount === 3;

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupLabel}>{group.label}</Text>
        <View style={[styles.groupBadge, allDone && styles.groupBadgeDone]}>
          <Text style={[styles.groupBadgeText, allDone && styles.groupBadgeTextDone]}>
            {unlockedCount}/3
          </Text>
        </View>
      </View>

      {group.tiers.map((tier, i) => (
        <React.Fragment key={tier.id}>
          {i > 0 && <View style={styles.tierSep} />}
          <TierRow
            tier={tier}
            group={group}
            tierIndex={i}
            stats={stats}
            unlockedIds={unlockedIds}
            isNext={i === nextTierIndex}
          />
        </React.Fragment>
      ))}
    </View>
  );
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);

  useFocusEffect(
    React.useCallback(() => {
      getUnlockedIds().then(setUnlockedIds);
      getStats().then(setStats);
    }, [])
  );

  const unlockedCount = unlockedIds.length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? insets.top + 67 : 0 }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOTAL PROGRESS</Text>
            <Text style={styles.summaryCount}>
              <Text style={styles.summaryUnlocked}>{unlockedCount}</Text>
              <Text style={styles.summaryTotal}>/{totalCount}</Text>
            </Text>
          </View>
          <View style={styles.summaryTrack}>
            <View style={[styles.summaryFill, { width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : "0%" }]} />
          </View>
          {unlockedCount === totalCount && totalCount > 0 && (
            <Text style={styles.allDoneText}>All achievements unlocked! 🏆</Text>
          )}
        </View>

        {ACHIEVEMENT_GROUPS.map((group) => (
          <GroupCard key={group.key} group={group} stats={stats} unlockedIds={unlockedIds} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d2b1a" },
  scroll: { padding: 16, gap: 12 },

  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    gap: 10,
    marginBottom: 4,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "rgba(254,253,248,0.4)", letterSpacing: 1.5, textTransform: "uppercase" },
  summaryCount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  summaryUnlocked: { color: "#D4AF37", fontSize: 22, fontFamily: "Inter_700Bold" },
  summaryTotal: { color: "rgba(254,253,248,0.35)", fontSize: 16, fontFamily: "Inter_500Medium" },
  summaryTrack: { width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" },
  summaryFill: { height: "100%", backgroundColor: "#D4AF37", borderRadius: 3, minWidth: 6 },
  allDoneText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#D4AF37", textAlign: "center" },

  groupCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  groupLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FEFDF8", letterSpacing: 0.5 },
  groupBadge: { backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  groupBadgeDone: { backgroundColor: "rgba(212,175,55,0.18)" },
  groupBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "rgba(254,253,248,0.4)" },
  groupBadgeTextDone: { color: "#D4AF37" },

  tierSep: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginLeft: 16 },
  tierRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12, opacity: 0.45 },
  tierRowUnlocked: { opacity: 1 },

  tierBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, minWidth: 52, alignItems: "center" },
  tierLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },

  tierIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  tierText: { flex: 1, gap: 2 },
  tierTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FEFDF8" },
  tierTitleLocked: { color: "rgba(254,253,248,0.5)" },
  tierDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(254,253,248,0.45)" },
  tierDescLocked: { color: "rgba(254,253,248,0.25)" },

  progressWrap: { marginTop: 6, gap: 4 },
  progressTrack: { height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressText: { fontSize: 10, fontFamily: "Inter_500Medium" },
});
