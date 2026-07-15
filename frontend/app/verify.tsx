import React, { useRef, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../lib/themeContext";
import { Button } from "../components/Button";
import { fontFamily } from "../lib/theme";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Verify() {
  const { c } = useTheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const { signInWithToken } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [focused, setFocused] = useState(0);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const inputs = useRef<TextInput[]>([]);

  const code = otp.join("");

  const verify = async () => {
    if (code.length !== 6) {
      setErr("Please enter the 6-digit code.");
      return;
    }

    setErr("");
    setLoading(true);

    try {
      const res = await api.post("/auth/otp/verify", {
        phone,
        code,
      });

      await signInWithToken(res.token, res.user);

      if (!res.user.onboarded) {
        router.replace("/birth-details");
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } catch (e: any) {
      setErr(e.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string, index: number) => {
    const value = text.replace(/\D/g, "");

    // User pasted complete OTP
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("");
      const filled = [...otp];

      digits.forEach((d, i) => {
        filled[i] = d;
      });

      setOtp(filled);

      if (digits.length === 6) {
        setTimeout(() => verify(), 100);
      }

      return;
    }

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (updated.join("").length === 6) {
      setTimeout(() => verify(), 100);
    }
  };

  const handleBackspace = (key: string, index: number) => {
    if (key !== "Backspace") return;

    if (otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: c.bg }}
      edges={["top", "bottom"]}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 28,
        }}
      >
        <Pressable testID="verify-back" onPress={() => router.back()}>
          <Text
            style={{
              color: c.textSecondary,
              fontSize: 14,
            }}
          >
            ← Back
          </Text>
        </Pressable>

        <Text
          style={{
            color: c.textPrimary,
            fontSize: 30,
            fontFamily: fontFamily.display,
            fontWeight: "600",
            marginTop: 36,
          }}
        >
          Verify your phone
        </Text>

        <Text
          style={{
            color: c.textSecondary,
            fontSize: 14,
            marginTop: 8,
            marginBottom: 34,
          }}
        >
          Enter the 6-digit code sent to {phone}
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 30,
          }}
        >
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputs.current[index] = ref;
              }}
              value={digit}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={1}
              autoFocus={index === 0}
              autoComplete={index === 0 ? "sms-otp" : "off"}
              textContentType="oneTimeCode"
              importantForAutofill="yes"
              onFocus={() => setFocused(index)}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) =>
                handleBackspace(nativeEvent.key, index)
              }
              style={{
                width: 52,
                height: 60,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: focused === index ? c.gold : c.border,
                backgroundColor: c.surface,
                textAlign: "center",
                fontSize: 24,
                fontWeight: "700",
                color: c.textPrimary,
              }}
            />
          ))}
        </View>

        {err ? (
          <Text
            testID="verify-error"
            style={{
              color: c.terracotta,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {err}
          </Text>
        ) : null}

        <Button
          testID="verify-btn"
          label="Verify"
          onPress={verify}
          loading={loading}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}
