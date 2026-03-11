import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Modal,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  createInitialGameState,
  confirmPalaceSetup,
  autoAISetupPalace,
  playCards,
  pickUpPile,
  getAIMove,
  getPlayerPhase,
  canPlayCards,
  getCurrentPlayer,
  type GameState,
  type Card,
} from "@/lib/palace-engine";
import { PlayingCard, EmptyCardSlot } from "@/components/PlayingCard";
import { recordWin, recordLoss } from "@/lib/stats";

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [setupSelected, setSetupSelected] = useState<string[]>([]);
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const prevMessage = useRef("");

  const human = gameState.players[0];
  const ai = gameState.players[1];
  const currentPlayer = getCurrentPlayer(gameState);
  const isHumanTurn = currentPlayer.isHuman && gameState.phase === "playing";
  const humanPhase = getPlayerPhase(human);

  useEffect(() => {
    if (gameState.message !== prevMessage.current) {
      prevMessage.current = gameState.message;
      messageOpacity.setValue(0);
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [gameState.message]);

  useEffect(() => {
    if (gameState.phase === "game_over" && !showGameOver) {
      const isWin = gameState.winner === "human";
      if (isWin) {
        recordWin();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        recordLoss();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setTimeout(() => setShowGameOver(true), 500);
    }
  }, [gameState.phase, gameState.winner]);

  useEffect(() => {
    if (gameState.phase === "choose_palace" && gameState.currentPlayerIndex === 1) {
      setTimeout(() => {
        setGameState((s) => autoAISetupPalace(s, 1));
      }, 600);
    }
  }, [gameState.phase, gameState.currentPlayerIndex]);

  useEffect(() => {
    if (
      gameState.phase === "playing" &&
      !currentPlayer.isHuman &&
      !isAIThinking
    ) {
      setIsAIThinking(true);
      const delay = 900 + Math.random() * 600;
      const timer = setTimeout(() => {
        setGameState((prevState) => {
          const aiIdx = prevState.players.findIndex((p) => !p.isHuman);
          const move = getAIMove(prevState);
          if (move.type === "play" && move.cardIds) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            return playCards(prevState, aiIdx, move.cardIds);
          } else {
            return pickUpPile(prevState, aiIdx);
          }
        });
        setIsAIThinking(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.currentPlayerIndex, isAIThinking]);

  const handleSetupToggle = (cardId: string) => {
    setSetupSelected((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      if (prev.length >= 3) return prev;
      Haptics.selectionAsync();
      return [...prev, cardId];
    });
  };

  const handleConfirmSetup = () => {
    if (setupSelected.length !== 3) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGameState((s) => confirmPalaceSetup(s, 0, setupSelected));
    setSetupSelected([]);
  };

  const [selectedPlayCards, setSelectedPlayCards] = useState<string[]>([]);

  const handleCardSelect = (cardId: string) => {
    if (!isHumanTurn) return;
    const card = human.hand.find((c) => c.id === cardId) ||
      human.faceUpPalace.find((c) => c.id === cardId);
    if (!card) return;

    setSelectedPlayCards((prev) => {
      if (prev.includes(cardId)) {
        Haptics.selectionAsync();
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length > 0) {
        const firstCard = human.hand.find((c) => c.id === prev[0]) ||
          human.faceUpPalace.find((c) => c.id === prev[0]);
        if (firstCard && firstCard.rank !== card.rank) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return [cardId];
        }
      }
      Haptics.selectionAsync();
      return [...prev, cardId];
    });
  };

  const handlePlaySelected = () => {
    if (selectedPlayCards.length === 0) return;
    const cardsToPlay = selectedPlayCards.map((id) =>
      human.hand.find((c) => c.id === id) || human.faceUpPalace.find((c) => c.id === id)
    ).filter(Boolean) as Card[];

    if (!canPlayCards(cardsToPlay, gameState.pile)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPlayCards([]);
    setGameState((s) => playCards(s, 0, selectedPlayCards));
  };

  const handlePickUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedPlayCards([]);
    setGameState((s) => pickUpPile(s, 0));
  };

  const handleFaceDownPlay = (fdIdx: number) => {
    if (!isHumanTurn) return;
    if (humanPhase !== "facedown") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGameState((s) => playCards(s, 0, [`fd-${fdIdx}`]));
  };

  const handleNewGame = () => {
    setShowGameOver(false);
    setSelectedPlayCards([]);
    setSetupSelected([]);
    setGameState(createInitialGameState());
  };

  const canPlay = selectedPlayCards.length > 0 && (() => {
    const cardsToPlay = selectedPlayCards.map((id) =>
      human.hand.find((c) => c.id === id) || human.faceUpPalace.find((c) => c.id === id)
    ).filter(Boolean) as Card[];
    return canPlayCards(cardsToPlay, gameState.pile);
  })();

  const pileTop = gameState.pile.length > 0 ? gameState.pile[gameState.pile.length - 1] : null;
  const pileCount = gameState.pile.length;

  return (
    <View style={[styles.container, {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
    }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#D4AF37" />
        </Pressable>
        <Text style={styles.topBarTitle}>Palace</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.gameArea}>
        <View style={styles.playerSection}>
          <View style={styles.playerHeader}>
            <View style={[styles.turnIndicator, !currentPlayer.isHuman && styles.turnIndicatorActive]} />
            <Text style={styles.playerName}>
              {ai.name}
              {isAIThinking ? "  ···" : ""}
            </Text>
            <Text style={styles.handCount}>{ai.hand.length} in hand</Text>
          </View>

          <View style={styles.palaceRow}>
            {ai.faceDownPalace.map((card, i) =>
              card ? (
                <PlayingCard key={`ai-fd-${i}`} faceDown small />
              ) : (
                <EmptyCardSlot key={`ai-fd-empty-${i}`} small />
              )
            )}
            <View style={styles.palaceSpacer} />
            {ai.faceUpPalace.map((card) => (
              <PlayingCard key={card.id} card={card} small />
            ))}
          </View>

          <View style={styles.aiHandRow}>
            {ai.hand.map((_, i) => (
              <PlayingCard key={`ai-hand-${i}`} faceDown micro />
            ))}
          </View>
        </View>

        <View style={styles.centerArea}>
          <Animated.View style={[styles.messageContainer, { opacity: messageOpacity }]}>
            <Text style={styles.messageText} numberOfLines={1}>
              {gameState.phase === "choose_palace"
                ? gameState.currentPlayerIndex === 0
                  ? `Select 3 cards for your palace (${setupSelected.length}/3)`
                  : "Opponent setting up..."
                : gameState.message}
            </Text>
          </Animated.View>

          <View style={styles.pilesRow}>
            <View style={styles.pileArea}>
              <Text style={styles.pileLabel}>DECK</Text>
              {gameState.deck.length > 0 ? (
                <PlayingCard faceDown />
              ) : (
                <EmptyCardSlot />
              )}
              <Text style={styles.pileCount}>{gameState.deck.length}</Text>
            </View>

            <View style={styles.pileArea}>
              <Text style={styles.pileLabel}>PILE</Text>
              {pileTop ? (
                <View>
                  {pileCount > 1 && (
                    <View style={styles.pileStack2} />
                  )}
                  {pileCount > 2 && (
                    <View style={styles.pileStack3} />
                  )}
                  <PlayingCard card={pileTop} />
                </View>
              ) : (
                <EmptyCardSlot />
              )}
              <Text style={styles.pileCount}>{pileCount > 0 ? pileCount : ""}</Text>
            </View>

            <View style={styles.pileArea}>
              <Text style={styles.pileLabel}>BURNED</Text>
              <EmptyCardSlot />
              <Text style={styles.pileCount}>{gameState.burnPile.length || ""}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            {isHumanTurn && humanPhase !== "facedown" && (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.playBtn,
                    !canPlay && styles.actionBtnDisabled,
                    pressed && canPlay && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={handlePlaySelected}
                  disabled={!canPlay}
                >
                  <Text style={[styles.actionBtnText, !canPlay && styles.actionBtnTextDisabled]}>
                    {selectedPlayCards.length > 1 ? `Play ${selectedPlayCards.length}` : "Play"}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.pickupBtn,
                    gameState.pile.length === 0 && styles.actionBtnDisabled,
                    pressed && gameState.pile.length > 0 && { opacity: 0.85 },
                  ]}
                  onPress={handlePickUp}
                  disabled={gameState.pile.length === 0}
                >
                  <Text style={[styles.actionBtnText, styles.pickupBtnText, gameState.pile.length === 0 && styles.actionBtnTextDisabled]}>
                    Pick Up
                  </Text>
                </Pressable>
              </>
            )}
            {isHumanTurn && humanPhase === "facedown" && (
              <Text style={styles.tapHint}>Tap a face-down card to flip it</Text>
            )}
            {!isHumanTurn && gameState.phase === "playing" && (
              <View style={styles.aiWaitRow}>
                <Text style={styles.aiWaitText}>Opponent thinking</Text>
                <Text style={styles.aiWaitDots}>···</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.playerSection}>
          <View style={styles.palaceRow}>
            {human.faceDownPalace.map((card, i) =>
              card ? (
                <PlayingCard
                  key={`human-fd-${i}`}
                  faceDown={humanPhase !== "facedown"}
                  card={humanPhase === "facedown" ? undefined : undefined}
                  small
                  onPress={humanPhase === "facedown" && isHumanTurn ? () => handleFaceDownPlay(i) : undefined}
                  disabled={humanPhase !== "facedown" || !isHumanTurn}
                />
              ) : (
                <EmptyCardSlot key={`human-fd-empty-${i}`} small />
              )
            )}
            <View style={styles.palaceSpacer} />
            {gameState.phase === "choose_palace" && gameState.currentPlayerIndex === 0
              ? human.faceUpPalace.map((card) => (
                  <PlayingCard key={card.id} card={card} small />
                ))
              : human.faceUpPalace.map((card) => (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    small
                    selected={humanPhase === "faceup" && selectedPlayCards.includes(card.id)}
                    onPress={humanPhase === "faceup" && isHumanTurn ? () => handleCardSelect(card.id) : undefined}
                    disabled={humanPhase !== "faceup" || !isHumanTurn}
                  />
                ))}
          </View>

          <View style={styles.playerHeader}>
            <View style={[styles.turnIndicator, currentPlayer.isHuman && gameState.phase === "playing" && styles.turnIndicatorActive]} />
            <Text style={styles.playerName}>{human.name}</Text>
            <Text style={styles.handCount}>{human.hand.length} in hand</Text>
          </View>
        </View>

        {gameState.phase === "choose_palace" && gameState.currentPlayerIndex === 0 ? (
          <View style={styles.handArea}>
            <Text style={styles.handLabel}>YOUR HAND — choose 3 for your palace</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScrollContent}>
              {human.hand.map((card) => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  selected={setupSelected.includes(card.id)}
                  onPress={() => handleSetupToggle(card.id)}
                />
              ))}
            </ScrollView>
            <Pressable
              style={({ pressed }) => [
                styles.confirmSetupBtn,
                setupSelected.length !== 3 && styles.confirmSetupBtnDisabled,
                pressed && setupSelected.length === 3 && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleConfirmSetup}
              disabled={setupSelected.length !== 3}
            >
              <Text style={styles.confirmSetupText}>Confirm Palace ({setupSelected.length}/3)</Text>
            </Pressable>
          </View>
        ) : (
          humanPhase !== "facedown" && (
            <View style={styles.handArea}>
              <Text style={styles.handLabel}>
                {humanPhase === "hand" ? "YOUR HAND" : "FACE-UP PALACE"}
              </Text>
              {humanPhase === "hand" ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScrollContent}>
                  {human.hand.map((card) => (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      selected={selectedPlayCards.includes(card.id)}
                      onPress={isHumanTurn ? () => handleCardSelect(card.id) : undefined}
                      disabled={!isHumanTurn}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.handScrollContent}>
                  <Text style={styles.faceupHint}>Tap cards above to play</Text>
                </View>
              )}
            </View>
          )
        )}
      </View>

      <Modal visible={showGameOver} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>
              {gameState.winner === "human" ? "🏆" : "💀"}
            </Text>
            <Text style={styles.modalTitle}>
              {gameState.winner === "human" ? "You Win!" : "You Lose"}
            </Text>
            <Text style={styles.modalSub}>
              {gameState.winner === "human"
                ? "Excellent play! You cleared all your cards."
                : "The AI beat you this time. Better luck next round!"}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.modalPlayAgain, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
              onPress={handleNewGame}
            >
              <Text style={styles.modalPlayAgainText}>Play Again</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modalHomeBtn, pressed && { opacity: 0.7 }]}
              onPress={() => { setShowGameOver(false); router.back(); }}
            >
              <Text style={styles.modalHomeBtnText}>Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#145229",
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
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  playerSection: {
    gap: 6,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  turnIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  turnIndicatorActive: {
    backgroundColor: "#D4AF37",
    ...Platform.select({
      ios: {
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
    }),
  },
  playerName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FEFDF8",
  },
  handCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.5)",
    marginLeft: "auto",
  },
  palaceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  palaceSpacer: {
    width: 12,
  },
  aiHandRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    paddingHorizontal: 4,
    maxHeight: 48,
    overflow: "hidden",
  },
  centerArea: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
  messageContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  messageText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(254,253,248,0.75)",
    textAlign: "center",
  },
  pilesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    alignItems: "flex-end",
  },
  pileArea: {
    alignItems: "center",
    gap: 4,
  },
  pileLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.4)",
    letterSpacing: 1.5,
  },
  pileCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(254,253,248,0.45)",
    height: 16,
  },
  pileStack2: {
    position: "absolute",
    width: 68,
    height: 96,
    borderRadius: 8,
    backgroundColor: "#FEFDF8",
    top: -3,
    left: 3,
    borderWidth: 1,
    borderColor: "#E8E4D8",
  },
  pileStack3: {
    position: "absolute",
    width: 68,
    height: 96,
    borderRadius: 8,
    backgroundColor: "#FEFDF8",
    top: -6,
    left: 6,
    borderWidth: 1,
    borderColor: "#E8E4D8",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: "center",
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    backgroundColor: "#D4AF37",
    ...Platform.select({
      ios: {
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  pickupBtn: {
    borderWidth: 1.5,
    borderColor: "rgba(254,253,248,0.3)",
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#0d2b1a",
  },
  pickupBtnText: {
    color: "#FEFDF8",
  },
  actionBtnTextDisabled: {
    color: "rgba(254,253,248,0.4)",
  },
  tapHint: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(254,253,248,0.6)",
    textAlign: "center",
  },
  aiWaitRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  aiWaitText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.5)",
  },
  aiWaitDots: {
    fontSize: 16,
    color: "#D4AF37",
    letterSpacing: 3,
  },
  handArea: {
    gap: 8,
    paddingBottom: 4,
  },
  handLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.4)",
    letterSpacing: 1.5,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  handScrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  faceupHint: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(254,253,248,0.5)",
    fontStyle: "italic",
    paddingHorizontal: 4,
  },
  confirmSetupBtn: {
    backgroundColor: "#D4AF37",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 4,
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
  confirmSetupBtnDisabled: {
    opacity: 0.4,
  },
  confirmSetupText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#0d2b1a",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#0f3320",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  modalEmoji: {
    fontSize: 56,
  },
  modalTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#D4AF37",
    textAlign: "center",
  },
  modalSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.65)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  modalPlayAgain: {
    backgroundColor: "#D4AF37",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: "100%",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  modalPlayAgainText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#0d2b1a",
  },
  modalHomeBtn: {
    paddingVertical: 12,
  },
  modalHomeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "rgba(254,253,248,0.5)",
  },
});
