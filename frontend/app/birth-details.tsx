import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../lib/themeContext";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { fontFamily, radii } from "../lib/theme";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { DatePickerField } from "../components/DatePickerField";
import { TimePickerField } from "../components/TimePickerField";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Energy",
  "Real Estate",
  "Media",
  "Consulting",
  "Other",
];

const ROLES = [
  "Founder / CEO",
  "Co-founder",
  "CFO",
  "COO",
  "CTO",
  "President",
  "Managing Partner",
  "Board Member",
  "Other"
];

const PROFILE_STORAGE_KEY = (userId?: string) =>
  userId ? `orivo.birthProfile.${userId}` : "orivo.birthProfile";

export default function BirthDetails() {
  const { c } = useTheme();
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState("");
  const [role, setRole] = useState("Founder / CEO");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("Technology");

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");

  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [city, setCity] = useState<{
    label: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [step, setStep] = useState(0);

  const debRef = useRef<any>(null);

  /*
   * ------------------------------------------------------------
   * CITY SEARCH
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!cityQuery || city?.label === cityQuery) {
      setCityResults([]);
      return;
    }

    if (debRef.current) {
      clearTimeout(debRef.current);
    }

    debRef.current = setTimeout(async () => {
      try {
        const res = await api.get(
          `/cities/search?q=${encodeURIComponent(cityQuery)}`,
        );

        setCityResults(res.results || []);
      } catch {
        setCityResults([]);
      }
    }, 350);

    return () => {
      if (debRef.current) {
        clearTimeout(debRef.current);
      }
    };
  }, [cityQuery, city?.label]);

  /*
   * ------------------------------------------------------------
   * VALIDATION
   * ------------------------------------------------------------
   */

  const validateStep0 = () => {
    if (!name.trim()) {
      return "Please enter your name";
    }

    if (!businessName.trim()) {
      return "Please enter your business name";
    }

    return "";
  };

  const validateStep1 = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return "Birth date must be YYYY-MM-DD";
    }

    if (!/^\d{2}:\d{2}$/.test(birthTime)) {
      return "Birth time must be HH:MM (24h)";
    }

    if (!city) {
      return "Please select your birth city";
    }

    return "";
  };

  /*
   * ------------------------------------------------------------
   * SUBMIT
   * ------------------------------------------------------------
   */

  const submit = async () => {
    const validationError = validateStep1();

    if (validationError) {
      setErr(validationError);
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const profileData = {
        name: name.trim(),
        role,
        businessName: businessName.trim(),
        industry,
        birthDate,
        birthTime,
        birthPlace: city!.label,
        birthLat: city!.lat,
        birthLng: city!.lng,
      };

      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY(user?.id),
        JSON.stringify(profileData),
      );

      await api.post("/auth/birth-details", profileData);

      updateUser({
        name: name.trim(),
        role,
        businessName: businessName.trim(),
        industry,
        onboarded: true,
        birth: {
          date: birthDate,
          time: birthTime,
          placeName: city!.label,
          lat: city!.lat,
          lng: city!.lng,
        },
      });

      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Failed to save your details");
    } finally {
      setLoading(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * NAVIGATION
   * ------------------------------------------------------------
   */

  const next = () => {
    setErr("");

    if (step === 0) {
      const validationError = validateStep0();

      if (validationError) {
        setErr(validationError);
        return;
      }

      setStep(1);
      return;
    }

    submit();
  };

  const goBack = () => {
    setErr("");
    setStep(0);
  };

  /*
   * ------------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------------
   */

  const isStepOne = step === 1;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: c.bg,
      }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingTop: 16,
            paddingBottom: 48,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* -------------------------------------------------- */}
          {/* TOP BAR                                            */}
          {/* -------------------------------------------------- */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 28,
            }}
          >
            {isStepOne ? (
              <Pressable
                onPress={goBack}
                hitSlop={12}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Text
                  style={{
                    color: c.textPrimary,
                    fontSize: 20,
                    lineHeight: 22,
                    marginTop: -2,
                  }}
                >
                  ‹
                </Text>
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}

            <Text
              style={{
                color: c.textPrimary,
                fontFamily: fontFamily.display,
                fontSize: 17,
                fontWeight: "600",
                letterSpacing: 0.4,
              }}
            >
              ORIVO
            </Text>

            <View style={{ width: 40 }} />
          </View>

          {/* -------------------------------------------------- */}
          {/* PROGRESS                                            */}
          {/* -------------------------------------------------- */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            {/* Step 1 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: step >= 0 ? c.gold : c.surface,
                  borderWidth: 1,
                  borderColor: step >= 0 ? c.gold : c.border,
                }}
              >
                <Text
                  style={{
                    color: step >= 0 ? c.primaryInk : c.textSecondary,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  1
                </Text>
              </View>

              <View style={{ marginLeft: 9 }}>
                <Text
                  style={{
                    color: step >= 0 ? c.textPrimary : c.textSecondary,
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  PROFILE
                </Text>
              </View>
            </View>

            {/* Connector */}
            <View
              style={{
                flex: 1,
                height: 1,
                marginHorizontal: 14,
                backgroundColor: step === 1 ? c.gold : c.border,
              }}
            />

            {/* Step 2 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: step === 1 ? c.gold : c.surface,
                  borderWidth: 1,
                  borderColor: step === 1 ? c.gold : c.border,
                }}
              >
                <Text
                  style={{
                    color: step === 1 ? c.primaryInk : c.textSecondary,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  2
                </Text>
              </View>

              <View style={{ marginLeft: 9 }}>
                <Text
                  style={{
                    color: step === 1 ? c.textPrimary : c.textSecondary,
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  BIRTH
                </Text>
              </View>
            </View>
          </View>

          {/* -------------------------------------------------- */}
          {/* HEADER                                              */}
          {/* -------------------------------------------------- */}

          <View style={{ marginBottom: 26 }}>
            <Text
              style={{
                color: c.gold,
                fontSize: 10,
                letterSpacing: 2.2,
                fontWeight: "600",
                marginBottom: 9,
              }}
            >
              {step === 0 ? "YOUR EXECUTIVE PROFILE" : "YOUR COSMIC PROFILE"}
            </Text>

            <Text
              style={{
                color: c.textPrimary,
                fontSize: 29,
                fontFamily: fontFamily.display,
                fontWeight: "600",
                lineHeight: 36,
                letterSpacing: -0.3,
              }}
            >
              {step === 0 ? "Tell us who you are." : "Your birth details."}
            </Text>

            <Text
              style={{
                color: c.textSecondary,
                fontSize: 14,
                lineHeight: 21,
                marginTop: 9,
                maxWidth: 340,
              }}
            >
              {step === 0
                ? "A little context helps Orivo tailor your insights to your professional world."
                : "Your birth information helps us calculate your personal astrological profile accurately."}
            </Text>
          </View>

          {/* -------------------------------------------------- */}
          {/* FORM SURFACE                                        */}
          {/* -------------------------------------------------- */}

          <View
            style={{
              backgroundColor: c.surface,
              borderRadius: radii.lg ?? 20,
              borderWidth: 1,
              borderColor: c.border,
              padding: 18,
              marginBottom: 18,
            }}
          >
            {/* ------------------------------------------------ */}
            {/* STEP 1                                             */}
            {/* ------------------------------------------------ */}

            {step === 0 && (
              <View>
                <Field
                  testID="name-input"
                  label="Full name"
                  placeholder="Jane K. Sharma"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (err) setErr("");
                  }}
                />

                <Field
                  testID="business-input"
                  label="Business name"
                  placeholder="Acme Capital"
                  value={businessName}
                  onChangeText={(text) => {
                    setBusinessName(text);
                    if (err) setErr("");
                  }}
                />

                {/* Role */}
                <View style={{ marginTop: 4 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: c.textSecondary,
                      marginBottom: 10,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      fontWeight: "600",
                    }}
                  >
                    Your role
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {ROLES.map((item) => {
                      const selected = role === item;

                      return (
                        <Pressable
                          key={item}
                          testID={`role-${item}`}
                          onPress={() => setRole(item)}
                          style={({ pressed }) => ({
                            paddingHorizontal: 13,
                            paddingVertical: 9,
                            borderRadius: radii.pill,
                            backgroundColor: selected ? c.primary : c.bg,
                            borderWidth: 1,
                            borderColor: selected ? c.primary : c.border,
                            opacity: pressed ? 0.75 : 1,
                          })}
                        >
                          <Text
                            style={{
                              color: selected ? c.primaryInk : c.textPrimary,
                              fontSize: 12.5,
                              fontWeight: selected ? "600" : "400",
                            }}
                          >
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Industry */}
                <View style={{ marginTop: 22 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: c.textSecondary,
                      marginBottom: 10,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      fontWeight: "600",
                    }}
                  >
                    Industry
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {INDUSTRIES.map((item) => {
                      const selected = industry === item;

                      return (
                        <Pressable
                          key={item}
                          testID={`industry-${item}`}
                          onPress={() => setIndustry(item)}
                          style={({ pressed }) => ({
                            paddingHorizontal: 13,
                            paddingVertical: 9,
                            borderRadius: radii.pill,
                            backgroundColor: selected ? c.teal : c.bg,
                            borderWidth: 1,
                            borderColor: selected ? c.teal : c.border,
                            opacity: pressed ? 0.75 : 1,
                          })}
                        >
                          <Text
                            style={{
                              color: selected ? "#FFF" : c.textPrimary,
                              fontSize: 12.5,
                              fontWeight: selected ? "600" : "400",
                            }}
                          >
                            {item}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* ------------------------------------------------ */}
            {/* STEP 2                                             */}
            {/* ------------------------------------------------ */}

            {step === 1 && (
              <View>
                {/* <Field
                  testID="dob-input"
                  label="Date of birth"
                  placeholder="1985-04-12"
                  value={birthDate}
                  onChangeText={(text) => {
                    setBirthDate(text);
                    if (err) setErr("");
                  }}
                />

                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: sizes.raw(11),
                    marginTop: -8,
                    marginBottom: 16,
                  }}
                >
                  Use YYYY-MM-DD
                </Text> */}
                <DatePickerField
                  testID="dob-input"
                  label="Date of birth"
                  value={birthDate}
                  onChange={(value) => {
                    setBirthDate(value);
                    if (err) setErr("");
                  }}
                />

                {/* <Field
                  testID="tob-input"
                  label="Time of birth"
                  placeholder="07:42"
                  value={birthTime}
                  onChangeText={(text) => {
                    setBirthTime(text);
                    if (err) setErr("");
                  }}
                />

                <Text
                  style={{
                    color: c.textSecondary,
                    fontSize: sizes.raw(11),
                    marginTop: -8,
                    marginBottom: 16,
                  }}
                >
                  Use 24-hour format, HH:MM
                </Text> */}
                <TimePickerField
                  testID="tob-input"
                  label="Time of birth"
                  value={birthTime}
                  onChange={(value) => {
                    setBirthTime(value);
                    if (err) setErr("");
                  }}
                />

                <Field
                  testID="city-input"
                  label="City of birth"
                  placeholder="Start typing your city..."
                  value={cityQuery}
                  onChangeText={(text) => {
                    setCityQuery(text);

                    if (city && city.label !== text) {
                      setCity(null);
                    }

                    if (err) setErr("");
                  }}
                />

                {/* City suggestions */}
                {cityResults.length > 0 && !city && (
                  <View
                    style={{
                      backgroundColor: c.bg,
                      borderRadius: radii.md,
                      borderColor: c.border,
                      borderWidth: 1,
                      marginTop: -8,
                      marginBottom: 16,
                      overflow: "hidden",
                    }}
                  >
                    {cityResults.slice(0, 6).map((result, index) => (
                      <Pressable
                        key={`${result.label}-${index}`}
                        testID={`city-result-${index}`}
                        onPress={() => {
                          setCity(result);
                          setCityQuery(result.label);
                          setCityResults([]);
                          setErr("");
                        }}
                        style={({ pressed }) => ({
                          paddingHorizontal: 14,
                          paddingVertical: 13,
                          borderTopWidth: index === 0 ? 0 : 1,
                          borderColor: c.border,
                          backgroundColor: pressed ? c.surface : "transparent",
                        })}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 15,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: c.surface,
                              marginRight: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: c.gold,
                                fontSize: 13,
                              }}
                            >
                              •
                            </Text>
                          </View>

                          <Text
                            style={{
                              color: c.textPrimary,
                              fontSize: 14,
                              flex: 1,
                            }}
                          >
                            {result.label}
                          </Text>

                          <Text
                            style={{
                              color: c.textSecondary,
                              fontSize: 18,
                            }}
                          >
                            ›
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Selected city */}
                {city && (
                  <View
                    style={{
                      marginTop: -8,
                      marginBottom: 8,
                      padding: 13,
                      backgroundColor: "rgba(15,110,86,0.07)",
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: "rgba(15,110,86,0.16)",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: c.teal,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFF",
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          ✓
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: c.textSecondary,
                            fontSize: 10,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            marginBottom: 2,
                          }}
                        >
                          Birth location
                        </Text>

                        <Text
                          style={{
                            color: c.teal,
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          {city.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* -------------------------------------------------- */}
          {/* ERROR                                               */}
          {/* -------------------------------------------------- */}

          {err ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 13,
                paddingVertical: 11,
                borderRadius: radii.md,
                backgroundColor: "rgba(180,70,55,0.07)",
                borderWidth: 1,
                borderColor: "rgba(180,70,55,0.16)",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: c.terracotta,
                  marginRight: 9,
                }}
              >
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  !
                </Text>
              </View>

              <Text
                testID="birth-error"
                style={{
                  color: c.terracotta,
                  fontSize: 12.5,
                  lineHeight: 18,
                  flex: 1,
                }}
              >
                {err}
              </Text>
            </View>
          ) : null}

          {/* -------------------------------------------------- */}
          {/* CTA                                                  */}
          {/* -------------------------------------------------- */}

          <Button
            testID="birth-continue-btn"
            label={step === 0 ? "Continue" : "Save & enter Orivo"}
            onPress={next}
            loading={loading}
            variant={step === 1 ? "gold" : "primary"}
          />

          {/* -------------------------------------------------- */}
          {/* FOOTER                                               */}
          {/* -------------------------------------------------- */}

          <View
            style={{
              alignItems: "center",
              marginTop: 17,
              paddingHorizontal: 20,
            }}
          >
            <Text
              style={{
                color: c.textSecondary,
                fontSize: 10.5,
                lineHeight: 16,
                textAlign: "center",
              }}
            >
              {step === 0
                ? "This information helps personalize your Orivo experience."
                : "Your birth information is used to calculate your personal profile."}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}