import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useTheme } from '../lib/themeContext';
import { useAuth } from '../lib/auth';
import { fontFamily } from '../lib/theme';

export default function Splash() {
  const { c } = useTheme();
  const { ready, user } = useAuth();

  if (!ready) {
    return (
      <View testID="splash-screen" style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              backgroundColor: c.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Text style={{ color: c.gold, fontFamily: fontFamily.display, fontSize: 30, fontWeight: '700' }}>O</Text>
          </View>
          <Text style={{ color: c.textPrimary, fontSize: 26, fontFamily: fontFamily.display, fontWeight: '600', letterSpacing: 2 }}>ORIVO</Text>
          <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 4, marginTop: 6 }}>PRIVATE DECISION SUPPORT</Text>
          <ActivityIndicator color={c.gold} style={{ marginTop: 28 }} />
        </View>
      </View>
    );
  }

  if (!user) return <Redirect href="/onboarding" />;
  if (!user.onboarded) return <Redirect href="/birth-details" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
