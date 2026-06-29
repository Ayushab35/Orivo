import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeContext';
import { fontFamily, radii } from '../lib/theme';
import { api } from '../lib/api';

export default function Notifications() {
  const { c } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then((r) => { setItems(r.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: c.textSecondary }}>← Back</Text>
        </Pressable>
        <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>NOTIFICATIONS</Text>
        <Text style={{ color: c.textPrimary, fontSize: 26, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4, marginBottom: 18 }}>
          The room is quiet.
        </Text>

        {loading ? <ActivityIndicator color={c.gold} /> : items.length === 0 ? (
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>Nothing here yet.</Text>
        ) : (
          items.map((n) => (
            <View
              key={n.id}
              testID={`notif-${n.id}`}
              style={{
                backgroundColor: c.surface,
                borderRadius: radii.md,
                borderColor: c.border,
                borderWidth: 1,
                padding: 14,
                marginBottom: 10,
                flexDirection: 'row',
                gap: 12,
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="alert-circle-outline" size={18} color={c.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '600' }}>{n.title}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 19 }}>{n.body}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
