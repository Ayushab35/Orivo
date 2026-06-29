import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { fontFamily, radii } from '../../lib/theme';
import { Card, Pill } from '../../components/UI';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function Credits() {
  const { c } = useTheme();
  const router = useRouter();
  const { creditsBalanceSec, refresh } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [t, l] = await Promise.all([api.get('/tasks'), api.get('/credits/ledger')]);
      setTasks(t.items || []);
      setLedger(l.items || []);
      await refresh();
    } catch {}
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const complete = async (taskId: string) => {
    try {
      await api.post('/tasks/complete', { taskId });
      await load();
    } catch (e: any) {
      Alert.alert('Could not complete', e.message);
    }
  };

  const totalDaily = tasks.filter(t => t.cadence === 'daily').length;
  const doneDaily = tasks.filter(t => t.cadence === 'daily' && t.completed).length;

  const mins = Math.floor(creditsBalanceSec / 60);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={{ paddingTop: 18, paddingBottom: 8 }}>
          <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>CREDITS</Text>
          <Text style={{ color: c.textPrimary, fontSize: 26, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4 }}>
            Time you've earned.
          </Text>
        </View>

        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.5 }}>BALANCE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6 }}>
            <Text testID="credits-balance" style={{ color: c.gold, fontSize: 44, fontFamily: fontFamily.display, fontWeight: '700' }}>{mins}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 14, marginBottom: 10 }}>minutes</Text>
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>
            Credits expire 90 days after earning. Spend them on a private session — or never; the choice is yours.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Pressable
              testID="credits-book-btn"
              onPress={() => router.push('/packages')}
              style={{ flex: 1, backgroundColor: c.primary, borderRadius: radii.pill, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: c.primaryInk, fontSize: 13, fontWeight: '600' }}>Book a session</Text>
            </Pressable>
          </View>
        </Card>

        <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 2, marginBottom: 8, marginTop: 8 }}>
          DAILY · {doneDaily}/{totalDaily} COMPLETE
        </Text>
        <View style={{ height: 4, backgroundColor: c.surfaceAlt, borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
          <View testID="daily-progress" style={{ width: `${totalDaily ? (doneDaily / totalDaily) * 100 : 0}%`, height: '100%', backgroundColor: c.teal }} />
        </View>

        {loading ? (
          <ActivityIndicator color={c.gold} />
        ) : (
          tasks.map((t) => (
            <Pressable
              key={t.id}
              testID={`task-${t.id}`}
              onPress={() => !t.completed && complete(t.id)}
              style={{
                backgroundColor: c.surface,
                borderRadius: radii.md,
                borderColor: c.border,
                borderWidth: 1,
                padding: 14,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                opacity: t.completed ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: t.completed ? c.teal : c.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: t.completed ? c.teal : c.border,
                }}
              >
                {t.completed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '600' }}>{t.title}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>{t.description}</Text>
              </View>
              <View>
                <Pill label={`+${Math.round(t.creditsSec / 60)} min`} tone="gold" />
                <Text style={{ color: c.textSecondary, fontSize: 10, marginTop: 4, textAlign: 'right' }}>{t.cadence.toUpperCase()}</Text>
              </View>
            </Pressable>
          ))
        )}

        {ledger.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>HISTORY</Text>
            {ledger.slice(0, 10).map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: c.border }}>
                <View>
                  <Text style={{ color: c.textPrimary, fontSize: 13 }}>{e.reason}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>{new Date(e.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={{ color: e.deltaSec >= 0 ? c.teal : c.terracotta, fontSize: 14, fontWeight: '600' }}>
                  {e.deltaSec >= 0 ? '+' : ''}{Math.round(e.deltaSec / 60)} min
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
