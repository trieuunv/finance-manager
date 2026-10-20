export interface HistoryItem {
  note: string;
  categoryId: string;
}

export interface CategorySuggestion {
  categoryId: string;
  confidence: number;
}

/** Lowercase, strip Vietnamese diacritics, split into tokens of 2+ chars. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
}

/**
 * Suggest categories for a note from the user's own history.
 * For each query token, P(category | token) is computed from past notes;
 * tokens never seen dilute confidence, so unknown notes score low.
 */
export function suggestCategories(
  note: string,
  history: HistoryItem[],
  limit = 3,
): CategorySuggestion[] {
  const queryTokens = [...new Set(tokenize(note))];
  if (queryTokens.length === 0) return [];

  const tokenTotals = new Map<string, number>();
  const tokenByCategory = new Map<string, Map<string, number>>();

  for (const item of history) {
    for (const token of new Set(tokenize(item.note))) {
      tokenTotals.set(token, (tokenTotals.get(token) ?? 0) + 1);
      const perCategory = tokenByCategory.get(token) ?? new Map<string, number>();
      perCategory.set(item.categoryId, (perCategory.get(item.categoryId) ?? 0) + 1);
      tokenByCategory.set(token, perCategory);
    }
  }

  const scores = new Map<string, number>();
  for (const token of queryTokens) {
    const total = tokenTotals.get(token);
    if (!total) continue;
    for (const [categoryId, count] of tokenByCategory.get(token)!) {
      scores.set(categoryId, (scores.get(categoryId) ?? 0) + count / total);
    }
  }

  return [...scores.entries()]
    .map(([categoryId, score]) => ({
      categoryId,
      confidence: Math.round((score / queryTokens.length) * 100) / 100,
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}
