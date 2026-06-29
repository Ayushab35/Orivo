import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewProps, View } from 'react-native';

/**
 * Reusable "card-in" entrance — fade + slight upward translate, staggered by index.
 * Pure RN Animated for portability with Expo Web.
 */
export function FadeInUp({
  index = 0,
  delay = 80,
  duration = 520,
  children,
  style,
  ...rest
}: ViewProps & { index?: number; delay?: number; duration?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay: delay * index,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return (
    <Animated.View {...rest} style={[{ opacity: anim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const op = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: op }} />;
}
