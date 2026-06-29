import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii, elevation, fontFamily } from '../lib/theme';
import { DISCLAIMER } from '../lib/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: radii.lg,
          borderColor: c.border,
          borderWidth: 1,
          padding: 18,
        },
        elevation.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      {kicker ? (
        <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{kicker}</Text>
      ) : null}
      <Text style={{ color: c.textPrimary, fontSize: 22, fontFamily: fontFamily.display, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

export function Pill({ label, tone = 'neutral', testID }: { label: string; tone?: 'neutral' | 'favorable' | 'caution' | 'gold'; testID?: string }) {
  const { c } = useTheme();
  const map = {
    neutral: { bg: c.surfaceAlt, fg: c.textPrimary },
    favorable: { bg: 'rgba(15,110,86,0.12)', fg: c.teal },
    caution: { bg: 'rgba(193,122,82,0.15)', fg: c.terracotta },
    gold: { bg: 'rgba(189,139,46,0.15)', fg: c.gold },
  } as const;
  const t = map[tone];
  return (
    <View testID={testID} style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: t.bg, borderRadius: radii.pill }}>
      <Text style={{ color: t.fg, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

export function Disclaimer({ testID }: { testID?: string }) {
  const { c } = useTheme();
  return (
    <Text
      testID={testID || 'disclaimer-line'}
      style={{ color: c.textSecondary, fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 18, lineHeight: 16 }}
    >
      {DISCLAIMER}
    </Text>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border, marginVertical: 12 }} />;
}
