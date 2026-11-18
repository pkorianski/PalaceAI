import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_PREFERENCES, PREFERENCES_KEY, parsePreferences, type Preferences } from "@/lib/preferences-model";
import { setHapticsEnabled } from "@/lib/haptics";
const Context = createContext({ preferences: DEFAULT_PREFERENCES, ready: false, busy: false, error: "", reload: async () => {}, update: async (_change: Partial<Pick<Preferences, "haptics" | "reduceMotion">>) => {} });
export function PreferencesProvider({ children }: React.PropsWithChildren) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const mounted = useRef(false), saving = useRef(false), current = useRef(DEFAULT_PREFERENCES);
  const reload = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      const next = parsePreferences(await AsyncStorage.getItem(PREFERENCES_KEY));
      current.current = next;
      if (mounted.current) { setPreferences(next); setReady(true); setError(""); setHapticsEnabled(next.haptics); }
    } catch { if (mounted.current) { setReady(false); setError("Settings could not load. Your saved settings are safe. Try again."); } }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }, []);
  useEffect(() => { mounted.current = true; void reload(); return () => { mounted.current = false; setHapticsEnabled(false); }; }, [reload]);
  const update = useCallback(async (change: Partial<Pick<Preferences, "haptics" | "reduceMotion">>) => {
    if (!ready || saving.current) return;
    saving.current = true; setBusy(true);
    try {
      const next = { ...current.current, ...change };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
      current.current = next;
      if (mounted.current) { setPreferences(next); setHapticsEnabled(next.haptics); setError(""); }
    } catch { if (mounted.current) setError("That change could not save. Your previous setting is still active. Try again."); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }, [ready]);
  return <Context.Provider value={{ preferences, ready, busy, error, reload, update }}>{children}</Context.Provider>;
}
export function usePreferences() { return useContext(Context); }
