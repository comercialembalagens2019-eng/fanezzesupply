import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import { matchesProduct, searchSuggestions } from "./productSearch";

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
    const labels = searchSuggestions(products, "cinza 32x40").map((s) => s.label);
    expect(labels).toContain("Envelope Cinza 32x40");
  });

  it("waits for at least two characters", () => {
    expect(searchSuggestions(products, "e")).toEqual([]);
  });
});
