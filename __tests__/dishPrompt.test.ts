import { buildDishPrompt } from '../src/utils/dishPrompt';

describe('buildDishPrompt', () => {
  it('describes the dish with its course, ingredients, steps and style', () => {
    const prompt = buildDishPrompt({
      title: ' Tarte aux pommes ',
      category: 'dessert',
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

  it('works with only a title', () => {
    const prompt = buildDishPrompt({
      title: 'Soupe',
      category: null,
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
      category: 'plat',
      balance: 'normal',
      ingredients: [],
      steps: ['x'.repeat(5000)],
    });
    expect(prompt.length).toBeLessThan(2000);
    expect(prompt).toContain('…');
  });
});
