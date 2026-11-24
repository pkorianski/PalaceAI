import React, { useState } from "react";
import { View, Text, Pressable, Switch, Modal, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { Page, s } from "@/components/settings/Page";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import { Action, palette, useReducedMotion } from "@/components/tour/ui";
import { resetPlayerProgress } from "@/lib/tour/storage";
function Row({ title, detail, icon, onPress, destructive = false }: { title: string; detail?: string; icon: React.ComponentProps<typeof Ionicons>["name"]; onPress: () => void; destructive?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [s.row, { opacity: pressed ? 0.6 : 1 }]}>
    <Ionicons name={icon} size={22} color={destructive ? "#FFAAA0" : palette.gold} />
    <View style={s.rowText}><Text style={[s.rowTitle, destructive && { color: "#FFAAA0" }]}>{title}</Text>{detail && <Text style={s.caption}>{detail}</Text>}</View>
    <Ionicons name="chevron-forward" size={17} color={palette.muted} />
  </Pressable>;
}
export default function SettingsScreen() {
  const { preferences, ready, busy, error, reload, update } = usePreferences();
  const reduced = useReducedMotion();
  const [confirm, setConfirm] = useState(false), [resetting, setResetting] = useState(false), [resetError, setResetError] = useState("");
  const reset = async () => {
    if (resetting) return;
    setResetting(true); setResetError("");
    try {
      await resetPlayerProgress();
      setConfirm(false);
      router.dismissAll(); router.replace("/");
    } catch { setResetError("Progress could not be fully reset. Please try again. No new game has been started."); }
    finally { setResetting(false); }
  };
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const build = Constants.nativeBuildVersion;
  return <Page title="Settings">
    <View style={s.hero}><Text style={s.eyebrow}>YOUR TABLE, YOUR WAY</Text><Text style={s.title}>Make yourself at home.</Text><Text style={s.body}>A few comforts for your next hand.</Text></View>
    {!!error && <View accessibilityRole="alert" style={s.section}><Text style={s.error}>{error}</Text><Action label="Retry settings" secondary onPress={() => void reload()} /></View>}
    <View style={s.group}>
      <View style={s.row}><Ionicons name="radio-button-on-outline" size={22} color={palette.gold} /><View style={s.rowText}><Text style={s.rowTitle}>Haptics</Text><Text style={s.caption}>A little feedback with each play.</Text></View><Switch accessibilityLabel="Haptics" value={preferences.haptics} disabled={!ready || busy} onValueChange={value => void update({ haptics: value })} trackColor={{ false: "#40574D", true: "#B79743" }} thumbColor="#FFF6E5" /></View>
      <View style={s.row}><Ionicons name="accessibility-outline" size={22} color={palette.gold} /><View style={s.rowText}><Text style={s.rowTitle}>Reduce motion</Text><Text style={s.caption}>Keep transitions gentle. Your device’s Reduce Motion setting is always respected.</Text></View><Switch accessibilityLabel="Reduce motion" value={preferences.reduceMotion} disabled={!ready || busy} onValueChange={value => void update({ reduceMotion: value })} trackColor={{ false: "#40574D", true: "#B79743" }} thumbColor="#FFF6E5" /></View>
    </View>
    <View style={s.group}>
      <Row title="Learn Palace" detail="Replay the quick visual guide." icon="school-outline" onPress={() => router.push("/learn")} />
      <Row title="How to Play" detail="The complete rules, always handy." icon="book-outline" onPress={() => router.push("/rules")} />
    </View>
    <View style={s.group}>
      <Row title="Help & support" detail="Get help or report an issue." icon="help-buoy-outline" onPress={() => router.push("/support")} />
      <Row title="Privacy policy" detail="Your game, your device." icon="shield-checkmark-outline" onPress={() => router.push("/privacy")} />
    </View>
    <View style={s.section}><Text style={s.eyebrow}>LOCAL PROGRESS</Text><Text style={s.caption}>Tour progress is saved on this device. Cloud sync and cross-device restore are not available. Quick Play starts a fresh deal when reopened.</Text><View style={s.group}><Row title="Reset game progress" detail="Erase mastery, trophies, statistics and saved Tour progress." icon="trash-outline" destructive onPress={() => { setResetError(""); setConfirm(true); }} /></View></View>
    <View style={{ alignItems: "center", gap: 5, paddingVertical: 12 }}><Text style={s.rowTitle}>Kori Games</Text><Text style={s.caption}>Palace · Version {version}{build ? ` (${build})` : ""}</Text><Text style={s.caption}>Made for the next great hand.</Text></View>
    <Modal visible={confirm} transparent animationType={reduced ? "none" : "fade"} onRequestClose={() => { if (!resetting) setConfirm(false); }}>
      <View style={styles.scrim}><View accessibilityViewIsModal style={styles.confirm}><ScrollView contentContainerStyle={{ gap: 18 }}>
        <Ionicons name="trash-outline" size={30} color="#FFAAA0" />
        <Text accessibilityRole="header" style={s.heading}>Reset all game progress?</Text>
        <Text style={s.body}>This permanently erases your Tour, trophies, themes, statistics, starter badges, mastery XP, weekly quests and seals, daily challenges and tutorial history on this device. Your settings stay. This cannot be undone.</Text>
        {!!resetError && <Text accessibilityRole="alert" style={s.error}>{resetError}</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel="Erase game progress" disabled={resetting} onPress={() => void reset()} style={[styles.erase, { opacity: resetting ? 0.5 : 1 }]}><Text style={styles.eraseText}>{resetting ? "Erasing…" : "Erase game progress"}</Text></Pressable>
        <Action label="Keep my progress" secondary disabled={resetting} onPress={() => setConfirm(false)} />
      </ScrollView></View></View>
    </Modal>
  </Page>;
}
const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "#00000099", justifyContent: "center", padding: 20 },
  confirm: { backgroundColor: palette.panel, borderRadius: 24, padding: 24, maxHeight: "90%", width: "100%", maxWidth: 460, alignSelf: "center" },
  erase: { minHeight: 54, borderRadius: 15, backgroundColor: "#793B36", padding: 16, alignItems: "center", justifyContent: "center" },
  eraseText: { color: "#FFF3F0", fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
