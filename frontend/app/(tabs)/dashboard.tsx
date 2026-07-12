import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/themeContext";
import { useAuth } from "../../lib/auth";
import { fontFamily, radii } from "../../lib/theme";
import { Kicker, Disclaimer } from "../../components/UI";
import { TierBadge, MinutesPill } from "../../components/Badges";
import { FadeInUp } from "../../components/Animated";
import { api } from "../../lib/api";
import { cacheGet, cacheSet } from "../../lib/cache";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TODAY_KEY = () => `dashboard.${new Date().toISOString().slice(0, 10)}`;

const NATURE_LABEL = {
  best: "PEAK",
  good: "GOOD",
  avoid: "AVOID",
  neutral: "—",
} as const;

function getDashboardChoghadia(day: any[] = []) {
  const rows: any[] = [];

  // Find consecutive Labh -> Amrit
  for (let i = 0; i < day.length - 1; i++) {
    if (day[i].muhurta === "Labh" && day[i + 1].muhurta === "Amrit") {
      rows.push(day[i]);
      rows.push(day[i + 1]);
      break;
    }
  }

  // First Udveg
  const udveg = day.find((x) => x.muhurta === "Udveg");
  if (udveg) rows.push(udveg);

  // First Kaal
  const kaal = day.find((x) => x.muhurta === "Kaal");
  if (kaal) rows.push(kaal);

  return rows;
}

