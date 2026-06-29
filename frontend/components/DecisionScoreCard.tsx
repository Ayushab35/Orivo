import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { fontFamily, radii } from '../lib/theme';
import { Kicker } from './UI';

/** Decision Index dial — large analytical number with sub-meters. */
export function DecisionScoreCard({
  score,
  label,
  tone,
  components,
  testID,
}: {
  score: number;
  label: string;
  tone: 'positive' | 'neutral' | 'caution';
  components: { momentum: number; clarity: number; energy: number; riskTolerance: number };
  testID?: string;
}) {
  const { c } = useTheme();
  const tint = tone === 'positive' ? c.positive : tone === 'caution' ? c.terracotta : c.gold;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [score]);
  const animatedText = anim.interpolate({ inputRange: [0, 100], outputRange: ['0', '100'] });

  return (
    <View
      testID={testID}
      style={{
        backgroundColor: c.surface,
        borderRadius: radii.lg,
        borderColor: c.border,
        borderWidth: 1,
        padding: 22,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Kicker>Decision Index</Kicker>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
            <Text testID="decision-score-value" style={{ color: tint, fontFamily: fontFamily.display, fontSize: 64, fontWeight: '500', letterSpacing: -2 }}>
              {score}
            </Text>
            <Text style={{ color: c.textMuted, fontFamily: fontFamily.mono, fontSize: 14, marginLeft: 4 }}>/100</Text>
          </View>
          <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '500', marginTop: 2 }}>{label}</Text>
        </View>
        <View style={{ width: 8, height: 64, borderRadius: 4, backgroundColor: c.surfaceMuted, marginTop: 18 }}>
          <View style={{ width: '100%', height: `${score}%`, backgroundColor: tint, borderRadius: 4, position: 'absolute', bottom: 0 }} />
        </View>
      </View>

      <View style={{ marginTop: 18, gap: 8 }}>
        {(['momentum', 'clarity', 'energy', 'riskTolerance'] as const).map((k) => (
          <SubMeter key={k} label={LABELS[k]} value={components[k]} color={tint} />
        ))}
      </View>
    </View>
  );
}

const LABELS = {
  momentum: 'Momentum',
  clarity: 'Clarity',
  energy: 'Energy',
  riskTolerance: 'Risk tolerance',
};

function SubMeter({ label, value, color }: { label: string; value: number; color: string }) {
  const { c } = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 0.4 }}>{label}</Text>
        <Text style={{ color: c.textPrimary, fontSize: 11, fontFamily: fontFamily.mono }}>{value}</Text>
      </View>
      <View style={{ height: 3, backgroundColor: c.surfaceMuted, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${value}%`, backgroundColor: color, opacity: 0.7 }} />
      </View>
    </View>
  );
}
