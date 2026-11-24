import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { PreferencesProvider } from "@/components/settings/PreferencesProvider";
import { useReducedMotion } from "@/components/tour/ui";
import { StudioIntro } from "@/components/brand/StudioIntro";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TableThemeProvider } from "@/components/tour/ThemeProvider";
import { queryClient } from "@/lib/query-client";

void SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const reduced = useReducedMotion();
  return (
    <Stack screenOptions={{ headerShown: false, animation: reduced ? "none" : "fade" }}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="settings" options={{ animation: reduced ? "none" : "slide_from_right" }} />
      <Stack.Screen name="privacy" options={{ animation: reduced ? "none" : "slide_from_right" }} />
      <Stack.Screen name="support" options={{ animation: reduced ? "none" : "slide_from_right" }} />
      <Stack.Screen name="learn" options={{ animation: reduced ? "none" : "slide_from_right" }} />
      <Stack.Screen
        name="game"
        options={{
          animation: reduced ? "none" : "slide_from_right",
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen name="tour" options={{ animation: reduced ? "none" : "slide_from_right" }} />
      <Stack.Screen name="tour-match" options={{ gestureEnabled: false, animation: reduced ? "none" : "fade" }} />
      <Stack.Screen name="rules" options={{ animation: reduced ? "none" : "slide_from_bottom" }} />
      <Stack.Screen name="achievements" options={{ title: "Achievements", animation: reduced ? "none" : "slide_from_bottom" }} />
      <Stack.Screen name="stats" options={{ title: "Statistics", animation: reduced ? "none" : "slide_from_bottom" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [introComplete, setIntroComplete] = useState(false);
  const completeIntro = useCallback(() => setIntroComplete(true), []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
        <GestureHandlerRootView
          style={{ flex: 1, backgroundColor: "#0d2b1a" }}
          onLayout={() => { void SplashScreen.hideAsync().catch(() => {}); }}
        >
          <View
            style={{ flex: 1 }}
            pointerEvents={introComplete ? "auto" : "none"}
            accessibilityElementsHidden={!introComplete}
            importantForAccessibility={introComplete ? "auto" : "no-hide-descendants"}
            aria-hidden={!introComplete}
          >
            <TableThemeProvider><RootLayoutNav /></TableThemeProvider>
          </View>
          {!introComplete && <StudioIntro onComplete={completeIntro} />}
        </GestureHandlerRootView>
      </PreferencesProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
