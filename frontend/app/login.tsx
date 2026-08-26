// import React, { useState } from 'react';
// import { View, Text, ScrollView, Alert, Platform } from 'react-native';
// import { useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useTheme } from '../lib/themeContext';
// import { Button } from '../components/Button';
// import { Field } from '../components/Field';
// import { fontFamily } from '../lib/theme';
// import { api } from '../lib/api';

// export default function Login() {
//   const { c } = useTheme();
//   const router = useRouter();
//   const [phone, setPhone] = useState('+15551234567');
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');

//   const send = async () => {
//     setErr('');
//     if (!phone || phone.length < 6) {
//       setErr('Enter a valid phone number');
//       return;
//     }
//     setLoading(true);
//     try {
//       await api.post('/auth/otp/send', { phone });
//       router.push({ pathname: '/verify', params: { phone } });
//     } catch (e: any) {
//       setErr(e.message || 'Failed to send code');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView
//       style={{ flex: 1, backgroundColor: c.bg }}
//       edges={["top", "bottom"]}
//     >
//       <ScrollView
//         contentContainerStyle={{
//           paddingHorizontal: 22,
//           paddingTop: 28,
//           paddingBottom: 40,
//         }}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         <Text
//           style={{
//             color: c.textPrimary,
//             fontSize: 16,
//             fontFamily: fontFamily.display,
//             fontWeight: "600",
//             letterSpacing: 3,
//           }}
//         >
//           ORIVO
//         </Text>

//         <Text
//           style={{
//             color: c.textPrimary,
//             fontSize: 30,
//             fontFamily: fontFamily.display,
//             fontWeight: "600",
//             marginTop: 36,
//             lineHeight: 38,
//           }}
//         >
//           Sign in.
//         </Text>
//         <Text
//           style={{
//             color: c.textSecondary,
//             fontSize: 14,
//             marginTop: 8,
//             marginBottom: 28,
//             lineHeight: 22,
//           }}
//         >
//           A 6-digit code will be sent to your number. We never store it. We
//           never share it.
//         </Text>

//         <Field
//           testID="phone-input"
//           label="Mobile number"
//           placeholder="+1 555 000 0000"
//           keyboardType="phone-pad"
//           autoComplete="tel"
//           value={phone}
//           onChangeText={setPhone}
//         />

//         {err ? (
//           <Text
//             testID="login-error"
//             style={{ color: c.terracotta, fontSize: 13, marginBottom: 12 }}
//           >
//             {err}
//           </Text>
//         ) : null}

//         <Button
//           testID="send-otp-btn"
//           label="Send code"
//           onPress={send}
//           loading={loading}
//           variant="primary"
//         />

//         <View
//           style={{
//             marginTop: 22,
//             padding: 14,
//             backgroundColor: c.surfaceAlt,
//             borderRadius: 12,
//             borderWidth: 1,
//             borderColor: c.border,
//           }}
//         >
//           <Text
//             style={{ color: c.textSecondary, fontSize: 12, lineHeight: 18 }}
//           >
//             Dev mode: use the code{" "}
//             <Text style={{ color: c.gold, fontWeight: "700" }}>123456</Text> for
//             any number. Twilio integration plugs in later.
//           </Text>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../lib/themeContext";
import { Button } from "../components/Button";
import { api } from "../lib/api";
import { fontFamily } from "../lib/theme";

