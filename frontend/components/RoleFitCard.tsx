import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii, fontFamily } from '../lib/theme';
import { Kicker, Pill } from './UI';

/**
 * Role-Fit replaces the Decision Score on the home tab.
 * Shows the executive archetype that best matches the user's astrological profile,
 * with an alignment-with-current-role indicator and a secondary tendency.
 */
export function RoleFitCard({
  data,
  testID,
}: {
  data: {
    archetype: string;
    archetypeKey: string;
    thesis: string;
    bestFor: string;
    watchOut: string;
    alignment: number;
    alignmentLabel: string;
    secondary?: { archetype: string; key: string };
  };
  testID?: string;
}) {
  const { c } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 700,
      delay: 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translate = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: radii.lg,
          borderColor: c.border,
          borderWidth: 1,
          padding: 22,
          opacity: anim,
          transform: [{ translateY: translate }],
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Kicker>Role best suited for you</Kicker>
          <Text
            testID="rolefit-archetype"
            style={{
              color: c.textPrimary,
              fontFamily: fontFamily.display,
              fontSize: 32,
              fontWeight: '500',
              letterSpacing: -0.5,
              marginTop: 4,
              lineHeight: 38,
            }}
          >
            {data.archetype}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: c.gold, fontFamily: fontFamily.mono, fontSize: 22, fontWeight: '600' }}>{data.alignment}%</Text>
          <Text style={{ color: c.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '600' }}>FIT</Text>
        </View>
      </View>

      <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 12 }}>{data.thesis}</Text>

      <View style={{ marginTop: 16, padding: 12, borderRadius: radii.md, backgroundColor: c.surfaceMuted, borderColor: c.border, borderWidth: 1 }}>
        <Text style={{ color: c.textMuted, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' }}>BEST FOR</Text>
        <Text style={{ color: c.textPrimary, fontSize: 13, marginTop: 4, lineHeight: 19 }}>{data.bestFor}</Text>
      </View>

      <View style={{ marginTop: 8, padding: 12, borderRadius: radii.md, backgroundColor: 'rgba(193,122,82,0.08)', borderColor: 'rgba(193,122,82,0.25)', borderWidth: 1 }}>
        <Text style={{ color: c.terracotta, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' }}>WATCH-OUT</Text>
        <Text style={{ color: c.textPrimary, fontSize: 13, marginTop: 4, lineHeight: 19 }}>{data.watchOut}</Text>
      </View>

      <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: c.textMuted, fontSize: 10, letterSpacing: 1.2, fontWeight: '600' }}>ALIGNMENT</Text>
          <Text style={{ color: c.textPrimary, fontSize: 12, marginTop: 2 }}>{data.alignmentLabel}</Text>
        </View>
        {data.secondary ? <Pill label={`Also: ${data.secondary.archetype}`} tone="gold" /> : null}
      </View>
    </Animated.View>
  );
}
