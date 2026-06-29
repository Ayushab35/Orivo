import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/themeContext';
import { Button } from '../components/Button';
import { fontFamily, radii } from '../lib/theme';

const CARDS = [
  {
    kicker: 'DECISION INTELLIGENCE',
    title: 'Bloomberg for your personal decision making.',
    body: 'Calm, objective, private. Read your leadership style, timing, and posture — not your horoscope.',
  },
  {
    kicker: 'TIMING THAT COMPOUNDS',
    title: 'Know your peak decision windows before the day begins.',
    body: 'A daily decision index, a current leadership phase, and the precise hours when your judgement is sharpest.',
  },
  {
    kicker: 'ON YOUR TERMS',
    title: 'An AI Advisor, on call. Private minutes when you need counsel.',
    body: 'Frame your hardest decisions against your patterns. Spend minutes with a senior advisor when stakes are real.',
  },
];

export default function Onboarding() {
  const { c } = useTheme();
  const router = useRouter();
  const [i, setI] = useState(0);
  const ref = useRef<ScrollView>(null);
  const width = Dimensions.get('window').width;
  const w = Math.min(width, 480);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / w);
    if (idx !== i) setI(idx);
  };

  const next = () => {
    if (i < CARDS.length - 1) {
      ref.current?.scrollTo({ x: (i + 1) * w, animated: true });
    } else {
      router.push('/login');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <View style={{ alignSelf: 'center', width: w, flex: 1, paddingHorizontal: 18, paddingTop: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: c.textPrimary, fontSize: 18, fontFamily: fontFamily.display, fontWeight: '600', letterSpacing: 3 }}>ORIVO</Text>
          <Pressable testID="onboarding-skip" onPress={() => router.push('/login')}>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1, marginTop: 30 }}
        >
          {CARDS.map((card, idx) => (
            <View key={idx} style={{ width: w - 36, paddingHorizontal: 6, justifyContent: 'center' }}>
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: radii.xl,
                  padding: 28,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>{card.kicker}</Text>
                <Text
                  style={{
                    color: c.textPrimary,
                    fontSize: 28,
                    fontFamily: fontFamily.display,
                    fontWeight: '600',
                    lineHeight: 36,
                    marginBottom: 18,
                  }}
                >
                  {card.title}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 15, lineHeight: 23 }}>{card.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 18 }}>
          {CARDS.map((_, idx) => (
            <View
              key={idx}
              style={{
                width: idx === i ? 24 : 8,
                height: 4,
                borderRadius: 2,
                backgroundColor: idx === i ? c.gold : c.border,
              }}
            />
          ))}
        </View>

        <Button
          testID="onboarding-cta"
          label={i === CARDS.length - 1 ? 'Enter Orivo' : 'Continue'}
          onPress={next}
          variant={i === CARDS.length - 1 ? 'gold' : 'primary'}
          style={{ marginBottom: 18 }}
        />
      </View>
    </SafeAreaView>
  );
}
