import { buildDishPrompt } from '../src/utils/dishPrompt';

describe('buildDishPrompt', () => {
  it('describes the dish with its course, ingredients, steps and style', () => {
    const prompt = buildDishPrompt({
      title: ' Tarte aux pommes ',
      categories: ['dessert'],
      balance: 'rich',
      ingredients: ['Pommes', ' ', 'Pâte brisée'],
      steps: ['Étaler la pâte', '', 'Napper de caramel'],
    });
    expect(prompt).toContain('"Tarte aux pommes", a homemade dessert');
    expect(prompt).toContain('Main ingredients: Pommes, Pâte brisée.');
    expect(prompt).toContain('1. Étaler la pâte 2. Napper de caramel');
    expect(prompt).toContain('indulgent');
    expect(prompt).toContain('No text');
  });

  it('lists every category', () => {
    const prompt = buildDishPrompt({
      title: 'Salade niçoise',
      categories: ['entree', 'plat'],
      balance: 'healthy',
      ingredients: [],
      steps: [],
    });
    expect(prompt).toContain('a homemade starter or main course');
  });

  it('works with only a title', () => {
    const prompt = buildDishPrompt({
      title: 'Soupe',
      categories: [],
      balance: 'normal',
      ingredients: [''],
      steps: [],
    });
    expect(prompt).toMatch(
      /^Appetizing food photograph of the finished dish "Soupe"\. /,
    );
    expect(prompt).not.toContain('Main ingredients');
    expect(prompt).not.toContain('Recipe steps');
  });

  it('shortens very long steps', () => {
    const prompt = buildDishPrompt({
      title: 'Pot-au-feu',
      categories: ['plat'],
      balance: 'normal',
      ingredients: [],
      steps: ['x'.repeat(5000)],
    });
    expect(prompt.length).toBeLessThan(2000);
    expect(prompt).toContain('…');
  });
});
