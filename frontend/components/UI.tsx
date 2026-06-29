import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii, elevation, fontFamily, DISCLAIMER } from '../lib/theme';

export function Card({ children, style, padding = 18 }: { children: React.ReactNode; style?: ViewStyle; padding?: number }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: radii.lg,
          borderColor: c.border,
          borderWidth: 1,
          padding,
        },
        elevation.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function FlatCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surfaceMuted,
          borderRadius: radii.md,
          borderColor: c.border,
          borderWidth: 1,
          padding: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Kicker({ children, color, style }: { children: React.ReactNode; color?: string; style?: TextStyle }) {
  const { c } = useTheme();
  return (
    <Text style={[{ color: color || c.textSecondary, fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase', fontWeight: '600' }, style]}>
      {children}
    </Text>
  );
}

export function H1({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { c } = useTheme();
  return (
    <Text style={[{ color: c.textPrimary, fontSize: 32, fontFamily: fontFamily.display, fontWeight: '500', lineHeight: 38, letterSpacing: -0.5 }, style]}>
      {children}
    </Text>
  );
}

export function H2({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { c } = useTheme();
  return (
    <Text style={[{ color: c.textPrimary, fontSize: 22, fontFamily: fontFamily.display, fontWeight: '500', lineHeight: 28 }, style]}>{children}</Text>
  );
}

export function Mono({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { c } = useTheme();
  return <Text style={[{ color: c.textPrimary, fontFamily: fontFamily.mono, fontSize: 12 }, style]}>{children}</Text>;
}

export function Pill({ label, tone = 'neutral', testID }: { label: string; tone?: 'neutral' | 'positive' | 'caution' | 'gold' | 'muted'; testID?: string }) {
  const { c } = useTheme();
  const map = {
    neutral: { bg: c.surfaceAlt, fg: c.textPrimary, br: c.border },
    positive: { bg: 'rgba(63,166,142,0.14)', fg: c.teal, br: 'rgba(63,166,142,0.35)' },
    caution: { bg: 'rgba(193,122,82,0.16)', fg: c.terracotta, br: 'rgba(193,122,82,0.35)' },
    gold: { bg: 'rgba(201,169,97,0.13)', fg: c.gold, br: 'rgba(201,169,97,0.35)' },
    muted: { bg: 'transparent', fg: c.textMuted, br: c.border },
  } as const;
  const t = map[tone];
  return (
    <View testID={testID} style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: t.bg, borderRadius: radii.pill, borderWidth: 1, borderColor: t.br }}>
      <Text style={{ color: t.fg, fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border, marginVertical: 14 }} />;
}

export function Disclaimer({ testID }: { testID?: string }) {
  const { c } = useTheme();
  return (
    <Text
      testID={testID || 'disclaimer-line'}
      style={{ color: c.textMuted, fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 16, letterSpacing: 0.3 }}
    >
      {DISCLAIMER}
    </Text>
  );
}

export function StatRow({ label, value, valueColor, testID }: { label: string; value: string | number; valueColor?: string; testID?: string }) {
  const { c } = useTheme();
  return (
    <View testID={testID} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
      <Text style={{ color: c.textSecondary, fontSize: 12, letterSpacing: 0.3 }}>{label}</Text>
      <Text style={{ color: valueColor || c.textPrimary, fontSize: 13, fontWeight: '600', fontFamily: c.bg ? undefined : undefined }}>{value}</Text>
    </View>
  );
}

export function SectionTitle({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      {kicker ? (
        <Text style={{ color: c.gold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, fontWeight: '700' }}>{kicker}</Text>
      ) : null}
      <Text style={{ color: c.textPrimary, fontSize: 18, fontFamily: fontFamily.display, fontWeight: '500', letterSpacing: -0.2 }}>{children}</Text>
    </View>
  );
}
