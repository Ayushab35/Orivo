import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, Text } from "react-native";
import { useTheme } from "../lib/themeContext";
import { fontFamily } from "../lib/theme";

export default function AstrologyLoader({
  message = "Reading your birth chart…",
}: {
  message?: string;
}) {
  const { c } = useTheme();
  const spin1 = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (value: Animated.Value, duration: number, reverse = false) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: reverse ? -1 : 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const a1 = loop(spin1, 14000);
    const a2 = loop(spin2, 22000, true);
    a1.start();
    a2.start();
    breathe.start();

    return () => {
      a1.stop();
      a2.stop();
      breathe.stop();
    };
  }, [pulse, spin1, spin2]);

  const rotate1 = spin1.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-360deg", "360deg"],
  });
  const rotate2 = spin2.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-360deg", "360deg"],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.08],
  });
  const glow = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.9],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 220,
            height: 220,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 110,
              borderWidth: 1.5,
              borderColor: c.gold,
              opacity: 0.35,
              transform: [{ rotate: rotate1 }],
            }}
          />
          <Animated.View
            style={{
              position: "absolute",
              width: 170,
              height: 170,
              borderRadius: 85,
              borderWidth: 1.2,
              borderColor: c.teal,
              borderStyle: "dashed",
              opacity: 0.6,
              transform: [{ rotate: rotate2 }],
            }}
          />
          <Animated.View
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale }],
              shadowColor: c.gold,
              shadowOpacity: 0.28,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Animated.View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: c.gold,
                opacity: glow,
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: c.teal,
              }}
            />
          </Animated.View>
        </View>

        <Text
          style={{
            color: c.textPrimary,
            fontSize: 24,
            fontFamily: fontFamily.display,
            fontWeight: "600",
            marginTop: 8,
            letterSpacing: -0.3,
          }}
        >
          Orivo
        </Text>
        <Text
          style={{
            color: c.textSecondary,
            fontSize: 13,
            marginTop: 8,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          {message}
        </Text>
        <Text
          style={{
            color: c.textMuted,
            fontSize: 11,
            marginTop: 10,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          One moment while we align your path
        </Text>
      </View>
    </View>
  );
}
