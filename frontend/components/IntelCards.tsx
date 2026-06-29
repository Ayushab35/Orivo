import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { fontFamily, radii } from '../lib/theme';
import { Kicker, Pill } from './UI';

export function PhaseCard({ phase, testID }: { phase: any; testID?: string }) {
  const { c } = useTheme();
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: c.surface,
        borderRadius: radii.lg,
        borderColor: c.border,
        borderWidth: 1,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View>
          <Kicker>Current Leadership Phase</Kicker>
          <Text style={{ color: c.textPrimary, fontFamily: fontFamily.display, fontSize: 24, fontWeight: '500', marginTop: 4 }}>{phase?.label}</Text>
        </View>
        <Pill label={`${phase?.daysRemaining ?? 0} days left`} tone="gold" />
      </View>

      <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 20 }}>{phase?.thesis}</Text>

      <View style={{ height: 3, backgroundColor: c.surfaceMuted, borderRadius: 2, marginTop: 16, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${phase?.progressPct ?? 0}%`, backgroundColor: c.gold }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ color: c.textMuted, fontSize: 10, fontFamily: fontFamily.mono }}>DAY {phase?.daysIn ?? 0}</Text>
        <Text style={{ color: c.textMuted, fontSize: 10, fontFamily: fontFamily.mono }}>OF {phase?.cycleLength ?? 120}</Text>
      </View>
    </View>
  );
}

export function PeakWindowCard({ window, testID }: { window: any; testID?: string }) {
  const { c } = useTheme();
  const start = fmt(window?.start);
  const end = fmt(window?.end);
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: c.surface,
        borderRadius: radii.lg,
        borderColor: c.border,
        borderWidth: 1,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Kicker>Peak Decision Window</Kicker>
          <Text testID="peak-window-time" style={{ color: c.textPrimary, fontFamily: fontFamily.display, fontSize: 26, fontWeight: '500', marginTop: 4, letterSpacing: -0.5 }}>
            {start} <Text style={{ color: c.textMuted }}>—</Text> {end}
          </Text>
        </View>
        <Pill label={`${window?.confidence || 'High'} conf.`} tone="positive" />
      </View>
      {window?.rationale ? (
        <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 }}>{window.rationale}</Text>
      ) : null}

      {window?.secondary && (
        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: c.textMuted, fontSize: 11, letterSpacing: 1 }}>SECONDARY</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: fontFamily.mono }}>
            {fmt(window.secondary.start)} — {fmt(window.secondary.end)}
          </Text>
        </View>
      )}
    </View>
  );
}

export function BriefCard({ brief, testID }: { brief: string; testID?: string }) {
  const { c } = useTheme();
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: c.surfaceMuted,
        borderRadius: radii.lg,
        borderColor: c.border,
        borderWidth: 1,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.gold }} />
        <Kicker color={c.gold}>Today's Brief</Kicker>
      </View>
      <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 23, letterSpacing: 0.1 }}>{brief}</Text>
    </View>
  );
}

export function ActivityList({ allowed, avoid }: { allowed: string[]; avoid: string[] }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: radii.md, borderColor: c.border, borderWidth: 1, padding: 14 }}>
        <Kicker color={c.teal}>Excellent for</Kicker>
        <View style={{ marginTop: 10, gap: 8 }}>
          {allowed.map((a, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 14, height: 1.5, backgroundColor: c.teal }} />
              <Text style={{ color: c.textPrimary, fontSize: 13 }}>{a}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: radii.md, borderColor: c.border, borderWidth: 1, padding: 14 }}>
        <Kicker color={c.terracotta}>Hold off on</Kicker>
        <View style={{ marginTop: 10, gap: 8 }}>
          {avoid.map((a, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 14, height: 1.5, backgroundColor: c.terracotta }} />
              <Text style={{ color: c.textPrimary, fontSize: 13 }}>{a}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
