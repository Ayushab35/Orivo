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

export default function SoulPurpose() {
  const { c } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const d = await api.get('/self/soul-purpose');
      setData(d);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const d = await api.post('/self/soul-purpose/refresh');
      setData(d);
    } catch {}
    setRefreshing(false);
  };

  const content = data?.content;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18 }}>
          <Pressable testID="soul-back" onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chevron-back" size={16} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>Back</Text>
          </Pressable>
          <Pressable testID="soul-refresh" onPress={refresh} disabled={refreshing} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: refreshing ? 0.5 : 1 }}>
            <Ionicons name="refresh-outline" size={14} color={c.gold} />
            <Text style={{ color: c.gold, fontSize: 12, fontWeight: '600' }}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
          </Pressable>
        </View>

        <View style={{ paddingTop: 18, paddingBottom: 8 }}>
          <Kicker>Dharma</Kicker>
          <Text style={{ color: c.textPrimary, fontFamily: fontFamily.display, fontSize: 32, fontWeight: '500', letterSpacing: -0.5, marginTop: 4, lineHeight: 38 }}>
            Soul Purpose & Profession
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={c.gold} /></View>
        ) : content ? (
          <>
            <FadeInUp index={0}>
              <Section title="Your soul purpose">
                <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 24 }}>{content.soulPurpose}</Text>
                {Array.isArray(content.purposeThemes) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {content.purposeThemes.map((t: string, i: number) => (
                      <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: c.surfaceMuted, borderColor: c.border, borderWidth: 1 }}>
                        <Text style={{ color: c.textPrimary, fontSize: 11 }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Section>
            </FadeInUp>

            <FadeInUp index={1}>
              <Section title="Primary profession">
                <Text style={{ color: c.gold, fontFamily: fontFamily.display, fontSize: 22, fontWeight: '500', letterSpacing: -0.3 }}>
                  {content.primaryProfession}
                </Text>
                {Array.isArray(content.alternativeProfessions) && content.alternativeProfessions.length > 0 && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={{ color: c.textMuted, fontSize: 10, letterSpacing: 1.4, fontWeight: '700', marginBottom: 8 }}>ALTERNATIVES</Text>
                    {content.alternativeProfessions.map((p: string, i: number) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: c.gold }} />
                        <Text style={{ color: c.textPrimary, fontSize: 13, flex: 1 }}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Section>
            </FadeInUp>

            {Array.isArray(content.avoidProfessions) && content.avoidProfessions.length > 0 && (
              <FadeInUp index={2}>
                <Section title="Not aligned">
                  {content.avoidProfessions.map((p: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: c.terracotta }} />
                      <Text style={{ color: c.textPrimary, fontSize: 13, flex: 1 }}>{p}</Text>
                    </View>
                  ))}
                </Section>
              </FadeInUp>
            )}

            {content.reasoning && (
              <FadeInUp index={3}>
                <Section title="Why">
                  <Text style={{ color: c.textPrimary, fontSize: 14, lineHeight: 22 }}>{content.reasoning}</Text>
                </Section>
              </FadeInUp>
            )}

            {Array.isArray(content.signals) && content.signals.length > 0 && (
              <FadeInUp index={4}>
                <Section title="Signals">
                  {content.signals.map((s: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderColor: c.border, gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '600' }}>{s.label}</Text>
                        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 }}>{s.note}</Text>
                      </View>
                      <Text style={{ color: c.gold, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>{s.value}</Text>
                    </View>
                  ))}
                </Section>
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
