import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "@/lib/haptics";
import {
  VENUES,
  RIVALS,
  TIERS,
  STYLE_LABELS,
  venueFor,
  type Rival,
} from "@/lib/tour/content";
import { loadCareer, updateCareer, careerId } from "@/lib/tour/storage";
import {
  emptyCareer,
  trophyCount,
  venueMedals,
  venueUnlocked,
  rivalUnlocked,
  tierUnlocked,
  themeUnlocked,
  startSeries,
  circuitRival,
  type Tier,
} from "@/lib/tour/model";
import {
  Arrival,
  Action,
  Eyebrow,
  Meter,
  palette,
  ui,
  useReducedMotion,
} from "@/components/tour/ui";
import { RivalPortrait, VenueScene, TrophyArt } from "@/components/tour/Art";

export default function TourScreen() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [career, setCareer] = useState(emptyCareer());
  const [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  const [tab, setTab] = useState<"journey" | "cabinet" | "circuit">("journey");
  const [chapter, setChapter] = useState(0),
    [selected, setSelected] = useState<Rival | null>(null);
  const [tier, setTier] = useState<Tier>(0),
    [busy, setBusy] = useState(false),
    [abandon, setAbandon] = useState(false);
  const [mode, setMode] = useState<"tour" | "circuit">("tour");
  const refresh = useCallback(async () => {
    try {
      const c = await loadCareer();
      setCareer(c);
      setLoaded(true);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  const venue = VENUES[chapter],
    count = trophyCount(career),
    available = venueUnlocked(career, venue.id);
  const openRival = (r: Rival, m: "tour" | "circuit" = "tour") => {
    setMode(m);
    setSelected(r);
    setTier(Math.min(2, career.trophies[r.id] || 0) as Tier);
    setError("");
  };
  const start = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const c = await updateCareer((c) =>
        startSeries(
          c,
          selected.id,
          mode === "circuit"
            ? (Math.min(2, Math.floor(c.circuit.wins / 6)) as Tier)
            : tier,
          careerId(),
          mode,
        ),
      );
      setCareer(c);
      setSelected(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push("/tour-match");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const equip = async (id: string) => {
    try {
      setCareer(
        await updateCareer((c) => {
          if (!themeUnlocked(c, id))
            throw new Error("Win this venue championship to unlock its theme.");
          return { ...c, equipped: id };
        }),
      );
      Haptics.selectionAsync();
    } catch (e) {
      setError(String(e));
    }
  };
  const medalName = (r: Rival) =>
    career.trophies[r.id] ? TIERS[career.trophies[r.id] - 1].name : "Unclaimed";
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          onPress={() => router.back()}
          style={s.back}
        >
          <Ionicons name="arrow-back" size={22} color={palette.white} />
        </Pressable>
        <View>
          <Eyebrow>PALACE • SOLO CAREER</Eyebrow>
          <Text style={s.wordmark}>The Tour</Text>
        </View>
        <View style={s.score}>
          <Ionicons name="trophy" size={15} color={palette.gold} />
          <Text style={s.scoreText}>
            {count}
            <Text style={{ color: palette.muted }}> / 48</Text>
          </Text>
        </View>
      </View>
      <View style={s.tabs}>
        {(["journey", "cabinet", "circuit"] as const).map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            onPress={() => {
              setTab(t);
              setError("");
            }}
            style={[s.tab, tab === t && s.tabActive]}
          >
            <Text style={[s.tabText, tab === t && { color: palette.gold }]}>
              {t === "journey"
                ? "Journey"
                : t === "cabinet"
                  ? "Trophy room"
                  : "Weekly circuit"}
            </Text>
          </Pressable>
        ))}
      </View>
      {!loaded ? (
        <View style={s.loading}>
          <ActivityIndicator color={palette.gold} />
          <Text style={ui.error}>{error}</Text>
          {!!error && <Action label="Try loading again" onPress={refresh} />}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            s.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {!!error && (
            <Text accessibilityRole="alert" style={ui.error}>
              {error}
            </Text>
          )}
          {career.active && (
            <View style={s.resume}>
              <Text style={[ui.subtitle, { color: palette.white }]}>
                An unfinished series is waiting.
              </Text>
              <Action
                label={`Resume • ${RIVALS.find((r) => r.id === career.active!.rivalId)?.name}`}
                onPress={() => router.push("/tour-match")}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setAbandon(true)}
                style={s.textButton}
              >
                <Text style={s.link}>Abandon series</Text>
              </Pressable>
            </View>
          )}
          {tab === "journey" && (
            <Arrival>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chapters}
              >
                {VENUES.map((v, i) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Chapter ${i + 1}: ${v.name}${venueUnlocked(career, v.id) ? "" : ", locked"}`}
                    key={v.id}
                    onPress={() => setChapter(i)}
                    style={[
                      s.chapter,
                      chapter === i && {
                        borderColor: v.accent,
                        backgroundColor: "#254038",
                      },
                    ]}
                  >
                    <Text style={[s.chapterN, { color: v.accent }]}>
                      {venueUnlocked(career, v.id) ? `0${i + 1}` : "⌑"}
                    </Text>
                    <Text style={s.chapterText}>{v.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={[s.sceneCard, { borderColor: venue.accent + "50" }]}>
                <VenueScene venue={venue} height={210} />
                <LinearGradient
                  colors={["transparent", palette.bg]}
                  style={s.sceneShade}
                />
                <View style={s.sceneLabel}>
                  <Eyebrow color={venue.accent}>
                    CHAPTER 0{chapter + 1} •{" "}
                    {available ? "YOUR JOURNEY" : "ON THE HORIZON"}
                  </Eyebrow>
                  <Text style={ui.title}>{venue.name}</Text>
                  <Text style={ui.subtitle}>{venue.subtitle}</Text>
                </View>
              </View>
              <View style={[ui.row, { marginVertical: 18 }]}>
                <Text style={[ui.subtitle, { color: venue.accent }]}>
                  {venueMedals(career, venue.id)} / 12 mastery trophies
                </Text>
                <Text style={ui.pill}>3 RIVALS + CHAMPION</Text>
              </View>
              <Meter
                value={venueMedals(career, venue.id)}
                total={12}
                color={venue.accent}
              />
              {!available && (
                <Text style={[ui.subtitle, s.gate]}>
                  Win the previous chapter’s championship and earn 6 trophies
                  there to enter. Silver rematches count toward the gate.
                </Text>
              )}
              <View style={s.pathArea}>
                <Svg
                  width="100%"
                  height="530"
                  viewBox="0 0 350 530"
                  preserveAspectRatio="none"
                  style={StyleSheet.absoluteFill}
                >
                  <Path
                    d="M60 35 C65 95 290 60 290 160 S60 180 60 290 S290 320 290 435"
                    stroke={venue.accent}
                    strokeWidth="2"
                    strokeDasharray="5 9"
                    opacity=".25"
                    fill="none"
                  />
                </Svg>
                {RIVALS.filter((r) => r.venueId === venue.id).map((r, i) => {
                  const unlocked = rivalUnlocked(career, r.id),
                    trophies = career.trophies[r.id] || 0;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${r.name}, ${r.title}. ${unlocked ? `${medalName(r)}. View challenge` : "Locked. View requirements"}`}
                      key={r.id}
                      onPress={() => openRival(r)}
                      style={[s.node, i % 2 === 1 && s.nodeRight]}
                    >
                      <View
                        style={[
                          s.portraitRing,
                          {
                            borderColor: trophies
                              ? TIERS[trophies - 1].color
                              : unlocked
                                ? venue.accent
                                : "#3C5047",
                            opacity: unlocked ? 1 : 0.55,
                          },
                        ]}
                      >
                        <RivalPortrait rival={r} size={76} />
                        <View
                          style={[
                            s.nodeBadge,
                            {
                              backgroundColor: unlocked
                                ? venue.accent
                                : "#3B5149",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              trophies
                                ? "checkmark"
                                : unlocked
                                  ? r.champion
                                    ? "trophy"
                                    : "play"
                                  : "lock-closed"
                            }
                            size={13}
                            color={palette.bg}
                          />
                        </View>
                      </View>
                      <View style={s.nodeWords}>
                        <Eyebrow color={venue.accent}>
                          {r.champion ? "CHAPTER CHAMPION" : `TABLE 0${i + 1}`}
                        </Eyebrow>
                        <Text style={s.rivalName}>{r.name}</Text>
                        <Text style={s.rivalTitle}>{r.title}</Text>
                        <Text
                          style={{
                            color: trophies
                              ? TIERS[trophies - 1].color
                              : palette.muted,
                            fontSize: 12,
                            marginTop: 6,
                          }}
                        >
                          {trophies
                            ? `${"◆".repeat(trophies)}  ${medalName(r)}`
                            : unlocked
                              ? "Take your seat →"
                              : r.champion
                                ? "Beat the three local rivals"
                                : "Unlock this chapter first"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <View style={[ui.panel, { borderColor: venue.accent + "55" }]}>
                <View style={ui.row}>
                  <View style={{ flex: 1, gap: 7 }}>
                    <Eyebrow color={venue.accent}>
                      THE CHAMPION’S REWARD
                    </Eyebrow>
                    <Text style={s.rewardName}>{venue.reward}</Text>
                    <Text style={ui.subtitle}>
                      Win the championship. Make this table and card back yours.
                    </Text>
                  </View>
                  <View style={[s.miniCard, { backgroundColor: venue.card }]}>
                    <Text style={{ color: venue.accent, fontSize: 30 }}>
                      {venue.symbol}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={s.footnote}>
                Your wins stay yours. Rematch freely. No lives, tickets or
                waiting.
              </Text>
            </Arrival>
          )}
          {tab === "cabinet" && (
            <Arrival>
              <Eyebrow>MAKE YOUR MARK</Eyebrow>
              <Text style={[ui.title, { marginTop: 8 }]}>
                A room for legends.
              </Text>
              <Text style={[ui.subtitle, { marginVertical: 12 }]}>
                Every trophy tells a story. Earn all three titles against a
                rival to master their table.
              </Text>
              {VENUES.map((v) => (
                <View key={v.id} style={[ui.panel, { marginVertical: 9 }]}>
                  <View style={ui.row}>
                    <Text style={s.rewardName}>{v.name}</Text>
                    <Text style={{ color: v.accent }}>
                      {venueMedals(career, v.id)} / 12
                    </Text>
                  </View>
                  <View style={s.shelf}>
                    {RIVALS.filter((r) => r.venueId === v.id).map((r) => {
                      const n = career.trophies[r.id] || 0;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${r.name}: ${n} trophies. View challenge`}
                          key={r.id}
                          style={s.trophySlot}
                          onPress={() => {
                            setMode("tour");
                            openRival(r);
                          }}
                        >
                          <TrophyArt
                            size={60}
                            color={n ? TIERS[n - 1].color : "#83978B"}
                            dim={!n}
                          />
                          <Text style={s.trophyName}>{r.name}</Text>
                          <Text style={s.trophyTier}>
                            {n ? TIERS[n - 1].name : "—"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
              <Text style={[ui.title, { marginTop: 22, fontSize: 26 }]}>
                Dress the table.
              </Text>
              <Text style={[ui.subtitle, { marginVertical: 12 }]}>
                Earned themes work in Quick Play and the Tour.
              </Text>
              {[
                {
                  id: "classic",
                  reward: "Palace Classic",
                  card: "#164d2a",
                  accent: palette.gold,
                  table: "#0D2B1A",
                  symbol: "♦",
                },
                ...VENUES,
              ].map((v) => {
                const unlocked = themeUnlocked(career, v.id);
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${v.reward}. ${career.equipped === v.id ? "Equipped" : unlocked ? "Equip theme" : "Win venue championship to unlock"}`}
                    key={v.id}
                    onPress={() => {
                      if (unlocked) equip(v.id);
                    }}
                    style={[
                      s.theme,
                      {
                        backgroundColor: v.table,
                        borderColor:
                          career.equipped === v.id ? v.accent : "#33483D",
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.miniCard,
                        { backgroundColor: v.card, width: 45, height: 62 },
                      ]}
                    >
                      <Text style={{ color: v.accent, fontSize: 24 }}>
                        {v.symbol}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rewardName}>{v.reward}</Text>
                      <Text style={ui.subtitle}>
                        {career.equipped === v.id
                          ? "Equipped ✓"
                          : unlocked
                            ? "Tap to equip"
                            : "Win the venue championship"}
                      </Text>
                    </View>
                    <Ionicons
                      name={unlocked ? "color-palette-outline" : "lock-closed"}
                      color={v.accent}
                      size={19}
                    />
                  </Pressable>
                );
              })}
            </Arrival>
          )}
          {tab === "circuit" && (
            <Arrival>
              <View style={[ui.panel, { borderColor: "#756240", padding: 24 }]}>
                <Eyebrow>THE WEEKLY SOLO CIRCUIT</Eyebrow>
                <TrophyArt size={116} />
                <Text style={ui.title}>{"New week.\nNew reputation."}</Text>
                <Text style={ui.subtitle}>
                  A rotating lineup of AI rivals. Six wins per division. Three
                  divisions to conquer. Losses never remove wins.
                </Text>
                <Text style={ui.pill}>WEEK OF {career.circuit.week} • UTC</Text>
                <Text style={s.rewardName}>
                  {
                    [
                      "Bronze circuit",
                      "Silver circuit",
                      "Gold circuit",
                      "Circuit champion",
                    ][Math.min(3, Math.floor(career.circuit.wins / 6))]
                  }
                </Text>
                <Meter value={career.circuit.wins} total={18} />
                <Text style={ui.subtitle}>
                  {career.circuit.wins} / 18 wins • {career.circuit.attempts}{" "}
                  matches played
                </Text>
                {count < 3 ? (
                  <Text style={ui.subtitle}>
                    Earn 3 Tour trophies to enter your first circuit.
                  </Text>
                ) : career.circuit.wins >= 18 ? (
                  <Text style={{ color: palette.gold, fontSize: 17 }}>
                    This week’s crown is yours. Your ribbon is saved.
                  </Text>
                ) : (
                  <>
                    <View style={ui.row}>
                      <RivalPortrait rival={circuitRival(career)} size={70} />
                      <View style={{ flex: 1 }}>
                        <Eyebrow>NEXT AT THE TABLE</Eyebrow>
                        <Text style={s.rivalName}>
                          {circuitRival(career).name}
                        </Text>
                        <Text style={ui.subtitle}>
                          {STYLE_LABELS[circuitRival(career).style]}
                        </Text>
                      </View>
                    </View>
                    <Action
                      disabled={!!career.active}
                      label="Enter the circuit"
                      onPress={() => openRival(circuitRival(career), "circuit")}
                    />
                  </>
                )}
                <Text style={s.footnote}>
                  Solo competition, saved on this device. Resets Monday at 00:00
                  UTC. Earned weekly ribbons stay in your collection.
                </Text>
              </View>
              {Object.entries(career.ribbons)
                .filter(([, n]) => n > 0)
                .map(([week, n]) => (
                  <View key={week} style={[ui.panel, { marginTop: 14 }]}>
                    <Text style={s.rewardName}>
                      ◆ {["", "Bronze", "Silver", "Gold"][n]} circuit ribbon
                    </Text>
                    <Text style={ui.subtitle}>Week of {week}</Text>
                  </View>
                ))}
            </Arrival>
          )}
        </ScrollView>
      )}
      <Modal
        visible={!!selected}
        transparent
        animationType={reducedMotion ? "none" : "fade"}
        onRequestClose={() => setSelected(null)}
      >
        <View style={s.modalVeil}>
          <ScrollView contentContainerStyle={s.modalScroll}>
            <Arrival style={{ width: "100%", maxWidth: 440 }}>
              {selected && (
                <View
                  style={[
                    ui.panel,
                    {
                      padding: 24,
                      borderColor: venueFor(selected).accent + "80",
                    },
                  ]}
                >
                  <View style={ui.row}>
                    <Eyebrow color={venueFor(selected).accent}>
                      {mode === "circuit"
                        ? "WEEKLY SOLO CIRCUIT"
                        : venueFor(selected).name}
                    </Eyebrow>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close rival"
                      onPress={() => setSelected(null)}
                      style={s.back}
                    >
                      <Ionicons name="close" size={22} color={palette.white} />
                    </Pressable>
                  </View>
                  <View style={{ alignItems: "center", gap: 12 }}>
                    <RivalPortrait rival={selected} size={132} />
                    <Text style={s.versus}>
                      YOU / {selected.name.toUpperCase()}
                    </Text>
                    <Text style={ui.title}>{selected.name}</Text>
                    <Text
                      style={{ color: venueFor(selected).accent, fontSize: 15 }}
                    >
                      {selected.title}
                    </Text>
                    <Text
                      style={[
                        ui.subtitle,
                        { textAlign: "center", fontStyle: "italic" },
                      ]}
                    >{`“${selected.intro}”`}</Text>
                    <Text style={ui.pill}>{STYLE_LABELS[selected.style]}</Text>
                  </View>
                  {mode === "tour" && (
                    <View style={s.tiers}>
                      {TIERS.map((t, i) => (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${t.name}, ${t.format}${tierUnlocked(career, selected.id, i as Tier) ? "" : ", locked"}`}
                          key={t.name}
                          onPress={() => setTier(i as Tier)}
                          style={[
                            s.tier,
                            tier === i && {
                              borderColor: t.color,
                              backgroundColor: "#FFFFFF0D",
                            },
                          ]}
                        >
                          <Text style={{ color: t.color, fontSize: 22 }}>
                            ◆
                          </Text>
                          <Text style={s.tierName}>{t.name}</Text>
                          <Text style={s.tierDetail}>{t.format}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <Text style={ui.subtitle}>
                    {mode === "circuit"
                      ? "One game. A win advances your division; a loss lets you try again."
                      : `${TIERS[tier].format}. ${tier === 0 ? "Beat this rival to claim your first title." : `First to ${TIERS[tier].target} wins. Your rival makes sharper endgame decisions.`}`}
                  </Text>
                  {!!error && <Text style={ui.error}>{error}</Text>}
                  {mode === "tour" &&
                  !tierUnlocked(career, selected.id, tier) ? (
                    <Text style={ui.error}>
                      {!venueUnlocked(career, selected.venueId)
                        ? "Unlock this chapter through the previous championship and 6 local trophies."
                        : !rivalUnlocked(career, selected.id)
                          ? "Beat this chapter’s three rivals at Bronze to challenge the champion."
                          : "Earn the previous trophy tier against this rival first."}
                    </Text>
                  ) : career.active ? (
                    <Text style={ui.subtitle}>
                      Resume or abandon your current series before starting
                      another.
                    </Text>
                  ) : (
                    <Action
                      disabled={busy}
                      label={busy ? "Taking your seat…" : "Take your seat"}
                      onPress={start}
                    />
                  )}
                  <Action
                    secondary
                    label="Back to the tour"
                    onPress={() => setSelected(null)}
                    icon="arrow-back"
                  />
                </View>
              )}
            </Arrival>
          </ScrollView>
        </View>
      </Modal>
      <Modal
        visible={abandon}
        transparent
        animationType={reducedMotion ? "none" : "fade"}
        onRequestClose={() => setAbandon(false)}
      >
        <View style={s.modalVeil}>
          <View style={[ui.panel, { margin: 24 }]}>
            <Text style={ui.title}>Leave this series?</Text>
            <Text style={ui.subtitle}>
              The current deal and series score will be cleared. All earned
              trophies and weekly wins stay yours.
            </Text>
            <Action label="Keep playing" onPress={() => setAbandon(false)} />
            <Action
              secondary
              label="Abandon this series"
              onPress={async () => {
                try {
                  setCareer(
                    await updateCareer((c) => ({ ...c, active: null })),
                  );
                  setAbandon(false);
                } catch (e) {
                  setError(String(e));
                  setAbandon(false);
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#FFFFFF08",
  },
  wordmark: {
    color: palette.white,
    fontFamily: "Inter_700Bold",
    fontSize: 25,
    letterSpacing: -0.8,
  },
  score: {
    flexDirection: "row",
    gap: 7,
    marginLeft: "auto",
    alignItems: "center",
  },
  scoreText: { color: palette.gold, fontFamily: "Inter_700Bold", fontSize: 14 },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 18,
    backgroundColor: "#FFFFFF06",
    borderRadius: 13,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#294235" },
  tabText: {
    fontFamily: "Inter_600SemiBold",
    color: palette.muted,
    fontSize: 12,
  },
  content: { padding: 20, maxWidth: 540, width: "100%", alignSelf: "center" },
  loading: { padding: 30, gap: 20 },
  chapters: { gap: 8, paddingBottom: 17 },
  chapter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#294538",
    borderRadius: 12,
    padding: 12,
  },
  chapterN: { fontFamily: "Inter_700Bold", fontSize: 12 },
  chapterText: {
    color: palette.white,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  sceneCard: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
    height: 280,
  },
  sceneShade: { position: "absolute", top: 100, left: 0, right: 0, bottom: 0 },
  sceneLabel: { position: "absolute", bottom: 18, left: 20, right: 16, gap: 8 },
  gate: {
    marginTop: 14,
    padding: 14,
    backgroundColor: "#FFFFFF07",
    borderRadius: 12,
  },
  pathArea: { position: "relative", paddingVertical: 16, gap: 18 },
  node: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 112,
    paddingHorizontal: 7,
    width: "94%",
  },
  nodeRight: { alignSelf: "flex-end", paddingLeft: 30 },
  portraitRing: { borderWidth: 2, borderRadius: 26, padding: 4 },
  nodeBadge: {
    position: "absolute",
    bottom: -4,
    right: -3,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: palette.bg,
  },
  nodeWords: { flex: 1, gap: 3, backgroundColor: palette.bg },
  rivalName: {
    color: palette.white,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  rivalTitle: { color: palette.muted, fontSize: 13 },
  rewardName: {
    color: palette.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  miniCard: {
    width: 58,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E8D8AC70",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "9deg" }],
  },
  footnote: {
    color: "#8CA494",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    paddingVertical: 18,
  },
  resume: {
    padding: 16,
    backgroundColor: "#284536",
    borderRadius: 18,
    marginBottom: 18,
    gap: 12,
  },
  textButton: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  link: { color: palette.muted, fontSize: 12, textDecorationLine: "underline" },
  shelf: {
    flexDirection: "row",
    borderBottomWidth: 3,
    borderBottomColor: "#A28A5860",
    paddingBottom: 12,
  },
  trophySlot: { flex: 1, alignItems: "center", minHeight: 100 },
  trophyName: { color: palette.white, fontSize: 11, marginTop: 3 },
  trophyTier: { color: palette.muted, fontSize: 10, marginTop: 4 },
  theme: {
    borderWidth: 1.5,
    padding: 18,
    borderRadius: 17,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  modalVeil: {
    flex: 1,
    backgroundColor: "#020F0DEB",
    justifyContent: "center",
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  versus: {
    fontSize: 10,
    letterSpacing: 3,
    color: palette.gold,
    marginTop: 8,
    fontFamily: "Inter_700Bold",
  },
  tiers: { flexDirection: "row", gap: 7, marginTop: 12 },
  tier: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#365044",
    borderRadius: 12,
    gap: 5,
  },
  tierName: {
    color: palette.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  tierDetail: { color: palette.muted, fontSize: 9 },
});
