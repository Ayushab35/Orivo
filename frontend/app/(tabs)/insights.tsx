import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { fontFamily, radii } from '../../lib/theme';
import { Kicker } from '../../components/UI';

type Item = { key: string; label: string; preview: string; href: string; icon: string; status: 'live' | 'updated' | 'beta' };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Leadership',
    items: [
      { key: 'leadership', label: 'Leadership Profile', preview: 'How you operate under stakes.', href: '/reports/personality', icon: 'person-outline', status: 'updated' },
      { key: 'assets', label: 'Strategic Assets', preview: 'What you compound on.', href: '/reports/strengths', icon: 'shield-checkmark-outline', status: 'updated' },
      { key: 'gaps', label: 'Growth Opportunities', preview: 'Sharpen where it matters.', href: '/reports/strengths', icon: 'analytics-outline', status: 'updated' },
      { key: 'style', label: 'Executive Style', preview: 'Tone, posture, presence.', href: '/reports/personality', icon: 'briefcase-outline', status: 'live' },
    ],
  },
  {
    title: 'Business Intelligence',
    items: [
      { key: 'edge', label: 'Executive Edge', preview: 'Your defining career trait.', href: '/reports/career', icon: 'flash-outline', status: 'updated' },
      { key: 'wealth', label: 'Wealth Dynamics', preview: 'Revenue + expense tendencies.', href: '/reports/financialPatterns', icon: 'trending-up-outline', status: 'updated' },
      { key: 'expansion', label: 'Expansion Timing', preview: 'When to push, when to hold.', href: '/outlook', icon: 'rocket-outline', status: 'live' },
      { key: 'behaviour', label: 'Financial Behaviour', preview: 'Patterns to watch quietly.', href: '/reports/financialPatterns', icon: 'pulse-outline', status: 'updated' },
    ],
  },
  {
    title: 'Timing',
    items: [
      { key: 'brief', label: 'Daily Brief', preview: "Today's decision summary.", href: '/(tabs)/dashboard', icon: 'sunny-outline', status: 'live' },
      { key: 'outlook', label: 'Monthly Outlook', preview: 'Phase, peaks, defensive days.', href: '/outlook', icon: 'calendar-outline', status: 'beta' },
      { key: 'phase', label: 'Current Phase', preview: 'Where you are in the cycle.', href: '/(tabs)/dashboard', icon: 'time-outline', status: 'live' },
      { key: 'peaks', label: 'Peak Decision Windows', preview: 'Best hours of the day.', href: '/outlook', icon: 'flame-outline', status: 'live' },
    ],
  },
  {
    title: 'Identity',
    items: [
      { key: 'perception', label: 'Market Perception', preview: 'How the room reads you.', href: '/reports/publicImage', icon: 'eye-outline', status: 'updated' },
      { key: 'numeric', label: 'Numerical Intelligence', preview: 'Strategic numbers + dates.', href: '/numerology', icon: 'apps-outline', status: 'updated' },
      { key: 'archetype', label: 'Executive Archetype', preview: 'Your operating signature.', href: '/reports/personality-quiz', icon: 'sparkles-outline', status: 'beta' },
    ],
  },
];

export default function Insights() {
  const { c } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View style={{ paddingTop: 18, paddingBottom: 14 }}>
          <Kicker>Library</Kicker>
          <Text style={{ color: c.textPrimary, fontSize: 28, fontFamily: fontFamily.display, fontWeight: '500', marginTop: 4, letterSpacing: -0.5 }}>
            Executive intelligence.
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
            Modular reports translated into business language. Built for decisions, not divination.
          </Text>
        </View>

        {GROUPS.map((g) => (
          <View key={g.title} style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Kicker>{g.title}</Kicker>
              <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
            </View>
            {g.items.map((it) => (
              <Pressable
                key={it.key}
                testID={`insight-${it.key}`}
                onPress={() => router.push(it.href as any)}
                style={({ pressed }: any) => ({
                  backgroundColor: pressed ? c.surfaceAlt : c.surface,
                  borderRadius: radii.md,
                  borderColor: c.border,
                  borderWidth: 1,
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                })}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: c.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={it.icon as any} size={18} color={c.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '500' }}>{it.label}</Text>
                    <StatusDot status={it.status} />
                  </View>
                  <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>{it.preview}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusDot({ status }: { status: 'live' | 'updated' | 'beta' }) {
  const { c } = useTheme();
  const map = {
    live: { bg: c.teal, label: 'LIVE' },
    updated: { bg: c.gold, label: 'NEW' },
    beta: { bg: c.textMuted, label: 'BETA' },
  } as const;
  const m = map[status];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: 'transparent' }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: m.bg }} />
      <Text style={{ color: m.bg, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>{m.label}</Text>
    </View>
  );
}
