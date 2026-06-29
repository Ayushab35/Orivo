import React from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '../lib/themeContext';
import { radii, fontFamily } from '../lib/theme';

type Variant = 'primary' | 'secondary' | 'gold' | 'ghost' | 'outline';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  textStyle,
  testID,
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
  icon?: React.ReactNode;
}) {
  const { c } = useTheme();
  const bg =
    variant === 'primary'
      ? c.primary
      : variant === 'secondary'
      ? c.teal
      : variant === 'gold'
      ? c.gold
      : variant === 'outline'
      ? 'transparent'
      : 'transparent';
  const fg =
    variant === 'primary' ? c.primaryInk : variant === 'gold' ? c.goldInk : variant === 'secondary' ? '#FFFFFF' : c.primary;
  const border = variant === 'outline' ? c.border : 'transparent';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'outline' ? 1 : 0,
          paddingVertical: 14,
          paddingHorizontal: 22,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
          minHeight: 50,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text
            style={[
              {
                color: fg,
                fontFamily: fontFamily.body,
                fontSize: 15,
                fontWeight: '600',
                letterSpacing: 0.3,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
