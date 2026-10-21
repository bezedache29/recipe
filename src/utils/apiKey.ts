import {
  getGenericPassword,
  resetGenericPassword,
  setGenericPassword,
} from 'react-native-keychain';

// The OpenAI key lives in the Android Keystore, never in the code or the database.
const SERVICE = 'openai-api-key';

export const getOpenAiKey = async (): Promise<string | null> => {
  const credentials = await getGenericPassword({ service: SERVICE });
  return credentials ? credentials.password : null;
};

export const saveOpenAiKey = async (key: string) => {
  await setGenericPassword('openai', key.trim(), { service: SERVICE });
};

export const deleteOpenAiKey = async () => {
  await resetGenericPassword({ service: SERVICE });
};
