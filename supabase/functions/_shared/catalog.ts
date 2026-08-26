// Authoritative, server-side product catalog. Never trust client-supplied prices.
// Prices are in centavos (BRL cents) per unit.
export const PRODUCT_UNIT_PRICE_CENTS: Record<string, number> = {
  "envelope": 8,
};

// Products that can only be quoted, never purchased online.
export const QUOTE_ONLY_PRODUCTS = new Set<string>([
  "envelope-personalizado",
  "stretch-4kg",
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
    totalCents += PRODUCT_UNIT_PRICE_CENTS[baseId] * quantity;
  }

  if (totalCents <= 0) return { error: "Total do pedido inválido" };
  return { totalCents };
}
