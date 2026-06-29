import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeContext';
import { Card, Disclaimer } from '../components/UI';
import { Button } from '../components/Button';
import { fontFamily, radii } from '../lib/theme';
import { api } from '../lib/api';

export default function Booking() {
  const { c } = useTheme();
  const router = useRouter();
  const { packageId, paymentMode } = useLocalSearchParams<{ packageId: string; paymentMode: 'credits' | 'stripe' }>();
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [outlooks, setOutlooks] = useState<Record<string, any>>({});
  const [selectedDay, setSelectedDay] = useState(0);
  const [slot, setSlot] = useState<{ start: string; end: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  useEffect(() => {
    // Fetch today's outlook to highlight favorable hours (use same windows for 7 days for MVP)
    api.get('/outlook/today').then((o) => {
      const s = new Set<string>();
      (o.favorable || []).forEach((w: any) => {
        const h = new Date(w.start).getHours();
        s.add(String(h));
      });
      setFavSet(s);
      setOutlooks({ today: o });
    });
  }, []);

  const dayDate = days[selectedDay];
  const hours = Array.from({ length: 11 }, (_, i) => 9 + i); // 09:00 to 19:00

  const confirm = async () => {
    if (!slot) return;
    setBusy(true);
    try {
      const res = await api.post('/bookings', {
        packageId,
        paymentMode,
        slotStart: slot.start,
        slotEnd: slot.end,
      });
      if (res.needsPayment) {
        Alert.alert('Booking pending', 'Complete payment to confirm your slot.');
        router.replace('/packages');
      } else {
        Alert.alert('Booking confirmed', `Your session is scheduled for ${new Date(slot.start).toLocaleString()}.`, [
          { text: 'Done', onPress: () => router.replace('/(tabs)/home') },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Could not book', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: c.textSecondary }}>← Back</Text>
        </Pressable>
        <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>CHOOSE A SLOT</Text>
        <Text style={{ color: c.textPrimary, fontSize: 28, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4, marginBottom: 16 }}>
          Pick a window.
        </Text>

        <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.5, marginBottom: 10 }}>DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {days.map((d, i) => {
              const active = selectedDay === i;
              return (
                <Pressable
                  key={i}
                  testID={`day-${i}`}
                  onPress={() => { setSelectedDay(i); setSlot(null); }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: radii.md,
                    backgroundColor: active ? c.primary : c.surface,
                    borderWidth: 1,
                    borderColor: active ? c.primary : c.border,
                    alignItems: 'center',
                    minWidth: 60,
                  }}
                >
                  <Text style={{ color: active ? c.primaryInk : c.textSecondary, fontSize: 10, letterSpacing: 1 }}>{d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</Text>
                  <Text style={{ color: active ? '#FFF' : c.textPrimary, fontSize: 18, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4 }}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.5, marginBottom: 10 }}>HOUR</Text>
        <Text style={{ color: c.gold, fontSize: 11, marginBottom: 12 }}>● favorable window</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {hours.map((h) => {
            const start = new Date(dayDate);
            start.setHours(h, 0, 0, 0);
            const end = new Date(start);
            end.setMinutes(end.getMinutes() + 30);
            const isFav = favSet.has(String(h));
            const isSel = slot && new Date(slot.start).getHours() === h && selectedDay === days.findIndex((d) => d.toDateString() === new Date(slot.start).toDateString());
            return (
              <Pressable
                key={h}
                testID={`slot-${h}`}
                onPress={() => setSlot({ start: start.toISOString(), end: end.toISOString() })}
                style={{
                  width: '23%',
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: isSel ? c.gold : isFav ? c.teal : c.border,
                  backgroundColor: isSel ? c.gold : isFav ? 'rgba(15,110,86,0.08)' : c.surface,
                }}
              >
                <Text style={{ color: isSel ? c.goldInk : isFav ? c.teal : c.textPrimary, fontWeight: '600', fontSize: 14 }}>{String(h).padStart(2, '0')}:00</Text>
                {isFav && !isSel && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.teal, marginTop: 4 }} />}
              </Pressable>
            );
          })}
        </View>

        {slot && (
          <Card style={{ marginTop: 18 }}>
            <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 1.5 }}>YOUR SLOT</Text>
            <Text style={{ color: c.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 6 }}>
              {new Date(slot.start).toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>Paying with {paymentMode === 'credits' ? 'credits' : 'card'} · Package {packageId}</Text>
          </Card>
        )}

        <Button
          testID="booking-confirm-btn"
          label="Confirm booking"
          onPress={confirm}
          disabled={!slot}
          loading={busy}
          variant="gold"
          style={{ marginTop: 18 }}
        />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
