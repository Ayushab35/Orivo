import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii, fontFamily } from '../lib/theme';
import { Card, SectionTitle, Disclaimer } from './UI';

/**
 * Shared report-card template. Renders a stack of labeled sections from a content tree.
 * `sections` can be heterogeneous — list, key-value, score-bars, paragraph.
 */
export type ReportSection =
  | { kind: 'paragraph'; title?: string; text: string }
  | { kind: 'list'; title: string; items: { title: string; detail?: string; meta?: string }[] }
  | { kind: 'bars'; title: string; items: { label: string; value: number; note?: string }[] }
  | { kind: 'axis'; title: string; leftLabel: string; rightLabel: string; value: number; subtitle?: string };

export function ReportCard({ kicker, title, sections }: { kicker: string; title: string; sections: ReportSection[] }) {
  const { c } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
      <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>{kicker}</Text>
      <Text style={{ color: c.textPrimary, fontSize: 30, fontFamily: fontFamily.display, fontWeight: '600', marginBottom: 20, lineHeight: 36 }}>
        {title}
      </Text>

      {sections.map((s, i) => (
        <Card key={i} style={{ marginBottom: 14 }}>
          {s.kind === 'paragraph' && (
            <View>
              {s.title ? <SectionTitle>{s.title}</SectionTitle> : null}
              <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 23 }}>{s.text}</Text>
            </View>
          )}

          {s.kind === 'list' && (
            <View>
              <SectionTitle>{s.title}</SectionTitle>
              {s.items.map((it, j) => (
                <View key={j} style={{ paddingVertical: 10, borderTopWidth: j === 0 ? 0 : 1, borderColor: c.border }}>
                  <Text style={{ color: c.textPrimary, fontWeight: '600', fontSize: 14 }}>{it.title}</Text>
                  {it.detail ? <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 20 }}>{it.detail}</Text> : null}
                  {it.meta ? <Text style={{ color: c.gold, fontSize: 11, marginTop: 6, letterSpacing: 1 }}>{it.meta.toUpperCase()}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {s.kind === 'bars' && (
            <View>
              <SectionTitle>{s.title}</SectionTitle>
              {s.items.map((it, j) => (
                <View key={j} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '500' }}>{it.label}</Text>
                    <Text style={{ color: c.gold, fontSize: 12, fontWeight: '600' }}>{it.value}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: c.surfaceAlt, borderRadius: radii.pill, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(0, Math.min(100, it.value))}%`, height: '100%', backgroundColor: c.teal }} />
                  </View>
                  {it.note ? <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>{it.note}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {s.kind === 'axis' && (
            <View>
              <SectionTitle>{s.title}</SectionTitle>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>{s.leftLabel}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>{s.rightLabel}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: c.surfaceAlt, borderRadius: radii.pill, position: 'relative' }}>
                <View
                  style={{
                    position: 'absolute',
                    left: `${Math.max(0, Math.min(100, s.value))}%`,
                    transform: [{ translateX: -7 }],
                    top: -3,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: c.gold,
                    borderWidth: 2,
                    borderColor: c.surface,
                  }}
                />
              </View>
              {s.subtitle ? <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 10 }}>{s.subtitle}</Text> : null}
            </View>
          )}
        </Card>
      ))}

      <Disclaimer />
    </ScrollView>
  );
}
