import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import type { Card, Suit } from "@/lib/palace-engine";

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
  micro?: boolean;
  disabled?: boolean;
  style?: object;
  testID?: string;
}

function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case "hearts": return "♥";
    case "diamonds": return "♦";
    case "clubs": return "♣";
    case "spades": return "♠";
  }
}

function isRed(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
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
  testID,
}: PlayingCardProps) {
  const cardW = micro ? 28 : small ? 44 : 66;
  const cardH = micro ? 40 : small ? 62 : 92;

  if (!card || faceDown) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.card,
          {
            width: cardW,
            height: cardH,
            opacity: pressed && !disabled ? 0.85 : 1,
            transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
          },
          styles.faceDown,
          style,
        ]}
      >
        <View style={styles.faceDownInner}>
          {!micro && (
            <Text style={[styles.faceDownSymbol, small && { fontSize: 14 }]}>♦</Text>
          )}
        </View>
      </Pressable>
    );
  }

  const red = isRed(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);
  const rank = card.rank;
  const color = red ? "#C0392B" : "#1A1A1A";

  const rankFontSize = micro ? 8 : small ? 11 : 16;
  const suitFontSize = micro ? 7 : small ? 9 : 12;
  const centerFontSize = micro ? 0 : small ? 16 : 26;

  return (
    <Pressable
      testID={testID}
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
      <View style={[styles.cardInner, selected && styles.selectedCardInner]}>
        <View style={[styles.corner, styles.cornerTL]}>
          <Text
            style={[styles.rankText, { fontSize: rankFontSize, color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {rank}
          </Text>
          <Text style={[styles.suitCorner, { fontSize: suitFontSize, color }]}>
            {suitSymbol}
          </Text>
        </View>

        {centerFontSize > 0 && (
          <Text style={[styles.centerSuit, { color, fontSize: centerFontSize }]}>
            {suitSymbol}
          </Text>
        )}

        <View style={[styles.corner, styles.cornerBR]}>
          <Text
            style={[
              styles.rankText,
              { fontSize: rankFontSize, color, transform: [{ rotate: "180deg" }] },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {rank}
          </Text>
          <Text
            style={[
              styles.suitCorner,
              { fontSize: suitFontSize, color, transform: [{ rotate: "180deg" }] },
            ]}
          >
            {suitSymbol}
          </Text>
        </View>
      </View>

      {selected && <View style={styles.selectedGlow} />}
    </Pressable>
  );
}

export function EmptyCardSlot({
  small = false,
  micro = false,
  style,
}: {
  small?: boolean;
  micro?: boolean;
  style?: object;
}) {
  const cardW = micro ? 28 : small ? 44 : 66;
  const cardH = micro ? 40 : small ? 62 : 92;
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
    borderRadius: 7,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.28,
        shadowRadius: 3,
      },
      android: { elevation: 4 },
    }),
  },
  cardInner: {
    flex: 1,
    backgroundColor: "#FEFDF8",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#E0DBD0",
    padding: 3,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  selectedCardInner: {
    borderColor: "#D4AF37",
    borderWidth: 1.5,
  },
  faceDown: {
    backgroundColor: "#164d2a",
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#D4AF37",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  faceDownInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  faceDownSymbol: {
    fontSize: 20,
    color: "#D4AF37",
    opacity: 0.6,
  },
  corner: {
    alignItems: "flex-start",
    width: "100%",
  },
  cornerTL: {
    alignItems: "flex-start",
  },
  cornerBR: {
    alignItems: "flex-start",
    transform: [{ rotate: "180deg" }],
  },
  rankText: {
    fontWeight: "800",
    lineHeight: 18,
  },
  suitCorner: {
    marginTop: -2,
    lineHeight: 12,
  },
  centerSuit: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "32%",
    textAlign: "center",
  },
  selectedCard: {
    zIndex: 10,
  },
  selectedGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  emptySlot: {
    borderRadius: 7,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(254,253,248,0.18)",
  },
});
