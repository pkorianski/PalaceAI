import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/components/tour/ui";

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
      "2 — Reset: Can be played on anything. You then play again and can play any card.\n\n10 — Burn: Can be played on anything. The pile is immediately removed from play. Play again!",
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

/** One rules reference, whether opened from Home or a paused match. */
export function RulesContent() {
  return <View style={{ width: "100%", maxWidth: 620, alignSelf: "center", gap: 20 }}>
      <View style={styles.suitHeader}>
        <Text accessible={false} style={styles.suitRow}>
          ♠ ♥ ♣ ♦
        </Text>
        <Text style={styles.gameTitle}>Palace</Text>
      </View>
      {RULES.map((rule) => (
        <View key={rule.title} style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <View style={styles.ruleIconContainer}>
              <Ionicons
                name={rule.icon as any}
                size={20}
                color={palette.gold}
              />
            </View>
            <Text accessibilityRole="header" style={styles.ruleTitle}>
              {rule.title}
            </Text>
          </View>
          <Text style={styles.ruleContent}>{rule.content}</Text>
        </View>
      ))}
      <View style={styles.cardValuesSection}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Card Values
        </Text>
        <View style={styles.cardValuesGrid}>
          {[
            "2★",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10🔥",
            "J",
            "Q",
            "K",
            "A",
          ].map((rank) => (
            <View key={rank} style={styles.cardValueChip}>
              <Text style={styles.cardValueText}>{rank}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.cardValuesNote}>
          ★ = Reset (play anything next) • 🔥 = Burn pile
        </Text>
      </View>
    </View>;
}

const styles = StyleSheet.create({
  suitHeader: { alignItems: "center", gap: 8, paddingVertical: 10 },
  suitRow: { fontSize: 20, color: palette.gold, letterSpacing: 8 },
  gameTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: palette.white,
  },
  ruleCard: {
    backgroundColor: palette.panel,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 14,
  },
  ruleHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  ruleIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: `${palette.gold}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: palette.white,
  },
  ruleContent: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: palette.muted,
    lineHeight: 25,
  },
  cardValuesSection: {
    backgroundColor: palette.panel,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: palette.gold,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  cardValuesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cardValueChip: {
    backgroundColor: palette.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 36,
    alignItems: "center",
  },
  cardValueText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: palette.bg,
  },
  cardValuesNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: palette.muted,
    lineHeight: 20,
  },
});
