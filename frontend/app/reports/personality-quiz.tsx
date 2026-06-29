import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/themeContext';
import { Button } from '../../components/Button';
import { Card, Disclaimer } from '../../components/UI';
import { fontFamily, radii } from '../../lib/theme';
import { api } from '../../lib/api';

const QUESTIONS = [
  { q: 'I gain energy from rooms with many people.', poles: ['Disagree', 'Agree'] },
  { q: 'I speak first in unfamiliar group settings.', poles: ['Rarely', 'Often'] },
  { q: 'I optimize decisions for outcomes 3+ years out.', poles: ['Disagree', 'Agree'] },
  { q: 'Short-term wins influence my big bets.', poles: ['Often', 'Rarely'] },
  { q: 'I commit to a decision once I have ~70% of the data.', poles: ['Rarely', 'Often'] },
];

export default function Quiz() {
  const { c } = useTheme();
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(0));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const setA = (i: number, v: number) => {
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
  };

  const submit = async () => {
    if (answers.some((a) => a === 0)) {
      Alert.alert('Please answer every question.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await api.post('/reports/personality/quiz', { answers });
      setResult(r);
    } catch (e: any) {
      Alert.alert('Could not submit', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Text style={{ color: c.textSecondary }}>← Back</Text>
          </Pressable>
          <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>ASSESSMENT RESULT</Text>
          <Text style={{ color: c.textPrimary, fontSize: 26, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4, marginBottom: 20, lineHeight: 34 }}>
            Your operating profile.
          </Text>
          <Card style={{ marginBottom: 12 }}>
            <Text testID="quiz-summary" style={{ color: c.textPrimary, fontSize: 15, lineHeight: 23 }}>{result.summary}</Text>
          </Card>
          <Card style={{ marginBottom: 12 }}>
            <AxisLine label="Introvert ↔ Extrovert" value={result.axis.introvertExtrovert} />
            <AxisLine label="Near-term ↔ Long-horizon" value={result.axis.goalOrientation} />
            <AxisLine label="Deliberative ↔ Decisive" value={result.axis.decisiveness} />
          </Card>
          <Button testID="quiz-done-btn" label="Done" onPress={() => router.replace('/(tabs)/insights')} variant="gold" />
          <Disclaimer />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: c.textSecondary }}>← Back</Text>
        </Pressable>
          <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5 }}>LEADERSHIP ASSESSMENT</Text>
        <Text style={{ color: c.textPrimary, fontSize: 26, fontFamily: fontFamily.display, fontWeight: '600', marginTop: 4, marginBottom: 24, lineHeight: 34 }}>
          5 questions. 60 seconds.
        </Text>

        {QUESTIONS.map((q, i) => (
          <Card key={i} style={{ marginBottom: 14 }}>
            <Text style={{ color: c.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 12, lineHeight: 22 }}>{i + 1}. {q.q}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: c.textSecondary, fontSize: 11 }}>{q.poles[0]}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <Pressable
                    key={v}
                    testID={`q${i}-${v}`}
                    onPress={() => setA(i, v)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      borderWidth: 1,
                      borderColor: answers[i] === v ? c.gold : c.border,
                      backgroundColor: answers[i] === v ? c.gold : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: answers[i] === v ? c.goldInk : c.textSecondary, fontSize: 12, fontWeight: '600' }}>{v}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={{ color: c.textSecondary, fontSize: 11 }}>{q.poles[1]}</Text>
            </View>
          </Card>
        ))}

        <Button testID="quiz-submit-btn" label="See my profile" onPress={submit} loading={submitting} variant="gold" />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

function AxisLine({ label, value }: { label: string; value: number }) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '500', marginBottom: 8 }}>{label}</Text>
      <View style={{ height: 8, backgroundColor: c.surfaceAlt, borderRadius: radii.pill, position: 'relative' }}>
        <View
          style={{
            position: 'absolute',
            left: `${Math.max(0, Math.min(100, value))}%`,
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
      <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 4 }}>Score: {value}</Text>
    </View>
  );
}
