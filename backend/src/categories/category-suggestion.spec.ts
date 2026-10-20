import { suggestCategories, tokenize } from './category-suggestion';

describe('tokenize', () => {
  it('strips Vietnamese diacritics and short tokens', () => {
    expect(tokenize('Cà phê Highlands, đi 2 người')).toEqual(['ca', 'phe', 'highlands', 'di', 'nguoi']);
  });
});

describe('suggestCategories', () => {
  const history = [
    { note: 'Cà phê Highlands', categoryId: 'coffee' },
    { note: 'ca phe sang', categoryId: 'coffee' },
    { note: 'Grab đi làm', categoryId: 'transport' },
    { note: 'Grab food trưa', categoryId: 'food' },
  ];

  it('suggests the category whose past notes share tokens', () => {
    const r = suggestCategories('cà phê với bạn', history);
    expect(r[0].categoryId).toBe('coffee');
  });

  it('splits confidence between categories sharing a token', () => {
    const r = suggestCategories('grab', history);
    expect(r.map((x) => x.categoryId).sort()).toEqual(['food', 'transport']);
    expect(r[0].confidence).toBe(0.5);
  });

  it('returns nothing for unknown or empty notes', () => {
    expect(suggestCategories('xyz', history)).toEqual([]);
    expect(suggestCategories('', history)).toEqual([]);
  });
});
