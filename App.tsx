import {
  DarkTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { FiltersProvider } from './src/context/FiltersContext';
import { initDatabase } from './src/db/database';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The database must be open (and migrated) before any screen queries it.
  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch(e => setError(String(e)));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>
            Impossible d'ouvrir la base de données.{'\n'}
            {error}
          </Text>
        </View>
      ) : !ready ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FiltersProvider>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </FiltersProvider>
      )}
    </SafeAreaProvider>
  );
}

// Keeps React Navigation backgrounds and borders in line with our palette.
const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.foreground,
    background: colors.background,
    card: colors.background,
    text: colors.foreground,
    border: colors.border,
    notification: colors.accent,
  },
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  error: {
    color: colors.destructive,
    textAlign: 'center',
  },
});

export default App;
