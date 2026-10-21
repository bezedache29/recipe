import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import KeyboardAwareScrollView from '../components/ui/KeyboardAwareScrollView';
import { colors, fonts, fontSize, spacing } from '../theme';
import { deleteOpenAiKey, getOpenAiKey, saveOpenAiKey } from '../utils/apiKey';

/** Shows only both ends of the key, enough to recognise it. */
const maskKey = (key: string) => `${key.slice(0, 7)}…${key.slice(-4)}`;

export default function SettingsScreen() {
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOpenAiKey().then(setSavedKey);
  }, []);

  const save = async () => {
    const key = draft.trim();
    if (!key.startsWith('sk-')) {
      Alert.alert(
        'Clé invalide',
        'Une clé OpenAI commence par « sk- ». Copie-la depuis platform.openai.com.',
      );
      return;
    }
    setSaving(true);
    try {
      await saveOpenAiKey(key);
      setSavedKey(key);
      setDraft('');
    } catch (e) {
      Alert.alert('Erreur', `La clé n'a pas pu être enregistrée.\n${e}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert('Supprimer la clé ?', 'Tu ne pourras plus générer de photos.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteOpenAiKey();
          setSavedKey(null);
        },
      },
    ]);

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.section}>Photos générées par l'IA</Text>
      <Text style={styles.hint}>
        Ta clé OpenAI sert à créer une photo du plat depuis le formulaire. Elle
        reste chiffrée sur ce téléphone. Chaque image est facturée sur ton
        compte OpenAI.
      </Text>

      {savedKey ? (
        <Card style={styles.savedKey}>
          <View style={styles.flex}>
            <Text style={styles.label}>Clé enregistrée</Text>
            <Text style={styles.key}>{maskKey(savedKey)}</Text>
          </View>
          <Button
            label="Supprimer"
            variant="destructive"
            size="sm"
            onPress={remove}
          />
        </Card>
      ) : null}

      <Input
        value={draft}
        onChangeText={setDraft}
        placeholder={savedKey ? 'Remplacer par une autre clé' : 'sk-…'}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <Button
        label="Enregistrer la clé"
        loading={saving}
        disabled={draft.trim() === ''}
        style={styles.saveButton}
        onPress={save}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  section: {
    fontFamily: fonts.headingMedium,
    fontSize: fontSize.lg,
    color: colors.foreground,
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  savedKey: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  key: {
    color: colors.foreground,
    fontSize: fontSize.base,
    marginTop: 2,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
