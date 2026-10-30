import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import { filterCatalog, matchesProduct, searchSuggestions } from "./productSearch";

const byId = (id: string) => products.find((p) => p.id === id)!;

describe("product search", () => {
  it("finds products by size, as the search box promises", () => {
    expect(matchesProduct(byId("envelope-cinza"), "32x40")).toBe(true);
  });

  it("ignores accents and case", () => {
    expect(matchesProduct(byId("envelope-cinza"), "CINZA")).toBe(true);
  });

  it("requires every word to match", () => {
    expect(matchesProduct(byId("envelope-cinza"), "cinza 99x99")).toBe(false);
  });

  it("suggests product + size combinations", () => {
    expect(searchSuggestions(products, "cinza 32x40")).toContainEqual({
      key: "envelope-cinza-32x40",
      productId: "envelope-cinza",
      size: "32x40",
      label: "Envelope Cinza 32x40",
      query: "Envelope Cinza 32x40",
      detail: "Tamanho",
    });
  });

  it("keeps exact identities when similar products match the same free text", () => {
    const suggestions = searchSuggestions(products, "cinza");
    expect(suggestions.find((s) => s.label === "Envelope Cinza")).toMatchObject({ productId: "envelope-cinza" });
    expect(suggestions.find((s) => s.label === "Envelope COEX")).toMatchObject({ productId: "envelope-coex" });
    expect(searchSuggestions(products, "Envelope").find((s) => s.label === "Envelope")).toMatchObject({ productId: "envelope" });
    expect(suggestions.every((s) => s.size === undefined)).toBe(true);
  });

  it("waits for at least two characters", () => {
    expect(searchSuggestions(products, "e")).toEqual([]);
  });
});

describe("exact catalog selection", () => {
  it("does not mix Cinza with COEX or Envelope with its namesakes", () => {
    expect(filterCatalog(products, { productId: "envelope-cinza" }).items.map((p) => p.id)).toEqual(["envelope-cinza"]);
    expect(filterCatalog(products, { productId: "envelope" }).items.map((p) => p.id)).toEqual(["envelope"]);
  });

  it("intersects the exact product with the free search", () => {
    expect(filterCatalog(products, { productId: "envelope-cinza", query: "32x40" }).items.map((p) => p.id)).toEqual(["envelope-cinza"]);
    expect(filterCatalog(products, { productId: "envelope-cinza", query: "19x25" }).items).toEqual([]);
  });

  it("retains description search when no exact product was requested", () => {
    const ids = filterCatalog(products, { query: "cinza" }).items.map((p) => p.id);
    expect(ids).toContain("envelope-cinza");
    expect(ids).toContain("envelope-coex");
  });

  it("treats empty, unknown and inaccessible ids alike without exposing a name", () => {
    for (const productId of ["", "inexistente", "produto-teste"]) {
      const result = filterCatalog(products, { productId });
      expect(result.items).toEqual([]);
      expect(result.selectedProduct).toBeUndefined();
      expect(result.invalidProduct).toBe(true);
    }
  });

  it("allows an admin to select an admin product while hiding it from visitors", () => {
    expect(filterCatalog(products, { productId: "produto-teste", isAdmin: true }).items.map((p) => p.id)).toEqual(["produto-teste"]);
    expect(filterCatalog(products).items.some((p) => p.adminOnly)).toBe(false);
  });

  it("keeps a valid material active even when its search has no results", () => {
    const result = filterCatalog(products, { productId: "envelope-cinza", query: "99x99" });
    expect(result.items).toEqual([]);
    expect(result.selectedProduct?.name).toBe("Envelope Cinza");
    expect(result.invalidProduct).toBe(false);
  });
});
