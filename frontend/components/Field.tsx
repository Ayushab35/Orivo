import React from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii, fontFamily } from '../lib/theme';

export function Field({
  label,
  containerStyle,
  testID,
  rightAdornment,
  ...rest
}: TextInputProps & { label?: string; containerStyle?: ViewStyle; testID?: string; rightAdornment?: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      {label ? (
        <Text style={{ fontSize: 12, color: c.textSecondary, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
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
          placeholderTextColor={c.textSecondary}
          style={{
            flex: 1,
            paddingVertical: 14,
            color: c.textPrimary,
            fontSize: 15,
            fontFamily: fontFamily.body,
            outlineWidth: 0 as any,
          }}
          {...rest}
        />
        {rightAdornment}
      </View>
    </View>
  );
}
