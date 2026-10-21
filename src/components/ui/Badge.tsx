import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, iconSize, radius, spacing } from '../../theme';

type Props = {
  label: string;
  icon?: LucideIcon;
  /** Fills the badge with this colour (e.g. a category colour). */
  color?: string;
  variant?: 'secondary' | 'outline';
};

/** Small read-only label, for tags like category or preparation time. */
export default function Badge({
  label,
  icon: Icon,
  color,
  variant = 'secondary',
}: Props) {
  const textColor =
    color != null ? colors.primaryForeground : colors.foreground;
  return (
    <View
      style={[
        styles.badge,
        styles[variant],
        color != null && { backgroundColor: color, borderColor: color },
      ]}
    >
      {Icon ? <Icon color={textColor} size={iconSize.sm - 2} /> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 3,
  },
  secondary: {
    backgroundColor: colors.muted,
    borderColor: colors.muted,
  },
  outline: {
    borderColor: colors.input,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
