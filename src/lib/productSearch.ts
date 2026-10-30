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

// Resolve access before the exact material filter; an unavailable id must not broaden the search.
export function filterCatalog(
  products: Product[],
  { productId = null, query = "", isAdmin = false }: { productId?: string | null; query?: string; isAdmin?: boolean } = {}
) {
  const accessible = products.filter((product) => !product.adminOnly || isAdmin);
  const selectedProduct = productId === null ? undefined : accessible.find((product) => product.id === productId);
  const invalidProduct = productId !== null && !selectedProduct;
  const selected = productId === null ? accessible : selectedProduct ? [selectedProduct] : [];

  return {
    items: selected.filter((product) => matchesProduct(product, query)),
    selectedProduct,
    invalidProduct,
  };
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
