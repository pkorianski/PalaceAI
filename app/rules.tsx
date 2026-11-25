import React from "react";
import { router } from "expo-router";
import { Page } from "@/components/settings/Page";
import { Action } from "@/components/tour/ui";
import { RulesContent } from "@/components/rules/RulesContent";

export default function RulesScreen() {
  return <Page title="How to Play">
    <RulesContent />
    <Action label="Play Now" icon="play" onPress={() => router.replace("/game")} />
  </Page>;
}
