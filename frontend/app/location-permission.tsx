import React, { useState } from "react";
import { View, Text, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
// dynamic import of expo-location performed at runtime to avoid bundle errors
import { useTheme } from "../lib/themeContext";
import { Kicker } from "../components/UI";
import { Button } from "../components/Button";
import { api } from "../lib/api";

export default function LocationPermission() {
  const { c } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onAllow = async () => {
    setLoading(true);
    try {
      let lat: number | null = null;
      let lon: number | null = null;

      if (Platform.OS !== "web") {
        try {
          const Location = await import("expo-location");
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setLoading(false);
            return router.replace("/");
          }
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch (e) {
          // expo-location not available or failed; fall back to navigator if possible
          if (
            typeof navigator === "undefined" ||
            !(navigator as any).geolocation
          ) {
            setLoading(false);
            return router.replace("/");
          }
        }
      }

      if (
        (lat == null || lon == null) &&
        typeof navigator !== "undefined" &&
        (navigator as any).geolocation
      ) {
        const p = new Promise<GeolocationPosition>((resolve, reject) =>
          (navigator as any).geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
          }),
        );
        try {
          const pos = await p;
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch (e) {
          // user denied or failed
        }
      }

      if (lat == null || lon == null) {
        setLoading(false);
        return router.replace("/");
      }

      await AsyncStorage.setItem(
        "orivo.location",
        JSON.stringify({ lat, lon }),
      );

      // Prefetch choghadia for today (ignore response errors)
      try {
        const date = new Date().toISOString().slice(0, 10);
        await api.get(
          `/astro/choghadia?date=${date}&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`,
        );
      } catch (_) {
        // ignore
      }

      setLoading(false);
      router.replace("/");
    } catch (e) {
      setLoading(false);
      router.replace("/");
    }
  };

  const onSkip = async () => {
    await AsyncStorage.removeItem("orivo.location");
    router.replace("/");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: c.bg, padding: 20 }}
      edges={["top"]}
    >
      <View style={{ marginTop: 36 }}>
        <Kicker>Location access</Kicker>
        <Text
          style={{
            color: c.textPrimary,
            fontSize: 20,
            fontWeight: "600",
            marginTop: 8,
          }}
        >
          Allow location for personalized timings
        </Text>
        <Text style={{ color: c.textSecondary, marginTop: 12, lineHeight: 20 }}>
          We use your approximate location (city-level) to provide personalized
          good and avoid timings for the day. This helps surface accurate local
          day timings for everyone in your city.
        </Text>

        <View style={{ height: 20 }} />
        <Button
          label="Allow location"
          onPress={onAllow}
          loading={loading}
          testID="btn-allow-location"
        />
        <View style={{ height: 12 }} />
        <Button
          label="Maybe later"
          variant="ghost"
          onPress={onSkip}
          testID="btn-skip-location"
        />
      </View>
    </SafeAreaView>
  );
}
