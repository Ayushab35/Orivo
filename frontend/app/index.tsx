import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../lib/themeContext";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import AstrologyLoader from "../components/AstrologyLoader";

const BIRTH_CHART_CACHE_KEY = "orivo.birthChart";
const PROFILE_STORAGE_KEY = "orivo.birthProfile";

function OrivoSplash() {
  return (
    <View
      testID="splash-screen"
      style={{
        flex: 1,
        backgroundColor: "#F8F4EE",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
      }}
    >
      {/* Logo */}
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 20,
          backgroundColor: "#1F2748",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 42,
            fontWeight: "500",
            color: "#D6A23A",
          }}
        >
          O
        </Text>
      </View>

      {/* Brand */}
      <Text
        style={{
          marginTop: 20,
          fontSize: 28,
          fontWeight: "700",
          letterSpacing: 2,
          color: "#2D2D2D",
        }}
      >
        ORIVO
      </Text>

      {/* Tagline */}
      <Text
        style={{
          marginTop: 12,
          fontSize: 13,
          letterSpacing: 5,
          color: "#8C8C8C",
          textAlign: "center",
        }}
      >
        PRIVATE DECISION SUPPORT
      </Text>

      {/* Loader */}
      <ActivityIndicator
        size="small"
        color="#D6B26A"
        style={{ marginTop: 48 }}
      />
    </View>
  );
}

// export default function Splash() {
//   const { c } = useTheme();
//   const { ready, user } = useAuth();
//   const [loadingAstro, setLoadingAstro] = useState(false);
//   const [astroReady, setAstroReady] = useState(false);
//   const [minimumSplashDone, setMinimumSplashDone] = useState(false);

//   useEffect(() => {
//     if (!ready || !user || !user.onboarded) return;

//     let cancelled = false;

//     const preloadBirthChart = async () => {
//       try {
//         const cached = await AsyncStorage.getItem(BIRTH_CHART_CACHE_KEY);

//         if (cached) {
//           if (!cancelled) {
//             setAstroReady(true);
//           }
//           return;
//         }

//         setLoadingAstro(true);

//         const storedProfileRaw =
//           await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
//         const storedProfile = storedProfileRaw
//           ? JSON.parse(storedProfileRaw)
//           : null;
//         console.log(
//           "Preloading birth chart with stored profile:",
//           storedProfileRaw,
//           storedProfile,
//         );
//         const payload: Record<string, any> = {
//           day: undefined,
//           month: undefined,
//           year: undefined,
//           hour: undefined,
//           minute: undefined,
//           lat: undefined,
//           lon: undefined,
//           tzone: undefined,
//         };

//         if (storedProfile?.birthDate) {
//           const [year, month, day] = storedProfile.birthDate
//             .split("-")
//             .map((value: string) => Number(value));
//           if (
//             !Number.isNaN(year) &&
//             !Number.isNaN(month) &&
//             !Number.isNaN(day)
//           ) {
//             payload.day = day;
//             payload.month = month;
//             payload.year = year;
//           }
//         }

//         if (storedProfile?.birthTime) {
//           const [hour, minute] = storedProfile.birthTime
//             .split(":")
//             .map((value: string) => Number(value));
//           if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
//             payload.hour = hour;
//             payload.minute = minute;
//           }
//         }

//         if (storedProfile?.birthLat != null)
//           payload.lat = Number(storedProfile.birthLat);
//         if (storedProfile?.birthLng != null)
//           payload.lon = Number(storedProfile.birthLng);
//         console.log("Preloading birth chart with payload:", payload);
//         const chart = await api.post("/astro/birth-chart", payload);
//         await AsyncStorage.setItem(
//           BIRTH_CHART_CACHE_KEY,
//           JSON.stringify(chart),
//         );
//       } catch (error) {
//         await AsyncStorage.setItem(
//           BIRTH_CHART_CACHE_KEY,
//           JSON.stringify({ fallback: true, error: String(error) }),
//         );
//       } finally {
//         if (!cancelled) {
//           setLoadingAstro(false);
//           setAstroReady(true);
//         }
//       }
//     };

