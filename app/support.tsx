import React, { useState } from "react";
import { View, Text } from "react-native";
import Constants from "expo-constants";
import { Page, s } from "@/components/settings/Page";
import { Action } from "@/components/tour/ui";
import { SUPPORT_EMAIL, SUPPORT_URL } from "@/lib/release-content";
import { openExternal } from "@/lib/external-links";
export default function SupportScreen() {
  const [error, setError] = useState("");
  return <Page title="Help & support">
    <View style={s.hero}><Text style={s.eyebrow}>WE’VE GOT YOUR BACK</Text><Text style={s.title}>Need a hand?</Text><Text style={s.body}>Questions, feedback, or a hand that didn’t play right? Tell us what happened.</Text></View>
    <View style={s.group}><View style={[s.row, { flexDirection: "column", alignItems: "stretch", gap: 14 }]}><Text style={s.heading}>Contact Kori Games</Text><Text selectable style={s.body}>{SUPPORT_EMAIL}</Text><Action label="Email support" onPress={() => { const subject = encodeURIComponent(`Palace ${Constants.expoConfig?.version ?? "1.0.0"} support`); void openExternal(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).then(ok => setError(ok ? "" : "No email app opened. Copy the address above into your preferred email service.")); }} /><Text style={s.caption}>Include your app version, device model and steps to reproduce. Screenshots help. Never send passwords or sensitive information.</Text></View></View>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <View style={s.section}><Text style={s.heading}>Where is my progress saved?</Text><Text style={s.body}>Your Tour and achievements live on this device. Tour resumes your saved deal. Quick Play begins a fresh deal when reopened. Keep the app installed to keep your local progress; cloud sync is not available.</Text></View>
    <View style={s.section}><Text style={s.heading}>Can I play without internet?</Text><Text style={s.body}>Yes. The installed App Store/TestFlight app plays offline. Expo Go during development still needs the development server. Opening a website or sending support email needs a connection.</Text></View>
    <View style={s.section}><Text style={s.heading}>Are these online opponents?</Text><Text style={s.body}>Quick Play, Tour rivals and the weekly circuit all use local computer opponents. The circuit refreshes on Mondays at 00:00 UTC. Multiplayer is not included.</Text></View>
    <Action label="Open support website" secondary onPress={() => { void openExternal(SUPPORT_URL).then(ok => setError(ok ? "" : "The browser could not open. You can contact us at the address above.")); }} />
  </Page>;
}
