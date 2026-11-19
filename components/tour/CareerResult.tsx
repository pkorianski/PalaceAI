import React, { useState } from "react";
import { RoundMastery } from "@/components/mastery/ui";
import type { RoundProgress } from "@/lib/mastery/model";
import { Pressable, ScrollView, Text, View } from "react-native";
import { TIERS, venueFor, type Rival } from "@/lib/tour/content";
import type { GameState } from "@/lib/palace-engine";
import type { GameResult } from "@/lib/stats";
import type { Outcome, Series } from "@/lib/tour/model";
import { Action, Arrival, Eyebrow, Meter, palette, ui } from "./ui";
import { TrophyArt } from "./Art";
export interface CareerGame {
  rival: Rival;
  series: Series;
  outcome: Outcome | null;
  error: string;
  onSnapshot: (
    game: GameState,
    metrics: { turns: number; pickups: number; burns: number; completedAt?: string },
  ) => void;
  onResult: (result: GameResult) => Promise<boolean>;
  onContinue: () => void;
  onExit: () => void;
}
export function CareerResult({ career, mastery, settled = true, saveError = "", onRetry }: { career: CareerGame; mastery?: RoundProgress | null; settled?: boolean; saveError?: string; onRetry?: () => void }) {
  const [details, setDetails] = useState(false);
  const o = career.outcome,
    v = venueFor(career.rival),
    tier = TIERS[career.series.tier];
  const title = !o
    ? "Saving your result…"
    : o.complete && o.won
      ? o.mode === "circuit"
        ? "One win closer."
        : o.earned
          ? "A title to your name."
          : "Still your table."
      : o.complete
        ? "This isn’t the end."
        : o.won
          ? "Keep the pressure on."
          : "The series is still alive.";
  return (
    <ScrollView
      contentContainerStyle={{ padding: 26, gap: 18, alignItems: "center" }}
    >
      <Arrival style={{ alignItems: "center", gap: 18, width: "100%" }}>
        <Eyebrow color={v.accent}>
          {v.name} • {career.rival.name}
        </Eyebrow>
        <TrophyArt
          size={76}
          color={o?.won ? tier.color : "#A0B7A5"}
          dim={!o?.won}
        />
        <Text accessibilityRole="header" style={[ui.title, { textAlign: "center", fontSize: 29 }]}>
          {title}
        </Text>
        <Text
          style={[ui.subtitle, { textAlign: "center", fontStyle: "italic" }]}
        >{`“${o?.won ? career.rival.victory : career.rival.defeat}”`}</Text>
        {!!saveError ? <View accessibilityRole="alert" style={{ width: "100%", gap: 8 }}><Text style={ui.error}>{saveError}</Text><Action label="Retry saving result" onPress={onRetry ?? (() => {})} /></View> : !settled && <Text accessibilityLiveRegion="polite" style={ui.subtitle}>Saving your result…</Text>}
        <View style={{ width: "100%", gap: 10 }}>
          <Action
            disabled={!o || !settled}
            label={o?.complete ? "Back to the tour" : "Next round"}
            onPress={o?.complete ? career.onExit : career.onContinue}
          />
          {!o?.complete && (
            <Action
              secondary
              disabled={!settled}
              label="Save and return to the map"
              onPress={career.onExit}
              icon="trophy-outline"
            />
          )}
        </View>
        <RoundMastery compact progress={mastery ?? null} />
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} onPress={() => setDetails(v => !v)} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: palette.gold }}>{details ? "Hide series details" : "Series details"}</Text></Pressable>
        {details && <>
        {o && (
          <View style={[ui.panel, { width: "100%" }]}>
            <View style={ui.row}>
              <Eyebrow>
                {o.mode === "circuit"
                  ? "WEEKLY CIRCUIT"
                  : `${tier.name} SERIES`}
              </Eyebrow>
              <Text
                style={{ color: palette.white, fontFamily: "Inter_700Bold" }}
              >
                {o.wins} — {o.losses}
              </Text>
            </View>
            <Meter
              value={o.wins}
              total={o.mode === "circuit" ? 1 : tier.target}
              color={tier.color}
            />
            <Text style={ui.subtitle}>
              {o.earned && o.mode === "tour"
                ? `${tier.name} trophy added to your collection. ${career.rival.champion ? `${v.reward} table theme unlocked.` : "Your next challenge is waiting."}`
                : o.complete
                  ? "Your earned trophies and circuit wins are safe."
                  : `First to ${tier.target} wins. Your series is saved.`}
            </Text>
          </View>
        )}
        </>}
        {!!career.error && <Text accessibilityRole="alert" style={ui.error}>{career.error}</Text>}

      </Arrival>
    </ScrollView>
  );
}
