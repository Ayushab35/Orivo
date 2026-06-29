import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii } from '../lib/theme';

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
        paddingVertical: 5,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(189,139,46,0.14)',
        borderColor: c.gold,
        borderWidth: 1,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.gold }} />
      <Text style={{ color: c.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
}

export function CreditPill({ seconds, testID }: { seconds: number; testID?: string }) {
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
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.gold }} />
      <Text style={{ color: c.textPrimary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>{mm} min</Text>
    </View>
  );
}
