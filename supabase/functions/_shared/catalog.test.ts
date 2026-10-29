import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { hasAdminOnlyProduct, priceOrder, shippingCentsFor, SHIPPING_FEE_CENTS } from "./catalog.ts";

Deno.test("shipping is free in Joinville/SC regardless of case and accents", () => {
  assertEquals(shippingCentsFor("Joinville", "SC"), 0);
  assertEquals(shippingCentsFor("  JOINVILLE ", "sc"), 0);
  assertEquals(shippingCentsFor("Joinvílle", "SC"), 0);
});

Deno.test("shipping is charged everywhere else", () => {
  assertEquals(shippingCentsFor("Blumenau", "SC"), SHIPPING_FEE_CENTS);
  assertEquals(shippingCentsFor("Joinville", "PR"), SHIPPING_FEE_CENTS);
  assertEquals(shippingCentsFor("", ""), SHIPPING_FEE_CENTS);
  assertEquals(shippingCentsFor(null, null), SHIPPING_FEE_CENTS);
  assertEquals(SHIPPING_FEE_CENTS, 1990);
});

Deno.test("tier price follows quantity", () => {
  const p500 = priceOrder([{ productId: "envelope-coex-19x25", quantity: 500 }]);
  const p1000 = priceOrder([{ productId: "envelope-coex-19x25", quantity: 1000 }]);
  assertEquals("totalCents" in p500 && p500.totalCents, 13500);
  assertEquals("totalCents" in p1000 && p1000.totalCents, 24000);
});

Deno.test("rejects below minimum, quote-only and unknown products", () => {
  assertEquals(priceOrder([{ productId: "envelope-20x30-Preto", quantity: 100 }]), { error: "Quantidade abaixo do pedido mínimo" });
  assertEquals(priceOrder([{ productId: "envelope-personalizado", quantity: 5000 }]), { error: "Produto disponível apenas sob consulta" });
  assertEquals(priceOrder([{ productId: "nao-existe", quantity: 5000 }]), { error: "Produto inválido" });
});

Deno.test("test product costs one centavo per unit and is admin-only", () => {
  const priced = priceOrder([{ productId: "produto-teste", quantity: 500 }]);
  assertEquals("totalCents" in priced && priced.totalCents, 500);
  assertEquals(priceOrder([{ productId: "produto-teste", quantity: 499 }]), { error: "Quantidade abaixo do pedido mínimo" });
  assertEquals(hasAdminOnlyProduct([{ productId: "produto-teste" }]), true);
  assertEquals(hasAdminOnlyProduct([{ productId: "envelope-coex-19x25" }]), false);
});
