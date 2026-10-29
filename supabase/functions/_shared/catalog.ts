// Authoritative, server-side product catalog. Never trust client-supplied prices.
// Prices are in centavos (BRL cents) per unit.
export const PRODUCT_UNIT_PRICE_CENTS: Record<string, number> = {
  "envelope": 8,
  "stretch-4kg": 2690,
  // Payment test product, visible and purchasable only by admins.
  "produto-teste": 1,
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

// Display data for order records. Names come from here, never from the client.
export const PRODUCT_INFO: Record<string, { name: string; unit: string; minQty: number }> = {
  "envelope": { name: "Envelope", unit: "unidade", minQty: 2000 },
  "envelope-coex": { name: "Envelope COEX", unit: "unidade", minQty: 500 },
  "envelope-cinza": { name: "Envelope Cinza", unit: "unidade", minQty: 500 },
  "stretch-4kg": { name: "Stretch 4kg", unit: "kg", minQty: 500 },
  // 100 × R$ 0,01 = R$ 1,00, the minimum a PIX charge accepts.
  "produto-teste": { name: "Produto teste (admin)", unit: "unidade", minQty: 500 },
};

// Products only admins may buy (createPendingOrder checks the role).
export const ADMIN_ONLY_PRODUCTS = new Set<string>(["produto-teste"]);

export function hasAdminOnlyProduct(items: { productId: string }[]): boolean {
  return items.some((item) => {
    const baseId = resolveBaseProductId(item.productId);
    return baseId !== null && ADMIN_ONLY_PRODUCTS.has(baseId);
  });
}

// Flat delivery fee outside Joinville/SC, in centavos. Shared with the storefront.
export const SHIPPING_FEE_CENTS = 1990;

const normalizePlace = (value: string | null | undefined) =>
  (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function shippingCentsFor(city: string | null | undefined, state: string | null | undefined): number {
  return normalizePlace(city) === "joinville" && normalizePlace(state) === "sc" ? 0 : SHIPPING_FEE_CENTS;
}

export interface OrderLine {
  productId: string;
  quantity: number;
}

export interface PricedOrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  totalCents: number;
}

// Variant suffixes (size/color) are shown in the product name, so keep them to a safe charset.
function variantLabel(productId: string, baseId: string): string | null {
  const suffix = productId.slice(baseId.length + 1);
  if (suffix.length === 0) return "";
  if (!/^[\p{L}\p{N} x-]{1,40}$/u.test(suffix)) return null;
  return suffix.split("-").join(" ");
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

export function priceOrder(
  items: unknown,
): { lines: PricedOrderLine[]; totalCents: number } | { error: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Itens do pedido são obrigatórios" };
  }
  if (items.length > 50) {
    return { error: "Muitos itens no pedido" };
  }

  const lines: PricedOrderLine[] = [];
  let totalCents = 0;
  for (const raw of items as OrderLine[]) {
    const baseId = resolveBaseProductId(raw?.productId);
    if (!baseId) return { error: "Produto inválido" };
    if (QUOTE_ONLY_PRODUCTS.has(baseId)) {
      return { error: "Produto disponível apenas sob consulta" };
    }
    const info = PRODUCT_INFO[baseId];
    const label = variantLabel(raw.productId, baseId);
    if (!info || label === null) return { error: "Produto inválido" };
    const quantity = Number(raw?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) {
      return { error: "Quantidade inválida" };
    }
    if (quantity < info.minQty) return { error: "Quantidade abaixo do pedido mínimo" };

    let unitPriceCents: number;
    const sizeMap = SIZE_TIER_PRICES[baseId];
    if (sizeMap) {
      const suffix = raw.productId.slice(baseId.length + 1);
      const sizeKey = Object.keys(sizeMap).find(
        (s) => suffix === s || suffix.startsWith(`${s}-`),
      );
      if (!sizeKey) return { error: "Tamanho inválido" };
      const tiers = [...sizeMap[sizeKey]].sort((a, b) => a.minQty - b.minQty);
      if (quantity < tiers[0].minQty) return { error: "Quantidade abaixo do pedido mínimo" };
      unitPriceCents = tiers.reduce(
        (acc, t) => (quantity >= t.minQty ? t.priceCents : acc),
        tiers[0].priceCents,
      );
    } else {
      unitPriceCents = PRODUCT_UNIT_PRICE_CENTS[baseId];
    }

    const lineTotal = unitPriceCents * quantity;
    totalCents += lineTotal;
    lines.push({
      productId: raw.productId,
      productName: label ? `${info.name} - ${label}` : info.name,
      quantity,
      unit: info.unit,
      unitPriceCents,
      totalCents: lineTotal,
    });
  }

  if (totalCents <= 0) return { error: "Total do pedido inválido" };
  return { lines, totalCents };
}

export function computeOrderTotalCents(
  items: unknown,
): { totalCents: number } | { error: string } {
  const priced = priceOrder(items);
  return "error" in priced ? priced : { totalCents: priced.totalCents };
}
