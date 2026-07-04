import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { fontFamily, radii } from '../../lib/theme';
import { Kicker, Disclaimer } from '../../components/UI';
import { FadeInUp } from '../../components/Animated';
import { api } from '../../lib/api';

export default function InnerProfile() {
  const { c } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const d = await api.get('/self/inner-profile');
      setData(d);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const d = await api.post('/self/inner-profile/refresh');
      setData(d);
    } catch {}
    setRefreshing(false);
  };

  const content = data?.content;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18 }}>
          <Pressable testID="inner-back" onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chevron-back" size={16} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>Back</Text>
          </Pressable>
          <Pressable testID="inner-refresh" onPress={refresh} disabled={refreshing} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: refreshing ? 0.5 : 1 }}>
            <Ionicons name="refresh-outline" size={14} color={c.gold} />
            <Text style={{ color: c.gold, fontSize: 12, fontWeight: '600' }}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
          </Pressable>
        </View>

        <View style={{ paddingTop: 18, paddingBottom: 8 }}>
          <Kicker>Self</Kicker>
          <Text style={{ color: c.textPrimary, fontFamily: fontFamily.display, fontSize: 32, fontWeight: '500', letterSpacing: -0.5, marginTop: 4, lineHeight: 38 }}>
            Inner Profile
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={c.gold} /></View>
        ) : content ? (
          <>
            <FadeInUp index={0}>
              <Section title="Nature">
                <Axis leftLabel="Introverted" rightLabel="Extroverted" value={content.nature?.axis ?? 50} accent={c.gold} />
                <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '500', marginTop: 14 }}>{content.nature?.label}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 4 }}>{content.nature?.detail}</Text>
              </Section>
            </FadeInUp>

            <FadeInUp index={1}>
              <Section title="Goal orientation">
                <Axis leftLabel="Near-term" rightLabel="Long-horizon" value={content.goalOrientation?.score ?? 50} accent={c.teal} />
                <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '500', marginTop: 14 }}>{content.goalOrientation?.label}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 4 }}>{content.goalOrientation?.detail}</Text>
              </Section>
            </FadeInUp>

            <FadeInUp index={2}>
              <Section title="Inner personality">
                <Text style={{ color: c.textPrimary, fontSize: 14, lineHeight: 22 }}>{content.innerPersonality}</Text>
              </Section>
            </FadeInUp>

            {Array.isArray(content.strengths) && (
              <FadeInUp index={3}>
                <Section title="Strengths">
                  {content.strengths.map((s: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                      <View style={{ width: 14, height: 1.5, backgroundColor: c.teal }} />
                      <Text style={{ color: c.textPrimary, fontSize: 13, flex: 1 }}>{s}</Text>
                    </View>
                  ))}
                </Section>
              </FadeInUp>
            )}

            {Array.isArray(content.weaknesses) && (
              <FadeInUp index={4}>
                <Section title="Growth edges">
                  {content.weaknesses.map((s: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                      <View style={{ width: 14, height: 1.5, backgroundColor: c.terracotta }} />
                      <Text style={{ color: c.textPrimary, fontSize: 13, flex: 1 }}>{s}</Text>
                    </View>
                  ))}
                </Section>
              </FadeInUp>
            )}

            <FadeInUp index={5}>
              <Section title="Public image">
                <Text style={{ color: c.textPrimary, fontSize: 14, lineHeight: 22 }}>{content.publicImage}</Text>
              </Section>
            </FadeInUp>

            {content.recalibration && (
              <FadeInUp index={6}>
                <View style={{ marginTop: 16, padding: 16, borderRadius: radii.md, backgroundColor: 'rgba(201,169,97,0.06)', borderColor: 'rgba(201,169,97,0.28)', borderWidth: 1 }}>
                  <Text style={{ color: c.gold, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }}>RECALIBRATION</Text>
                  <Text style={{ color: c.textPrimary, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{content.recalibration}</Text>
                </View>
              </FadeInUp>
            )}

            <Disclaimer />
          </>
        ) : (
          <Text style={{ color: c.textSecondary, marginTop: 40, textAlign: 'center' }}>Report unavailable.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: any) {
  const { c } = useTheme();
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ color: c.textMuted, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>{title.toUpperCase()}</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: radii.lg, borderColor: c.border, borderWidth: 1, padding: 18 }}>{children}</View>
    </View>
  );
}

function Axis({ leftLabel, rightLabel, value, accent }: any) {
  const { c } = useTheme();
  const v = Math.max(0, Math.min(100, value));
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: c.textMuted, fontSize: 11 }}>{leftLabel}</Text>
        <Text style={{ color: c.textMuted, fontSize: 11 }}>{rightLabel}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: c.surfaceMuted, borderRadius: 3, position: 'relative' }}>
        <View style={{ position: 'absolute', left: `${v}%`, transform: [{ translateX: -8 }], top: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: accent, borderColor: c.surface, borderWidth: 2 }} />
      </View>
      <Text style={{ color: accent, fontSize: 11, marginTop: 6, fontFamily: 'monospace' as any }}>SCORE {v}</Text>
    </View>
  );
}
