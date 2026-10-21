import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme';

type Props = {
  label: string;
  /** Fills the badge with this colour (e.g. a category colour). */
  color?: string;
  variant?: 'secondary' | 'outline';
};

/** Small read-only label, for tags like category or preparation time. */
export default function Badge({ label, color, variant = 'secondary' }: Props) {
  return (
    <View
      style={[
        styles.badge,
        styles[variant],
        color != null && { backgroundColor: color, borderColor: color },
      ]}
    >
      <Text style={[styles.label, color != null && styles.filledLabel]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
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
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  filledLabel: {
    color: colors.primaryForeground,
  },
});
