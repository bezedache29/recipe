import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { NativeModules } from 'react-native';

type KeepAwakeModule = { activate: () => void; deactivate: () => void };

// Native code in android/app/src/main/java/com/salou/recipe/KeepAwakeModule.kt.
// Missing in tests, where it simply does nothing.
const KeepAwake: KeepAwakeModule | undefined = NativeModules.KeepAwake;

/**
 * Keeps the screen on while the current screen is displayed, and lets the
 * phone sleep again as soon as the user navigates away from it.
 */
export const useKeepAwake = () =>
  useFocusEffect(
    useCallback(() => {
      KeepAwake?.activate();
      return () => KeepAwake?.deactivate();
    }, []),
  );
