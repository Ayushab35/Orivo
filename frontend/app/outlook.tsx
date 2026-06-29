import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeContext';
import { fontFamily, radii } from '../lib/theme';
import { Card, Disclaimer } from '../components/UI';
import { api } from '../lib/api';

export default function Outlook() {
  const { c } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const o = await api.get('/outlook/today');
        setData(o);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const addToCalendar = async (slot: any, tone: 'fav' | 'caution') => {
    const ics = makeICS(slot, tone);
    if (Platform.OS === 'web') {
      const blob = new Blob([ics], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orivo-${slot.label.replace(/\s+/g, '-').toLowerCase()}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      await Share.share({ message: ics });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Pressable testID="outlook-back" onPress={() => router.back()} style={{ marginBottom: 14 }}>
          <Text style={{ color: c.textSecondary }}>← Back</Text>
        </Pressable>

        <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>TODAY'S OUTLOOK</Text>
        <Text style={{ color: c.textPrimary, fontSize: 28, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4, marginBottom: 18 }}>
          {data?.date ? new Date(data.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Today'}
        </Text>

        {loading ? <ActivityIndicator color={c.gold} /> : (
          <>
            <Section title="Favorable windows" tone="fav" />
            {(data?.favorable || []).map((w: any, i: number) => (
              <SlotCard key={`f${i}`} slot={w} tone="fav" onAdd={() => addToCalendar(w, 'fav')} testID={`fav-slot-${i}`} />
            ))}

            <View style={{ height: 14 }} />
            <Section title="Caution windows" tone="caution" />
            {(data?.caution || []).map((w: any, i: number) => (
              <SlotCard key={`c${i}`} slot={w} tone="caution" onAdd={() => addToCalendar(w, 'caution')} testID={`caution-slot-${i}`} />
            ))}
          </>
        )}

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, tone }: { title: string; tone: 'fav' | 'caution' }) {
  const { c } = useTheme();
  const color = tone === 'fav' ? c.teal : c.terracotta;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color, fontSize: 12, letterSpacing: 1.5, fontWeight: '700' }}>{title.toUpperCase()}</Text>
    </View>
  );
}

function SlotCard({ slot, tone, onAdd, testID }: { slot: any; tone: 'fav' | 'caution'; onAdd: () => void; testID: string }) {
  const { c } = useTheme();
  const color = tone === 'fav' ? c.teal : c.terracotta;
  return (
    <Card style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: color }}>
      <Text style={{ color: c.textPrimary, fontSize: 18, fontFamily: fontFamily.display, fontWeight: '600' }}>
        {fmt(slot.start)} — {fmt(slot.end)}
      </Text>
      <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 6 }}>{slot.label}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 20 }}>{slot.reason}</Text>
      <Pressable
        testID={testID}
        onPress={onAdd}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          marginTop: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: radii.pill,
          backgroundColor: c.surfaceAlt,
        }}
      >
        <Ionicons name="calendar-outline" size={14} color={c.primary} />
        <Text style={{ color: c.primary, fontSize: 12, fontWeight: '600' }}>Add to calendar</Text>
      </Pressable>
    </Card>
  );
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function makeICS(slot: any, tone: 'fav' | 'caution') {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const dtStart = fmt(new Date(slot.start));
  const dtEnd = fmt(new Date(slot.end));
  const title = `Orivo — ${tone === 'fav' ? 'Favorable' : 'Caution'}: ${slot.label}`;
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Orivo//Outlook//EN
BEGIN:VEVENT
UID:${Date.now()}@orivo.app
DTSTAMP:${dtStart}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${title}
DESCRIPTION:${slot.reason}
END:VEVENT
END:VCALENDAR`;
}
