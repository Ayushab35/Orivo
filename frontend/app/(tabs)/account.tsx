import React from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { fontFamily, radii } from '../../lib/theme';
import { Card } from '../../components/UI';
import { TierBadge } from '../../components/Badges';
import { useAuth } from '../../lib/auth';

export default function Account() {
  const { c, theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const referralShare = async () => {
    try {
      const url = `Join me on Orivo — private decision support for founders. Use my code ${user?.referralCode} to claim 10 bonus minutes.`;
      // @ts-ignore
      if (typeof navigator !== 'undefined' && navigator.share) {
        // @ts-ignore
        await navigator.share({ title: 'Orivo', text: url });
      } else {
        await Share.share({ message: url });
      }
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={{ paddingTop: 18, paddingBottom: 14 }}>
          <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>ACCOUNT</Text>
          <Text style={{ color: c.textPrimary, fontSize: 26, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4 }}>
            {user?.name || 'Founder'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <TierBadge tier={user?.tier} />
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>{user?.businessName}</Text>
          </View>
        </View>

        <Card style={{ marginBottom: 14 }}>
          <Row label="Phone" value={user?.phone || '—'} />
          <Row label="Role" value={user?.role || '—'} />
          <Row label="Industry" value={user?.industry || '—'} />
          <Row label="Date of birth" value={user?.birth?.date || '—'} />
          <Row label="Time of birth" value={user?.birth?.time || '—'} />
          <Row label="Place of birth" value={user?.birth?.placeName || '—'} last />
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '600' }}>Dark theme</Text>
              <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>Switch the interior lighting of Orivo.</Text>
            </View>
            <Switch
              testID="theme-switch"
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: c.border, true: c.gold }}
              thumbColor={c.surface}
            />
          </View>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>REFERRAL</Text>
          <Text style={{ color: c.textPrimary, fontSize: 18, fontFamily: fontFamily.display, fontWeight: '600' }}>
            {user?.referralCode || '—'}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 6, marginBottom: 14 }}>
            Share your code. Each peer who joins gives you both 10 bonus minutes.
          </Text>
          <Pressable
            testID="referral-share"
            onPress={referralShare}
            style={{ backgroundColor: c.primary, borderRadius: radii.pill, paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ color: c.primaryInk, fontSize: 13, fontWeight: '600' }}>Share referral</Text>
          </Pressable>
        </Card>

        <Pressable
          testID="logout-btn"
          onPress={() => {
            signOut().then(() => router.replace('/onboarding'));
          }}
          style={{ marginTop: 8, alignItems: 'center', paddingVertical: 14 }}
        >
          <Text style={{ color: c.terracotta, fontSize: 13, fontWeight: '600' }}>Sign out</Text>
        </Pressable>

        <Text style={{ color: c.textSecondary, fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 14 }}>
          For self-reflection and decision support — not a guarantee of outcomes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderColor: c.border,
      }}
    >
      <Text style={{ color: c.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}
