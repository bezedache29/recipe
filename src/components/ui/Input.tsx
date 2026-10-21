import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { colors, controlHeight, fontSize, radius, spacing } from '../../theme';
import { useRevealOnFocus } from './KeyboardAwareScrollView';

/** Text field with the app's look; the border lights up while typing. */
export default function Input({
  style,
  multiline,
  onFocus,
  onBlur,
  onContentSizeChange,
  ...props
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const reveal = useRevealOnFocus();
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      selectionColor={colors.primary}
      cursorColor={colors.primary}
      multiline={multiline}
      onFocus={e => {
        setFocused(true);
        reveal?.();
        onFocus?.(e);
      }}
      onBlur={e => {
        setFocused(false);
        onBlur?.(e);
      }}
      onContentSizeChange={e => {
        // A growing multi-line field (e.g. a step) must stay above the keyboard.
        if (focused && multiline) {
          reveal?.();
        }
        onContentSizeChange?.(e);
      }}
      style={[
        styles.input,
        multiline && styles.multiline,
        focused && styles.focused,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: controlHeight.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    fontSize: fontSize.base,
  },
  multiline: {
    minHeight: 88,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  focused: {
    borderColor: colors.primary,
  },
});
