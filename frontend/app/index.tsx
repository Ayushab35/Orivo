import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../lib/themeContext";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import AstrologyLoader from "../components/AstrologyLoader";

const BIRTH_CHART_CACHE_KEY = "orivo.birthChart";
const PROFILE_STORAGE_KEY = "orivo.birthProfile";

export default function Splash() {
  const { c } = useTheme();
  const { ready, user } = useAuth();
  const [loadingAstro, setLoadingAstro] = useState(false);
  const [astroReady, setAstroReady] = useState(false);

  useEffect(() => {
    if (!ready || !user || !user.onboarded) return;

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
          storedProfileRaw,
          storedProfile,
        );
        const payload: Record<string, any> = {
          day: undefined,
          month: undefined,
          year: undefined,
          hour: undefined,
          minute: undefined,
          lat: undefined,
          lon: undefined,
          tzone: undefined,
        };

        if (storedProfile?.birthDate) {
          const [year, month, day] = storedProfile.birthDate
            .split("-")
            .map((value: string) => Number(value));
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
            .map((value: string) => Number(value));
          if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
            payload.hour = hour;
            payload.minute = minute;
          }
        }

        if (storedProfile?.birthLat != null)
          payload.lat = Number(storedProfile.birthLat);
        if (storedProfile?.birthLng != null)
          payload.lon = Number(storedProfile.birthLng);
        console.log("Preloading birth chart with payload:", payload);
        const chart = await api.post("/astro/birth-chart", payload);
        await AsyncStorage.setItem(
          BIRTH_CHART_CACHE_KEY,
          JSON.stringify(chart),
        );
      } catch (error) {
        await AsyncStorage.setItem(
          BIRTH_CHART_CACHE_KEY,
          JSON.stringify({ fallback: true, error: String(error) }),
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

  if (!ready) {
    return (
      <View
        testID="splash-screen"
        style={{
          flex: 1,
          backgroundColor: c.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              color: c.textPrimary,
              fontSize: 24,
              fontFamily: "System",
              fontWeight: "600",
            }}
          >
            Loading Orivo…
          </Text>
        </View>
      </View>
    );
  }

  if (!user) return <Redirect href="/onboarding" />;
  if (!user.onboarded) return <Redirect href="/birth-details" />;
  if (loadingAstro || !astroReady) return <AstrologyLoader />;
  return <Redirect href="/(tabs)/dashboard" />;
}
