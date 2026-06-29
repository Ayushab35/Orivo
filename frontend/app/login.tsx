import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/themeContext';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { fontFamily } from '../lib/theme';
import { api } from '../lib/api';

export default function Login() {
  const { c } = useTheme();
  const router = useRouter();
  const [phone, setPhone] = useState('+15551234567');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    setErr('');
    if (!phone || phone.length < 6) {
      setErr('Enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/otp/send', { phone });
      router.push({ pathname: '/verify', params: { phone } });
    } catch (e: any) {
      setErr(e.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 28, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: c.textPrimary, fontSize: 16, fontFamily: fontFamily.display, fontWeight: '600', letterSpacing: 3 }}>ORIVO</Text>

        <Text
          style={{
            color: c.textPrimary,
            fontSize: 30,
            fontFamily: fontFamily.display,
            fontWeight: '600',
            marginTop: 36,
            lineHeight: 38,
          }}
        >
          Sign in.
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 8, marginBottom: 28, lineHeight: 22 }}>
          A 6-digit code will be sent to your number. We never store it. We never share it.
        </Text>

        <Field
          testID="phone-input"
          label="Mobile number"
          placeholder="+1 555 000 0000"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={setPhone}
        />

        {err ? <Text testID="login-error" style={{ color: c.terracotta, fontSize: 13, marginBottom: 12 }}>{err}</Text> : null}

        <Button testID="send-otp-btn" label="Send code" onPress={send} loading={loading} variant="primary" />

        <View
          style={{
            marginTop: 22,
            padding: 14,
            backgroundColor: c.surfaceAlt,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <Text style={{ color: c.textSecondary, fontSize: 12, lineHeight: 18 }}>
            Dev mode: use the code <Text style={{ color: c.gold, fontWeight: '700' }}>123456</Text> for any number. Twilio integration plugs in later.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
