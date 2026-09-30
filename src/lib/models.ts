const series = (prefix: string, items: string[]) => items.map((i) => `${prefix} ${i}`);

const catalog: { brand: string; models: string[] }[] = [
  {
    brand: "Apple",
    models: [
      ...series("iPhone", ["8", "8 Plus", "X", "XR", "XS", "XS Max", "SE (2nd gen)", "SE (3rd gen)"]),
      ...series("iPhone", ["11", "11 Pro", "11 Pro Max", "12 mini", "12", "12 Pro", "12 Pro Max", "13 mini", "13", "13 Pro", "13 Pro Max"]),
      ...series("iPhone", ["14", "14 Plus", "14 Pro", "14 Pro Max", "15", "15 Plus", "15 Pro", "15 Pro Max"]),
      ...series("iPhone", ["16e", "16", "16 Plus", "16 Pro", "16 Pro Max", "17", "Air", "17 Pro", "17 Pro Max"]),
    ],
  },
  {
    brand: "Samsung",
    models: [
      ...series("Galaxy", ["S20", "S20+", "S20 Ultra", "S20 FE", "S21", "S21+", "S21 Ultra", "S21 FE", "S22", "S22+", "S22 Ultra"]),
      ...series("Galaxy", ["S23", "S23+", "S23 Ultra", "S23 FE", "S24", "S24+", "S24 Ultra", "S24 FE", "S25", "S25+", "S25 Ultra", "S25 Edge", "S25 FE"]),
      ...series("Galaxy", ["A12", "A13", "A14", "A15", "A16", "A25", "A26", "A32", "A33", "A34", "A35", "A36", "A51", "A52", "A52s", "A53", "A54", "A55", "A56"]),
      ...series("Galaxy", ["Z Flip3", "Z Flip4", "Z Flip5", "Z Flip6", "Z Flip7", "Z Fold3", "Z Fold4", "Z Fold5", "Z Fold6", "Z Fold7"]),
    ],
  },
  {
    brand: "Google",
    models: series("Pixel", ["6", "6 Pro", "6a", "7", "7 Pro", "7a", "8", "8 Pro", "8a", "9", "9 Pro", "9 Pro XL", "9 Pro Fold", "9a", "10", "10 Pro", "10 Pro XL", "10 Pro Fold"]),
  },
  {
    brand: "Xiaomi",
    models: [
      ...series("Xiaomi", ["12", "12 Pro", "13", "13 Pro", "13T", "14", "14 Ultra", "14T", "15", "15 Ultra"]),
      ...series("Redmi Note", ["10", "10 Pro", "11", "11 Pro", "12", "12 Pro", "13", "13 Pro", "14", "14 Pro"]),
    ],
  },
  {
    brand: "OnePlus",
    models: series("OnePlus", ["9", "9 Pro", "10 Pro", "11", "12", "13", "Nord 3", "Nord 4", "Nord CE 4"]),
  },
];

export const STORAGE_OPTIONS = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];

// Case/space-insensitive key; "Plus" and "+" are treated as the same.
export const modelKey = (s: string) =>
  s.toLowerCase().replace(/\bplus\b/g, "+").replace(/[^a-z0-9+]/g, "");

export interface Suggestion {
  value: string;
  search: string;
  mine?: boolean;
}

const catalogEntries: Suggestion[] = catalog.flatMap(({ brand, models }) =>
  models.map((m) => ({ value: m, search: `${brand} ${m}`.toLowerCase() })),
);

const catalogByKey = new Map<string, string>();
for (const { brand, models } of catalog) {
  for (const m of models) {
    catalogByKey.set(modelKey(m), m);
    catalogByKey.set(modelKey(`${brand} ${m}`), m);
  }
}

/** Maps a typed name to the catalog spelling, or to a spelling already in use. */
export function canonicalModel(input: string, used: string[] = []) {
  const clean = input.trim().replace(/\s+/g, " ");
  const key = modelKey(clean);
  if (!key) return clean;
  return catalogByKey.get(key) ?? used.find((u) => modelKey(u) === key) ?? clean;
}

/** Finds the most specific known model mentioned anywhere in free text (e.g. an ad title). */
export function detectModel(text: string, used: string[] = []) {
  const hay = modelKey(text);
  let best: { key: string; value: string } | undefined;
  const consider = (key: string, value: string) => {
    if (key.length >= 4 && hay.includes(key) && (!best || key.length > best.key.length)) best = { key, value };
  };
  for (const [key, value] of catalogByKey) consider(key, value);
  for (const u of used) consider(modelKey(u), u);
  return best?.value;
}

/** User's own models first (most used first), then the built-in catalog. */
export function modelSuggestions(used: string[]): Suggestion[] {
  const counts = new Map<string, { value: string; n: number }>();
  for (const u of used) {
    const key = modelKey(u);
    if (!key) continue;
    const c = counts.get(key) ?? { value: canonicalModel(u), n: 0 };
    c.n++;
    counts.set(key, c);
  }
  const mine = [...counts.values()].sort((a, b) => b.n - a.n).map((c) => ({ value: c.value, search: c.value.toLowerCase(), mine: true }));
  const mineKeys = new Set(counts.keys());
  return [...mine, ...catalogEntries.filter((e) => !mineKeys.has(modelKey(e.value)))];
}

/** Most frequent spelling per key, for displaying grouped stats. */
export function groupLabel(spellings: string[]) {
  const counts = new Map<string, number>();
  for (const s of spellings) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}
