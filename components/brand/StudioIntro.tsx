import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";

import { usePreferences } from "@/components/settings/PreferencesProvider";

const INTRO_DURATION_MS = 1300 + 650 + 250; // Ignite, hold the full lockup, fade.

/** One finite studio ident per root mount; no storage, sound, or network needed. */
export function StudioIntro({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const forceReduced = preferences.reduceMotion;
  const progress = useRef(new Animated.Value(0)).current;
  const completed = useRef(false);
  const [laidOut, setLaidOut] = useState(false);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    let active = true;
    // Treat an unavailable preference as reduced motion; never delay startup for it.
    const preferenceTimeout = setTimeout(() => {
      if (active) setReduced((value) => value ?? true);
    }, 200);
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => { if (active) setReduced(value); },
      () => { if (active) setReduced(true); },
    );
    const preference = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    const appState = AppState.addEventListener("change", (state) => {
      if (state !== "active") finish();
    });
    // Completion deliberately does not depend on an animation callback.
    const watchdog = setTimeout(finish, INTRO_DURATION_MS + 500);
    return () => {
      active = false;
      clearTimeout(preferenceTimeout);
      clearTimeout(watchdog);
      preference.remove();
      appState.remove();
    };
  }, [finish]);

  useEffect(() => {
    if (!laidOut || reduced === null || completed.current) return;
    if (reduced || forceReduced) {
      progress.setValue(0.85); // Fully visible, static studio lockup.
      const timeout = setTimeout(finish, 500);
      return () => clearTimeout(timeout);
    }
    progress.setValue(0);
    const timing = (toValue: number, duration: number) => Animated.timing(progress, {
      toValue,
      duration,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== "web",
      isInteraction: false,
    });
    const animation = Animated.sequence([
      timing(0.85, 1300),
      Animated.delay(650),
      timing(1, 250),
    ]);
    const timeout = setTimeout(finish, INTRO_DURATION_MS);
    animation.start();
    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [laidOut, reduced, forceReduced, progress, finish]);

  const tween = (inputRange: number[], outputRange: number[]) =>
    progress.interpolate({ inputRange, outputRange, extrapolate: "clamp" });

  return (
    <Animated.View
      testID="studio-intro"
      accessibilityViewIsModal
      onLayout={() => setLaidOut(true)}
      style={[styles.overlay, { opacity: tween([0, 0.87, 1], [1, 1, 0]) }]}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={["#172C35", "#0C111B", "#090D16"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.identity} accessible accessibilityRole="header" accessibilityLabel="Kori Games">
        <View style={styles.emblem} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View style={[styles.glow, {
            opacity: tween([0, 0.35, 0.7, 1], [0, 0.3, 0.12, 0.12]),
            transform: [{ scale: tween([0, 0.35, 0.7, 1], [0.2, 1.3, 1, 1]) }],
          }]}>
            <Svg width={190} height={190} viewBox="0 0 190 190">
              <Defs>
                <RadialGradient id="studio-glow">
                  <Stop offset="0" stopColor="#73F7CF" stopOpacity={0.8} />
                  <Stop offset="0.5" stopColor="#73F7CF" stopOpacity={0.22} />
                  <Stop offset="1" stopColor="#73F7CF" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={95} cy={95} r={95} fill="url(#studio-glow)" />
            </Svg>
          </Animated.View>
          <Animated.View style={{
            opacity: tween([0, 0.14, 0.36, 1], [0, 0, 1, 1]),
            transform: [{ scale: tween([0, 0.14, 0.35, 0.56, 1], [0.08, 0.08, 1.12, 1, 1]) }],
          }}>
            <Svg width={106} height={110} viewBox="0 0 88 92">
              <Path d="M23 84 V11 M23 49 L68 9 M23 49 L65 84" stroke="#C0FFE9" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.spark, {
            opacity: tween([0, 0.12, 0.35, 1], [0, 1, 0, 0]),
            transform: [{ scale: tween([0, 0.12, 0.4, 1], [1, 2, 12, 12]) }],
          }]} />
        </View>
        <Animated.View style={[styles.wordmark, {
          opacity: tween([0, 0.43, 0.8, 1], [0, 0, 1, 1]),
          transform: [{ translateY: tween([0, 0.43, 0.8, 1], [12, 12, 0, 0]) }],
        }]}>
          <Text style={styles.name} maxFontSizeMultiplier={1.3}>KORI</Text>
          <Text style={styles.games} maxFontSizeMultiplier={1.5}>GAMES</Text>
        </Animated.View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip studio intro"
        onPress={finish}
        style={({ pressed }) => [styles.skip, { bottom: Math.max(insets.bottom, 16) + 12, opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={styles.skipText}>Skip intro</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#090D16", zIndex: 100, alignItems: "center", justifyContent: "center" },
  identity: { alignItems: "center", gap: 28, paddingHorizontal: 16 },
  emblem: { width: 106, height: 110, alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", width: 190, height: 190, borderRadius: 95 },
  spark: { position: "absolute", left: 24, top: 55, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  wordmark: { alignItems: "center", gap: 10 },
  name: { color: "#F9FAFB", fontFamily: "Inter_700Bold", fontSize: 31, letterSpacing: 3 },
  games: { color: "#B9C7D8", fontFamily: "Inter_500Medium", fontSize: 14, letterSpacing: 7, paddingLeft: 7 },
  skip: { position: "absolute", alignSelf: "center", minHeight: 44, minWidth: 100, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  skipText: { color: "#B9C7D8", fontFamily: "Inter_400Regular", fontSize: 13 },
});
