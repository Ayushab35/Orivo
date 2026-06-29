import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../lib/auth';
import { fontFamily, radii } from '../../lib/theme';
import { Kicker, FlatCard, Pill, Disclaimer } from '../../components/UI';
import { TierBadge, MinutesPill } from '../../components/Badges';
import { DecisionScoreCard } from '../../components/DecisionScoreCard';
import { PhaseCard, PeakWindowCard, BriefCard, ActivityList } from '../../components/IntelCards';
import { api } from '../../lib/api';

const QUICK = [
  { key: 'leadership', label: 'Leadership Profile', icon: 'person-outline', module: 'personality' },
  { key: 'wealth', label: 'Wealth Dynamics', icon: 'trending-up-outline', module: 'financialPatterns' },
  { key: 'assets', label: 'Strategic Assets', icon: 'shield-outline', module: 'strengths' },
  { key: 'market', label: 'Market Perception', icon: 'eye-outline', module: 'publicImage' },
  { key: 'edge', label: 'Executive Edge', icon: 'flash-outline', module: 'career' },
  { key: 'numeric', label: 'Numerical Intelligence', icon: 'apps-outline', module: 'numerology' },
];

export default function Dashboard() {
  const { c } = useTheme();
  const router = useRouter();
  const { user, creditsBalanceSec, refresh } = useAuth();
  const [data, setData] = useState<any>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [b, d] = await Promise.all([api.get('/dashboard/today'), api.get('/decisions')]);
      setData(b);
      setDecisions(d.items || []);
      await refresh();
    } catch {}
  };

  useFocusEffect(useCallback(() => { (async () => { await load(); setLoading(false); })(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.name || 'Founder').split(' ')[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl tintColor={c.gold} refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 18, paddingBottom: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.textMuted, fontSize: 11, letterSpacing: 1.5 }}>{greeting.toUpperCase()}</Text>
            <Text testID="dash-name" style={{ color: c.textPrimary, fontSize: 28, fontFamily: fontFamily.display, fontWeight: '500', marginTop: 2, letterSpacing: -0.5 }}>
              {firstName}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              <TierBadge tier={user?.tier} />
              {user?.businessName ? <Pill label={user.businessName} tone="muted" /> : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <MinutesPill testID="dash-minutes-pill" seconds={creditsBalanceSec} />
            <Pressable testID="dash-notif-bell" onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={c.textSecondary} />
            </Pressable>
          </View>
        </View>

        {loading || !data ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator color={c.gold} />
          </View>
        ) : (
          <>
            {/* Decision Index */}
            <DecisionScoreCard
              testID="decision-index-card"
              score={data.decisionIndex.score}
              label={data.decisionIndex.label}
              tone={data.decisionIndex.tone}
              components={data.decisionIndex.components}
            />

            {/* Allowed / Avoid */}
            <View style={{ marginTop: 14 }}>
              <ActivityList allowed={data.decisionIndex.allowed} avoid={data.decisionIndex.avoid} />
            </View>

            {/* Phase */}
            <View style={{ marginTop: 14 }}>
              <PhaseCard testID="phase-card" phase={data.phase} />
            </View>

            {/* Peak Window */}
            <View style={{ marginTop: 14 }}>
              <PeakWindowCard testID="peak-window-card" window={data.peakWindow} />
              <Pressable
                testID="full-outlook-link"
                onPress={() => router.push('/outlook')}
                style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingVertical: 4 }}
              >
                <Text style={{ color: c.gold, fontSize: 12, fontWeight: '600' }}>Full daily brief</Text>
                <Ionicons name="arrow-forward" size={13} color={c.gold} />
              </Pressable>
            </View>

            {/* Today's Brief */}
            <View style={{ marginTop: 8 }}>
              <BriefCard testID="brief-card" brief={data.brief} />
            </View>

            {/* Quick Insights */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 10 }}>
              <Kicker>Quick Insights</Kicker>
              <Pressable onPress={() => router.push('/(tabs)/insights')}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>All ›</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {QUICK.map((q) => (
                <Pressable
                  key={q.key}
                  testID={`quick-${q.key}`}
                  onPress={() => router.push(q.module === 'numerology' ? '/numerology' : `/reports/${q.module}` as any)}
                  style={{
                    width: '48.5%',
                    backgroundColor: c.surface,
                    borderRadius: radii.md,
                    borderColor: c.border,
                    borderWidth: 1,
                    padding: 14,
                  }}
                >
                  <Ionicons name={q.icon as any} size={18} color={c.gold} />
                  <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '500', marginTop: 10 }}>{q.label}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 4 }}>Updated today</Text>
                </Pressable>
              ))}
            </View>

            {/* Recent Decisions */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 10 }}>
              <Kicker>Recent Decisions</Kicker>
              <Pressable testID="open-advisor-link" onPress={() => router.push('/(tabs)/advisor')}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>Advisor ›</Text>
              </Pressable>
            </View>
            {decisions.length === 0 ? (
              <FlatCard>
                <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 20 }}>
                  No decisions logged yet. Ask the Advisor to help you frame your next one — anything you commit to becomes a checkpoint here.
                </Text>
                <Pressable
                  testID="cta-ask-advisor"
                  onPress={() => router.push('/(tabs)/advisor')}
                  style={{ marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1 }}
                >
                  <Text style={{ color: c.textPrimary, fontSize: 12, fontWeight: '600' }}>Ask the Advisor →</Text>
                </Pressable>
              </FlatCard>
            ) : (
              decisions.slice(0, 4).map((d) => (
                <View key={d.id} style={{ backgroundColor: c.surface, borderRadius: radii.md, borderColor: c.border, borderWidth: 1, padding: 12, marginBottom: 8 }}>
                  <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '500' }}>{d.title}</Text>
                  {d.decision ? <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>{d.decision}</Text> : null}
                  <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 4, fontFamily: fontFamily.mono }}>{new Date(d.createdAt).toLocaleString()}</Text>
                </View>
              ))
            )}

            <Disclaimer />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
