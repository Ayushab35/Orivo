import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/themeContext';
import { Card, Disclaimer } from '../components/UI';
import { Button } from '../components/Button';
import { fontFamily, radii } from '../lib/theme';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

type Mode = 'credits' | 'pay';

export default function Packages() {
  const { c } = useTheme();
  const router = useRouter();
  const { creditsBalanceSec } = useAuth();
  const [mode, setMode] = useState<Mode>('pay');
  const [packages, setPackages] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/packages').then((r) => {
      setPackages(r.items || []);
      const popular = (r.items || []).find((p: any) => p.popular);
      setSelected(popular?.id || (r.items || [])[0]?.id || null);
    });
  }, []);

  const selPkg = packages.find((p) => p.id === selected);
  const canUseCredits = selPkg && creditsBalanceSec >= selPkg.creditsSec;

  const proceed = async () => {
    if (!selPkg) return;
    if (mode === 'credits') {
      router.push({ pathname: '/booking', params: { packageId: selPkg.id, paymentMode: 'credits' } });
      return;
    }
    // Pay now -> create Stripe checkout immediately, then redirect
    setBusy(true);
    try {
      // Get origin URL for web; fallback for native
      const origin =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const res = await api.post('/payments/checkout', { packageId: selPkg.id, originUrl: origin });
      if (Platform.OS === 'web') {
        window.location.href = res.url;
      } else {
        Alert.alert('Open payment link', res.url);
      }
    } catch (e: any) {
      Alert.alert('Could not start payment', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={{ marginBottom: 14 }}>
          <Text style={{ color: c.textSecondary }}>← Back</Text>
        </Pressable>
        <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>
          PRIVATE CONSULTATION
        </Text>
        <Text
          style={{
            color: c.textPrimary,
            fontSize: 28,
            fontFamily: fontFamily.display,
            fontWeight: "600",
            marginTop: 4,
            marginBottom: 16,
          }}
        >
          Choose a package.
        </Text>

        {/* Mode toggle */}
        <View
          style={{
            flexDirection: "row",
            padding: 4,
            backgroundColor: c.surfaceAlt,
            borderRadius: radii.pill,
            marginBottom: 18,
          }}
        >
          {(["pay", "credits"] as Mode[]).map((m) => (
            <Pressable
              key={m}
              testID={`mode-${m}`}
              onPress={() => setMode(m)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: radii.pill,
                backgroundColor: mode === m ? c.surface : "transparent",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: mode === m ? c.textPrimary : c.textSecondary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {m === "pay"
                  ? "Pay now"
                  : `Use minutes (${Math.floor(creditsBalanceSec / 60)})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {packages.map((p) => {
          const active = selected === p.id;
          const insufficient =
            mode === "credits" && creditsBalanceSec < p.creditsSec;
          return (
            <Pressable
              key={p.id}
              testID={`pkg-${p.id}`}
              onPress={() => setSelected(p.id)}
              style={{
                backgroundColor: c.surface,
                borderRadius: radii.lg,
                borderWidth: active ? 2 : 1,
                borderColor: active ? c.gold : c.border,
                padding: 18,
                marginBottom: 12,
                opacity: insufficient ? 0.5 : 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text
                    style={{
                      color: c.textPrimary,
                      fontSize: 18,
                      fontFamily: fontFamily.display,
                      fontWeight: "600",
                    }}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={{
                      color: c.textSecondary,
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {p.description}
                  </Text>
                  <Text
                    style={{
                      color: c.gold,
                      fontSize: 12,
                      marginTop: 8,
                      letterSpacing: 1,
                    }}
                  >
                    {Math.round(p.creditsSec / 60)} MINUTES
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  {p.popular && (
                    <View
                      style={{
                        backgroundColor: c.gold,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: c.goldInk,
                          fontSize: 9,
                          fontWeight: "700",
                          letterSpacing: 1,
                        }}
                      >
                        POPULAR
                      </Text>
                    </View>
                  )}
                  {mode === "pay" ? (
                    <Text
                      style={{
                        color: c.textPrimary,
                        fontSize: 22,
                        fontFamily: fontFamily.display,
                        fontWeight: "700",
                      }}
                    >
                      ${p.priceUsd}
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: c.textPrimary,
                        fontSize: 22,
                        fontFamily: fontFamily.display,
                        fontWeight: "700",
                      }}
                    >
                      {Math.round(p.creditsSec / 60)}m
                    </Text>
                  )}
                </View>
              </View>
              {insufficient && (
                <Text
                  style={{ color: c.terracotta, fontSize: 11, marginTop: 6 }}
                >
                  Insufficient minutes
                </Text>
              )}
            </Pressable>
          );
        })}

        <Button
          testID="pkg-continue-btn"
          label={
            mode === "pay"
              ? "Continue to payment"
              : canUseCredits
                ? "Choose a slot"
                : "Insufficient minutes"
          }
          onPress={proceed}
          disabled={!selPkg || (mode === "credits" && !canUseCredits)}
          loading={busy}
          variant="gold"
          style={{ marginTop: 8 }}
        />

        <Text
          style={{
            color: c.textSecondary,
            fontSize: 12,
            textAlign: "center",
            marginTop: 14,
            lineHeight: 18,
          }}
        >
          Both paths always available. Earn minutes through reflection — or
          simply pay.
        </Text>
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
