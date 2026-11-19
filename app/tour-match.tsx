import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { GameScreen } from "./game";
import { createInitialGameState, type GameState } from "@/lib/palace-engine";
import type { GameResult } from "@/lib/stats";
import { rivalById } from "@/lib/tour/content";
import { loadCareer, updateCareer } from "@/lib/tour/storage";
import { finishRound, type Series, type Outcome } from "@/lib/tour/model";
import { Action, palette, ui } from "@/components/tour/ui";
export default function TourMatch() {
  const [series, setSeries] = useState<Series | null>(null),
    [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const open = useCallback(async () => {
    setLoading(true);
    try {
      let c = await loadCareer();
      if (!c.active) {
        router.dismissTo("/tour");
        return;
      }
      if (!c.active.game)
        c = await updateCareer((c) => {
          if (!c.active || c.active.game) return c;
          const game = createInitialGameState(),
            rival = rivalById(c.active.rivalId)!;
          game.players[1].name = rival.name;
          return {
            ...c,
            active: {
              ...c.active,
              game,
              metrics: { turns: 0, pickups: 0, burns: 0 },
            },
          };
        });
      if (mounted.current) {
        setSeries(c.active);
        setOutcome(null);
        setError("");
      }
    } catch (e) {
      if (mounted.current) setError(String(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    open();
  }, [open]);
  const roundId = series?.roundId;
  const onSnapshot = useCallback(
    (
      game: GameState,
      metrics: { turns: number; pickups: number; burns: number; completedAt?: string },
    ) => {
      updateCareer((c) =>
        c.active && c.active.roundId === roundId
          ? { ...c, active: { ...c.active, game, metrics } }
          : c,
      )
        .then(() => {
          if (mounted.current) setError("");
        })
        .catch((e) => {
          if (mounted.current)
            setError(`Progress could not save: ${String(e)}`);
        });
    },
    [roundId],
  );
  const onResult = useCallback(
    async (result: GameResult) => {
      let fresh = false;
      const c = await updateCareer((c) => {
        fresh = !c.receipts.some((o) => o.roundId === roundId);
        return finishRound(c, roundId!, result.won).career;
      });
      if (mounted.current) {
        setOutcome(c.receipts.find((o) => o.roundId === roundId)!);
        setError("");
      }
      return fresh;
    },
    [roundId],
  );
  const exit = () => router.dismissTo("/tour");
  if (loading || !series)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          padding: 35,
          justifyContent: "center",
          gap: 20,
        }}
      >
        <ActivityIndicator color={palette.gold} />
        <Text style={ui.error}>{error}</Text>
        {!!error && <Action label="Retry loading saved game" onPress={open} />}
        <Action secondary label="Back to tour" onPress={exit} />
      </View>
    );
  return (
    <GameScreen
      key={series.roundId}
      career={{
        rival: rivalById(series.rivalId)!,
        series,
        outcome,
        error,
        onSnapshot,
        onResult,
        onContinue: open,
        onExit: exit,
      }}
    />
  );
}
