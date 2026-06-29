import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useTheme } from '../lib/themeContext';

/**
 * Hero visual for onboarding. Pure RN Animated — concentric arcs slowly orbiting,
 * a soft pulse, and a quiet center dot. Reads "abstract intelligence", never astrology.
 * Mobile-safe (no Lottie dependency required); you can replace this with a Lottie file
 * by dropping JSON into /assets/lottie and using LottieView.
 */
export function OnboardingHero({ size = 240 }: { size?: number }) {
  const { c } = useTheme();
  const r1 = useRef(new Animated.Value(0)).current;
  const r2 = useRef(new Animated.Value(0)).current;
  const r3 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = (a: Animated.Value, dur: number, reverse = false) =>
      Animated.loop(
        Animated.timing(a, {
          toValue: reverse ? -1 : 1,
          duration: dur,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const s1 = spin(r1, 22000);
    const s2 = spin(r2, 32000, true);
    const s3 = spin(r3, 14000);
    s1.start(); s2.start(); s3.start(); breathe.start();
    return () => { s1.stop(); s2.stop(); s3.stop(); breathe.stop(); };
  }, []);

  const rot1 = r1.interpolate({ inputRange: [-1, 1], outputRange: ['-360deg', '360deg'] });
  const rot2 = r2.interpolate({ inputRange: [-1, 1], outputRange: ['-360deg', '360deg'] });
  const rot3 = r3.interpolate({ inputRange: [-1, 1], outputRange: ['-360deg', '360deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const op = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  const ringStyle = (d: number, color: string, opacity: number, dashed = false): any => ({
    position: 'absolute',
    width: d,
    height: d,
    borderRadius: d / 2,
    borderWidth: 1,
    borderColor: color,
    opacity,
    borderStyle: dashed ? 'dashed' : 'solid',
  });

  const dotOnRing = (d: number, color: string): any => ({
    position: 'absolute',
    top: -3,
    left: d / 2 - 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color,
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ring */}
      <Animated.View style={[ringStyle(size, c.border, 0.7), { transform: [{ rotate: rot1 }] }]}>
        <View style={dotOnRing(size, c.gold)} />
      </Animated.View>

      {/* Middle dashed ring */}
      <Animated.View style={[ringStyle(size * 0.74, c.borderStrong, 0.6, true), { transform: [{ rotate: rot2 }] }]}>
        <View style={dotOnRing(size * 0.74, c.teal)} />
      </Animated.View>

      {/* Inner ring */}
      <Animated.View style={[ringStyle(size * 0.48, c.gold, 0.7), { transform: [{ rotate: rot3 }] }]} />

      {/* Pulse center */}
      <Animated.View
        style={{
          width: size * 0.18,
          height: size * 0.18,
          borderRadius: (size * 0.18) / 2,
          backgroundColor: c.gold,
          opacity: 0.18,
          transform: [{ scale }],
          position: 'absolute',
        }}
      />
      <Animated.View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: c.gold,
          opacity: op,
          position: 'absolute',
        }}
      />
    </View>
  );
}
