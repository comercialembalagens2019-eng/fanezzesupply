import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import { buildCartProduct, formatBRL, getUnitPrice, shippingFor } from "@/lib/pricing";
import { priceOrder } from "../../supabase/functions/_shared/catalog.ts";

// The card form must be created with exactly the amount the server charges, so the
// site's price math has to match the server catalog for every tier.
const cents = (reais: number) => Math.round(reais * 100);

describe("site prices match the server catalog", () => {
  const variants = products
    .filter((p) => !p.quoteOnly)
    .flatMap((p) =>
      p.sizePricing?.length
        ? p.sizePricing.flatMap((sp) => sp.tiers.map((t) => ({ id: `${p.id}-${sp.size}`, qty: t.minQty, product: p })))
        : [{ id: p.id, qty: p.minOrder, product: p }],
    );

  it.each(variants)("$id × $qty", ({ id, qty, product }) => {
    const server = priceOrder([{ productId: id, quantity: qty }]);
    expect("totalCents" in server).toBe(true);
    if (!("totalCents" in server)) return;
    expect(cents(getUnitPrice(id, qty, product.price) * qty)).toBe(server.totalCents);
  });
});

describe("buildCartProduct", () => {
  it("joins size and color into the variant id the server expects", () => {
    const coex = products.find((p) => p.id === "envelope-coex")!;
    const item = buildCartProduct(coex, 500, "19x25");
    expect(item.id).toBe("envelope-coex-19x25");
    expect(item.name).toBe("Envelope COEX - 19x25");
  });
});

describe("shippingFor", () => {
  it("is free only in Joinville/SC, accent- and case-insensitive", () => {
    expect(shippingFor("Joinville", "SC")).toBe(0);
    expect(shippingFor("JOINVILLE", "sc")).toBe(0);
    expect(shippingFor("Curitiba", "PR")).toBe(19.9);
  });
});

describe("formatBRL", () => {
  it("formats reais in pt-BR", () => {
    expect(formatBRL(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });
});
