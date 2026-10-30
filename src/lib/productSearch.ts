import type { Product } from "@/types";

// Case- and accent-insensitive, so "cinza", "Cinza" and "envelopes" all match.
export const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function matchesProduct(product: Product, term: string): boolean {
  const q = normalize(term);
  if (!q) return true;
  const haystack = [product.name, product.description, product.category, ...(product.sizes ?? []), ...(product.colors ?? [])]
    .map(normalize)
    .join(" ");
  // Every word must appear somewhere ("cinza 32x40" finds the gray envelope in that size).
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export interface SearchSuggestion {
  key: string;
  label: string;
  detail: string;
  /** Value for /produtos?q= */
  query: string;
}

// Header suggestions: matching products first, then product + size combinations.
export function searchSuggestions(products: Product[], term: string, limit = 6): SearchSuggestion[] {
  const q = normalize(term);
  if (q.length < 2) return [];
  const result: SearchSuggestion[] = [];
  for (const product of products) {
    if (!matchesProduct(product, term)) continue;
    const sizes = (product.sizes ?? []).filter((size) => q.split(/\s+/).some((word) => normalize(size).includes(word)));
    if (sizes.length === 0) {
      result.push({ key: product.id, label: product.name, detail: product.category, query: product.name });
    }
    for (const size of sizes) {
      result.push({ key: `${product.id}-${size}`, label: `${product.name} ${size}`, detail: "Tamanho", query: `${product.name} ${size}` });
    }
  }
  return result.slice(0, limit);
}
