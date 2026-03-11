import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import type { Card, Rank, Suit } from "@/lib/palace-engine";

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
  micro?: boolean;
  disabled?: boolean;
  style?: object;
}

function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
    case "spades":
      return "♠";
  }
}

function isRed(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

function displayRank(rank: Rank): string {
  return rank;
}

export function PlayingCard({
  card,
  faceDown = false,
  selected = false,
  onPress,
  small = false,
  micro = false,
  disabled = false,
  style,
}: PlayingCardProps) {
  const cardW = micro ? 30 : small ? 46 : 68;
  const cardH = micro ? 42 : small ? 64 : 96;
  const rankSize = micro ? 9 : small ? 12 : 18;
  const suitSize = micro ? 8 : small ? 10 : 14;

  if (!card || faceDown) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.card,
          {
            width: cardW,
            height: cardH,
            transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
          },
          styles.faceDown,
          style,
        ]}
      >
        <View style={styles.faceDownPattern}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.patternRow}>
              {Array.from({ length: 3 }).map((_, j) => (
                <Text key={j} style={[styles.patternCard, { fontSize: micro ? 6 : small ? 8 : 11 }]}>♦</Text>
              ))}
            </View>
          ))}
        </View>
      </Pressable>
    );
  }

  const red = isRed(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);
  const rank = displayRank(card.rank);
  const color = red ? "#C0392B" : "#1A1A1A";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardW,
          height: cardH,
          transform: [
            { scale: pressed && !disabled ? 0.95 : 1 },
            { translateY: selected ? -10 : 0 },
          ],
        },
        selected && styles.selectedCard,
        style,
      ]}
    >
      <View style={[styles.cardInner, { borderColor: selected ? "#D4AF37" : "#E8E4D8" }]}>
        <View style={styles.cornerTL}>
          <Text style={[styles.rankText, { fontSize: rankSize, color }]}>{rank}</Text>
          <Text style={[styles.suitSmall, { fontSize: suitSize, color }]}>{suitSymbol}</Text>
        </View>
        {!small && !micro && (
          <Text style={[styles.centerSuit, { color, fontSize: 28 }]}>{suitSymbol}</Text>
        )}
        {small && !micro && (
          <Text style={[styles.centerSuit, { color, fontSize: 16 }]}>{suitSymbol}</Text>
        )}
        <View style={styles.cornerBR}>
          <Text style={[styles.rankText, { fontSize: rankSize, color, transform: [{ rotate: "180deg" }] }]}>{rank}</Text>
          <Text style={[styles.suitSmall, { fontSize: suitSize, color, transform: [{ rotate: "180deg" }] }]}>{suitSymbol}</Text>
        </View>
      </View>
      {selected && <View style={styles.selectedGlow} />}
    </Pressable>
  );
}

export function EmptyCardSlot({ small = false, micro = false, style }: { small?: boolean; micro?: boolean; style?: object }) {
  const cardW = micro ? 30 : small ? 46 : 68;
  const cardH = micro ? 42 : small ? 64 : 96;
  return (
    <View
      style={[
        styles.emptySlot,
        { width: cardW, height: cardH },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  cardInner: {
    flex: 1,
    backgroundColor: "#FEFDF8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E4D8",
    padding: 4,
    justifyContent: "space-between",
  },
  faceDown: {
    backgroundColor: "#1a5c34",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D4AF37",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  faceDownPattern: {
    gap: 2,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  patternRow: {
    flexDirection: "row",
    gap: 2,
  },
  patternCard: {
    color: "#D4AF37",
  },
  cornerTL: {
    alignItems: "flex-start",
  },
  cornerBR: {
    alignItems: "flex-end",
  },
  rankText: {
    fontWeight: "700",
    lineHeight: 20,
  },
  suitSmall: {
    lineHeight: 14,
    marginTop: -2,
  },
  centerSuit: {
    textAlign: "center",
    lineHeight: 34,
  },
  selectedCard: {
    ...Platform.select({
      ios: {
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  selectedGlow: {
    position: "absolute",
    inset: -2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  emptySlot: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.2)",
    borderStyle: "dashed",
  },
});
