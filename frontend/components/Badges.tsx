import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii, fontFamily } from '../lib/theme';

export function TierBadge({ tier, testID }: { tier?: string; testID?: string }) {
  const { c } = useTheme();
  const label = (tier || 'executive').toUpperCase();
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(201,169,97,0.10)',
        borderColor: 'rgba(201,169,97,0.35)',
        borderWidth: 1,
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: c.gold }} />
      <Text style={{ color: c.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
}

export function MinutesPill({ seconds, testID }: { seconds: number; testID?: string }) {
  const { c } = useTheme();
  const mm = Math.floor((seconds || 0) / 60);
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radii.pill,
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: 1,
      }}
    >
      <Text style={{ color: c.gold, fontFamily: fontFamily.mono, fontSize: 12, fontWeight: '700' }}>{mm}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' }}>min</Text>
    </View>
  );
}
