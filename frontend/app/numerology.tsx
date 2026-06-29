import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/themeContext';
import { fontFamily, radii } from '../lib/theme';
import { Card, Disclaimer } from '../components/UI';
import { api } from '../lib/api';

export default function Numerology() {
  const { c } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/numerology');
        setData(r);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Pressable testID="num-back" onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: c.textSecondary }}>← Back</Text>
        </Pressable>
        <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>NUMERICAL INTELLIGENCE</Text>
        <Text style={{ color: c.textPrimary, fontSize: 28, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4, marginBottom: 20 }}>
          Your numbers.
        </Text>

        {loading ? <ActivityIndicator color={c.gold} /> : (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <Card style={{ flex: 1, alignItems: 'flex-start' }}>
                <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.5 }}>LIFE PATH</Text>
                <Text testID="life-path" style={{ color: c.gold, fontSize: 46, fontFamily: fontFamily.display, fontWeight: '700', marginTop: 4 }}>{data?.lifePath}</Text>
              </Card>
              <Card style={{ flex: 1, alignItems: 'flex-start' }}>
                <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.5 }}>EXECUTIVE NUMBER</Text>
                <Text style={{ color: c.gold, fontSize: 46, fontFamily: fontFamily.display, fontWeight: '700', marginTop: 4 }}>{data?.birthNumber}</Text>
              </Card>
            </View>

            <Card style={{ marginBottom: 14 }}>
              <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.5 }}>STRATEGIC COLOR</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: data?.luckyColor?.hex, borderWidth: 1, borderColor: c.border }} />
                <View>
                  <Text style={{ color: c.textPrimary, fontSize: 17, fontFamily: fontFamily.display, fontWeight: '600' }}>{data?.luckyColor?.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>Anchor color for high-stakes settings.</Text>
                </View>
              </View>
            </Card>

            <Card style={{ marginBottom: 14 }}>
              <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.5, marginBottom: 10 }}>STRATEGIC DATES (NEXT 60 DAYS)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(data?.luckyDates || []).map((d: string, i: number) => (
                  <View key={i} testID={`lucky-${i}`} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: 'rgba(189,139,46,0.14)' }}>
                    <Text style={{ color: c.gold, fontSize: 12, fontWeight: '600' }}>{new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={{ marginBottom: 14 }}>
              <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.5, marginBottom: 12 }}>OPERATING GRID</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {(data?.loshuGrid || []).map((cell: any, i: number) => (
                  <View
                    key={i}
                    testID={`loshu-${cell.number}`}
                    style={{
                      width: '31%',
                      aspectRatio: 1,
                      borderRadius: radii.md,
                      backgroundColor: cell.present ? c.primary : c.surfaceAlt,
                      borderWidth: 1,
                      borderColor: cell.present ? c.gold : c.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                      padding: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: cell.present ? c.gold : c.textSecondary,
                        fontSize: 28,
                        fontFamily: fontFamily.display,
                        fontWeight: '700',
                      }}
                    >
                      {cell.number}
                    </Text>
                    <Text style={{ color: cell.present ? '#FFF' : c.textSecondary, fontSize: 9, marginTop: 2, letterSpacing: 1, textAlign: 'center' }}>
                      {cell.plane.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 8 }}>
                {(data?.loshuGrid || []).filter((c: any) => c.present).map((cell: any, i: number) => (
                  <View key={i} style={{ paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderColor: c.border }}>
                    <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '600' }}>{cell.number} — {cell.plane}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>{cell.meaning}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Disclaimer />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
