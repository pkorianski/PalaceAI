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
import { StudioIntro } from "@/components/brand/StudioIntro";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TableThemeProvider } from "@/components/tour/ThemeProvider";
import { queryClient } from "@/lib/query-client";

void SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen
        name="game"
        options={{
          animation: "slide_from_right",
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen name="tour" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="tour-match" options={{ gestureEnabled: false, animation: "fade" }} />
      <Stack.Screen name="rules" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen
        name="achievements"
        options={{
          headerShown: true,
          headerTitle: "Achievements",
          headerStyle: { backgroundColor: "#0d2b1a" },
          headerTintColor: "#D4AF37",
          headerTitleStyle: { fontFamily: "Inter_700Bold", fontSize: 18 },
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="stats"
        options={{
          headerShown: true,
          headerTitle: "Statistics",
          headerStyle: { backgroundColor: "#0d2b1a" },
          headerTintColor: "#D4AF37",
          headerTitleStyle: { fontFamily: "Inter_700Bold", fontSize: 18 },
          animation: "slide_from_bottom",
        }}
      />
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
