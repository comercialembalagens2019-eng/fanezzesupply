// Authoritative, server-side product catalog. Never trust client-supplied prices.
// Prices are in centavos (BRL cents) per unit.
export const PRODUCT_UNIT_PRICE_CENTS: Record<string, number> = {
  "envelope": 8,
  "stretch-4kg": 2690,
};

// Products priced per size, with quantity tiers. Prices in centavos per unit.
export const SIZE_TIER_PRICES: Record<string, Record<string, { minQty: number; priceCents: number }[]>> = {
  "envelope-coex": {
    "19x25": [{ minQty: 500, priceCents: 27 }, { minQty: 1000, priceCents: 24 }],
    "32x20": [{ minQty: 500, priceCents: 36 }, { minQty: 1000, priceCents: 31 }],
    "30x40": [{ minQty: 500, priceCents: 66 }, { minQty: 1000, priceCents: 56 }],
    "40x60": [{ minQty: 500, priceCents: 136 }, { minQty: 1000, priceCents: 117 }],
    "50x70": [{ minQty: 500, priceCents: 171 }, { minQty: 1000, priceCents: 146 }],
  },
  "envelope-cinza": {
    "20x30": [{ minQty: 500, priceCents: 16 }, { minQty: 1000, priceCents: 14 }],
    "26x36": [{ minQty: 500, priceCents: 26 }, { minQty: 1000, priceCents: 20 }],
    "32x40": [{ minQty: 500, priceCents: 36 }, { minQty: 1000, priceCents: 26 }],
    "40x50": [{ minQty: 500, priceCents: 55 }, { minQty: 1000, priceCents: 46 }],
    "50x70": [{ minQty: 500, priceCents: 105 }, { minQty: 1000, priceCents: 77 }],
    "70x60": [{ minQty: 500, priceCents: 120 }, { minQty: 1000, priceCents: 87 }],
    "40x00": [{ minQty: 500, priceCents: 64 }, { minQty: 1000, priceCents: 55 }],
    "50x90": [{ minQty: 500, priceCents: 140 }, { minQty: 1000, priceCents: 102 }],
  },
};

// Products that can only be quoted, never purchased online.
export const QUOTE_ONLY_PRODUCTS = new Set<string>([
  "envelope-personalizado",
]);

export interface OrderLine {
  productId: string;
  quantity: number;
}

// Cart ids may carry a variant suffix (e.g. "envelope-20x30").
export function resolveBaseProductId(productId: string): string | null {
  if (typeof productId !== "string" || productId.length === 0 || productId.length > 100) {
    return null;
  }
  const known = [
    ...Object.keys(SIZE_TIER_PRICES),
    ...Object.keys(PRODUCT_UNIT_PRICE_CENTS),
    ...QUOTE_ONLY_PRODUCTS,
  ].sort((a, b) => b.length - a.length);
  for (const id of known) {
    if (productId === id || productId.startsWith(`${id}-`)) return id;
  }
  return null;
}

export function computeOrderTotalCents(
  items: unknown,
): { totalCents: number } | { error: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Itens do pedido são obrigatórios" };
  }
  if (items.length > 50) {
    return { error: "Muitos itens no pedido" };
  }

  let totalCents = 0;
  for (const raw of items as OrderLine[]) {
    const baseId = resolveBaseProductId(raw?.productId);
    if (!baseId) return { error: "Produto inválido" };
    if (QUOTE_ONLY_PRODUCTS.has(baseId)) {
      return { error: "Produto disponível apenas sob consulta" };
    }
    const quantity = Number(raw?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) {
      return { error: "Quantidade inválida" };
    }
    const sizeMap = SIZE_TIER_PRICES[baseId];
    if (sizeMap) {
      const suffix = raw.productId.slice(baseId.length + 1);
      const sizeKey = Object.keys(sizeMap).find(
        (s) => suffix === s || suffix.startsWith(`${s}-`),
      );
      if (!sizeKey) return { error: "Tamanho inválido" };
      const tiers = [...sizeMap[sizeKey]].sort((a, b) => a.minQty - b.minQty);
      if (quantity < tiers[0].minQty) return { error: "Quantidade abaixo do pedido mínimo" };
      const unit = tiers.reduce(
        (acc, t) => (quantity >= t.minQty ? t.priceCents : acc),
        tiers[0].priceCents,
      );
      totalCents += unit * quantity;
      continue;
    }
    totalCents += PRODUCT_UNIT_PRICE_CENTS[baseId] * quantity;
  }

  if (totalCents <= 0) return { error: "Total do pedido inválido" };
  return { totalCents };
}
