import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAppTheme } from './app-theme';

const paths = {
  web: 'M12 2.5 20 7v10l-8 4.5L4 17V7zM12 7.5l4 2.25v4.5l-4 2.25-4-2.25v-4.5zM12 2.5v19M4 7l16 10M20 7 4 17',
  history: 'M3 12a9 9 0 1 1 3 6.7M3 6v6h6m3-5v5l3 2',
  skills: 'M12 3l3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z',
  settings: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  moon: 'M20 15A8 8 0 0 1 9 4a8.5 8.5 0 1 0 11 11Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  chevron: 'm9 6 6 6-6 6',
  reset: 'M4 4v6h6M4.5 10a8 8 0 1 1 1.7 7',
  check: 'm5 12 4 4L19 6',
  lock: 'M8 10V7a4 4 0 0 1 8 0v3m-9 0h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm5 4v2',
  play: 'm9 5 11 7-11 7z',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h1m-1 6h1m-1 6h1',
  center: 'M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5m-3-10v4m-2-2h4',
  minus: 'M5 12h14',
  plus: 'M5 12h14m-7-7v14',
  close: 'm6 6 12 12M18 6 6 18',
  camera: 'M4 7h3l2-3h6l2 3h3v13H4zM12 10a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z',
};

export type IconName = keyof typeof paths;

export function Icon({ name, color, size = 20 }: { name: IconName; color: string; size?: number }) {
  return (
    <Svg accessible={false} importantForAccessibility="no" width={size} height={size} viewBox="0 0 24 24">
      <Path d={paths[name]} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ActionButton({ label, accessibilityLabel, icon, onPress, variant = 'primary', disabled, style }: {
  label?: string;
  accessibilityLabel?: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const foreground = variant === 'primary' ? colors.onAction : colors.text;
  const borderColor = variant === 'secondary' ? colors.connector : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [styles.button, label && styles.labeled, {
        backgroundColor: variant === 'primary'
          ? (pressed ? colors.actionPressed : colors.action)
          : (pressed ? colors.pressed : variant === 'secondary' ? colors.surface : 'transparent'),
        borderColor: focused ? colors.focus : borderColor,
        opacity: disabled ? 0.55 : 1,
      }, style]}
    >
      {icon && <Icon name={icon} color={foreground} />}
      {label && <Text style={[styles.buttonLabel, { color: foreground }]}>{label}</Text>}
    </Pressable>
  );
}

export function ScreenHeading({ title, description }: { title: string; description?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={[styles.headingTitle, { color: colors.text }]}>{title}</Text>
      {description && <Text style={[styles.body, { color: colors.muted }]}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { minWidth: 48, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, padding: 8 },
  labeled: { paddingHorizontal: 12 },
  buttonLabel: { flexShrink: 1, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  heading: { gap: 8 },
  headingTitle: { fontSize: 34, fontWeight: '700', letterSpacing: -1.3 },
  body: { fontSize: 16, lineHeight: 24 },
});
