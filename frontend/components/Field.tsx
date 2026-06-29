import React from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii } from '../lib/theme';

export function Field({
  label,
  containerStyle,
  testID,
  rightAdornment,
  hint,
  ...rest
}: TextInputProps & { label?: string; containerStyle?: ViewStyle; testID?: string; rightAdornment?: React.ReactNode; hint?: string }) {
  const { c } = useTheme();
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? (
        <Text style={{ fontSize: 10, color: c.textSecondary, marginBottom: 6, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600' }}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: radii.md,
          backgroundColor: c.surface,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          testID={testID}
          placeholderTextColor={c.textMuted}
          style={{
            flex: 1,
            paddingVertical: 14,
            color: c.textPrimary,
            fontSize: 15,
            outlineWidth: 0 as any,
          }}
          {...rest}
        />
        {rightAdornment}
      </View>
      {hint ? <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 6 }}>{hint}</Text> : null}
    </View>
  );
}
