import { getOpenAiKey } from './apiKey';
import { buildDishPrompt, DishDetails } from './dishPrompt';
import { savePhotoFromBase64 } from './photos';

// Change here to switch model (see the OpenAI Images API reference).
const MODEL = 'gpt-image-2';
const TIMEOUT_MS = 120_000;

export class MissingApiKeyError extends Error {}

/** The parts of the OpenAI Images API response we read. */
type ImagesResponse = {
  data?: { b64_json?: string }[];
  error?: { message?: string };
};

/**
 * Asks OpenAI for a picture of the dish and stores it like a picked photo.
 * Returns the stored path.
 */
export const generateDishPhoto = async (dish: DishDetails): Promise<string> => {
  const key = await getOpenAiKey();
  if (!key) {
    throw new MissingApiKeyError();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          prompt: buildDishPrompt(dish),
          size: '1536x1024',
          quality: 'medium',
          output_format: 'jpeg',
          output_compression: 85,
          n: 1,
        }),
        // React Native types its own AbortSignal, same object at runtime.
        signal: controller.signal as RequestInit['signal'],
      },
    );
    const body = (await response.json()) as ImagesResponse;
    if (!response.ok) {
      throw new Error(body?.error?.message ?? `Erreur ${response.status}`);
    }
    const base64 = body?.data?.[0]?.b64_json;
    if (!base64) {
      throw new Error("OpenAI n'a renvoyé aucune image.");
    }
    return await savePhotoFromBase64(base64, 'jpg');
  } catch (e) {
    if (controller.signal.aborted) {
      throw new Error('La génération a pris trop de temps. Réessaie.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
};
