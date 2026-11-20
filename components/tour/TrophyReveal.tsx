import React, { useEffect, useRef } from "react";
import { Animated, Platform } from "react-native";
import { useReducedMotion } from "./ui";
export function TrophyReveal({ celebrate, children }: React.PropsWithChildren<{ celebrate: boolean }>) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    scale.setValue(1);
    if (!celebrate || reduced) return;
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 220, useNativeDriver: Platform.OS !== "web" }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: Platform.OS !== "web" }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [celebrate, reduced, scale]);
  return <Animated.View style={{ transform: [{ scale }], padding: celebrate ? 12 : 0, borderRadius: 100, backgroundColor: celebrate ? "#34452B" : "transparent" }}>{children}</Animated.View>;
}
