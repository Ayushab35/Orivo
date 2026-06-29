import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/themeContext';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { fontFamily, radii } from '../lib/theme';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Energy', 'Real Estate', 'Media', 'Consulting', 'Other'];
const ROLES = ['Founder / CEO', 'Co-founder', 'CFO', 'COO', 'CTO', 'President', 'Managing Partner', 'Board Member'];

export default function BirthDetails() {
  const { c } = useTheme();
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('Founder / CEO');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [city, setCity] = useState<{ label: string; lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [step, setStep] = useState(0);
  const debRef = useRef<any>(null);

  useEffect(() => {
    if (!cityQuery || city?.label === cityQuery) return;
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/cities/search?q=${encodeURIComponent(cityQuery)}`);
        setCityResults(res.results || []);
      } catch {
        setCityResults([]);
      }
    }, 350);
  }, [cityQuery]);

  const validateStep0 = () => {
    if (!name.trim()) return 'Please enter your name';
    if (!businessName.trim()) return 'Please enter your business name';
    return '';
  };

  const validateStep1 = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return 'Birth date must be YYYY-MM-DD';
    if (!/^\d{2}:\d{2}$/.test(birthTime)) return 'Birth time must be HH:MM (24h)';
    if (!city) return 'Please select your birth city';
    return '';
  };

  const submit = async () => {
    const e = validateStep1();
    if (e) {
      setErr(e);
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await api.post('/auth/birth-details', {
        name,
        role,
        businessName,
        industry,
        birthDate,
        birthTime,
        birthPlace: city!.label,
        birthLat: city!.lat,
        birthLng: city!.lng,
      });
      await refresh();
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      setErr(e.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step === 0) {
      const e = validateStep0();
      if (e) { setErr(e); return; }
      setErr('');
      setStep(1);
    } else {
      submit();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24 }}>
          {[0, 1].map((s) => (
            <View key={s} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: step >= s ? c.gold : c.border }} />
          ))}
        </View>

        <Text style={{ color: c.gold, fontSize: 11, letterSpacing: 2.5, marginBottom: 6 }}>STEP {step + 1} OF 2</Text>
        <Text style={{ color: c.textPrimary, fontSize: 26, fontFamily: fontFamily.display, fontWeight: '600', marginBottom: 24, lineHeight: 34 }}>
          {step === 0 ? 'Tell us who you are.' : 'Your birth details.'}
        </Text>

        {step === 0 && (
          <View>
            <Field testID="name-input" label="Full name" placeholder="Jane K. Sharma" value={name} onChangeText={setName} />
            <Field testID="business-input" label="Business name" placeholder="Acme Capital" value={businessName} onChangeText={setBusinessName} />

            <Text style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Role</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {ROLES.map((r) => (
                <Pressable
                  key={r}
                  testID={`role-${r}`}
                  onPress={() => setRole(r)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: radii.pill,
                    backgroundColor: role === r ? c.primary : c.surface,
                    borderWidth: 1,
                    borderColor: role === r ? c.primary : c.border,
                  }}
                >
                  <Text style={{ color: role === r ? c.primaryInk : c.textPrimary, fontSize: 13 }}>{r}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Industry</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {INDUSTRIES.map((r) => (
                <Pressable
                  key={r}
                  testID={`industry-${r}`}
                  onPress={() => setIndustry(r)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: radii.pill,
                    backgroundColor: industry === r ? c.teal : c.surface,
                    borderWidth: 1,
                    borderColor: industry === r ? c.teal : c.border,
                  }}
                >
                  <Text style={{ color: industry === r ? '#FFF' : c.textPrimary, fontSize: 13 }}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Field testID="dob-input" label="Date of birth (YYYY-MM-DD)" placeholder="1985-04-12" value={birthDate} onChangeText={setBirthDate} />
            <Field testID="tob-input" label="Time of birth (24h HH:MM)" placeholder="07:42" value={birthTime} onChangeText={setBirthTime} />
            <Field
              testID="city-input"
              label="City of birth"
              placeholder="Start typing your city..."
              value={cityQuery}
              onChangeText={(t) => {
                setCityQuery(t);
                if (city && city.label !== t) setCity(null);
              }}
            />
            {cityResults.length > 0 && !city && (
              <View style={{ backgroundColor: c.surface, borderRadius: radii.md, borderColor: c.border, borderWidth: 1, marginTop: -8, marginBottom: 14 }}>
                {cityResults.slice(0, 6).map((r, idx) => (
                  <Pressable
                    key={idx}
                    testID={`city-result-${idx}`}
                    onPress={() => {
                      setCity(r);
                      setCityQuery(r.label);
                      setCityResults([]);
                    }}
                    style={{ padding: 12, borderTopWidth: idx === 0 ? 0 : 1, borderColor: c.border }}
                  >
                    <Text style={{ color: c.textPrimary, fontSize: 14 }}>{r.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {city && (
              <View style={{ marginTop: -8, marginBottom: 14, padding: 10, backgroundColor: 'rgba(15,110,86,0.08)', borderRadius: radii.md }}>
                <Text style={{ color: c.teal, fontSize: 12 }}>✓ {city.label}</Text>
              </View>
            )}
          </View>
        )}

        {err ? <Text testID="birth-error" style={{ color: c.terracotta, fontSize: 13, marginBottom: 12 }}>{err}</Text> : null}

        <Button
          testID="birth-continue-btn"
          label={step === 0 ? 'Continue' : 'Save & enter Orivo'}
          onPress={next}
          loading={loading}
          variant={step === 1 ? 'gold' : 'primary'}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
