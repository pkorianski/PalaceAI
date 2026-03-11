import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface RuleSection {
  title: string;
  content: string;
  icon: string;
}

const RULES: RuleSection[] = [
  {
    title: "Objective",
    icon: "trophy-outline",
    content:
      "Be the first player to get rid of all your cards — including your hand, face-up palace cards, and face-down palace cards.",
  },
  {
    title: "Setup",
    icon: "layers-outline",
    content:
      "Each player receives 3 face-down palace cards (placed on the table), 3 face-up palace cards (placed on top of the face-down cards), and 6 cards in hand.\n\nBefore play begins, each player chooses 3 cards from their hand to place face-up as their palace cards.",
  },
  {
    title: "Playing the Game",
    icon: "card-outline",
    content:
      "Players take turns playing cards onto a central pile. You must play a card equal to or higher in value than the top card on the pile.\n\nYou can play multiple cards of the same rank at once.\n\nAfter playing, draw from the deck to keep at least 3 cards in hand (while the deck lasts).",
  },
  {
    title: "Can't Play?",
    icon: "arrow-down-circle-outline",
    content:
      "If you cannot play any card (or choose not to), you must pick up the entire pile into your hand and the next player starts fresh.",
  },
  {
    title: "Special Cards",
    icon: "flash-outline",
    content:
      "2 — Reset: Can be played on anything. The next player can play any card.\n\n3 — Transparent: Invisible card, the effective top card is what's beneath it.\n\n7 — Reverse: The next card played must be 7 or lower.\n\n10 — Burn: Played on anything. The pile is immediately removed from play. Play again!",
  },
  {
    title: "4 of a Kind = Burn",
    icon: "bonfire-outline",
    content:
      "If four cards of the same rank appear consecutively on top of the pile (including cards just played), the pile burns — it's removed from play and you play again!",
  },
  {
    title: "Palace Phase",
    icon: "home-outline",
    content:
      "Once your hand is empty and the deck is exhausted, you play your face-up palace cards.\n\nWhen those are gone, flip face-down palace cards one at a time — you cannot look at them before playing!\n\nIf a flipped card cannot be played, pick up the entire pile.",
  },
  {
    title: "Winning",
    icon: "star-outline",
    content:
      "The first player to successfully play all their cards (hand + face-up + face-down palace) wins the game!",
  },
];

export default function RulesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
        },
      ]}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#D4AF37" />
        </Pressable>
        <Text style={styles.topBarTitle}>How to Play</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.suitHeader}>
          <Text style={styles.suitRow}>♠ ♥ ♣ ♦</Text>
          <Text style={styles.gameTitle}>Palace</Text>
        </View>

        {RULES.map((rule, idx) => (
          <View key={idx} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <View style={styles.ruleIconContainer}>
                <Ionicons name={rule.icon as any} size={18} color="#D4AF37" />
              </View>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
            </View>
            <Text style={styles.ruleContent}>{rule.content}</Text>
          </View>
        ))}

        <View style={styles.cardValuesSection}>
          <Text style={styles.sectionTitle}>Card Values</Text>
          <View style={styles.cardValuesGrid}>
            {["2★", "3", "4", "5", "6", "7▼", "8", "9", "10🔥", "J", "Q", "K", "A"].map((r) => (
              <View key={r} style={styles.cardValueChip}>
                <Text style={styles.cardValueText}>{r}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.cardValuesNote}>
            ★ = Reset • 🔥 = Burn • ▼ = Play low or equal
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.playNowBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => {
            router.replace("/game");
          }}
        >
          <Text style={styles.playNowText}>Play Now</Text>
          <Ionicons name="play" size={18} color="#0d2b1a" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d2b1a",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#D4AF37",
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  suitHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  suitRow: {
    fontSize: 20,
    color: "rgba(212,175,55,0.5)",
    letterSpacing: 8,
    marginBottom: 4,
  },
  gameTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#D4AF37",
    letterSpacing: 4,
  },
  ruleCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.1)",
    gap: 10,
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ruleIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FEFDF8",
  },
  ruleContent: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.7)",
    lineHeight: 22,
  },
  cardValuesSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.1)",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.5)",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  cardValuesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  cardValueChip: {
    backgroundColor: "#FEFDF8",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: "center",
  },
  cardValueText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1A1A",
  },
  cardValuesNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.4)",
  },
  playNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4AF37",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  playNowText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#0d2b1a",
  },
});
