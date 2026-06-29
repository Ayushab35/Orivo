import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/themeContext';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { fontFamily } from '../lib/theme';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Verify() {
  const { c } = useTheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithToken } = useAuth();

  const verify = async () => {
    setErr('');
    setLoading(true);
    try {
      const res = await api.post('/auth/otp/verify', { phone, code });
      await signInWithToken(res.token, res.user);
      if (!res.user.onboarded) router.replace('/birth-details');
      else router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      setErr(e.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 22, paddingTop: 28, flex: 1 }}>
        <Pressable testID="verify-back" onPress={() => router.back()}>
          <Text style={{ color: c.textSecondary, fontSize: 14 }}>← Back</Text>
        </Pressable>

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
          Enter the code.
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 14, marginTop: 8, marginBottom: 28 }}>
          Sent to {phone}. In dev mode, use 123456.
        </Text>

        <Field
          testID="otp-input"
          label="6-digit code"
          placeholder="• • • • • •"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />

        {err ? <Text testID="verify-error" style={{ color: c.terracotta, fontSize: 13, marginBottom: 12 }}>{err}</Text> : null}

        <Button testID="verify-btn" label="Verify & continue" onPress={verify} loading={loading} variant="primary" />
      </View>
    </SafeAreaView>
  );
}
