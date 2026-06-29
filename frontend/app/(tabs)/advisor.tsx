import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { fontFamily, radii } from '../../lib/theme';
import { Kicker } from '../../components/UI';
import { api } from '../../lib/api';

type Msg = { id?: string; role: 'user' | 'assistant'; content: string; pending?: boolean };

const SUGGESTIONS = [
  'I am weighing two acquisition offers. How should I think about timing?',
  'Should I make a senior hire this month?',
  'I have a tough investor conversation tomorrow. How do I prepare?',
  'When is the best window to announce our pricing change?',
];

export default function Advisor() {
  const { c } = useTheme();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput('');
    const userMsg: Msg = { role: 'user', content: message };
    const pendingMsg: Msg = { role: 'assistant', content: '', pending: true };
    setMessages((m) => [...m, userMsg, pendingMsg]);
    setSending(true);
    try {
      const res = await api.post('/advisor/chat', { message, sessionId });
      setSessionId(res.sessionId);
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.pending) copy[copy.length - 1] = { id: res.messageId, role: 'assistant', content: res.reply };
        return copy;
      });
    } catch (e: any) {
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.pending) copy[copy.length - 1] = { role: 'assistant', content: 'I could not reach the Advisor just now. Try again in a moment.' };
        return copy;
      });
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Kicker>AI Advisor</Kicker>
              <Text style={{ color: c.textPrimary, fontSize: 24, fontFamily: fontFamily.display, fontWeight: '500', marginTop: 4 }}>
                Decision intelligence, on call.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.teal }} />
              <Text style={{ color: c.teal, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' }}>ONLINE</Text>
            </View>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {messages.length === 0 && (
            <View style={{ marginTop: 12 }}>
              <View style={{ backgroundColor: c.surface, borderRadius: radii.lg, borderColor: c.border, borderWidth: 1, padding: 18 }}>
                <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 22, marginBottom: 4 }}>
                  Bring me your hardest decision today. I'll frame it against your current Leadership Phase, Decision Index, and Peak Window — and end with one concrete next step.
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 8, lineHeight: 17 }}>
                  Private. Conversations are not used to train any model. Stored only to your account.
                </Text>
              </View>
              <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.4, marginTop: 20, marginBottom: 10 }}>SUGGESTED</Text>
              {SUGGESTIONS.map((s, i) => (
                <Pressable
                  key={i}
                  testID={`suggest-${i}`}
                  onPress={() => send(s)}
                  style={({ pressed }: any) => ({
                    backgroundColor: pressed ? c.surfaceAlt : c.surfaceMuted,
                    borderRadius: radii.md,
                    borderColor: c.border,
                    borderWidth: 1,
                    padding: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  })}
                >
                  <Ionicons name="arrow-forward-circle-outline" size={16} color={c.gold} />
                  <Text style={{ flex: 1, color: c.textPrimary, fontSize: 13, lineHeight: 19 }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {messages.map((m, i) => (
            <View key={i} style={{ marginTop: 14, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: c.gold, fontSize: 10, fontWeight: '700', fontFamily: fontFamily.display }}>O</Text>
                  </View>
                  <Text style={{ color: c.textMuted, fontSize: 10, letterSpacing: 1.2, fontWeight: '600' }}>ORIVO ADVISOR</Text>
                </View>
              )}
              <View
                testID={`msg-${m.role}-${i}`}
                style={{
                  maxWidth: '88%',
                  backgroundColor: m.role === 'user' ? c.surfaceAlt : c.surface,
                  borderColor: c.border,
                  borderWidth: 1,
                  borderRadius: radii.md,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderTopRightRadius: m.role === 'user' ? 4 : radii.md,
                  borderTopLeftRadius: m.role === 'assistant' ? 4 : radii.md,
                }}
              >
                {m.pending ? (
                  <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', height: 18 }}>
                    <ActivityIndicator color={c.gold} size="small" />
                    <Text style={{ color: c.textMuted, fontSize: 12, marginLeft: 8 }}>Thinking…</Text>
                  </View>
                ) : (
                  <Text style={{ color: c.textPrimary, fontSize: 14, lineHeight: 22 }}>{m.content}</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bgInset }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: radii.md, borderColor: c.border, borderWidth: 1, paddingHorizontal: 12 }}>
              <TextInput
                testID="advisor-input"
                placeholder="Ask the Advisor…"
                placeholderTextColor={c.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => send()}
                multiline
                style={{ paddingVertical: 12, fontSize: 14, color: c.textPrimary, maxHeight: 110, outlineWidth: 0 as any }}
              />
            </View>
            <Pressable
              testID="advisor-send"
              disabled={!input.trim() || sending}
              onPress={() => send()}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: input.trim() ? c.gold : c.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: input.trim() && !sending ? 1 : 0.6,
              }}
            >
              {sending ? <ActivityIndicator color={c.goldInk} size="small" /> : <Ionicons name="arrow-up" size={20} color={input.trim() ? c.goldInk : c.textMuted} />}
            </Pressable>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 10, textAlign: 'center', marginTop: 6 }}>
            For self-reflection and decision support — not a guarantee of outcomes.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
