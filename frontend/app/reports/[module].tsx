import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { ReportCard, ReportSection } from '../../components/ReportCard';

const TITLES: Record<string, { kicker: string; title: string }> = {
  personality: { kicker: 'LEADERSHIP PROFILE', title: 'How you operate.' },
  strengths: { kicker: 'STRATEGIC ASSETS & GROWTH', title: 'What you carry. Where to sharpen.' },
  career: { kicker: 'EXECUTIVE EDGE', title: 'Your career-defining trait.' },
  publicImage: { kicker: 'MARKET PERCEPTION', title: 'How the room reads you.' },
  financialPatterns: { kicker: 'WEALTH DYNAMICS', title: 'Revenue and expense patterns to watch.' },
};

export default function ReportScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { module } = useLocalSearchParams<{ module: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/reports/${module}`);
        setData(r);
      } catch (e: any) {
        setErr(e.message || 'Failed to load');
      }
      setLoading(false);
    })();
  }, [module]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <Text style={{ color: c.textSecondary, marginBottom: 12 }}>Composing your report…</Text>
        <ActivityIndicator color={c.gold} />
      </SafeAreaView>
    );
  }

  if (err) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: 22 }} edges={['top']}>
        <Pressable onPress={() => router.back()}><Text style={{ color: c.textSecondary }}>← Back</Text></Pressable>
        <Text style={{ color: c.terracotta, marginTop: 30 }}>{err}</Text>
      </SafeAreaView>
    );
  }

  const meta = TITLES[String(module)] || { kicker: 'REPORT', title: 'Your report' };
  const sections = toSections(String(module), data?.content || {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <Pressable testID="report-back" onPress={() => router.back()} style={{ padding: 18, paddingBottom: 0 }}>
        <Text style={{ color: c.textSecondary }}>← Back</Text>
      </Pressable>
      <ReportCard kicker={meta.kicker} title={meta.title} sections={sections} />
    </SafeAreaView>
  );
}

function toSections(moduleKey: string, content: any): ReportSection[] {
  const out: ReportSection[] = [];
  if (moduleKey === 'personality') {
    if (content.summary) out.push({ kind: 'paragraph', title: 'Summary', text: content.summary });
    if (Array.isArray(content.traits)) {
      out.push({
        kind: 'bars',
        title: 'Trait calibration',
        items: content.traits.map((t: any) => ({ label: t.label, value: t.score, note: t.note })),
      });
    }
    if (content.axis) {
      out.push({
        kind: 'axis',
        title: 'Introvert ↔ Extrovert',
        leftLabel: 'Introverted',
        rightLabel: 'Extroverted',
        value: content.axis.introvertExtrovert,
      });
      out.push({
        kind: 'axis',
        title: 'Near-term ↔ Long-horizon',
        leftLabel: 'Near-term',
        rightLabel: 'Long-horizon',
        value: content.axis.goalOrientation,
      });
    }
  } else if (moduleKey === 'strengths') {
    if (Array.isArray(content.strengths)) out.push({ kind: 'list', title: 'Strengths', items: content.strengths.map((s: any) => ({ title: s.title, detail: s.detail })) });
    if (Array.isArray(content.improvements)) out.push({ kind: 'list', title: 'Improvement areas', items: content.improvements.map((s: any) => ({ title: s.title, detail: s.detail, meta: s.nextStep ? `Next step: ${s.nextStep}` : undefined })) });
  } else if (moduleKey === 'career') {
    if (content.trait) out.push({ kind: 'paragraph', title: 'Your defining trait', text: content.trait });
    if (content.thesis) out.push({ kind: 'paragraph', title: 'Thesis', text: content.thesis });
    if (Array.isArray(content.leveragePoints)) out.push({ kind: 'list', title: 'Where to leverage it', items: content.leveragePoints.map((p: string) => ({ title: p })) });
    if (Array.isArray(content.watchOuts)) out.push({ kind: 'list', title: 'Watch-outs', items: content.watchOuts.map((p: string) => ({ title: p })) });
  } else if (moduleKey === 'publicImage') {
    if (Array.isArray(content.perceivedAs)) out.push({ kind: 'list', title: 'How you\'re perceived', items: content.perceivedAs.map((p: string) => ({ title: p })) });
    if (Array.isArray(content.misreadAs)) out.push({ kind: 'list', title: 'How you can be misread', items: content.misreadAs.map((p: string) => ({ title: p })) });
    if (content.recalibration) out.push({ kind: 'paragraph', title: 'Recalibration', text: content.recalibration });
  } else if (moduleKey === 'financialPatterns') {
    if (Array.isArray(content.revenuePatterns)) out.push({ kind: 'list', title: 'Revenue patterns', items: content.revenuePatterns.map((p: string) => ({ title: p })) });
    if (Array.isArray(content.expensePatterns)) out.push({ kind: 'list', title: 'Expense patterns', items: content.expensePatterns.map((p: string) => ({ title: p })) });
    if (Array.isArray(content.watchPoints)) out.push({ kind: 'list', title: 'Watch points', items: content.watchPoints.map((p: string) => ({ title: p })) });
  }
  if (out.length === 0) out.push({ kind: 'paragraph', text: 'Your report is being composed. Check back shortly.' });
  return out;
}
