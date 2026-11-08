/**
 * Typo-tolerant matching of typed phrases against known names (vendors,
 * accounts, categories). Used by the search parser as a second pass, after
 * exact matches have been taken.
 *
 * It is deliberately conservative: a wrong guess is worse than no guess,
 * because the guess narrows the user's results.
 */

/** Lower-cases and strips accents so "Café" and "cafe" compare equal. */
export const normalizeForMatch = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/**
 * Edits (insert, delete, replace, swap of two neighbours) we tolerate for a
 * name of this length. Short names must match exactly: "food" and "foot" are
 * one edit apart but mean different things.
 */
export const allowedEdits = (length: number): number => {
  if (length < 5) return 0;
  if (length < 9) return 1;
  return 2;
};

/**
 * Optimal-string-alignment distance (Levenshtein plus neighbour swaps, so
 * "starbcuks" is one edit from "starbucks"). Returns `limit + 1` as soon as
 * the distance is known to exceed `limit`.
 */
export const editDistance = (a: string, b: string, limit: number): number => {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  if (a === b) return 0;

  let twoRowsBack: number[] = [];
  let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMinimum = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        previousRow[j] + 1, // deletion
        row[j - 1] + 1, // insertion
        previousRow[j - 1] + cost, // replacement
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, twoRowsBack[j - 2] + 1); // swap
      }
      row.push(value);
      if (value < rowMinimum) rowMinimum = value;
    }
    if (rowMinimum > limit) return limit + 1;
    twoRowsBack = previousRow;
    previousRow = row;
  }
  return previousRow[b.length];
};

export interface FuzzyPhraseMatch {
  /** Where the matched words start and end in the original query. */
  start: number;
  end: number;
  /** The words as the user typed them. */
  typed: string;
  distance: number;
}

/**
 * Finds the run of words in `query` that best matches `name` within the
 * allowed number of typos. Words in `ignoredWords` (dates, filter keywords)
 * and numbers are never taken as part of a name.
 */
export const findFuzzyPhrase = (
  query: string,
  name: string,
  ignoredWords: ReadonlySet<string>,
): FuzzyPhraseMatch | null => {
  const target = normalizeForMatch(name).replace(/\s+/g, " ");
  const limit = allowedEdits(target.length);
  if (limit === 0 || !target) return null;

  // Words without the punctuation around them: "starbuks." and "(starbuks)"
  // are the word "starbuks".
  const words = Array.from(query.matchAll(/[^\s,;]+/g), (m) => {
    const raw = m[0];
    const lead = raw.length - raw.replace(/^[("'“‘]+/, "").length;
    const text = raw.slice(lead).replace(/[)"'”’.!?:]+$/, "");
    return { text, start: (m.index ?? 0) + lead };
  }).filter((word) => word.text.length > 0);
  const wordCount = target.split(" ").length;
  let best: FuzzyPhraseMatch | null = null;

  for (let i = 0; i + wordCount <= words.length; i++) {
    const windowWords = words.slice(i, i + wordCount);
    const normalizedWords = windowWords.map((w) => normalizeForMatch(w.text));
    if (
      normalizedWords.some((w) => ignoredWords.has(w) || /^[\d.,%$]+$/.test(w))
    ) {
      continue;
    }

    const candidate = normalizedWords.join(" ");
    // People rarely mistype the first letter; requiring it removes most
    // false positives between unrelated words.
    if (candidate[0] !== target[0]) continue;

    const distance = editDistance(candidate, target, limit);
    if (distance > limit) continue;

    if (!best || distance < best.distance) {
      const first = windowWords[0];
      const last = windowWords[windowWords.length - 1];
      const end = last.start + last.text.length;
      best = {
        start: first.start,
        end,
        typed: query.slice(first.start, end),
        distance,
      };
    }
  }
  return best;
};
