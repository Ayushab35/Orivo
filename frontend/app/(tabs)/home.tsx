import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../lib/auth';
import { fontFamily, radii } from '../../lib/theme';
import { Card, Pill } from '../../components/UI';
import { TierBadge, CreditPill } from '../../components/Badges';
import { api } from '../../lib/api';

const SHORTCUTS = [
  { key: 'outlook', label: "Today's outlook", icon: 'sunny-outline', href: '/outlook' },
  { key: 'personality', label: 'Personality', icon: 'person-circle-outline', href: '/reports/personality' },
  { key: 'strengths', label: 'Strengths', icon: 'flame-outline', href: '/reports/strengths' },
  { key: 'career', label: 'Career trait', icon: 'briefcase-outline', href: '/reports/career' },
  { key: 'publicImage', label: 'Public image', icon: 'eye-outline', href: '/reports/publicImage' },
  { key: 'financialPatterns', label: 'Financial patterns', icon: 'trending-up-outline', href: '/reports/financialPatterns' },
  { key: 'numerology', label: 'Numerology', icon: 'grid-outline', href: '/numerology' },
  { key: 'booking', label: 'Book session', icon: 'calendar-outline', href: '/packages' },
];

export default function Home() {
  const { c } = useTheme();
  const router = useRouter();
  const { user, creditsBalanceSec, refresh } = useAuth();
  const [outlook, setOutlook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const o = await api.get('/outlook/today');
        setOutlook(o);
        await refresh();
      } catch {}
      setLoading(false);
    })();
  }, []);

  const fav = outlook?.favorable?.[0];
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
          <View>
            <Text style={{ color: c.textSecondary, fontSize: 12, letterSpacing: 2 }}>{greeting.toUpperCase()}</Text>
            <Text style={{ color: c.textPrimary, fontSize: 22, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 2 }}>
              {user?.name?.split(' ')[0] || 'Founder'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CreditPill testID="home-credits-pill" seconds={creditsBalanceSec} />
            <Pressable testID="notif-bell" onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={c.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Tier */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          <TierBadge testID="home-tier-badge" tier={user?.tier} />
          {user?.businessName ? <Pill label={user.businessName} tone="neutral" /> : null}
        </View>

        {/* Favorable window banner */}
        <Pressable testID="home-fav-banner" onPress={() => router.push('/outlook')}>
          <View
            style={{
              backgroundColor: c.primary,
              borderRadius: radii.lg,
              padding: 22,
              marginBottom: 18,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <View
              style={{
                position: 'absolute',
                right: -40,
                top: -40,
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: 'rgba(189,139,46,0.15)',
              }}
            />
            <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5, marginBottom: 8 }}>TODAY'S FAVORABLE WINDOW</Text>
            {loading ? (
              <ActivityIndicator color={c.gold} style={{ alignSelf: 'flex-start' }} />
            ) : fav ? (
              <>
                <Text style={{ color: '#FFF', fontSize: 24, fontFamily: fontFamily.display, fontWeight: '600' }}>
                  {fmtTime(fav.start)} — {fmtTime(fav.end)}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6, lineHeight: 22 }}>
                  {fav.label}. {fav.reason}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 }}>
                  <Text style={{ color: c.gold, fontSize: 13, fontWeight: '600' }}>View full outlook</Text>
                  <Ionicons name="arrow-forward" size={14} color={c.gold} />
                </View>
              </>
            ) : (
              <Text style={{ color: '#FFF' }}>Outlook unavailable</Text>
            )}
          </View>
        </Pressable>

        {/* Shortcuts */}
        <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>EXPLORE</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {SHORTCUTS.map((s) => (
            <Pressable
              key={s.key}
              testID={`shortcut-${s.key}`}
              onPress={() => router.push(s.href as any)}
              style={{
                width: '48%',
                backgroundColor: c.surface,
                borderRadius: radii.md,
                borderColor: c.border,
                borderWidth: 1,
                padding: 16,
              }}
            >
              <Ionicons name={s.icon as any} size={22} color={c.gold} />
              <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 10 }}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
