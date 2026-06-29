import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Animated, Easing } from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../lib/auth';
import { fontFamily, radii } from '../../lib/theme';
import { Kicker, FlatCard, Pill, Disclaimer } from '../../components/UI';
import { TierBadge, MinutesPill } from '../../components/Badges';
import { RoleFitCard } from '../../components/RoleFitCard';
import { PhaseCard, PeakWindowCard, BriefCard } from '../../components/IntelCards';
import { FadeInUp, PulseDot } from '../../components/Animated';
import { api } from '../../lib/api';
import { cacheGet, cacheSet } from '../../lib/cache';

const QUICK = [
  { key: 'leadership', label: 'Leadership Profile', icon: 'person-outline', module: 'personality' },
  { key: 'wealth', label: 'Wealth Dynamics', icon: 'trending-up-outline', module: 'financialPatterns' },
  { key: 'assets', label: 'Strategic Assets', icon: 'shield-outline', module: 'strengths' },
  { key: 'market', label: 'Market Perception', icon: 'eye-outline', module: 'publicImage' },
  { key: 'edge', label: 'Executive Edge', icon: 'flash-outline', module: 'career' },
  { key: 'numeric', label: 'Numerical Intelligence', icon: 'apps-outline', module: 'numerology' },
];

const TODAY_KEY = () => `dashboard.${new Date().toISOString().slice(0, 10)}`;

export default function Dashboard() {
  const { c } = useTheme();
  const router = useRouter();
  const { user, creditsBalanceSec, refresh } = useAuth();
  const [data, setData] = useState<any>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bonusVisible, setBonusVisible] = useState(false);

  const toastOp = useRef(new Animated.Value(0)).current;
  const toastTr = useRef(new Animated.Value(0)).current;

  const showBonus = () => {
    setBonusVisible(true);
    Animated.parallel([
      Animated.timing(toastOp, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(toastTr, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOp, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(toastTr, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setBonusVisible(false));
    }, 3200);
  };

  const load = async () => {
    try {
      // Try memory/AsyncStorage cache first for an instant paint
      const cached = await cacheGet<any>(TODAY_KEY());
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      const [b, d] = await Promise.all([api.get('/dashboard/today'), api.get('/decisions')]);
      setData(b);
      setDecisions(d.items || []);
      await cacheSet(TODAY_KEY(), b, 1000 * 60 * 60 * 6);
      await refresh();
      if (b.dailyLoginBonusGranted) showBonus();
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
      {bonusVisible && (
        <Animated.View
          testID="login-bonus-toast"
          style={{
            position: 'absolute',
            top: 12,
            left: 16,
            right: 16,
            zIndex: 10,
            opacity: toastOp,
            transform: [{ translateY: toastTr.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }}
        >
          <View
            style={{
              backgroundColor: c.surface,
              borderColor: c.gold,
              borderWidth: 1,
              borderRadius: radii.md,
              paddingVertical: 10,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(201,169,97,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={14} color={c.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '600' }}>+10 seconds added</Text>
              <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 1 }}>Daily check-in reward — visible in Membership.</Text>
            </View>
          </View>
        </Animated.View>
      )}

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
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' }}>
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
            {/* Role-fit replaces Decision Score */}
            <FadeInUp index={0}>
              {data.roleFit && <RoleFitCard testID="rolefit-card" data={data.roleFit} />}
            </FadeInUp>

            {/* Phase */}
            <FadeInUp index={1} style={{ marginTop: 14 }}>
              <PhaseCard testID="phase-card" phase={data.phase} />
            </FadeInUp>

            {/* Peak Window */}
            <FadeInUp index={2} style={{ marginTop: 14 }}>
              <PeakWindowCard testID="peak-window-card" window={data.peakWindow} />
              <Pressable
                testID="full-outlook-link"
                onPress={() => router.push('/outlook')}
                style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingVertical: 4 }}
              >
                <Text style={{ color: c.gold, fontSize: 12, fontWeight: '600' }}>Full daily brief</Text>
                <Ionicons name="arrow-forward" size={13} color={c.gold} />
              </Pressable>
            </FadeInUp>

            {/* Today's Brief */}
            <FadeInUp index={3} style={{ marginTop: 8 }}>
              <BriefCard testID="brief-card" brief={data.brief} />
            </FadeInUp>

            {/* Quick Insights */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 10 }}>
              <Kicker>Quick Insights</Kicker>
              <Pressable testID="dash-all-insights" onPress={() => router.push('/(tabs)/insights')}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>All ›</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {QUICK.map((q, i) => (
                <FadeInUp key={q.key} index={4 + i} delay={50} style={{ width: '48.5%' }}>
                  <Pressable
                    testID={`quick-${q.key}`}
                    onPress={() => router.push(q.module === 'numerology' ? '/numerology' : (`/reports/${q.module}` as any))}
                    style={({ pressed }: any) => ({
                      backgroundColor: pressed ? c.surfaceAlt : c.surface,
                      borderRadius: radii.md,
                      borderColor: c.border,
                      borderWidth: 1,
                      padding: 14,
                    })}
                  >
                    <Ionicons name={q.icon as any} size={18} color={c.gold} />
                    <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '500', marginTop: 10 }}>{q.label}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 4 }}>Updated today</Text>
                  </Pressable>
                </FadeInUp>
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
              decisions.slice(0, 4).map((d, i) => (
                <FadeInUp key={d.id} index={i}>
                  <View style={{ backgroundColor: c.surface, borderRadius: radii.md, borderColor: c.border, borderWidth: 1, padding: 12, marginBottom: 8 }}>
                    <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '500' }}>{d.title}</Text>
                    {d.decision ? <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>{d.decision}</Text> : null}
                    <Text style={{ color: c.textMuted, fontSize: 10, marginTop: 4, fontFamily: fontFamily.mono }}>{new Date(d.createdAt).toLocaleString()}</Text>
                  </View>
                </FadeInUp>
              ))
            )}

            <Disclaimer />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
