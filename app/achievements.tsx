import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  AppState,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ACHIEVEMENT_GROUPS, getUnlockedIds } from "@/lib/achievements";
import { loadMastery, equipMasteryReward } from "@/lib/mastery/storage";
import {
  TRACKS,
  TITLES,
  THEMES,
  levelFor,
  equippedTitle,
  metricValue,
  nextMilestone,
  nextReward,
  questBoard,
  themeAvailable,
  type Mastery,
} from "@/lib/mastery/model";
import { Action, Arrival, Meter, palette, ui } from "@/components/tour/ui";
import { TrophyArt } from "@/components/tour/Art";
import { LevelBadge, XpMeter, m } from "@/components/mastery/ui";
import * as Haptics from "@/lib/haptics";
const TABS = ["Mastery", "Weekly quests", "Rewards", "Starter badges"] as const;
type Tab = (typeof TABS)[number];
const RANKS = ["I", "II", "III", "IV", "V"];
export default function AchievementsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(
    params.tab === "quests" ? "Weekly quests" : "Mastery",
  );
  const [state, setState] = useState<Mastery | null>(null),
    [badges, setBadges] = useState<string[]>([]),
    [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>("days"),
    [busy, setBusy] = useState(false);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null),
    insets = useSafeAreaInsets();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const refresh = () => {
        void Promise.all([loadMastery(), getUnlockedIds()])
          .then(([s, ids]) => {
            if (active) {
              setState(s);
              setBadges(ids);
              setError("");
            }
          })
          .catch(() => {
            if (active)
              setError(
                "Your progress could not load. Your original save has been kept. Please try again.",
              );
          });
      };
      refresh();
      const timer = setInterval(refresh, 60000),
        sub = AppState.addEventListener("change", (value) => {
          if (value === "active") refresh();
        });
      return () => {
        active = false;
        clearInterval(timer);
        sub.remove();
      };
    }, []),
  );
  const equip = async (type: "title" | "theme", id: string | null) => {
    if (busy) return;
    setBusy(true);
    try {
      setState(await equipMasteryReward(type, id));
      setError("");
      void Haptics.selectionAsync();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const retry = () => {
    void loadMastery()
      .then((s) => {
        setState(s);
        setError("");
      })
      .catch(() =>
        setError("Progress still could not load. Your save has been kept."),
      );
  };
  const level = state ? levelFor(state.xp) : 1,
    next = state ? nextMilestone(state) : null;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={styles.tabs}>
        {TABS.map((name) => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityLabel={name}
            accessibilityState={{ selected: tab === name }}
            onPress={() => {
              setTab(name);
              scroll.current?.scrollTo({ y: 0, animated: false });
            }}
            style={[styles.tab, tab === name && styles.activeTab]}
          >
            <Text
              maxFontSizeMultiplier={1.3}
              style={[styles.tabText, tab === name && { color: palette.gold }]}
            >
              {name}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 18,
          paddingBottom: insets.bottom + 28,
          gap: 18,
        }}
      >
        {!!error && (
          <View accessibilityRole="alert" style={m.card}>
            <Text style={ui.error}>{error}</Text>
            <Action label="Retry progress" secondary onPress={retry} />
          </View>
        )}
        {!state && !error && (
          <ActivityIndicator
            color={palette.gold}
            accessibilityLabel="Loading achievements"
          />
        )}
        {state && (
          <>
            {tab === "Mastery" && (
              <>
                <Arrival>
                  <LinearGradient
                    colors={["#315440", "#142F29"]}
                    style={[m.card, { borderColor: "#A18647", gap: 18 }]}
                  >
                    <View style={m.row}>
                      <LevelBadge level={level} size={78} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={m.eyebrow}>YOUR PALACE LEGACY</Text>
                        <Text style={m.title}>{equippedTitle(state)}</Text>
                        <Text style={m.body}>
                          Mastery level {level} · Built one hand at a time.
                        </Text>
                      </View>
                    </View>
                    <XpMeter state={state} />
                    <Text
                      style={[m.text, { color: palette.gold, fontSize: 16 }]}
                    >
                      Next reward: {nextReward(state)}
                    </Text>
                    <View style={styles.rule} />
                    <Text style={m.body}>
                      Every finished game earns XP. Wins, pile burns, milestones
                      and weekly quests add more. Levels continue beyond the
                      last badge.
                    </Text>
                    <Text style={m.caption}>
                      Previously saved statistics count. Calendar goals start
                      with your first game using mastery.
                    </Text>
                    {next && (
                      <Text
                        style={[m.text, { fontSize: 15, color: palette.gold }]}
                      >
                        Up next: {next.track.name} {RANKS[next.index]} ·{" "}
                        {next.value.toLocaleString()} /{" "}
                        {next.target.toLocaleString()} {next.track.unit}
                      </Text>
                    )}
                  </LinearGradient>
                </Arrival>
                <View style={m.row}>
                  <Text style={[m.text, { flex: 1 }]}>The long game</Text>
                  <Text style={m.caption}>
                    {state.milestones.length} /{" "}
                    {TRACKS.reduce((n, t) => n + t.goals.length, 0)} milestones
                  </Text>
                </View>
                {TRACKS.map((track) => {
                  const value = metricValue(state, track.id),
                    count = track.goals.filter((_, i) =>
                      state.milestones.includes(`${track.id}-${i}`),
                    ).length;
                  const target =
                    track.goals[Math.min(count, track.goals.length - 1)];
                  return (
                    <View key={track.id} style={m.card}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`View ${track.name} milestones`}
                        accessibilityState={{ expanded: expanded === track.id }}
                        onPress={() =>
                          setExpanded(expanded === track.id ? null : track.id)
                        }
                        style={m.row}
                      >
                        <View style={styles.icon}>
                          <Ionicons
                            name={track.icon as any}
                            color={palette.gold}
                            size={23}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={m.text}>{track.name}</Text>
                          <Text style={m.caption}>{track.detail}</Text>
                        </View>
                        <Ionicons
                          name={
                            expanded === track.id
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          color={palette.muted}
                          size={18}
                        />
                      </Pressable>
                      <View style={[m.row, { gap: 8 }]}>
                        {track.goals.map((_, i) => {
                          const rank = RANKS[i] ?? `${i + 1}`;
                          return (
                            <View
                              key={rank}
                              style={[
                                styles.rank,
                                state.milestones.includes(`${track.id}-${i}`) &&
                                  styles.earnedRank,
                              ]}
                            >
                              <Text
                                style={{
                                  color: state.milestones.includes(
                                    `${track.id}-${i}`,
                                  )
                                    ? "#FFE2A1"
                                    : "#A4B9AA",
                                  fontSize: 12,
                                  fontFamily: "Inter_700Bold",
                                }}
                              >
                                {rank}
                              </Text>
                            </View>
                          );
                        })}
                        <Text style={[m.caption, { marginLeft: "auto" }]}>
                          {count}/{track.goals.length}
                        </Text>
                      </View>
                      <Meter value={value} total={target} />
                      <Text style={m.body}>
                        {value.toLocaleString()} / {target.toLocaleString()}{" "}
                        {track.unit}
                        {count === track.goals.length
                          ? " · Track mastered"
                          : " to next milestone"}
                      </Text>
                      {expanded === track.id &&
                        track.goals.map((goal, i) => (
                          <View key={goal} style={m.row}>
                            <Ionicons
                              name={
                                state.milestones.includes(`${track.id}-${i}`)
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                              }
                              color={
                                state.milestones.includes(`${track.id}-${i}`)
                                  ? palette.gold
                                  : palette.muted
                              }
                              size={20}
                            />
                            <Text style={[m.body, { flex: 1 }]}>
                              Rank {RANKS[i]} · {goal.toLocaleString()}{" "}
                              {track.unit}
                            </Text>
                            <Text style={m.caption}>+{150 * (i + 1)} XP</Text>
                          </View>
                        ))}
                    </View>
                  );
                })}
              </>
            )}
            {tab === "Weekly quests" && (
              <>
                <LinearGradient
                  colors={["#3D3827", "#17372D"]}
                  style={[m.card, { borderColor: "#9A7F44" }]}
                >
                  <View style={m.row}>
                    <TrophyArt size={76} />
                    <View style={{ flex: 1, gap: 7 }}>
                      <Text style={m.eyebrow}>
                        WEEK OF {state.weekly.key} · UTC
                      </Text>
                      <Text style={m.title}>
                        {state.weekly.rewarded.length === 4
                          ? "Your week. Your seal."
                          : "A fresh week. A lasting mark."}
                      </Text>
                    </View>
                  </View>
                  <Text style={m.body}>
                    Four quests. +150 XP each. Finish the board for a permanent
                    dated seal and +250 XP.
                  </Text>
                  <Meter value={state.weekly.rewarded.length} total={4} />
                  <Text style={[m.text, { color: palette.gold }]}>
                    {state.weekly.rewarded.length}/4 completed ·{" "}
                    {state.seals.length} lifetime seals
                  </Text>
                  <Text style={m.caption}>
                    Play Quick Play or Tour. Refreshes Monday at 00:00 UTC.
                    Earned XP and seals stay; missed days never erase lifetime
                    progress. Separate from the Tour’s weekly circuit.
                  </Text>
                </LinearGradient>
                {questBoard(state.weekly.key).map((q) => {
                  const done = state.weekly.rewarded.includes(q.id);
                  return (
                    <View
                      key={q.id}
                      style={[m.card, done && { borderColor: "#B69A54" }]}
                    >
                      <View style={m.row}>
                        <View style={styles.icon}>
                          <Ionicons
                            name={(done ? "checkmark" : q.icon) as any}
                            size={23}
                            color={palette.gold}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 5 }}>
                          <Text style={m.text}>{q.name}</Text>
                          <Text style={m.body}>
                            {Math.min(q.value(state), q.target)} / {q.target}{" "}
                            {q.unit}
                          </Text>
                        </View>
                      </View>
                      <Meter value={q.value(state)} total={q.target} />
                      <Text
                        style={[m.caption, done && { color: palette.gold }]}
                      >
                        {done
                          ? "+150 XP added to your legacy"
                          : "+150 XP when completed"}
                      </Text>
                    </View>
                  );
                })}
                <View style={m.card}>
                  <Text style={m.text}>Your seal collection</Text>
                  {state.seals.length ? (
                    state.seals
                      .slice(-12)
                      .reverse()
                      .map((week) => (
                        <View key={week} style={m.row}>
                          <Ionicons
                            name="ribbon"
                            size={24}
                            color={palette.gold}
                          />
                          <Text style={m.body}>
                            Week of {week} · Quest board complete
                          </Text>
                        </View>
                      ))
                  ) : (
                    <Text style={m.body}>
                      Your first seal is waiting. It takes play on three
                      different days—not three consecutive days.
                    </Text>
                  )}
                  {state.seals.length > 12 && (
                    <Text style={m.caption}>
                      Showing your latest 12 of {state.seals.length} earned
                      seals. All are preserved.
                    </Text>
                  )}
                </View>
              </>
            )}
            {tab === "Rewards" && (
              <>
                <View style={{ gap: 10 }}>
                  <Text style={m.eyebrow}>EARNED AT THE TABLE</Text>
                  <Text style={m.title}>Make your mark.</Text>
                  <Text style={m.body}>
                    Choose a title for Home and your seat at the table. Unlock
                    new looks through mastery or weekly seals. Cosmetic rewards
                    never change the rules.
                  </Text>
                </View>
                <Text style={m.text}>Player titles</Text>
                {TITLES.map((title) => (
                  <View key={title.id} style={m.card}>
                    <View style={m.row}>
                      <LevelBadge level={title.level} size={50} />
                      <View style={{ flex: 1, gap: 5 }}>
                        <Text style={m.text}>{title.name}</Text>
                        <Text style={m.caption}>
                          Mastery level {title.level}
                          {level >= title.level ? " · Unlocked" : " to unlock"}
                        </Text>
                      </View>
                    </View>
                    <Action
                      label={
                        state.title === title.id
                          ? `${title.name} equipped`
                          : level >= title.level
                            ? `Equip ${title.name}`
                            : `Reach level ${title.level}`
                      }
                      disabled={
                        busy || state.title === title.id || level < title.level
                      }
                      secondary
                      onPress={() => void equip("title", title.id)}
                    />
                  </View>
                ))}
                <Text style={m.text}>Mastery table styles</Text>
                {THEMES.map((theme) => (
                  <View
                    key={theme.id}
                    style={[
                      m.card,
                      {
                        backgroundColor: theme.table,
                        borderColor: theme.accent + "66",
                      },
                    ]}
                  >
                    <View style={m.row}>
                      {[0, 1, 2].map((i) => (
                        <View
                          key={i}
                          style={{
                            width: 30,
                            height: 42,
                            borderRadius: 5,
                            borderWidth: 1.5,
                            borderColor: theme.accent,
                            backgroundColor: theme.card,
                            transform: [{ rotate: `${(i - 1) * 8}deg` }],
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name="diamond"
                            size={13}
                            color={theme.accent}
                          />
                        </View>
                      ))}
                      <View style={{ flex: 1, gap: 5 }}>
                        <Text style={[m.text, { color: theme.accent }]}>
                          {theme.name}
                        </Text>
                        <Text style={m.caption}>
                          {theme.seals
                            ? `${theme.seals} weekly seals`
                            : `Mastery level ${theme.level}`}
                        </Text>
                      </View>
                    </View>
                    <Action
                      label={
                        state.theme === theme.id
                          ? `${theme.name} equipped`
                          : themeAvailable(state, theme.id)
                            ? `Equip ${theme.name}`
                            : theme.seals
                              ? `Earn ${theme.seals} weekly seals`
                              : `Reach level ${theme.level}`
                      }
                      disabled={
                        busy ||
                        state.theme === theme.id ||
                        !themeAvailable(state, theme.id)
                      }
                      secondary
                      onPress={() => void equip("theme", theme.id)}
                    />
                  </View>
                ))}
                <Action
                  label="Use my Tour table style"
                  secondary
                  disabled={busy || state.theme === null}
                  onPress={() => void equip("theme", null)}
                />
                <Text style={m.caption}>
                  Tour championship themes remain yours. Equipping one in the
                  Trophy room switches back to your Tour style.
                </Text>
              </>
            )}
            {tab === "Starter badges" && (
              <>
                <View style={{ gap: 10 }}>
                  <Text style={m.eyebrow}>WHERE YOUR STORY BEGAN</Text>
                  <Text style={m.title}>The original collection.</Text>
                  <Text style={m.body}>
                    Your 24 original badges keep their names, goals and earned
                    status. They’re the beginning of your legacy.
                  </Text>
                </View>
                {ACHIEVEMENT_GROUPS.map((group) => (
                  <View key={group.key} style={m.card}>
                    <Text style={m.text}>{group.label}</Text>
                    {group.tiers.map((tier) => (
                      <View key={tier.id} style={m.row}>
                        <View style={styles.icon}>
                          <Ionicons
                            name={
                              (badges.includes(tier.id)
                                ? tier.icon
                                : "lock-closed-outline") as any
                            }
                            size={22}
                            color={
                              badges.includes(tier.id)
                                ? palette.gold
                                : "#A4B9AA"
                            }
                          />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={m.text}>{tier.title}</Text>
                          <Text style={m.body}>{tier.desc}</Text>
                        </View>
                        {badges.includes(tier.id) && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color={palette.gold}
                          />
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    padding: 6,
    margin: 12,
    marginBottom: 0,
    borderRadius: 16,
    backgroundColor: "#142F29",
    gap: 3,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: { backgroundColor: "#2E4B3A" },
  tabText: {
    color: "#B3C6BA",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textAlign: "center",
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EFC77816",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#26473B",
    alignItems: "center",
    justifyContent: "center",
  },
  earnedRank: {
    backgroundColor: "#8A6D35",
    borderWidth: 1,
    borderColor: "#D4B96E",
  },
  rule: { height: 1, backgroundColor: "#C8B77C33" },
});
