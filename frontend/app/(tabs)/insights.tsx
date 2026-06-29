import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { fontFamily, radii } from '../../lib/theme';

const MODULES = [
  { key: 'personality', label: 'Personality', kicker: 'WHO YOU ARE', icon: 'person-circle-outline', href: '/reports/personality' },
  { key: 'strengths', label: 'Strengths & improvement', kicker: 'WHAT YOU CARRY', icon: 'flame-outline', href: '/reports/strengths' },
  { key: 'career', label: 'Career-defining trait', kicker: 'WHAT YOU\'RE BUILT FOR', icon: 'briefcase-outline', href: '/reports/career' },
  { key: 'publicImage', label: 'Public image', kicker: 'HOW YOU\'RE READ', icon: 'eye-outline', href: '/reports/publicImage' },
  { key: 'financialPatterns', label: 'Financial patterns', kicker: 'PATTERNS TO WATCH', icon: 'trending-up-outline', href: '/reports/financialPatterns' },
  { key: 'numerology', label: 'Numerology hub', kicker: 'LUCKY DATES, COLORS, LOSHU', icon: 'grid-outline', href: '/numerology' },
  { key: 'quiz', label: 'Personality quiz', kicker: 'CALIBRATE YOUR PROFILE', icon: 'clipboard-outline', href: '/reports/personality-quiz' },
];

export default function Insights() {
  const { c } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={{ paddingTop: 18, paddingBottom: 14 }}>
          <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>INSIGHTS</Text>
          <Text style={{ color: c.textPrimary, fontSize: 26, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4 }}>
            Read yourself, then read the room.
          </Text>
        </View>

        {MODULES.map((m, idx) => (
          <Pressable
            key={m.key}
            testID={`insight-${m.key}`}
            onPress={() => router.push(m.href as any)}
            style={{
              backgroundColor: c.surface,
              borderRadius: radii.lg,
              borderColor: c.border,
              borderWidth: 1,
              padding: 18,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: c.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={m.icon as any} size={22} color={c.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.textSecondary, fontSize: 10, letterSpacing: 1.5 }}>{m.kicker}</Text>
              <Text style={{ color: c.textPrimary, fontSize: 15, fontWeight: '600', marginTop: 3 }}>{m.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
