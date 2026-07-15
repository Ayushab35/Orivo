import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../lib/themeContext';
import { fontFamily, radii } from '../lib/theme';
import { Button } from '../components/Button';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function PaymentSuccess() {
  const { c } = useTheme();
  const router = useRouter();
  const { updateCreditsBalance } = useAuth();
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const [status, setStatus] = useState<string>('checking');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const attempts = useRef(0);

  useEffect(() => {
    // Fallback: query string for web
    let sid = session_id;
    if (!sid && Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      sid = params.get('session_id') || undefined as any;
    }
    if (!sid) {
      setStatus('error');
      return;
    }
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const r = await api.get(`/payments/status/${sid}`);
        setPaymentStatus(r.payment_status);
        if (r.payment_status === 'paid') {
          setStatus('paid');
          if (typeof r.creditsBalanceSec === "number") {
            updateCreditsBalance(r.creditsBalanceSec);
          }
          return;
        }
        if (r.status === 'expired') {
          setStatus('expired');
          return;
        }
      } catch (e) {
        // continue polling
      }
      attempts.current += 1;
      if (attempts.current >= 8) {
        setStatus('timeout');
        return;
      }
      setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [session_id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: 22, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
      {status === 'checking' && (
        <>
          <ActivityIndicator color={c.gold} size="large" />
          <Text style={{ color: c.textPrimary, fontSize: 18, fontFamily: fontFamily.display, marginTop: 18 }}>Confirming your payment…</Text>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 6 }}>This takes a few seconds.</Text>
        </>
      )}
      {status === 'paid' && (
        <>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.teal, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
            <Text style={{ color: '#FFF', fontSize: 36 }}>✓</Text>
          </View>
          <Text style={{ color: c.textPrimary, fontSize: 26, fontFamily: fontFamily.display, fontWeight: '600' }}>Minutes added.</Text>
          <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22, maxWidth: 320 }}>
            Your private minutes are in your wallet. Book a slot whenever you're ready — minutes expire 90 days after issue.
          </Text>
          <Button testID="success-book-btn" label="Choose a slot" onPress={() => router.replace('/booking?packageId=executive_30&paymentMode=credits')} variant="gold" style={{ marginTop: 28, paddingHorizontal: 32 }} />
          <Button testID="success-home-btn" label="Back to dashboard" onPress={() => router.replace('/(tabs)/dashboard')} variant="ghost" style={{ marginTop: 8 }} />
        </>
      )}
      {(status === 'expired' || status === 'timeout' || status === 'error') && (
        <>
          <Text style={{ color: c.terracotta, fontSize: 22, fontFamily: fontFamily.display, fontWeight: '600' }}>
            {status === 'expired' ? 'Session expired' : status === 'error' ? 'No session' : 'Still processing'}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center', maxWidth: 320 }}>
            {paymentStatus ? `Payment status: ${paymentStatus}.` : ''} You can try again or check back later.
          </Text>
          <Button label="Back to packages" onPress={() => router.replace('/packages')} variant="primary" style={{ marginTop: 24 }} />
        </>
      )}
    </SafeAreaView>
  );
}
