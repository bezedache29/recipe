import { Balance, Category } from '../types';

export type DishDetails = {
  title: string;
  categories: Category[];
  balance: Balance;
  ingredients: string[];
  steps: string[];
};

const COURSE: Record<Category, string> = {
  entree: 'starter',
  plat: 'main course',
  dessert: 'dessert',
  encas: 'snack',
};

const STYLE: Record<Balance, string> = {
  healthy: 'Light, fresh and colourful presentation.',
  normal: '',
  rich: 'Generous, indulgent, comforting presentation.',
};

/** Enough to describe how the dish is cooked and served, without huge prompts. */
const MAX_STEPS_LENGTH = 1500;

const clean = (values: string[]) => values.map(v => v.trim()).filter(Boolean);

/**
 * Describes the dish for the image model. Written in English (the models
 * follow it best) but keeps the French recipe text: the steps tell the model
 * how the dish is cooked and plated, so the picture matches this recipe.
 */
export const buildDishPrompt = ({
  title,
  categories,
  balance,
  ingredients,
  steps,
}: DishDetails) => {
  const names = clean(ingredients);
  let method = clean(steps)
    .map((step, index) => `${index + 1}. ${step}`)
    .join(' ');
  if (method.length > MAX_STEPS_LENGTH) {
    method = `${method.slice(0, MAX_STEPS_LENGTH)}…`;
  }
  return [
    `Appetizing food photograph of the finished dish "${title.trim()}"${
      categories.length > 0
        ? `, a homemade ${categories.map(c => COURSE[c]).join(' or ')}`
        : ''
    }.`,
    names.length > 0 ? `Main ingredients: ${names.join(', ')}.` : '',
    method
      ? `Recipe steps (in French), show the result they produce: ${method}`
      : '',
    STYLE[balance],
    'Served on a plate on a kitchen table, natural soft light, close-up,',
    'shallow depth of field, realistic. No text, no people, no hands.',
  ]
    .filter(Boolean)
    .join(' ');
};
