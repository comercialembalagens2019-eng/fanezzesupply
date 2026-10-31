import { describe, expect, it } from "vitest";
import { authPagePath, authReturnDestination, legacyLoginDestination } from "./authReturn";

describe("auth return destination", () => {
  it.each(["/carrinho", "/produtos"])("preserves %s across both auth pages", (destination) => {
    const query = `?${new URLSearchParams({ returnTo: destination })}`;
    expect(authReturnDestination(query, null)).toBe(destination);
    expect(authReturnDestination("", { from: destination })).toBe(destination);
    expect(authPagePath("/login", destination)).toBe(`/login${query}`);
    expect(authPagePath("/cadastro", destination)).toBe(`/cadastro${query}`);
  });

  it.each([
    "https://example.com", "//example.com", "/\\example.com", "\\carrinho",
    "/admin", "/carrinho/", "/carrinho?x=1", "/produtos#x", "/%63arrinho", "", null, 1, {},
  ])("rejects destinations outside the exact allowlist: %s", (destination) => {
    const query = `?${new URLSearchParams({ returnTo: String(destination) })}`;
    expect(authReturnDestination(query, null)).toBeNull();
    expect(authReturnDestination("", { from: destination })).toBeNull();
    expect(authPagePath("/login", destination)).toBe("/login");
  });

  it("prioritizes a valid explicit destination and validates the state fallback", () => {
    expect(authReturnDestination("?returnTo=%2Fprodutos", { from: "/carrinho" })).toBe("/produtos");
    expect(authReturnDestination("?returnTo=%2Fadmin", { from: "/carrinho" })).toBe("/carrinho");
    expect(authReturnDestination("", null)).toBeNull();
    expect(authReturnDestination("", "invalid state")).toBeNull();
  });

  it("retains safe legacy login routes without allowing them in returnTo", () => {
    expect(legacyLoginDestination({ from: "/pedidos" })).toBe("/pedidos");
    for (const from of ["//example.com", "/\\example.com", "https://example.com", null]) {
      expect(legacyLoginDestination({ from })).toBeNull();
    }
  });
});
