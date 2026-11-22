import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useTableTheme } from "@/components/tour/ThemeProvider";
import type { Card, Suit } from "@/lib/palace-engine";
interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
  large?: boolean;
  micro?: boolean;
  disabled?: boolean;
  style?: object;
  playable?: boolean;
  accessibilityLabel?: string;
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
export function PlayingCard({
  card,
  faceDown = false,
  selected = false,
  onPress,
  small = false,
  large = false,
  micro = false,
  disabled = false,
  style,
  playable = false,
  accessibilityLabel
}: PlayingCardProps) {
  const theme = useTableTheme();
  const cardW = micro ? 28 : small ? 44 : large ? 84 : 66;
  const cardH = micro ? 40 : small ? 62 : large ? 118 : 92;
  if (!card || faceDown) {
    return <Pressable accessible={!micro} importantForAccessibility={micro ? "no-hide-descendants" : "auto"} accessibilityRole={onPress ? "button" : "image"} accessibilityLabel={accessibilityLabel ?? "Face-down card"} accessibilityState={{
      disabled: !!onPress && disabled,
      selected
    }} accessibilityHint={onPress ? "Double tap to play this unknown card." : undefined} onPress={onPress} disabled={disabled || !onPress} style={({
      pressed
    }) => [styles.card, {
      width: cardW,
      height: cardH,
      opacity: pressed && !disabled ? 0.85 : 1,
      transform: [{
        scale: pressed && !disabled ? 0.95 : 1
      }]
    }, styles.faceDown, {
      backgroundColor: theme.card,
      borderColor: theme.accent
    }, style]}>
        <View style={styles.faceDownInner}>
          {!micro && <Text maxFontSizeMultiplier={1} style={[styles.faceDownSymbol, large && { fontSize: 30 }, small && {
          fontSize: 14
        }]}>♦</Text>}
        </View>
      </Pressable>;
  }
  const red = isRed(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);
  const rank = card.rank;
  const color = red ? "#C0392B" : "#1A1A1A";
  const rankFontSize = micro ? 8 : small ? 11 : large ? 21 : 16;
  const suitFontSize = micro ? 7 : small ? 9 : large ? 15 : 12;
  const centerFontSize = micro ? 0 : small ? 16 : large ? 34 : 26;
  return <Pressable accessible accessibilityRole={onPress ? "button" : "image"} accessibilityLabel={`${({
    A: "Ace",
    K: "King",
    Q: "Queen",
    J: "Jack"
  } as Record<string, string>)[card.rank] || card.rank} of ${card.suit}`} accessibilityState={{
    disabled: !!onPress && disabled,
    selected
  }} accessibilityHint={onPress ? `${playable ? "Playable. " : ""}Double tap to select this card, then use Play.` : undefined} onPress={onPress} disabled={disabled || !onPress} style={({
    pressed
  }) => [styles.card, {
    width: cardW,
    height: cardH,
    transform: [{
      scale: pressed && !disabled ? 0.95 : 1
    }, {
      translateY: selected ? -10 : 0
    }]
  }, playable && {
    borderColor: theme.accent,
    borderWidth: 2
  }, selected && styles.selectedCard, style]}>
      <View style={[styles.cardInner, selected && styles.selectedCardInner]}>
        <View style={[styles.corner, styles.cornerTL]}>
          <Text maxFontSizeMultiplier={1} style={[styles.rankText, {
          fontSize: rankFontSize,
          color,
          lineHeight: micro ? 9 : undefined
        }]} numberOfLines={1} adjustsFontSizeToFit>
            {rank}
          </Text>
          <Text maxFontSizeMultiplier={1} style={[styles.suitCorner, {
          fontSize: suitFontSize,
          color,
          lineHeight: micro ? 8 : undefined,
          marginTop: micro ? 0 : 1
        }]}>
            {suitSymbol}
          </Text>
        </View>

        {centerFontSize > 0 && <View style={styles.centerMark} pointerEvents="none">
            <Text maxFontSizeMultiplier={1} style={[styles.centerSuit, {
          color,
          fontSize: centerFontSize
        }]}>
              {suitSymbol}
            </Text>
          </View>}

        <View style={[styles.corner, styles.cornerBR]}>
          <Text maxFontSizeMultiplier={1} style={[styles.rankText, {
          fontSize: rankFontSize,
          color,
          lineHeight: micro ? 9 : undefined,
          transform: [{
            rotate: "180deg"
          }]
        }]} numberOfLines={1} adjustsFontSizeToFit>
            {rank}
          </Text>
          <Text maxFontSizeMultiplier={1} style={[styles.suitCorner, {
          fontSize: suitFontSize,
          color,
          lineHeight: micro ? 8 : undefined,
          marginTop: micro ? 0 : 1,
          transform: [{
            rotate: "180deg"
          }]
        }]}>
            {suitSymbol}
          </Text>
        </View>
      </View>

      {playable && !selected && <View pointerEvents="none" style={{
      position: "absolute",
      right: 3,
      top: 3,
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: "#16392E"
    }}><Text maxFontSizeMultiplier={1} style={{
        color: "#FFF6E5",
        fontSize: 11
      }}>✓</Text></View>}
      {selected && <View style={styles.selectedGlow} />}
    </Pressable>;
}
export function EmptyCardSlot({
  small = false,
  micro = false,
  style
}: {
  small?: boolean;
  micro?: boolean;
  style?: object;
  playable?: boolean;
  accessibilityLabel?: string;
}) {
  const cardW = micro ? 28 : small ? 44 : 66;
  const cardH = micro ? 40 : small ? 62 : 92;
  return <View style={[styles.emptySlot, {
    width: cardW,
    height: cardH
  }, style]} />;
}
const styles = StyleSheet.create({
  card: {
    borderRadius: 7,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.28,
        shadowRadius: 3
      },
      android: {
        elevation: 4
      }
    })
  },
  cardInner: {
    flex: 1,
    backgroundColor: "#FEFDF8",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#E0DBD0",
    padding: 3,
    justifyContent: "space-between",
    overflow: "hidden"
  },
  selectedCardInner: {
    borderColor: "#D4AF37",
    borderWidth: 1.5
  },
  faceDown: {
    backgroundColor: "#164d2a",
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#D4AF37",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },
  faceDownInner: {
    alignItems: "center",
    justifyContent: "center"
  },
  faceDownSymbol: {
    fontSize: 20,
    color: "#D4AF37",
    opacity: 0.6
  },
  corner: {
    alignItems: "flex-start",
    width: "100%"
  },
  cornerTL: {
    alignItems: "flex-start"
  },
  cornerBR: {
    alignItems: "flex-end"
  },
  rankText: {
    fontWeight: "800",
    lineHeight: undefined,
    includeFontPadding: false
  },
  suitCorner: {
    lineHeight: undefined,
    includeFontPadding: false,
    marginTop: 1
  },
  centerMark: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  centerSuit: {
    textAlign: "center",
    lineHeight: undefined,
    includeFontPadding: false,
    alignSelf: "center"
  },
  selectedCard: {
    ...Platform.select({
      ios: {
        shadowColor: "#D4AF37",
        shadowOffset: {
          width: 0,
          height: 0
        },
        shadowOpacity: 0.7,
        shadowRadius: 8
      },
      android: {
        elevation: 8
      }
    })
  },
  selectedGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#D4AF37"
  },
  emptySlot: {
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.18)",
    borderStyle: "dashed"
  }
});
