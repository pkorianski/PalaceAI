import { STYLE_LABELS } from "@/lib/tour/content";
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
  AppState,
  AccessibilityInfo,
  findNodeHandle,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "@/lib/haptics";
import { hasSeenTutorial, markTutorialSeen } from "@/lib/tutorial";
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
import { presentTurn } from "@/lib/game-presentation";
import { PlayingCard, EmptyCardSlot } from "@/components/PlayingCard";
import type { GameResult } from "@/lib/stats";
import { careerId } from "@/lib/tour/storage";
import { loadMastery, recordMasteryRound } from "@/lib/mastery/storage";
import { equippedTitle, type RoundProgress } from "@/lib/mastery/model";
import { RoundMastery } from "@/components/mastery/ui";
import {
  checkAndUnlockAchievements,
  type Achievement,
} from "@/lib/achievements";
import { updateDailyChallenge } from "@/lib/daily-challenge";

import { RivalPortrait } from "@/components/tour/Art";
import { CareerResult, type CareerGame } from "@/components/tour/CareerResult";
import { useReducedMotion } from "@/components/tour/ui";
import { getRivalMove } from "@/lib/tour/ai";
import { useTableTheme } from "@/components/tour/ThemeProvider";

const TUTORIAL_STEPS = [
  {
    step: "1 of 2",
    icon: "hand-left-outline" as const,
    title: "Choose Your Palace",
    body: "Tap 3 cards from your hand below. Pick your strongest — they become your face-up backup cards.",
  },
  {
    step: "2 of 2",
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

export function GameScreen({ career }: { career?: CareerGame } = {}) {
  const theme = useTableTheme();
  const { height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height - insets.top - insets.bottom < 740 && fontScale < 1.3;
  const menuButton = useRef<React.ComponentRef<typeof View>>(null);
  const menuHeading = useRef<React.ComponentRef<typeof Text>>(null);
  const rulesHeading = useRef<React.ComponentRef<typeof Text>>(null);
  const leaveHeading = useRef<React.ComponentRef<typeof Text>>(null);
  const resultHeading = useRef<React.ComponentRef<typeof Text>>(null);
  const lastSpoken = useRef({ heading: "", hint: "" });
  const focus = (node: React.ComponentRef<typeof View> | null) => {
    if (!node) return;
    if (Platform.OS === "web") { (node as unknown as { focus?: () => void }).focus?.(); return; }
    const handle = findNodeHandle(node);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
  };
  const [resultDetails, setResultDetails] = useState(false);
  const reducedMotion = useReducedMotion();
  const resultRecorded = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [quickRoundId, setQuickRoundId] = useState(careerId);
  const completedAt = useRef<string | null>(career?.series.metrics?.completedAt ?? null);
  const [masteryProgress, setMasteryProgress] = useState<RoundProgress | null>(null);
  const [playerTitle, setPlayerTitle] = useState("");
  useEffect(() => {
    let active = true;
    void loadMastery().then(s => { if (active) setPlayerTitle(equippedTitle(s)); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const [resultError, setResultError] = useState("");
  const [resultAttempt, setResultAttempt] = useState(0);
  const [gameState, setGameState] = useState<GameState>(() => career?.series.game || createInitialGameState());
  const [showGameOver, setShowGameOver] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState !== "background");
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
  const humanTurnsRef = useRef(career?.series.metrics?.turns || 0);
  const humanPickupsRef = useRef(career?.series.metrics?.pickups || 0);
  const burnsRef = useRef(career?.series.metrics?.burns || 0);
  const prevBurnPileLen = useRef(career?.series.game?.burnPile.length || 0);
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

  const anyTutVisible = isTutStep0Visible || isTutStep1Visible;
  useEffect(() => {
    if (isTutStep2Visible) { setShowTutorial(false); void markTutorialSeen(); }
  }, [isTutStep2Visible]);
  const paused = !foreground || showMenuSheet || showRulesOverlay || showLeaveModal;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => setForeground(state === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (gameState.message !== prevMessage.current) {
      prevMessage.current = gameState.message;
      if (reducedMotion) { messageOpacity.setValue(1); return; }
      messageOpacity.setValue(0);
      const animation = Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== "web",
      });
      animation.start();
      return () => animation.stop();
    }
  }, [gameState.message, reducedMotion, messageOpacity]);

  useEffect(() => {
    if (gameState.burnPile.length > prevBurnPileLen.current) {
      burnsRef.current++;
      prevBurnPileLen.current = gameState.burnPile.length;
    }
  }, [gameState.burnPile.length]);

  // Tutorial: check on mount whether to show first-game walkthrough
  useEffect(() => {
    hasSeenTutorial().then((seen) => {
      if (!seen) {
        setShowTutorial(true);
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
    if (gameState.phase !== "game_over" || resultRecorded.current) return;
    resultRecorded.current = true;
    const result: GameResult = { won: gameState.winner === "human", turns: humanTurnsRef.current, pickups: humanPickupsRef.current, burns: burnsRef.current };
    const save = async () => {
      setShowGameOver(true);
      setResultError("");
      try {
        completedAt.current ??= new Date().toISOString();
        // Save the final deal first so a restart can settle the same round ID.
        career?.onSnapshot(gameState, { turns: result.turns, pickups: result.pickups, burns: result.burns, completedAt: completedAt.current });
        const progress = await recordMasteryRound(career?.series.roundId ?? quickRoundId, result, completedAt.current);
        if (!alive.current) return;
        setMasteryProgress(previous => previous ?? progress);
        if (career) await career.onResult(result);
        if (!alive.current) return;
        const newAchievements = await checkAndUnlockAchievements(progress.state.stats, result);
        if (!alive.current) return;
        const justCompleted = (await updateDailyChallenge(result, career?.series.roundId ?? quickRoundId, completedAt.current)).justCompleted;
        setGameOverData({ result, newAchievements, dailyChallengeCompleted: justCompleted });
        Haptics.notificationAsync(result.won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
        setResultError(""); setShowGameOver(true);
      } catch (e) {
        resultRecorded.current = false;
        setResultError(`Could not save the result: ${String(e)}`);
      }
    };
    save();
  }, [gameState.phase, gameState.winner, resultAttempt]);

  useEffect(() => {
    if (gameState.phase !== "game_over") career?.onSnapshot(gameState, { turns: humanTurnsRef.current, pickups: humanPickupsRef.current, burns: burnsRef.current });
  }, [gameState, career?.onSnapshot]);

  useEffect(() => {
    if (!paused && gameState.phase === "choose_palace" && gameState.currentPlayerIndex === 1) {
      const timer = setTimeout(() => {
        setGameState((s) => autoAISetupPalace(s, 1));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.currentPlayerIndex, paused]);

  useEffect(() => {
    if (paused || gameState.phase !== "playing") return;
    const curr = gameState.players[gameState.currentPlayerIndex];
    if (curr.isHuman) return;

    const delay = 800 + Math.random() * 500;
    const timer = setTimeout(() => {
      setGameState((prevState) => {
        const c = prevState.players[prevState.currentPlayerIndex];
        if (c.isHuman || prevState.phase !== "playing") return prevState;
        const aiIdx = prevState.players.findIndex((p) => !p.isHuman);
        const move = career ? getRivalMove(prevState, career.rival.style, career.series.tier) : getAIMove(prevState);
        if (move.type === "play" && move.cardIds) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return playCards(prevState, aiIdx, move.cardIds);
        } else {
          return pickUpPile(prevState, aiIdx);
        }
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [gameState, paused]);

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
    resultRecorded.current = false;
    completedAt.current = null;
    setQuickRoundId(careerId());
    setMasteryProgress(null);
    setResultDetails(false);
    setResultError("");
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
    if (career) career.onExit();
    else router.dismissTo("/");
  }, [career]);

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

  const turn = presentTurn(gameState, selectedPlayCards);
  const canPlay = turn.canPlay;
  useEffect(() => {
    if (Platform.OS === "web" || paused) return;
    const guidanceChanged = lastSpoken.current.heading !== turn.heading || lastSpoken.current.hint !== turn.hint;
    const announcement = guidanceChanged ? `${turn.heading}. ${turn.hint}` : gameState.message;
    lastSpoken.current = { heading: turn.heading, hint: turn.hint };
    let current = true;
    void AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      if (enabled && current && alive.current) AccessibilityInfo.announceForAccessibility(announcement);
    }).catch(() => {});
    return () => { current = false; };
  }, [turn.heading, turn.hint, gameState.message, paused]);

  const pileTop = gameState.pile.length > 0 ? gameState.pile[gameState.pile.length - 1] : null;
  const pileCount = gameState.pile.length;

  return (
    <View testID="game-table" style={[styles.container, {
      backgroundColor: theme.table,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }]}>
      <View style={styles.topBar}>
        <View style={styles.backBtn} />
        <Text style={[styles.topBarTitle, { flex: 1, textAlign: "center", letterSpacing: 0.5 }]} accessibilityRole="header">{career ? `${career.rival.name} • ${career.series.wins}–${career.series.losses}` : "Palace"}</Text>
        <Pressable
          accessibilityRole="button"
          ref={menuButton}
          accessibilityLabel="Game menu"
          onPress={() => setShowMenuSheet(true)}
          style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#D4AF37" />
        </Pressable>
      </View>

      {!showGameOver && !!(resultError || career?.error) && <View style={{ padding: 12 }}><Text style={{ color: "#FFBFAC" }}>{resultError || career?.error}</Text>{!!resultError && <Pressable accessibilityRole="button" onPress={() => setResultAttempt(n => n + 1)} style={{ padding: 14 }}><Text style={{ color: "#EFC778" }}>Retry saving result</Text></Pressable>}</View>}
      <ScrollView testID="board-scroll" bounces={false} contentContainerStyle={[styles.gameArea, { flexGrow: 1 }]} style={{ flex: 1 }}>
        <View style={[styles.opponentPanel, compact && { paddingVertical: 6, gap: 4 }]}>
          <View style={styles.playerHeader}>
            {career && <RivalPortrait rival={career.rival} size={30} />}
            <View style={[styles.turnIndicator, !currentPlayer.isHuman && styles.turnIndicatorActive]} />
            <Text style={styles.playerName}>
              {ai.name}
              {!currentPlayer.isHuman && gameState.phase === "playing" ? "  ···" : ""}
            </Text>
            <Text style={styles.handCount}>{ai.hand.length} in hand</Text>
          </View>

          {career && <Text style={{ color: "#A4B9AA", fontSize: 12 }}>{STYLE_LABELS[career.rival.style]}</Text>}
          {!compact && gameState.phase !== "choose_palace" && <View style={styles.aiFanRow}>
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
          </View>}

          {gameState.phase !== "choose_palace" && <>
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
          </>}
        </View>

        <View style={[styles.centerArea, { paddingVertical: compact ? 6 : 12 }]}>
          <View accessibilityLiveRegion="polite" style={{ gap: 3, alignItems: "center", paddingHorizontal: 8 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: "#FFF6E5" }}>{turn.heading}</Text>
            <Text style={{ fontSize: 13, lineHeight: 18, textAlign: "center", color: "#C5D7CB" }}>{turn.hint}</Text>
          </View>
          {(!compact || gameState.phase !== "playing" || !gameState.message.startsWith("Your turn")) && <Animated.View style={[styles.messageContainer, { opacity: messageOpacity }]}>
            <Text style={[styles.messageText, { fontSize: 12 }]}>
              {gameState.phase === "choose_palace"
                ? gameState.currentPlayerIndex === 0
                  ? `Select 3 cards for your palace (${setupSelected.length}/3)`
                  : "Opponent setting up..."
                : gameState.message}
            </Text>
          </Animated.View>}

          {gameState.phase !== "choose_palace" && <>
          <View style={styles.pilesRow}>
            <View style={styles.pileArea}>
              <Text style={styles.pileLabel}>DECK</Text>
              {gameState.deck.length > 0 ? (
                <PlayingCard faceDown small={compact} />
              ) : (
                <EmptyCardSlot small={compact} />
              )}
              <Text style={styles.pileCount}>{gameState.deck.length}</Text>
            </View>

            <View style={styles.pileArea}>
              <Text style={styles.pileLabel}>PILE</Text>
              {pileTop ? (
                <View>
                  {!compact && pileCount > 1 && (
                    <View style={styles.pileStack2} />
                  )}
                  {!compact && pileCount > 2 && (
                    <View style={styles.pileStack3} />
                  )}
                  <PlayingCard card={pileTop} small={compact} />
                </View>
              ) : (
                <EmptyCardSlot small={compact} />
              )}
              <Text style={styles.pileCount}>{pileCount > 0 ? pileCount : ""}</Text>
            </View>

            <View style={styles.pileArea}>
              <Text style={styles.pileLabel}>BURNED</Text>
              <EmptyCardSlot small={compact} />
              <Text style={styles.pileCount}>{gameState.burnPile.length || ""}</Text>
            </View>
          </View>

          </>}

        </View>

        <View style={styles.playerSection}>
          <View style={styles.playerHeader}>
            <View style={[styles.turnIndicator, isHumanTurn && styles.turnIndicatorActive]} />
            <View style={{ flex: 1, gap: 2 }}><Text style={styles.playerName}>You</Text>{!!playerTitle && <Text style={{ color: "#C5D7CB", fontSize: 12 }}>{playerTitle}</Text>}</View>
            <Text style={styles.handCount}>{human.hand.length} in hand</Text>
          </View>
          {gameState.phase !== "choose_palace" && <View style={styles.palaceRowLabeled}>
            <View style={styles.palaceGroup}>
              <View style={styles.palaceGroupCards}>
                {human.faceDownPalace.map((card, i) => card ? (
                  <PlayingCard key={`human-fd-${i}`} faceDown small accessibilityLabel={`Face-down card ${i + 1}`}
                    onPress={humanPhase === "facedown" && isHumanTurn ? () => handleFaceDownPlay(i) : undefined}
                    disabled={humanPhase !== "facedown" || !isHumanTurn} />
                ) : <EmptyCardSlot key={`human-fd-empty-${i}`} small />)}
              </View>
              <Text style={styles.palaceGroupLabel}>FACE DOWN</Text>
            </View>
            <View style={styles.palaceSpacer} />
            <View style={styles.palaceGroup}>
              <View style={styles.palaceGroupCards}>
                {human.faceUpPalace.map(card => <PlayingCard key={card.id} card={card} small
                  selected={humanPhase === "faceup" && selectedPlayCards.includes(card.id)}
                  playable={turn.playableIds.includes(card.id)}
                  onPress={humanPhase === "faceup" && isHumanTurn ? () => handleCardSelect(card.id) : undefined}
                  disabled={humanPhase !== "faceup" || !isHumanTurn} />)}
              </View>
              <Text style={styles.palaceGroupLabel}>FACE UP</Text>
            </View>
          </View>}
        </View>

        {anyTutVisible && <View testID="game-guide" style={{ backgroundColor: "#213E31", borderRadius: 14, padding: 12, gap: 6, borderWidth: 1, borderColor: "#6A693B" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFF6E5" }}>{TUTORIAL_STEPS[tutorialStep].title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Skip guide" onPress={() => { setShowTutorial(false); void markTutorialSeen(); }} style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "#EFC778" }}>Skip</Text></Pressable>
          </View>
          <Text style={{ fontSize: 13, lineHeight: 19, color: "#CBD8CE" }}>{TUTORIAL_STEPS[tutorialStep].body}</Text>

        </View>}
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
                      playable={turn.playableIds.includes(card.id)}
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
      </ScrollView>
      <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4, backgroundColor: theme.table }}>
        {gameState.phase === "choose_palace" && gameState.currentPlayerIndex === 0 ? (
            <Pressable
              style={({ pressed }) => [
                styles.confirmSetupBtn,
                setupSelected.length !== 3 && styles.confirmSetupBtnDisabled,
                pressed && setupSelected.length === 3 && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button" accessibilityState={{ disabled: setupSelected.length !== 3 }}
              onPress={handleConfirmSetup}
              disabled={setupSelected.length !== 3}
            >
              <Text style={styles.confirmSetupText}>Confirm Palace ({setupSelected.length}/3)</Text>
            </Pressable>        ) : (
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
                  accessibilityRole="button" accessibilityLabel={selectedPlayCards.length > 1 ? `Play ${selectedPlayCards.length}` : "Play"}
                  accessibilityState={{ disabled: !canPlay }}
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
                  accessibilityRole="button" accessibilityLabel="Pick Up"
                  accessibilityState={{ disabled: gameState.pile.length === 0 }}
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
          </View>        )}
      </View>


      <Modal visible={showGameOver} transparent animationType={reducedMotion ? "none" : "fade"} onRequestClose={() => {}} onShow={() => focus(resultHeading.current)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            {career ? <CareerResult career={career} mastery={masteryProgress} settled={!!gameOverData && !resultError} saveError={resultError} onRetry={() => setResultAttempt(n => n + 1)} /> : <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
              bounces={false}
            >
              <Text style={styles.modalEmoji}>
                {gameState.winner === "human" ? "🏆" : "💀"}
              </Text>
              <Text ref={resultHeading} accessible accessibilityRole="header" style={styles.modalTitle}>
                {gameState.winner === "human" ? "You Win!" : "You Lose"}
              </Text>

              {!!resultError ? <View accessibilityRole="alert" style={{ gap: 10 }}><Text style={{ color: "#FFBFAC", fontSize: 15 }}>{resultError}</Text><Pressable accessibilityRole="but…24804 tokens truncated…nGame, result.burns),
    },
  };
  const quests: string[] = [];
  let seal = false;
  if (weekKey(new Date(completedAt)) === s.weekly.key) {
    s = {
      ...s,
      weekly: {
        ...s.weekly,
        games: s.weekly.games + 1,
        wins: s.weekly.wins + +result.won,
        burns: s.weekly.burns + result.burns,
        days: s.weekly.days.includes(day)
          ? s.weekly.days
          : [...s.weekly.days, day],
        rewarded: [...s.weekly.rewarded],
      },
    };
    for (const quest of questBoard(s.weekly.key))
      if (
        quest.value(s) >= quest.target &&
        !s.weekly.rewarded.includes(quest.id)
      ) {
        s.weekly.rewarded.push(quest.id);
        quests.push(quest.name);
        s.xp += 150;
      }
    if (s.weekly.rewarded.length === 4 && !s.seals.includes(s.weekly.key)) {
      s = { ...s, seals: [...s.seals, s.weekly.key], xp: s.xp + 250 };
      seal = true;
    }
  }
  const previous = s.milestones;
  s = awardMilestones(s);
  return {
    state: s,
    xpGained: s.xp - before,
    beforeLevel,
    milestones: s.milestones.filter((id) => !previous.includes(id)),
    quests,
    seal,
    duplicate: false,
  };
}
export function equipReward(
  state: Mastery,
  type: "title" | "theme",
  id: string | null,
): Mastery {
  if (type === "title") {
    const title = TITLES.find((t) => t.id === id);
    if (!title || title.level > levelFor(state.xp))
      throw new Error("Reach the required mastery level to equip this title.");
    return { ...state, title: title.id };
  }
  if (id !== null && !themeAvailable(state, id))
    throw new Error(
      "Earn the required mastery level or weekly seals to equip this table.",
    );
  return { ...state, theme: id };
}
export function nextMilestone(state: Mastery) {
  return TRACKS.flatMap((track) => {
    const index = track.goals.findIndex(
      (_, i) => !state.milestones.includes(`${track.id}-${i}`),
    );
    return index < 0
      ? []
      : [
          {
            track,
            index,
            target: track.goals[index],
            value: metricValue(state, track.id),
          },
        ];
  }).sort((a, b) => b.value / b.target - a.value / a.target)[0];
}

export function nextReward(state: Mastery): string {
  const level = levelFor(state.xp);
  const candidates = [
    ...TITLES.filter((t) => t.level > level).map((t) => ({
      name: t.name,
      level: t.level,
    })),
    ...THEMES.filter((t) => !t.seals && t.level > level).map((t) => ({
      name: t.name,
      level: t.level,
    })),
  ].sort((a, b) => a.level - b.level);
  return candidates[0]
    ? `${candidates[0].name} at level ${candidates[0].level}`
    : `Another dated seal from your next weekly board`;
}

// Presentation only: uses the same level ordering as nextReward, with a visual payload.
export function rewardPreview(state: Mastery) {
  const level = levelFor(state.xp);
  return [
    ...TITLES.filter(t => t.level > level).map(t => ({ ...t, kind: "title" as const })),
    ...THEMES.filter(t => !t.seals && t.level > level).map(t => ({ ...t, kind: "theme" as const })),
  ].sort((a, b) => a.level - b.level)[0] ?? null;
}
