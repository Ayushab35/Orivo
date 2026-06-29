import React from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii } from '../lib/theme';

type Variant = 'primary' | 'secondary' | 'gold' | 'ghost' | 'outline' | 'subtle';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  textStyle,
  testID,
  size = 'md',
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}) {
  const { c } = useTheme();
  const bg =
    variant === 'primary'
      ? c.primary
      : variant === 'secondary'
      ? c.surfaceAlt
      : variant === 'gold'
      ? c.gold
      : variant === 'subtle'
      ? c.surfaceMuted
      : 'transparent';
  const fg =
    variant === 'primary'
      ? c.primaryInk
      : variant === 'gold'
      ? c.goldInk
      : variant === 'outline' || variant === 'ghost' || variant === 'subtle' || variant === 'secondary'
      ? c.textPrimary
      : c.textPrimary;
  const border = variant === 'outline' ? c.borderStrong : variant === 'secondary' ? c.border : 'transparent';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed, hovered }: any) => [
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
          paddingVertical: size === 'sm' ? 10 : 14,
          paddingHorizontal: size === 'sm' ? 14 : 22,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.45 : pressed ? 0.85 : hovered ? 0.95 : 1,
          minHeight: size === 'sm' ? 38 : 48,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={[{ color: fg, fontSize: size === 'sm' ? 13 : 14, fontWeight: '600', letterSpacing: 0.3 }, textStyle]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