export default function Dashboard() {
  const { c } = useTheme();
  const router = useRouter();
  const { user, creditsBalanceSec, refresh } = useAuth();
  const [data, setData] = useState<any>(null);
  const [chogApi, setChogApi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bonusVisible, setBonusVisible] = useState(false);

  const toastOp = useRef(new Animated.Value(0)).current;
  const toastTr = useRef(new Animated.Value(0)).current;

  const showBonus = () => {
    setBonusVisible(true);
    Animated.parallel([
      Animated.timing(toastOp, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(toastTr, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOp, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(toastTr, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => setBonusVisible(false));
    }, 3200);
  };

  const load = async () => {
    try {
      const cached = await cacheGet<any>(TODAY_KEY());
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      // Ensure we have a stored location; if not, ask for permission first
      const locRaw = await AsyncStorage.getItem("orivo.location");
      console.log("locRaw", locRaw);
      if (!locRaw) {
        router.push("/location-permission");
        return;
      }
      try {
        const loc = JSON.parse(locRaw);
        const date = new Date().toISOString().slice(0, 10);
        const lat = encodeURIComponent(String(loc.lat));
        const lon = encodeURIComponent(String(loc.lon));
        const ch = await api.get(
          `/astro/choghadia?date=${date}&lat=${lat}&lon=${lon}`,
        );
        setChogApi(ch.payload || ch.payload || ch);
      } catch (e) {
        
      }

      const b = await api.get("/dashboard/today");
      setData(b);
      await cacheSet(TODAY_KEY(), b, 1000 * 60 * 60 * 6);
      await refresh();
      if (b.dailyLoginBonusGranted) showBonus();
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await load();
        setLoading(false);
      })();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const dateObj = data?.date ? new Date(data.date) : new Date();
  const dayName =
    data?.dayName || dateObj.toLocaleDateString(undefined, { weekday: "long" });
  const dateLabel = dateObj.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const firstName = (user?.name || "Founder").split(" ")[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      {bonusVisible && (
        <Animated.View
          testID="login-bonus-toast"
          style={{
            position: "absolute",
            top: 12,
            left: 16,
            right: 16,
            zIndex: 10,
            opacity: toastOp,
            transform: [
              {
                translateY: toastTr.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              backgroundColor: c.surface,
              borderColor: c.gold,
              borderWidth: 1,
              borderRadius: radii.md,
              paddingVertical: 10,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "rgba(201,169,97,0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={14} color={c.gold} />
            </View>
            <Text
              style={{ color: c.textPrimary, fontSize: 13, fontWeight: "600" }}
            >
              +10 seconds added
            </Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor={c.gold}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Small header line */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 18,
            paddingBottom: 12,
          }}
        >
          <View>
            <Text
              style={{
                color: c.textMuted,
                fontSize: 10,
                letterSpacing: 1.6,
                fontWeight: "700",
              }}
            >
              ORIVO
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 2,
              }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                {firstName}
              </Text>
              <View
                style={{
                  width: 2,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: c.textMuted,
                }}
              />
              <TierBadge tier={user?.tier} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <MinutesPill
              testID="dash-minutes-pill"
              seconds={creditsBalanceSec}
            />
            <Pressable
              testID="dash-notif-bell"
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={c.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {loading || !data ? (
          <View style={{ paddingVertical: 100, alignItems: "center" }}>
            <ActivityIndicator color={c.gold} />
          </View>
        ) : (
          <>
            {/* Card 1: Date + Day + Description + Color */}
            <FadeInUp index={0}>
              <View
                testID="day-card"
                style={{
                  backgroundColor: c.surface,
                  borderRadius: radii.lg,
                  borderColor: c.border,
                  borderWidth: 1,
                  padding: 22,
                  overflow: "hidden",
                }}
              >
                {/* soft ambient glow of the day color */}
                <View
                  style={{
                    position: "absolute",
                    right: -60,
                    top: -60,
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    backgroundColor: data.color?.hex,
                    opacity: 0.08,
                  }}
                />

                <Kicker>Today</Kicker>
                <Text
                  style={{
                    color: c.textPrimary,
                    fontFamily: fontFamily.display,
                    fontSize: 34,
                    fontWeight: "500",
                    letterSpacing: -0.6,
                    marginTop: 4,
                    lineHeight: 40,
                  }}
                >
                  {dayName}
                </Text>
                <Text
                  style={{
                    color: c.textSecondary,
                    fontFamily: fontFamily.mono,
                    fontSize: 12,
                    marginTop: 2,
                    letterSpacing: 0.5,
                  }}
                >
                  {dateLabel}
                </Text>

                <View
                  style={{
                    height: 1,
                    backgroundColor: c.border,
                    marginVertical: 16,
                  }}
                />

                <Text
                  style={{ color: c.textPrimary, fontSize: 15, lineHeight: 23 }}
                >
                  {data.dayDescription?.description}
                </Text>

                {/* Color-of-the-day chip */}
                <View
                  testID="color-of-day"
                  style={{
                    marginTop: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: radii.md,
                    backgroundColor: c.surfaceMuted,
                    borderColor: c.border,
                    borderWidth: 1,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: data.color?.hex,
                      borderColor: c.border,
                      borderWidth: 1,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: c.textMuted,
                        fontSize: 10,
                        letterSpacing: 1.4,
                        fontWeight: "700",
                      }}
                    >
                      WEAR TODAY
                    </Text>
                    <Text
                      style={{
                        color: c.textPrimary,
                        fontSize: 14,
                        fontFamily: fontFamily.display,
                        fontWeight: "600",
                        marginTop: 2,
                      }}
                    >
                      {data.color?.name}
                    </Text>
                    <Text
                      style={{
                        color: c.textSecondary,
                        fontSize: 11,
                        marginTop: 2,
                        lineHeight: 15,
                      }}
                    >
                      {data.color?.reason}
                    </Text>
                  </View>
                </View>
              </View>
            </FadeInUp>

            {/* Card 2: Decision windows */}
            <FadeInUp index={1} style={{ marginTop: 14 }}>
              <View
                testID="decision-windows-card"
                style={{
                  backgroundColor: c.surface,
                  borderRadius: radii.lg,
                  borderColor: c.border,
                  borderWidth: 1,
                  padding: 22,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <View>
                    <Kicker>Peak decision windows</Kicker>
                    <Text
                      style={{
                        color: c.textPrimary,
                        fontFamily: fontFamily.display,
                        fontSize: 20,
                        fontWeight: "500",
                        marginTop: 4,
                      }}
                    >
                      The best and hardest hours today.
                    </Text>
                  </View>
                  <Ionicons name="hourglass-outline" size={18} color={c.gold} />
                </View>

                {chogApi?.chaughadiya?.day ? (
                  getDashboardChoghadia(chogApi.chaughadiya.day).map(
                    (it: any, i: number) => (
                      <DayRow
                        key={`day-${i}`}
                        item={it}
                        testID={`choghadia-day-${i}`}
                      />
                    ),
                  )
                ) : (
                  <>
                    {data.decisionWindows?.good?.map(
                      (window: any, i: number) => (
                        <WindowRow
                          key={`good-${i}`}
                          window={window}
                          tone="good"
                          testID={`decision-window-good-${i}`}
                        />
                      ),
                    )}

                    <View style={{ height: 12 }} />

                    {data.decisionWindows?.avoid?.map(
                      (window: any, i: number) => (
                        <WindowRow
                          key={`avoid-${i}`}
                          window={window}
                          tone="avoid"
                          testID={`decision-window-avoid-${i}`}
                        />
                      ),
                    )}
                  </>
                )}
              </View>
            </FadeInUp>

            {/* Two report tiles */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
              <FadeInUp index={2} style={{ flex: 1 }}>
                <ReportTile
                  testID="tile-soul"
                  icon="compass-outline"
                  kicker="DHARMA"
                  title="Soul Purpose"
                  subtitle="& potential profession"
                  onPress={() => router.push("/self/soul-purpose")}
                />
              </FadeInUp>
              <FadeInUp index={3} style={{ flex: 1 }}>
                <ReportTile
                  testID="tile-inner"
                  icon="prism-outline"
                  kicker="SELF"
                  title="Inner Profile"
                  subtitle="nature, strengths, image"
                  onPress={() => router.push("/self/inner-profile")}
                />
              </FadeInUp>
            </View>

            <FadeInUp index={4} style={{ marginTop: 14 }}>
              <CurrentPeriodCard
                period={data.currentPeriod}
                testID="current-period-card"
              />
            </FadeInUp>

            <Disclaimer />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CurrentPeriodCard({
  period,
  testID,
}: {
  period: any;
  testID?: string;
}) {
  const { c } = useTheme();
  const coveredPct = period?.totalDays
    ? Math.round((period.coveredDays / period.totalDays) * 100)
    : 0;
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: c.surface,
        borderRadius: radii.lg,
        borderColor: c.border,
        borderWidth: 1,
        padding: 22,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <View>
          <Kicker>CURRENT PERIOD</Kicker>
          <Text
            style={{
              color: c.textPrimary,
              fontFamily: fontFamily.display,
              fontSize: 20,
              fontWeight: "500",
              marginTop: 4,
            }}
          >
            {period?.start
              ? new Date(period.start).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "—"}{" "}
            —{" "}
            {period?.end
              ? new Date(period.end).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </Text>
        </View>
        <Text
          style={{
            color: c.textSecondary,
            fontSize: 11,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          {period?.coveredDays ?? 0}/{period?.totalDays ?? 0} days covered
        </Text>
      </View>

      {period?.summary ? (
        <Text
          style={{
            color: c.textSecondary,
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 16,
          }}
        >
          {period.summary}
        </Text>
      ) : null}

      <View
        style={{
          height: 12,
          backgroundColor: c.surfaceMuted,
          borderRadius: radii.md,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${coveredPct}%`,
            height: 12,
            backgroundColor: c.gold,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <Text style={{ color: c.textMuted, fontSize: 11 }}>
          {coveredPct}% complete
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 11 }}>
          {period?.remainingDays ?? 0} days left
        </Text>
      </View>
    </View>
  );
}

function WindowRow({
  window,
  tone,
  testID,
}: {
  window: any;
  tone: "good" | "avoid";
  testID?: string;
}) {
  const { c } = useTheme();
  const accent = tone === "good" ? c.teal : c.terracotta;
  return (
    <View
      testID={testID}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderColor: c.border,
      }}
    >
      <View
        style={{
          width: 3,
          minHeight: 40,
          borderRadius: 2,
          backgroundColor: accent,
          marginTop: 4,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: "700" }}>
          {shortTime(window.start)} — {shortTime(window.end)}
        </Text>
        <Text
          style={{
            color: c.textSecondary,
            fontSize: 12,
            marginTop: 6,
            lineHeight: 18,
          }}
        >
          {window.note}
        </Text>
      </View>
    </View>
  );
}

// function DayRow({ item, testID }: { item: any; testID?: string }) {
//   const { c } = useTheme();
//   // Map muhurta names to tones
//   const toneMap: Record<string, "good" | "avoid" | "neutral"> = {
//     Amrit: "good",
//     Shubh: "good",
//     Labh: "good",
//     Char: "neutral",
//     Rog: "avoid",
//     Kaal: "avoid",
//     Udveg: "avoid",
//   };
//   const mu = item.muhurta || item.name || "—";
//   const tone = toneMap[mu] || "neutral";
//   const accent =
//     tone === "good" ? c.teal : tone === "avoid" ? c.terracotta : c.border;
//   return (
//     <View
//       testID={testID}
//       style={{
//         flexDirection: "row",
//         alignItems: "flex-start",
//         gap: 12,
//         paddingVertical: 10,
//         borderTopWidth: 1,
//         borderColor: c.border,
//       }}
//     >
//       <View
//         style={{
//           width: 3,
//           minHeight: 40,
//           borderRadius: 2,
//           backgroundColor: accent,
//           marginTop: 4,
//         }}
//       />
//       <View style={{ flex: 1 }}>
//         <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: "700" }}>
//           {mu === "Labh" || mu === "Amrit" ? "Best Time" : "Avoid Time"}
//         </Text>

//         <Text
//           style={{
//             color: tone === "good" ? c.teal : c.terracotta,
//             fontSize: 11,
//             fontWeight: "600",
//             marginTop: 2,
//           }}
//         >
//           {mu}
//         </Text>
//         <Text
//           style={{
//             color: c.textSecondary,
//             fontSize: 12,
//             marginTop: 6,
//             lineHeight: 18,
//           }}
//         >
//           {item.time}
//         </Text>
//       </View>
//     </View>
//   );
// }
function DayRow({ item, testID }: { item: any; testID?: string }) {
  const { c } = useTheme();

  const mu = item.muhurta || item.name || "—";

  const config: Record<
    string,
    {
      tone: "good" | "avoid" | "neutral";
      title: string;
      subtitle: string;
    }
  > = {
    Labh: {
      tone: "good",
      title: "Business Growth",
      subtitle:
        "Ideal for investments, negotiations, client meetings and financial decisions.",
    },
    Amrit: {
      tone: "good",
      title: "High Impact Decisions",
      subtitle:
        "Perfect for signing agreements, launching initiatives and making important executive decisions.",
    },
    Udveg: {
      tone: "avoid",
      title: "Avoid Major Decisions",
      subtitle:
        "Delay negotiations, important meetings and financial commitments if possible.",
    },
    Kaal: {
      tone: "avoid",
      title: "High Risk Period",
      subtitle:
        "Avoid investments, contracts and starting new ventures. Use this time for routine work.",
    },
  };

  const row = config[mu] ?? {
    tone: "neutral",
    title: mu,
    subtitle: "",
  };

  const accent =
    row.tone === "good"
      ? c.teal
      : row.tone === "avoid"
        ? c.terracotta
        : c.border;

  return (
    <View
      testID={testID}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderColor: c.border,
      }}
    >
      <View
        style={{
          width: 4,
          minHeight: 56,
          borderRadius: 4,
          backgroundColor: accent,
          marginTop: 2,
        }}
      />

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: c.textPrimary,
            fontSize: 15,
            fontWeight: "700",
          }}
        >
          {row.title}
        </Text>

        <Text
          style={{
            color: c.textSecondary,
            fontSize: 12,
            lineHeight: 18,
            marginTop: 4,
          }}
        >
          {row.subtitle}
        </Text>

        <Text
          style={{
            color: accent,
            fontSize: 12,
            fontWeight: "700",
            marginTop: 10,
            letterSpacing: 0.3,
          }}
        >
          {item.time}
        </Text>
      </View>
    </View>
  );
}

function ReportTile({ icon, kicker, title, subtitle, onPress, testID }: any) {
  const { c } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }: any) => ({
        backgroundColor: pressed ? c.surfaceAlt : c.surface,
        borderRadius: radii.lg,
        borderColor: c.border,
        borderWidth: 1,
        padding: 18,
        minHeight: 140,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: "rgba(201,169,97,0.10)",
          borderColor: "rgba(201,169,97,0.28)",
          borderWidth: 1,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <Ionicons name={icon} size={16} color={c.gold} />
      </View>
      <Text
        style={{
          color: c.gold,
          fontSize: 10,
          letterSpacing: 1.5,
          fontWeight: "700",
        }}
      >
        {kicker}
      </Text>
      <Text
        style={{
          color: c.textPrimary,
          fontSize: 16,
          fontFamily: fontFamily.display,
          fontWeight: "500",
          marginTop: 4,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: c.textSecondary,
          fontSize: 11,
          marginTop: 4,
          lineHeight: 15,
        }}
      >
        {subtitle}
      </Text>
      <View style={{ flex: 1 }} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginTop: 8,
        }}
      >
        <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: "600" }}>
          Open
        </Text>
        <Ionicons name="arrow-forward" size={11} color={c.textMuted} />
      </View>
    </Pressable>
  );
}

function shortTime(iso?: string) {
  if (!iso) return "—";
  if (iso.length <= 5) return iso;
  return iso.slice(-5);
}
