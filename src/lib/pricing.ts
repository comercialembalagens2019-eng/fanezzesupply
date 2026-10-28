import { products } from "@/data/products";
import type { Product } from "@/types";

// Mirrors supabase/functions/_shared/catalog.ts, which is what is actually charged.
const productsByIdLength = [...products].sort((a, b) => b.id.length - a.id.length);

export function resolveBaseProduct(productId: string): Product | undefined {
  return productsByIdLength.find((p) => productId === p.id || productId.startsWith(`${p.id}-`));
}

// Cart item ids carry variant suffixes, e.g. "envelope-coex-19x25" or "envelope-20x30-Preto".
export function getUnitPrice(productId: string, quantity: number, fallback: number): number {
  const base = resolveBaseProduct(productId);
  if (!base) return fallback;
  if (!base.sizePricing?.length) return base.price;

  const suffix = productId.slice(base.id.length + 1);
  const sizing = base.sizePricing.find((sp) => suffix === sp.size || suffix.startsWith(`${sp.size}-`));
  if (!sizing) return fallback;

  const tiers = [...sizing.tiers].sort((a, b) => a.minQty - b.minQty);
  return tiers.reduce((acc, tier) => (quantity >= tier.minQty ? tier.price : acc), tiers[0].price);
}
