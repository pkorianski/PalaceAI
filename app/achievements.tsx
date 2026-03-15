import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  FlatList,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ALL_ACHIEVEMENTS, getUnlockedIds, type Achievement } from "@/lib/achievements";

type AchievementItem = Achievement & { unlocked: boolean };

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      getUnlockedIds().then(setUnlockedIds);
    }, [])
  );

  const items: AchievementItem[] = ALL_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedIds.includes(a.id),
  }));

  const unlockedCount = unlockedIds.length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  const renderItem = ({ item }: { item: AchievementItem }) => (
    <View style={[styles.row, item.unlocked ? styles.rowUnlocked : styles.rowLocked]}>
      <View style={[styles.iconWrap, item.unlocked ? styles.iconUnlocked : styles.iconLocked]}>
        <Ionicons
          name={item.unlocked ? (item.icon as any) : "lock-closed"}
          size={20}
          color={item.unlocked ? "#D4AF37" : "rgba(254,253,248,0.2)"}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, !item.unlocked && styles.titleLocked]}>
          {item.title}
        </Text>
        <Text style={[styles.desc, !item.unlocked && styles.descLocked]}>
          {item.desc}
        </Text>
      </View>
      {item.unlocked && (
        <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? insets.top + 67 : 0,
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progress</Text>
          <Text style={styles.progressCount}>
            <Text style={styles.progressUnlocked}>{unlockedCount}</Text>
            <Text style={styles.progressTotal}>/{totalCount}</Text>
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : "0%" },
            ]}
          />
        </View>
        {unlockedCount === totalCount && totalCount > 0 && (
          <Text style={styles.allDoneText}>All achievements unlocked!</Text>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d2b1a",
  },
  progressCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    gap: 10,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.5)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  progressCount: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  progressUnlocked: {
    color: "#D4AF37",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  progressTotal: {
    color: "rgba(254,253,248,0.35)",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 3,
    minWidth: 6,
  },
  allDoneText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#D4AF37",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginLeft: 58,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  rowUnlocked: {
    opacity: 1,
  },
  rowLocked: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconUnlocked: {
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  iconLocked: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FEFDF8",
  },
  titleLocked: {
    color: "rgba(254,253,248,0.6)",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.5)",
  },
  descLocked: {
    color: "rgba(254,253,248,0.3)",
  },
});
