import { expect, test } from "@playwright/test";

test("home material links select an exact product and retain the size guide", async ({ page }) => {
  await page.goto("/");
  const materials = page.getByRole("region", { name: "Escolha o material" });
  const grayCard = materials.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Envelope Cinza", exact: true }) });
  await grayCard.getByRole("link", { name: "Ver tamanhos e preços" }).click();
  const results = page.getByRole("region", { name: "Resultados do catálogo" });
  await expect(results.getByRole("heading", { level: 3 })).toHaveText(["Envelope Cinza"]);
  await page.goBack();
  await expect(page.locator('a[href="/produtos?produto=envelope-cinza&q=32x40"]')).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Pedido rápido" })).toBeVisible();
});

test("clearing a material preserves the search and other URL parameters, including history", async ({ page }) => {
  await page.goto("/produtos?produto=envelope&q=32x40&origem=guia");
  const cards = page.getByRole("region", { name: "Resultados do catálogo" }).getByRole("heading", { level: 3 });
  await expect(cards).toHaveText(["Envelope"]);
  await page.getByRole("button", { name: "Limpar material" }).click();
  await expect(page).not.toHaveURL(/produto=/);
  await expect(page).toHaveURL(/q=32x40/);
  await expect(page).toHaveURL(/origem=guia/);
  await expect(cards).toHaveText(["Envelope", "Envelope Cinza"]);
  await page.goBack();
  await expect(cards).toHaveText(["Envelope"]);
  await expect(page.getByRole("status")).toContainText("Material: Envelope");
  await page.goForward();
  await expect(cards).toHaveText(["Envelope", "Envelope Cinza"]);
});

test("same-route URL navigation updates product ids and intersects them with search", async ({ page }) => {
  await page.goto("/produtos?produto=envelope-cinza&q=19x25");
  const results = page.getByRole("region", { name: "Resultados do catálogo" });
  await expect(results).toContainText("Nenhum produto encontrado.");
  await expect(page.getByRole("status")).toContainText("Material: Envelope Cinza");
  // Exercise a history location update without reloading or remounting the route.
  await page.evaluate(() => {
    window.history.pushState(null, "", "/produtos?produto=envelope-coex&q=19x25");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(results.getByRole("heading", { level: 3 })).toHaveText(["Envelope COEX"]);
  await expect(page.getByRole("status")).toContainText("Material: Envelope COEX");
});

test("empty, unknown and admin ids show the same unavailable state to visitors", async ({ page }) => {
  for (const productId of ["", "inexistente", "produto-teste"]) {
    await page.goto(`/produtos?produto=${productId}`);
    const results = page.getByRole("region", { name: "Resultados do catálogo" });
    await expect(results).toHaveText("Material indisponível. Limpe o filtro para ver outros produtos.");
    await expect(results.getByRole("heading", { level: 3 })).toHaveCount(0);
    await expect(page.getByText("Produto teste (admin)")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Limpar material" })).toBeVisible();
  }
});

test("catalog search keeps the material while a new header search clears it", async ({ page }) => {
  await page.goto("/produtos?produto=envelope-cinza");
  const results = page.getByRole("region", { name: "Resultados do catálogo" });
  await page.getByRole("searchbox", { name: "Buscar produtos", exact: true }).fill("19x25");
  await expect(results).toContainText("Nenhum produto encontrado.");
  await expect(page).toHaveURL(/produto=envelope-cinza/);
  await page.getByRole("combobox", { name: "Buscar produtos" }).fill("COEX");
  await page.getByRole("combobox", { name: "Buscar produtos" }).press("Enter");
  await expect(page).not.toHaveURL(/produto=/);
  await expect(page).toHaveURL(/q=COEX/);
  await expect(results.getByRole("heading", { level: 3 })).toHaveText(["Envelope COEX"]);
});
