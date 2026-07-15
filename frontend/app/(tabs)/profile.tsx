import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { fontFamily, radii } from '../../lib/theme';
import { Kicker, FlatCard, Disclaimer } from '../../components/UI';
import { TierBadge } from '../../components/Badges';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

export default function Profile() {
  const { c, theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { user, creditsBalanceSec, signOut } = useAuth();
  const [ledger, setLedger] = useState<any[]>([]);
  const [section, setSection] = useState<'identity' | 'preferences' | 'membership' | 'legal'>('identity');

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const l = await api.get("/credits/ledger");
        setLedger(l.items || []);
      } catch {}
    })();
  }, []));

  const referralShare = async () => {
    try {
      const url = `Join me on Orivo — private decision intelligence for founders. Use code ${user?.referralCode} to claim 10 bonus minutes.`;
      // @ts-ignore
      if (typeof navigator !== 'undefined' && navigator.share) {
        // @ts-ignore
        await navigator.share({ title: 'Orivo', text: url });
      } else {
        await Share.share({ message: url });
      }
    } catch {}
  };

  const minutes = Math.floor(creditsBalanceSec / 60);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 18, paddingBottom: 14 }}>
          <Kicker>Profile</Kicker>
          <Text
            style={{
              color: c.textPrimary,
              fontSize: 28,
              fontFamily: fontFamily.display,
              fontWeight: "500",
              marginTop: 4,
              letterSpacing: -0.5,
            }}
          >
            {user?.name || "Founder"}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <TierBadge tier={user?.tier} />
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>
              {user?.businessName}
            </Text>
          </View>
        </View>

        {/* Section tabs */}
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            padding: 4,
            backgroundColor: c.surfaceMuted,
            borderRadius: radii.pill,
            borderColor: c.border,
            borderWidth: 1,
            marginBottom: 18,
          }}
        >
          {(["identity", "preferences", "membership", "legal"] as const).map(
            (s) => (
              <Pressable
                key={s}
                testID={`prof-tab-${s}`}
                onPress={() => setSection(s)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: "center",
                  borderRadius: radii.pill,
                  backgroundColor: section === s ? c.surface : "transparent",
                  borderColor: section === s ? c.border : "transparent",
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    color: section === s ? c.textPrimary : c.textSecondary,
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                    textTransform: "capitalize",
                  }}
                >
                  {s}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        {section === "identity" && (
          <>
            <Section title="Identity">
              <Row label="Founder" value={user?.name || "—"} />
              <Row label="Role" value={user?.role || "—"} />
              <Row label="Business" value={user?.businessName || "—"} />
              <Row label="Industry" value={user?.industry || "—"} />
              <Row label="Phone" value={user?.phone || "—"} last />
            </Section>
            <Section title="Birth Details">
              <Row label="Date" value={user?.birth?.date || "—"} />
              <Row label="Time" value={user?.birth?.time || "—"} />
              <Row label="Place" value={user?.birth?.placeName || "—"} last />
            </Section>
          </>
        )}

        {section === "preferences" && (
          <>
            <Section title="Preferences">
              <RowSwitch
                label="Dark theme"
                value={theme === "dark"}
                onChange={toggleTheme}
                hint="Default interior lighting."
                testID="theme-switch"
              />
              <RowSwitch
                label="AI personalization"
                value={true}
                onChange={() => {}}
                hint="Briefs use your profile for context."
              />
              <RowSwitch
                label="Notifications"
                value={true}
                onChange={() => {}}
                hint="Daily brief and peak window reminders."
                last
              />
            </Section>
          </>
        )}

        {section === "membership" && (
          <>
            <View
              style={{
                backgroundColor: c.surface,
                borderRadius: radii.lg,
                borderColor: c.border,
                borderWidth: 1,
                padding: 18,
                marginBottom: 14,
              }}
            >
              <Kicker>Private Minutes</Kicker>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <Text
                  testID="profile-minutes-value"
                  style={{
                    color: c.gold,
                    fontFamily: fontFamily.display,
                    fontSize: 52,
                    fontWeight: "500",
                    letterSpacing: -1.5,
                  }}
                >
                  {minutes}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                  min available
                </Text>
              </View>
              <Text
                style={{
                  color: c.textMuted,
                  fontSize: 12,
                  marginTop: 6,
                  lineHeight: 18,
                }}
              >
                Reserved for private consultations. Granted minutes expire 90
                days after issue.
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <Pressable
                  testID="profile-book-btn"
                  onPress={() => router.push("/packages")}
                  style={{
                    flex: 1,
                    backgroundColor: c.gold,
                    borderRadius: radii.pill,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: c.goldInk,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Private Consultation
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/packages")}
                  style={{
                    flex: 1,
                    backgroundColor: "transparent",
                    borderRadius: radii.pill,
                    borderWidth: 1,
                    borderColor: c.border,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: c.textPrimary,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Add minutes
                  </Text>
                </Pressable>
              </View>
            </View>

            <Section title="Membership Benefits">
              <Row label="Daily Brief" value="Included" valueColor={c.teal} />
              <Row
                label="Leadership Assessment"
                value="Included"
                valueColor={c.teal}
              />
              <Row
                label="Private Consultations"
                value={`${minutes} min`}
                valueColor={c.gold}
                last
              />
            </Section>

            <Section title="Recent Activity">
              {ledger.length === 0 ? (
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 13,
                    paddingVertical: 8,
                  }}
                >
                  No activity yet.
                </Text>
              ) : (
                ledger.slice(0, 10).map((e, i) => (
                  <View
                    key={e.id}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 10,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderColor: c.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.textPrimary, fontSize: 13 }}>
                        {prettyReason(e.reason)}
                      </Text>
                      <Text
                        style={{
                          color: c.textMuted,
                          fontSize: 10,
                          fontFamily: fontFamily.mono,
                          marginTop: 2,
                        }}
                      >
                        {new Date(e.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: e.deltaSec >= 0 ? c.teal : c.terracotta,
                        fontSize: 13,
                        fontFamily: fontFamily.mono,
                        fontWeight: "600",
                      }}
                    >
                      {e.deltaSec >= 0 ? "+" : ""}
                      {Math.round(e.deltaSec / 60)} min
                    </Text>
                  </View>
                ))
              )}
            </Section>

            <Section title="Referral">
              <Text
                style={{
                  color: c.textPrimary,
                  fontSize: 22,
                  fontFamily: fontFamily.display,
                  fontWeight: "500",
                  letterSpacing: 1,
                }}
              >
                {user?.referralCode || "—"}
              </Text>
              <Text
                style={{ color: c.textSecondary, fontSize: 12, marginTop: 6 }}
              >
                Each peer who joins adds 10 minutes to both accounts.
              </Text>
              <Pressable
                testID="referral-share"
                onPress={referralShare}
                style={{
                  marginTop: 12,
                  alignSelf: "flex-start",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: radii.pill,
                  backgroundColor: c.surfaceAlt,
                  borderColor: c.border,
                  borderWidth: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Ionicons
                  name="share-outline"
                  size={14}
                  color={c.textPrimary}
                />
                <Text
                  style={{
                    color: c.textPrimary,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Share code
                </Text>
              </Pressable>
            </Section>
          </>
        )}

        {section === "legal" && (
          <>
            <Section title="Legal">
              <Pressable
                style={{
                  paddingVertical: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderBottomWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Text style={{ color: c.textPrimary, fontSize: 13 }}>
                  Privacy policy
                </Text>
                <Ionicons name="open-outline" size={14} color={c.textMuted} />
              </Pressable>
              <Pressable
                style={{
                  paddingVertical: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderBottomWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Text style={{ color: c.textPrimary, fontSize: 13 }}>
                  Terms of service
                </Text>
                <Ionicons name="open-outline" size={14} color={c.textMuted} />
              </Pressable>
              <View style={{ paddingVertical: 12 }}>
                <Text
                  style={{
                    color: c.textPrimary,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  Disclaimer
                </Text>
                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: 12,
                    lineHeight: 19,
                  }}
                >
                  Orivo provides decision-support intelligence. Reports are for
                  self-reflection and not a guarantee of outcomes. Always
                  consult qualified counsel for legal, financial, or medical
                  matters.
                </Text>
              </View>
            </Section>
          </>
        )}

        <Pressable
          testID="logout-btn"
          onPress={() => {
            signOut().then(() => router.replace("/onboarding"));
          }}
          style={{ alignItems: "center", paddingVertical: 18, marginTop: 6 }}
        >
          <Text
            style={{ color: c.terracotta, fontSize: 13, fontWeight: "600" }}
          >
            Sign out
          </Text>
        </Pressable>

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Kicker>{title}</Kicker>
        <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
      </View>
      <View style={{ backgroundColor: c.surface, borderRadius: radii.md, borderColor: c.border, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 }}>{children}</View>
    </View>
  );
}

function Row({ label, value, last, valueColor }: { label: string; value: string; last?: boolean; valueColor?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderColor: c.border }}>
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: valueColor || c.textPrimary, fontSize: 13, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

function RowSwitch({ label, value, onChange, hint, last, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string; last?: boolean; testID?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderColor: c.border }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '500' }}>{label}</Text>
        {hint ? <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{hint}</Text> : null}
      </View>
      <Switch testID={testID} value={value} onValueChange={onChange} trackColor={{ false: c.border, true: c.gold }} thumbColor={c.surface} />
    </View>
  );
}

function prettyReason(r: string) {
  const map: Record<string, string> = {
    welcome: 'Welcome credit',
    'task:daily_checkin': 'Daily Brief reviewed',
    'task:complete_personality': 'Leadership Assessment completed',
    'task:open_numerology': 'Numerical Intelligence reviewed',
    'task:log_decision': 'Decision logged',
    'task:share_referral': 'Referral shared',
  };
  if (map[r]) return map[r];
  if (r.startsWith('purchase:')) return 'Private minutes purchased';
  if (r.startsWith('booking:')) return 'Private Consultation';
  return r;
}
