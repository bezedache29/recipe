import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  controlHeight,
  fontSize,
  iconSize,
  radius,
  spacing,
} from '../../theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /**
   * Colour of the option (e.g. its category). Shown as a dot (or tints the
   * icon) when off, and fills the chip when on. Defaults to the primary colour.
   */
  color?: string;
  /** Replaces the colour dot. */
  icon?: LucideIcon;
};

/** Toggleable pill used for filters and multiple-choice fields. */
export default function Chip({
  label,
  selected,
  onPress,
  color,
  icon: Icon,
}: Props) {
  const fill = color ?? colors.primary;
  return (
    <Pressable
      onPress={() => {
        // Leaves the text field being edited, like a tap on empty space.
        Keyboard.dismiss();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: fill, borderColor: fill },
        pressed && !selected && styles.pressed,
      ]}
    >
      {Icon ? (
        <Icon
          size={iconSize.sm}
          color={selected ? colors.primaryForeground : fill}
          fill={selected ? colors.primaryForeground : 'transparent'}
          style={styles.icon}
        />
      ) : color && !selected ? (
        <View style={[styles.dot, { backgroundColor: color }]} />
      ) : null}
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: controlHeight.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.input,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.muted,
  },
  icon: {
    marginRight: spacing.xs + 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  label: {
    color: colors.foreground,
    fontSize: fontSize.sm + 1,
  },
  selectedLabel: {
    color: colors.primaryForeground,
    fontWeight: '600',
  },
});
