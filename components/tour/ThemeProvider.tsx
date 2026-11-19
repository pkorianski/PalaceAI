import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { usePathname } from "expo-router";
import { VENUES } from "@/lib/tour/content";
import { loadCareer } from "@/lib/tour/storage";
import { loadMastery } from "@/lib/mastery/storage";
import { THEMES, themeAvailable } from "@/lib/mastery/model";
const classic = {
  card: "#164d2a",
  table: "#0d2b1a",
  accent: "#D4AF37",
  name: "Classic",
};
const Context = createContext(classic);
export function TableThemeProvider({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const [theme, set] = useState(classic);
  useEffect(() => {
    const refresh = () =>
      Promise.all([loadCareer(), loadMastery()])
        .then(([c, mastery]) => {
          const reward = THEMES.find(t => t.id === mastery.theme && themeAvailable(mastery, t.id));
          if (reward) { set({ table: reward.table, card: reward.card, accent: reward.accent, name: reward.name }); return; }
          const v = VENUES.find((v) => v.id === c.equipped);
          set(
            v
              ? {
                  card: v.card,
                  table: v.table,
                  accent: v.accent,
                  name: v.reward,
                }
              : classic,
          );
        })
        .catch(() => {});
    refresh();
    const subscription = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => {
      subscription.remove();
    };
  }, [pathname]);
  return <Context.Provider value={theme}>{children}</Context.Provider>;
}
export function useTableTheme() {
  return useContext(Context);
}
