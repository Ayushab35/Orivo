import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { fontFamily, radii } from '../../lib/theme';
import { Kicker } from '../../components/UI';
import { FadeInUp, PulseDot } from '../../components/Animated';
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
  const [sessions, setSessions] = useState<any[]>([]);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const scrollRef = useRef<ScrollView>(null);

  const loadSessions = async () => {
    try {
      const r = await api.get('/advisor/sessions');
      setSessions(r.items || []);
    } catch {}
  };

  useEffect(() => { loadSessions(); }, []);

  const openSession = async (sid: string) => {
    try {
      const r = await api.get(`/advisor/history?sessionId=${sid}`);
      const msgs = (r.items || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content }));
      setSessionId(sid);
      setMessages(msgs);
      setView('chat');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    } catch {}
  };

  const newChat = () => {
    setSessionId(undefined);
    setMessages([]);
    setView('chat');
  };

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
      loadSessions();
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
        <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Kicker>AI Advisor</Kicker>
              <Text style={{ color: c.textPrimary, fontSize: 22, fontFamily: fontFamily.display, fontWeight: '500', marginTop: 4, letterSpacing: -0.4 }}>
                Decision intelligence, on call.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PulseDot color={c.teal} />
              <Text style={{ color: c.teal, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' }}>ONLINE</Text>
            </View>
          </View>

          {/* Segmented control: Chat | History */}
          <View style={{ flexDirection: 'row', gap: 4, padding: 4, backgroundColor: c.surfaceMuted, borderRadius: radii.pill, borderColor: c.border, borderWidth: 1, marginTop: 14 }}>
            <Pressable
              testID="adv-tab-chat"
              onPress={() => setView('chat')}
              style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radii.pill, backgroundColor: view === 'chat' ? c.surface : 'transparent', borderColor: view === 'chat' ? c.border : 'transparent', borderWidth: 1 }}
            >
              <Text style={{ color: view === 'chat' ? c.textPrimary : c.textSecondary, fontSize: 12, fontWeight: '600' }}>Chat</Text>
            </Pressable>
            <Pressable
              testID="adv-tab-history"
              onPress={() => { setView('history'); loadSessions(); }}
              style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radii.pill, backgroundColor: view === 'history' ? c.surface : 'transparent', borderColor: view === 'history' ? c.border : 'transparent', borderWidth: 1 }}
            >
              <Text style={{ color: view === 'history' ? c.textPrimary : c.textSecondary, fontSize: 12, fontWeight: '600' }}>History ({sessions.length})</Text>
            </Pressable>
          </View>
        </View>

        {view === 'history' ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Pressable
              testID="adv-new-chat"
              onPress={newChat}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 14,
                borderRadius: radii.md,
                borderColor: c.gold,
                borderWidth: 1,
                backgroundColor: 'rgba(201,169,97,0.06)',
                marginBottom: 12,
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={c.gold} />
              <Text style={{ color: c.gold, fontSize: 13, fontWeight: '600' }}>Start a new conversation</Text>
            </Pressable>

            {sessions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>No past conversations yet.</Text>
              </View>
            ) : (
              sessions.map((s, i) => (
                <FadeInUp key={s.id} index={i} delay={40}>
                  <Pressable
                    testID={`session-${s.id}`}
                    onPress={() => openSession(s.id)}
                    style={({ pressed }: any) => ({
                      backgroundColor: pressed ? c.surfaceAlt : c.surface,
                      borderRadius: radii.md,
                      borderColor: c.border,
                      borderWidth: 1,
                      padding: 14,
                      marginBottom: 8,
                    })}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '500', flex: 1, paddingRight: 8 }} numberOfLines={1}>{s.title || 'Untitled'}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 10, fontFamily: fontFamily.mono }}>{relTime(s.updatedAt)}</Text>
                    </View>
                    {s.lastMessage ? <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 17 }} numberOfLines={2}>{s.lastMessage}</Text> : null}
                  </Pressable>
                </FadeInUp>
              ))
            )}
          </ScrollView>
        ) : (
          <>
            <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              {messages.length === 0 && (
                <View style={{ marginTop: 12 }}>
                  <FadeInUp index={0}>
                    <View style={{ backgroundColor: c.surface, borderRadius: radii.lg, borderColor: c.border, borderWidth: 1, padding: 18 }}>
                      <Text style={{ color: c.textPrimary, fontSize: 15, lineHeight: 22, marginBottom: 4 }}>
                        Bring me your hardest decision today. I'll frame it against your current Leadership Phase, Role-Fit, and Peak Window — and end with one concrete next step.
                      </Text>
                      <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 8, lineHeight: 17 }}>
                        Private. Conversations are saved to your account so you can revisit them — never used to train any model.
                      </Text>
                    </View>
                  </FadeInUp>
                  <Text style={{ color: c.textSecondary, fontSize: 11, letterSpacing: 1.4, marginTop: 20, marginBottom: 10 }}>SUGGESTED</Text>
                  {SUGGESTIONS.map((s, i) => (
                    <FadeInUp key={i} index={i + 1} delay={50}>
                      <Pressable
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
                    </FadeInUp>
                  ))}
                </View>
              )}

              {messages.map((m, i) => (
                <FadeInUp key={i} index={0} delay={0} style={{ marginTop: 14, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
                </FadeInUp>
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
                  style={({ pressed }: any) => ({
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: input.trim() ? c.gold : c.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: input.trim() && !sending ? (pressed ? 0.85 : 1) : 0.6,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  {sending ? <ActivityIndicator color={c.goldInk} size="small" /> : <Ionicons name="arrow-up" size={20} color={input.trim() ? c.goldInk : c.textMuted} />}
                </Pressable>
              </View>
              <Text style={{ color: c.textMuted, fontSize: 10, textAlign: 'center', marginTop: 6 }}>
                For self-reflection and decision support — not a guarantee of outcomes.
              </Text>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function relTime(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
