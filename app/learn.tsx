import React, { useState } from "react";
import { View, Text } from "react-native";
import { Page, s } from "@/components/settings/Page";
import { Action, palette } from "@/components/tour/ui";
import { PlayingCard } from "@/components/PlayingCard";
import { router } from "expo-router";
import type { Rank, Suit } from "@/lib/palace-engine";
const STEPS: { title: string; body: string; cards: [Rank, Suit][] }[] = [
  { title: "Build your palace.", body: "Choose three strong cards from your hand as your face-up palace. They are your backup for the end of the game. Confirm your choices to start.", cards: [["A", "spades"], ["K", "hearts"], ["Q", "clubs"]] },
  { title: "Match it. Or beat it.", body: "Play cards of the same rank that match or beat the top pile card. Draw back up to three cards while the deck lasts. Can’t play? Pick up the pile and the next player starts fresh.", cards: [["7", "diamonds"], ["8", "clubs"], ["8", "hearts"]] },
  { title: "Keep a little magic.", body: "A 2 resets the pile and gives you another play. A 10 burns the pile and gives you another play. Four consecutive cards of the same rank also burn it.", cards: [["2", "clubs"], ["10", "hearts"], ["10", "spades"]] },
  { title: "Last card. Best feeling.", body: "When the deck and your hand are empty, play your face-up palace. Then flip face-down cards one at a time. If a flip can’t be played, pick up the pile. Get rid of every card to win.", cards: [["A", "hearts"], ["K", "spades"], ["Q", "diamonds"]] },
];
export default function LearnScreen() {
  const [step, setStep] = useState(0), item = STEPS[step];
  return <Page title="Learn Palace">
    <View style={s.hero}><Text style={s.eyebrow}>A SEAT AT THE TABLE · {step + 1} / {STEPS.length}</Text><Text accessibilityRole="header" style={s.title}>{item.title}</Text></View>
    <View style={{ backgroundColor: palette.panel, paddingVertical: 38, borderRadius: 24, flexDirection: "row", justifyContent: "center", gap: 16 }} accessibilityLabel="Example cards">
      {item.cards.map(([rank, suit], i) => <PlayingCard key={`${step}-${i}`} card={{ rank, suit, id: `example-${i}` }} faceDown={step === 3 && i === 2} />)}
    </View>
    <Text style={s.body}>{item.body}</Text><Text style={s.caption}>Example cards · No game or progress is changed by this guide.</Text>
    <View style={{ flexDirection: "row", gap: 6 }}>{STEPS.map((_, i) => <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i <= step ? palette.gold : "#29483C" }} />)}</View>
    <Action label={step === STEPS.length - 1 ? "Back to settings" : "Next"} onPress={() => step === STEPS.length - 1 ? (router.canGoBack() ? router.back() : router.replace("/settings")) : setStep(step + 1)} />
    {step > 0 && <Action label="Previous" secondary onPress={() => setStep(step - 1)} />}
  </Page>;
}
