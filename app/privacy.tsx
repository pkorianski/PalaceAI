import React from "react";
import { View, Text } from "react-native";
import { Page, s } from "@/components/settings/Page";
import { Action } from "@/components/tour/ui";
import { PRIVACY_SECTIONS, PRIVACY_UPDATED, PRIVACY_URL, SUPPORT_EMAIL } from "@/lib/release-content";
import { openExternal } from "@/lib/external-links";
export default function PrivacyScreen() {
  const [error, setError] = React.useState("");
  return <Page title="Privacy policy">
    <View style={s.hero}><Text style={s.eyebrow}>KORIANSKI GAMES</Text><Text style={s.title}>Your game. Your device.</Text><Text style={s.caption}>Updated {PRIVACY_UPDATED}</Text></View>
    {PRIVACY_SECTIONS.map(section => <View key={section.title} style={s.section}><Text accessibilityRole="header" style={s.heading}>{section.title}</Text><Text style={s.body}>{section.body}</Text></View>)}
    <View style={s.section}><Text style={s.heading}>Contact</Text><Text selectable style={s.body}>{SUPPORT_EMAIL}</Text></View>
    <Action label="Open policy in browser" secondary onPress={() => { void openExternal(PRIVACY_URL).then(ok => setError(ok ? "" : "The browser could not open. The full policy is available above.")); }} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </Page>;
}