export default function Login() {
  const { c } = useTheme();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(
    null,
  );
  const [err, setErr] = useState("");

  const handlePhoneChange = (value: string) => {
    const numbersOnly = value.replace(/[^0-9]/g, "");

    setPhone(numbersOnly.slice(0, 10));

    if (err) {
      setErr("");
    }
  };

  const send = async () => {
    setErr("");

    if (phone.length !== 10) {
      setErr("Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = `+91${phone}`;

      await api.post("/auth/otp/send", {
        phone: formattedPhone,
      });

      router.push({
        pathname: "/verify",
        params: {
          phone: formattedPhone,
        },
      });
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to send verification code",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErr("");
    setSocialLoading("google");

    try {
      // TODO:
      // Implement Google OAuth here.
      //
      // const { idToken } = await signInWithGoogle();
      //
      // const response = await api.post('/auth/google', {
      //   idToken,
      // });

      throw new Error("Google authentication is not configured yet.");
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to continue with Google",
      );
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setErr("");
    setSocialLoading("apple");

    try {
      // TODO:
      // Implement Apple authentication here.
      //
      // const credential = await signInWithApple();
      //
      // const response = await api.post('/auth/apple', {
      //   identityToken: credential.identityToken,
      //   authorizationCode: credential.authorizationCode,
      //   user: credential.user,
      // });

      throw new Error("Apple authentication is not configured yet.");
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to continue with Apple",
      );
    } finally {
      setSocialLoading(null);
    }
  };

  const isPhoneValid = phone.length === 10;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: c.bg,
      }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* =========================================================
              BRAND
          ========================================================= */}

          <View
            style={{
              alignItems: "center",
              marginTop: 8,
              marginBottom: 46,
            }}
          >
            <Text
              style={{
                color: c.textPrimary,
                fontSize: 17,
                fontFamily: fontFamily.display,
                fontWeight: "700",
                letterSpacing: 5,
              }}
            >
              ORIVO
            </Text>

            <View
              style={{
                width: 28,
                height: 1,
                backgroundColor: c.gold,
                marginTop: 10,
              }}
            />
          </View>

          {/* =========================================================
              HEADER
          ========================================================= */}

          <View
            style={{
              marginBottom: 30,
            }}
          >
            <Text
              style={{
                color: c.textPrimary,
                fontSize: 32,
                fontFamily: fontFamily.display,
                fontWeight: "600",
                letterSpacing: -0.7,
                lineHeight: 39,
              }}
            >
              Welcome to ORIVO.
            </Text>

            <Text
              style={{
                color: c.textSecondary,
                fontSize: 15,
                lineHeight: 22,
                marginTop: 9,
                maxWidth: 330,
              }}
            >
              Sign in or create your account to continue.
            </Text>
          </View>

          {/* =========================================================
              PHONE NUMBER
          ========================================================= */}

          <Text
            style={{
              color: c.textPrimary,
              fontSize: 13,
              fontWeight: "600",
              marginBottom: 9,
            }}
          >
            Mobile number
          </Text>

          <View
            style={{
              height: 60,
              borderRadius: 15,
              borderWidth: 1,
              borderColor: err
                ? c.terracotta
                : isPhoneValid
                  ? c.gold
                  : c.border,
              backgroundColor: c.surface,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            {/* Country */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingRight: 14,
                marginRight: 14,
                borderRightWidth: 1,
                borderRightColor: c.border,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  marginRight: 7,
                }}
              >
                🇮🇳
              </Text>

              <Text
                style={{
                  color: c.textPrimary,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                +91
              </Text>
            </View>

            {/* Number */}

            <TextInput
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="numeric"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter mobile number"
              placeholderTextColor={c.textSecondary}
              selectionColor={c.gold}
              style={{
                flex: 1,
                color: c.textPrimary,
                fontSize: 16,
                fontWeight: "500",
                padding: 0,
                height: 50,
              }}
              returnKeyType="done"
              onSubmitEditing={send}
            />

            {/* Valid check */}

            {isPhoneValid && (
              <View
                style={{
                  width: 21,
                  height: 21,
                  borderRadius: 11,
                  backgroundColor: c.gold,
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 8,
                }}
              >
                <Text
                  style={{
                    color: c.bg,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  ✓
                </Text>
              </View>
            )}
          </View>

          {/* Error */}

          {err ? (
            <Text
              style={{
                color: c.terracotta,
                fontSize: 12,
                marginTop: 8,
                lineHeight: 17,
              }}
            >
              {err}
            </Text>
          ) : null}

          {/* =========================================================
              PRIMARY ACTION
          ========================================================= */}

          <View
            style={{
              marginTop: 16,
            }}
          >
            <Button
              testID="send-otp-btn"
              label={loading ? "Sending code..." : "Continue"}
              onPress={send}
              loading={loading}
              variant="primary"
            />
          </View>

          {/* Helper */}

          <Text
            style={{
              color: c.textSecondary,
              fontSize: 11,
              lineHeight: 17,
              textAlign: "center",
              marginTop: 11,
            }}
          >
            We'll send a one-time verification code.
          </Text>

          {/* =========================================================
              DIVIDER
          ========================================================= */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 28,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: c.border,
              }}
            />

            <Text
              style={{
                color: c.textSecondary,
                fontSize: 10,
                letterSpacing: 1.2,
                marginHorizontal: 14,
                textTransform: "uppercase",
              }}
            >
              or
            </Text>

            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: c.border,
              }}
            />
          </View>

          {/* =========================================================
              GOOGLE
          ========================================================= */}

          <Pressable
            onPress={handleGoogleLogin}
            disabled={socialLoading !== null || loading}
            style={({ pressed }) => ({
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",

              opacity:
                socialLoading !== null || loading ? 0.6 : pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                color: "#4285F4",
                fontSize: 18,
                fontWeight: "700",
                marginRight: 10,
              }}
            >
              G
            </Text>

            {socialLoading === "google" ? (
              <ActivityIndicator color={c.textPrimary} />
            ) : (
              <Text
                style={{
                  color: c.textPrimary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Continue with Google
              </Text>
            )}
          </Pressable>

          {/* =========================================================
              APPLE
          ========================================================= */}

          <Pressable
            onPress={handleAppleLogin}
            disabled={socialLoading !== null || loading}
            style={({ pressed }) => ({
              height: 52,
              borderRadius: 14,
              backgroundColor: c.textPrimary,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              marginTop: 10,

              opacity:
                socialLoading !== null || loading ? 0.6 : pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                color: c.bg,
                fontSize: 20,
                marginRight: 9,
                marginTop: -2,
              }}
            >
              
            </Text>

            {socialLoading === "apple" ? (
              <ActivityIndicator color={c.bg} />
            ) : (
              <Text
                style={{
                  color: c.bg,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                Continue with Apple
              </Text>
            )}
          </Pressable>

          {/* =========================================================
              TERMS
          ========================================================= */}

          <Text
            style={{
              color: c.textSecondary,
              fontSize: 11,
              lineHeight: 17,
              textAlign: "center",
              marginTop: 20,
              paddingHorizontal: 12,
            }}
          >
            By continuing, you agree to ORIVO's Terms of Service and Privacy
            Policy.
          </Text>

          {/* =========================================================
              FOOTER
          ========================================================= */}

          <View
            style={{
              marginTop: "auto",
              paddingTop: 34,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: c.textSecondary,
                fontSize: 10,
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              Know the moment. Make the move.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
