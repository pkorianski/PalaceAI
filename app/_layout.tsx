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
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";

SplashScreen.preventAutoHideAsync();

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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0d2b1a" }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
