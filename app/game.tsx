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
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { recordGameResult, type GameResult } from "@/lib/stats";
import {
  checkAndUnlockAchievements,
  type Achievement,
} from "@/lib/achievements";
import { updateDailyChallenge } from "@/lib/daily-challenge";

const TUTORIAL_KEY = "palace_tutorial_done";

const TUTORIAL_STEPS = [
  {
    step: "1 of 3",
    icon: "hand-left-outline" as const,
    title: "Choose Your Palace",
    body: "Tap 3 cards from your hand below. Pick your strongest — they become your face-up backup cards.",
  },
  {
    step: "2 of 3",
    icon: "checkmark-circle-outline" as const,
    title: "Lock Them In",
    body: "Great picks! Now tap 'Confirm Palace' to place your 3 cards face-up on the board.",
  },
  {
    step: "3 of 3",
    icon: "play-circle-outline" as const,
    title: "Your Turn!",
    body: "Tap a card in your hand to select it, then tap Play. You must match or beat the top card on the pile.",
  },
];

const RULES = [
  {
    title: "Objective",
    icon: "trophy-outline",
    content: "Be the first player to get rid of all your cards — hand, face-up palace, and face-down palace.",
  },
  {
    title: "Playing the Game",
    icon: "card-outline",
    content: "Play cards equal to or higher than the top pile card. You can play multiple cards of the same rank at once.\n\nAfter playing, draw to keep at least 3 cards in hand while the deck lasts.",
  },
  {
    title: "Can't Play?",
    icon: "arrow-down-circle-outline",
    content: "If you cannot (or choose not to) play, pick up the entire pile. The next player starts fresh.",
  },
  {
    title: "Special Cards",
    icon: "flash-outline",
    content: "2 — Reset: Play on anything, then play again with any card.\n\n10 — Burn: Play on anything, pile is removed. Play again!",
  },
  {
    title: "4 of a Kind = Burn",
    icon: "bonfire-outline",
    content: "If four cards of the same rank appear consecutively on top of the pile, it burns and you play again!",
  },
  {
    title: "Palace Phase",
    icon: "home-outline",
    content: "Once your hand is empty and the deck is gone, play face-up palace cards, then flip face-down cards one at a time — you can't look before playing!",
  },
];

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const [setupSelected, setSetupSelected] = useState<string[]>([]);
  const [gameOverData, setGameOverData] = useState<{
    result: GameResult;
    newAchievements: Achievement[];
    dailyChallengeCompleted: boolean;
  } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const prevMessage = useRef("");
  const humanTurnsRef = useRef(0);
  const humanPickupsRef = useRef(0);
  const burnsRef = useRef(0);
  const prevBurnPileLen = useRef(0);
  const human = gameState.players[0];
  const ai = gameState.players[1];
  const currentPlayer = getCurrentPlayer(gameState);
  const isHumanTurn = currentPlayer.isHuman && gameState.phase === "playing";
  const humanPhase = getPlayerPhase(human);

  const isTutStep0Visible =
    showTutorial && tutorialStep === 0 &&
    setupSelected.length < 3 &&
    gameState.phase === "choose_palace" &&
    gameState.currentPlayerIndex === 0;

  const isTutStep1Visible =
    showTutorial && tutorialStep === 1 &&
    setupSelected.length === 3 &&
    gameState.phase === "choose_palace" &&
    gameState.currentPlayerIndex === 0;

  const isTutStep2Visible = showTutorial && tutorialStep === 2 && isHumanTurn;

  const anyTutVisible = isTutStep0Visible || isTutStep1Visible || isTutStep2Visible;

  useEffect(() => {
    if (gameState.message !== prevMessage.current) {
      prevMessage.current = gameState.message;
      messageOpacity.setValue(0);
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
  }, [gameState.message]);

  useEffect(() => {
    if (gameState.burnPile.length > prevBurnPileLen.current) {
      burnsRef.current++;
      prevBurnPileLen.current = gameState.burnPile.length;
    }
  }, [gameState.burnPile.length]);

  // Tutorial: check on mount whether to show first-game walkthrough
  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_KEY).then((val) => {
      if (!val) {
        setShowTutorial(true);
        AsyncStorage.setItem(TUTORIAL_KEY, "true");
      }
    });
  }, []);

  // Tutorial: auto-advance step 0 → 1 when 3 palace cards are selected
  useEffect(() => {
    if (showTutorial && tutorialStep === 0 && setupSelected.length === 3) {
      setTutorialStep(1);
    }
  }, [showTutorial, tutorialStep, setupSelected.length]);

  // Tutorial: advance to step 2 when playing phase starts and it's human's turn
  useEffect(() => {
    if (showTutorial && tutorialStep <= 1 && gameState.phase === "playing" && isHumanTurn) {
      setTutorialStep(2);
    }
  }, [showTutorial, tutorialStep, gameState.phase, isHumanTurn]);

  useEffect(() => {
    if (gameState.phase === "game_over" && !showGameOver) {
      const isWin = gameState.winner === "human";
      const result: GameResult = {
        won: isWin,
        turns: humanTurnsRef.current,
        pickups: humanPickupsRef.current,
        burns: burnsRef.current,
      };
      if (isWin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      recordGameResult(result).then((updatedStats) =>
        Promise.all([
          checkAndUnlockAchievements(updatedStats, result),
          updateDailyChallenge(result),
        ]).then(([newAchievements, { justCompleted }]) => {
          setGameOverData({ result, newAchievements, dailyChallengeCompleted: justCompleted });
          setTimeout(() => setShowGameOver(true), 500);
        })
      );
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
    if (gameState.phase !== "playing") return;
    const curr = gameState.players[gameState.currentPlayerIndex];
    if (curr.isHuman) return;

    const delay = 800 + Math.random() * 500;
    const timer = setTimeout(() => {
      setGameState((prevState) => {
        const c = prevState.players[prevState.currentPlayerIndex];
        if (c.isHuman || prevState.phase !== "playing") return prevState;
        const aiIdx = prevState.players.findIndex((p) => !p.isHuman);
        const move = getAIMove(prevState);
        if (move.type === "play" && move.cardIds) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return playCards(prevState, aiIdx, move.cardIds);
        } else {
          return pickUpPile(prevState, aiIdx);
        }
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [gameState]);

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
    humanTurnsRef.current++;
    setSelectedPlayCards([]);
    setGameState((s) => playCards(s, 0, selectedPlayCards));
  };

  const handlePickUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    humanPickupsRef.current++;
    setSelectedPlayCards([]);
    setGameState((s) => pickUpPile(s, 0));
  };

  const handleFaceDownPlay = (fdIdx: number) => {
    if (!isHumanTurn) return;
    if (humanPhase !== "facedown") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    humanTurnsRef.current++;
    setGameState((s) => playCards(s, 0, [`fd-${fdIdx}`]));
  };

  const handleNewGame = () => {
    setShowGameOver(false);
    setSelectedPlayCards([]);
    setSetupSelected([]);
    setGameOverData(null);
    setShowTutorial(false);
    setTutorialStep(0);
    humanTurnsRef.current = 0;
    humanPickupsRef.current = 0;
    burnsRef.current = 0;
    prevBurnPileLen.current = 0;
    setGameState(createInitialGameState());
  };

  const handleDismissTutStep = useCallback(() => {
    if (tutorialStep >= 2) {
      setShowTutorial(false);
    } else {
      setTutorialStep((prev) => prev + 1);
    }
  }, [tutorialStep]);

  const isGameActive =
    gameState.phase !== "setup" &&
    gameState.phase !== "choose_palace" &&
    gameState.phase !== "game_over";

  useEffect(() => {
    if (!isGameActive) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setShowLeaveModal(true);
      return true;
    });
    return () => sub.remove();
  }, [isGameActive]);

  const handleConfirmLeave = useCallback(() => {
    setShowLeaveModal(false);
    router.back();
  }, []);

  const handleQuitFromMenu = useCallback(() => {
    setShowMenuSheet(false);
    setTimeout(() => setShowLeaveModal(true), 150);
  }, []);

  const handleRulesFromMenu = useCallback(() => {
    setShowMenuSheet(false);
    setTimeout(() => setShowRulesOverlay(true), 150);
  }, []);

  const handleCancelLeave = useCallback(() => {
    setShowLeaveModal(false);
  }, []);

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
        <View style={styles.backBtn} />
        <Text style={styles.topBarTitle}>Palace</Text>
        <Pressable
          onPress={() => setShowMenuSheet(true)}
          style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#D4AF37" />
        </Pressable>
      </View>

      <View style={styles.gameArea}>
        <View style={styles.opponentPanel}>
          <View style={styles.playerHeader}>
            <View style={[styles.turnIndicator, !currentPlayer.isHuman && styles.turnIndicatorActive]} />
            <Text style={styles.playerName}>
              {ai.name}
              {!currentPlayer.isHuman && gameState.phase === "playing" ? "  ···" : ""}
            </Text>
            <Text style={styles.handCount}>{ai.hand.length} in hand</Text>
          </View>

          <View style={styles.aiFanRow}>
            {ai.hand.length === 0 ? (
              <Text style={styles.aiEmptyHand}>No cards in hand</Text>
            ) : (
              ai.hand.slice(0, 9).map((_, i) => (
                <PlayingCard
                  key={`ai-fan-${i}`}
                  faceDown
                  micro
                  style={{ marginLeft: i === 0 ? 0 : -10 }}
                />
              ))
            )}
          </View>

          <View style={styles.palaceRowLabeled}>
            <View style={styles.palaceGroup}>
              <View style={styles.palaceGroupCards}>
                {ai.faceDownPalace.map((card, i) =>
                  card ? (
                    <PlayingCard key={`ai-fd-${i}`} faceDown small />
                  ) : (
                    <EmptyCardSlot key={`ai-fd-empty-${i}`} small />
                  )
                )}
              </View>
              <Text style={styles.palaceGroupLabel}>FACE DOWN</Text>
            </View>
            <View style={styles.palaceSpacer} />
            <View style={styles.palaceGroup}>
              <View style={styles.palaceGroupCards}>
                {ai.faceUpPalace.length > 0
                  ? ai.faceUpPalace.map((card) => (
                      <PlayingCard key={card.id} card={card} small />
                    ))
                  : [0, 1, 2].map((i) => (
                      <EmptyCardSlot key={`ai-fu-empty-${i}`} small />
                    ))}
              </View>
              <Text style={styles.palaceGroupLabel}>FACE UP</Text>
            </View>
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
          <View style={styles.playerHeader}>
            <View style={[styles.turnIndicator, currentPlayer.isHuman && gameState.phase === "playing" && styles.turnIndicatorActive]} />
            <Text style={styles.playerName}>{human.name}</Text>
            <Text style={styles.handCount}>{human.hand.length} in hand</Text>
          </View>

          <View style={styles.palaceRowLabeled}>
            <View style={styles.palaceGroup}>
              <View style={styles.palaceGroupCards}>
                {human.faceDownPalace.map((card, i) =>
                  card ? (
                    <PlayingCard
                      key={`human-fd-${i}`}
                      faceDown={humanPhase !== "facedown"}
                      small
                      onPress={humanPhase === "facedown" && isHumanTurn ? () => handleFaceDownPlay(i) : undefined}
                      disabled={humanPhase !== "facedown" || !isHumanTurn}
                    />
                  ) : (
                    <EmptyCardSlot key={`human-fd-empty-${i}`} small />
                  )
                )}
              </View>
              <Text style={styles.palaceGroupLabel}>FACE DOWN</Text>
            </View>
            <View style={styles.palaceSpacer} />
            <View style={styles.palaceGroup}>
              <View style={styles.palaceGroupCards}>
                {gameState.phase === "choose_palace" && gameState.currentPlayerIndex === 0
                  ? [
                      ...human.faceUpPalace.map((card) => (
                        <PlayingCard key={card.id} card={card} small />
                      )),
                      ...[...Array(3 - human.faceUpPalace.length)].map((_, i) => (
                        <EmptyCardSlot key={`human-fu-empty-${i}`} small />
                      )),
                    ]
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
              <Text style={styles.palaceGroupLabel}>FACE UP</Text>
            </View>
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
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
              bounces={false}
            >
              <Text style={styles.modalEmoji}>
                {gameState.winner === "human" ? "🏆" : "💀"}
              </Text>
              <Text style={styles.modalTitle}>
                {gameState.winner === "human" ? "You Win!" : "You Lose"}
              </Text>

              {gameOverData && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>GAME SUMMARY</Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{gameOverData.result.turns}</Text>
                      <Text style={styles.summaryItemLabel}>Turns</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, gameOverData.result.pickups > 0 && styles.summaryWarn]}>
                        {gameOverData.result.pickups}
                      </Text>
                      <Text style={styles.summaryItemLabel}>Pickups</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, gameOverData.result.burns > 0 && styles.summaryGold]}>
                        {gameOverData.result.burns}
                      </Text>
                      <Text style={styles.summaryItemLabel}>Burns</Text>
                    </View>
                  </View>
                </View>
              )}

              {gameOverData?.dailyChallengeCompleted && (
                <View style={styles.dailyCompleteBox}>
                  <Ionicons name="sunny" size={18} color="#D4AF37" />
                  <Text style={styles.dailyCompleteText}>Daily Challenge Complete!</Text>
                </View>
              )}

              {gameOverData && gameOverData.newAchievements.length > 0 && (
                <View style={styles.achievementsBox}>
                  <Text style={styles.achievementsLabel}>
                    {gameOverData.newAchievements.length === 1
                      ? "ACHIEVEMENT UNLOCKED"
                      : `${gameOverData.newAchievements.length} ACHIEVEMENTS UNLOCKED`}
                  </Text>
                  {gameOverData.newAchievements.map((a) => (
                    <View key={a.id} style={styles.achievementRow}>
                      <View style={styles.achievementIcon}>
                        <Ionicons name={a.icon as any} size={18} color="#D4AF37" />
                      </View>
                      <View style={styles.achievementText}>
                        <Text style={styles.achievementTitle}>{a.title}</Text>
                        <Text style={styles.achievementDesc}>{a.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Menu action sheet ── */}
      <Modal visible={showMenuSheet} transparent animationType="slide">
        <Pressable style={styles.sheetOverlay} onPress={() => setShowMenuSheet(false)}>
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Pressable
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              onPress={handleRulesFromMenu}
            >
              <View style={styles.sheetRowIcon}>
                <Ionicons name="book-outline" size={20} color="#D4AF37" />
              </View>
              <Text style={styles.sheetRowText}>How to Play</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(254,253,248,0.3)" />
            </Pressable>
            <View style={styles.sheetDivider} />
            <Pressable
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              onPress={handleQuitFromMenu}
            >
              <View style={[styles.sheetRowIcon, styles.sheetRowIconRed]}>
                <Ionicons name="exit-outline" size={20} color="#E74C3C" />
              </View>
              <Text style={[styles.sheetRowText, styles.sheetRowTextRed]}>Quit Game</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.sheetCancelBtn, pressed && { opacity: 0.7 }]}
              onPress={() => setShowMenuSheet(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── In-game rules overlay ── */}
      <Modal visible={showRulesOverlay} animationType="slide">
        <View style={[styles.rulesContainer, {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
        }]}>
          <View style={styles.rulesTopBar}>
            <Text style={styles.rulesTopBarTitle}>How to Play</Text>
            <Pressable
              onPress={() => setShowRulesOverlay(false)}
              style={({ pressed }) => [styles.rulesCloseBtn, pressed && { opacity: 0.6 }]}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color="#D4AF37" />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.rulesScrollContent}
          >
            {RULES.map((rule, idx) => (
              <View key={idx} style={styles.rulesCard}>
                <View style={styles.rulesCardHeader}>
                  <View style={styles.rulesCardIcon}>
                    <Ionicons name={rule.icon as any} size={18} color="#D4AF37" />
                  </View>
                  <Text style={styles.rulesCardTitle}>{rule.title}</Text>
                </View>
                <Text style={styles.rulesCardBody}>{rule.content}</Text>
              </View>
            ))}
            <View style={styles.rulesChipSection}>
              <Text style={styles.rulesChipLabel}>Card Values (low → high)</Text>
              <View style={styles.rulesChipRow}>
                {["2★", "3", "4", "5", "6", "7", "8", "9", "10🔥", "J", "Q", "K", "A"].map((r) => (
                  <View key={r} style={styles.rulesChip}>
                    <Text style={styles.rulesChipText}>{r}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.rulesChipNote}>★ = Reset • 🔥 = Burn pile</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Leave confirmation ── */}
      <Modal visible={showLeaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.leaveCard}>
            <View style={styles.leaveIconWrap}>
              <Ionicons name="exit-outline" size={28} color="#E74C3C" />
            </View>
            <Text style={styles.leaveTitle}>Leave Game?</Text>
            <Text style={styles.leaveSub}>
              Your current game progress will be lost.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.leaveConfirmBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleConfirmLeave}
            >
              <Text style={styles.leaveConfirmText}>Leave</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.leaveKeepBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleCancelLeave}
            >
              <Text style={styles.leaveKeepText}>Keep Playing</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── First-game tutorial overlay ── */}
      {anyTutVisible && (
        <View
          style={[
            styles.tutorialOverlay,
            {
              paddingBottom:
                insets.bottom + (Platform.OS === "web" ? 34 : 0) + 200,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.tutorialCard}>
            <View style={styles.tutorialTopRow}>
              <View style={styles.tutorialStepPill}>
                <Text style={styles.tutorialStepPillText}>
                  {TUTORIAL_STEPS[tutorialStep].step}
                </Text>
              </View>
              <Ionicons name="school-outline" size={14} color="rgba(212,175,55,0.45)" />
            </View>

            <View style={styles.tutorialHeaderRow}>
              <View style={styles.tutorialIconCircle}>
                <Ionicons
                  name={TUTORIAL_STEPS[tutorialStep].icon}
                  size={20}
                  color="#D4AF37"
                />
              </View>
              <Text style={styles.tutorialTitle}>
                {TUTORIAL_STEPS[tutorialStep].title}
              </Text>
            </View>

            <Text style={styles.tutorialBody}>
              {TUTORIAL_STEPS[tutorialStep].body}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.tutorialBtn,
                pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
              ]}
              onPress={handleDismissTutStep}
            >
              <Text style={styles.tutorialBtnText}>
                {tutorialStep >= 2 ? "Got it!" : "Got it  →"}
              </Text>
            </Pressable>
          </View>

          {/* Arrow pointing down toward the hand area */}
          <View style={styles.tutorialArrowWrap} pointerEvents="none">
            <Ionicons name="chevron-down" size={22} color="#D4AF37" />
          </View>
        </View>
      )}
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
  opponentPanel: {
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    borderRadius: 14,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.12)",
  },
  aiFanRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
    height: 42,
  },
  aiEmptyHand: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.3)",
    fontStyle: "italic",
  },
  palaceRowLabeled: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 2,
  },
  palaceGroup: {
    alignItems: "center",
    gap: 5,
  },
  palaceGroupCards: {
    flexDirection: "row",
    gap: 5,
  },
  palaceGroupLabel: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.3)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
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
    width: "100%",
    maxWidth: 340,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    overflow: "hidden",
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
  modalScroll: {
    alignItems: "center",
    padding: 28,
    gap: 16,
  },
  modalEmoji: {
    fontSize: 52,
  },
  modalTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#D4AF37",
    textAlign: "center",
  },
  summaryBox: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  summaryLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.4)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FEFDF8",
  },
  summaryItemLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  summaryWarn: {
    color: "#E74C3C",
  },
  summaryGold: {
    color: "#D4AF37",
  },
  dailyCompleteBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(212,175,55,0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  dailyCompleteText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#D4AF37",
    letterSpacing: 0.3,
  },
  achievementsBox: {
    width: "100%",
    backgroundColor: "rgba(212,175,55,0.07)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
  },
  achievementsLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "#D4AF37",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 2,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  achievementIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  achievementText: {
    flex: 1,
    gap: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FEFDF8",
  },
  achievementDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.5)",
  },
  modalPlayAgain: {
    backgroundColor: "#D4AF37",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: "100%",
    alignItems: "center",
    marginTop: 4,
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
    paddingVertical: 10,
  },
  modalHomeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "rgba(254,253,248,0.5)",
  },
  leaveCard: {
    backgroundColor: "#0f3320",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(231,76,60,0.2)",
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
  leaveIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(231,76,60,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  leaveTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FEFDF8",
    textAlign: "center",
  },
  leaveSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.5)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  leaveConfirmBtn: {
    backgroundColor: "#E74C3C",
    borderRadius: 13,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
  },
  leaveConfirmText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FEFDF8",
  },
  leaveKeepBtn: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 13,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  leaveKeepText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#D4AF37",
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#0f3320",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    gap: 4,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 14,
    borderRadius: 12,
  },
  sheetRowPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sheetRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRowIconRed: {
    backgroundColor: "rgba(231,76,60,0.1)",
  },
  sheetRowText: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    color: "#FEFDF8",
  },
  sheetRowTextRed: {
    color: "#E74C3C",
  },
  sheetDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginLeft: 58,
  },
  sheetCancelBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  sheetCancelText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.45)",
  },
  rulesContainer: {
    flex: 1,
    backgroundColor: "#0d2b1a",
  },
  rulesTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212,175,55,0.1)",
  },
  rulesTopBarTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#D4AF37",
    letterSpacing: 0.5,
  },
  rulesCloseBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rulesScrollContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  rulesCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.1)",
    gap: 10,
  },
  rulesCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rulesCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  rulesCardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FEFDF8",
  },
  rulesCardBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.7)",
    lineHeight: 22,
  },
  rulesChipSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.1)",
    gap: 10,
  },
  rulesChipLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(254,253,248,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  rulesChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  rulesChip: {
    backgroundColor: "#FEFDF8",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: "center",
  },
  rulesChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1A1A",
  },
  rulesChipNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.4)",
  },
  tutorialOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 16,
    justifyContent: "flex-end",
  },
  tutorialCard: {
    backgroundColor: "#0d2b1a",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    padding: 18,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tutorialTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tutorialStepPill: {
    backgroundColor: "rgba(212,175,55,0.14)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tutorialStepPillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#D4AF37",
    letterSpacing: 0.5,
  },
  tutorialHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tutorialIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(212,175,55,0.1)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  tutorialTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#FEFDF8",
  },
  tutorialBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(254,253,248,0.78)",
    lineHeight: 21,
  },
  tutorialBtn: {
    backgroundColor: "#D4AF37",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 2,
  },
  tutorialBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#0d2b1a",
  },
  tutorialArrowWrap: {
    alignItems: "center",
    marginTop: -2,
    opacity: 0.85,
  },
});