//     preloadBirthChart();
//     return () => {
//       cancelled = true;
//     };
//   }, [ready, user]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setMinimumSplashDone(true);
//     }, 1500);

//     return () => clearTimeout(timer);
//   }, []);

//   if (!minimumSplashDone || loadingAstro || !astroReady) {
//     return <OrivoSplash />;
//   }

//   if (!user) return <Redirect href="/onboarding" />;
//   if (!user.onboarded) return <Redirect href="/birth-details" />;
//   if (loadingAstro || !astroReady) return <AstrologyLoader />;
//   return <Redirect href="/(tabs)/dashboard" />;
// }
export default function Splash() {
  const { ready, user } = useAuth();
  console.log("AUTH STATE", {
    ready,
    user,
  });
  const [loadingAstro, setLoadingAstro] = useState(false);
  const [astroReady, setAstroReady] = useState(false);
  const [minimumSplashDone, setMinimumSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumSplashDone(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;

    // No astro preload required for unauthenticated users
    if (!user) {
      setAstroReady(true);
      return;
    }

    // No astro preload required before onboarding
    if (!user.onboarded) {
      setAstroReady(true);
      return;
    }

    let cancelled = false;

    const preloadBirthChart = async () => {
      try {
        const cached = await AsyncStorage.getItem(BIRTH_CHART_CACHE_KEY);

        if (cached) {
          if (!cancelled) {
            setAstroReady(true);
          }
          return;
        }

        setLoadingAstro(true);

        const storedProfileRaw =
          await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

        const storedProfile = storedProfileRaw
          ? JSON.parse(storedProfileRaw)
          : null;

        console.log(
          "Preloading birth chart with stored profile:",
          storedProfile,
        );

        const payload: Record<string, any> = {};

        if (storedProfile?.birthDate) {
          const [year, month, day] = storedProfile.birthDate
            .split("-")
            .map((v: string) => Number(v));

          if (
            !Number.isNaN(year) &&
            !Number.isNaN(month) &&
            !Number.isNaN(day)
          ) {
            payload.day = day;
            payload.month = month;
            payload.year = year;
          }
        }

        if (storedProfile?.birthTime) {
          const [hour, minute] = storedProfile.birthTime
            .split(":")
            .map((v: string) => Number(v));

          if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
            payload.hour = hour;
            payload.minute = minute;
          }
        }

        if (storedProfile?.birthLat != null) {
          payload.lat = Number(storedProfile.birthLat);
        }

        if (storedProfile?.birthLng != null) {
          payload.lon = Number(storedProfile.birthLng);
        }

        console.log("Preloading birth chart payload:", payload);

        const chart = await api.post("/astro/birth-chart", payload);

        await AsyncStorage.setItem(
          BIRTH_CHART_CACHE_KEY,
          JSON.stringify(chart),
        );
      } catch (error) {
        console.error("Birth chart preload failed:", error);

        await AsyncStorage.setItem(
          BIRTH_CHART_CACHE_KEY,
          JSON.stringify({
            fallback: true,
            error: String(error),
          }),
        );
      } finally {
        if (!cancelled) {
          setLoadingAstro(false);
          setAstroReady(true);
        }
      }
    };

    preloadBirthChart();

    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  console.log("Splash state:", {
    ready,
    user: !!user,
    onboarded: user?.onboarded,
    loadingAstro,
    astroReady,
    minimumSplashDone,
  });

  // Wait only for auth + splash timer
  if (!ready || !minimumSplashDone) {
    return <OrivoSplash />;
  }

  // Redirect immediately when auth state is known
  if (!user) {
    return <Redirect href="/onboarding" />;
  }

  if (!user.onboarded) {
    return <Redirect href="/birth-details" />;
  }

  // Only onboarded users wait for chart preload
  if (loadingAstro || !astroReady) {
    return <OrivoSplash />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
