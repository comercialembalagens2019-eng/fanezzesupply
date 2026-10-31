import { expect, test } from "@playwright/test";

test("home material links select an exact product and retain the size guide", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("region", { name: "Encontre seu envelope" }).getByRole("link", { name: "Ver opções de Envelope Cinza" }).click();
  const results = page.getByRole("region", { name: "Resultados do catálogo" });
  await expect(results.getByRole("heading", { level: 3 })).toHaveText(["Envelope Cinza"]);
  await page.goBack();
  await expect(page.getByRole("region", { name: "Veja o tamanho antes de comprar" }).getByRole("link", { name: "Comprar este tamanho" })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Já sabe o que precisa?" })).toBeVisible();
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

for (const inputMethod of ["click", "keyboard"] as const) {
  test(`choosing a gray envelope suggestion uses its exact id by ${inputMethod}`, async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("combobox", { name: "Buscar produtos" });
    await search.fill("cinza");
    const gray = page.getByRole("listbox", { name: "Sugestões" }).getByRole("option").filter({ has: page.getByText("Envelope Cinza", { exact: true }) });
    await expect(gray).toBeVisible();
    if (inputMethod === "click") {
      await gray.click();
    } else {
      await search.press("ArrowDown");
      await search.press("ArrowDown");
      await expect(gray).toHaveAttribute("aria-selected", "true");
      await search.press("Enter");
    }
    await expect(page).toHaveURL(/produto=envelope-cinza/);
    await expect(page).not.toHaveURL(/[?&]q=/);
    await expect(page.getByRole("region", { name: "Resultados do catálogo" }).getByRole("heading", { level: 3 })).toHaveText(["Envelope Cinza"]);
  });
}

test("choosing a size suggestion keeps its exact product and searches only that size", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Buscar produtos" }).fill("cinza 32x40");
  await page.getByRole("listbox", { name: "Sugestões" }).getByRole("option").filter({ has: page.getByText("Envelope Cinza 32x40", { exact: true }) }).click();
  await expect(page).toHaveURL(/produto=envelope-cinza/);
  await expect(page).toHaveURL(/q=32x40/);
  await expect(page.getByRole("searchbox", { name: "Buscar produtos", exact: true })).toHaveValue("32x40");
  await expect(page.getByRole("region", { name: "Resultados do catálogo" }).getByRole("heading", { level: 3 })).toHaveText(["Envelope Cinza"]);
});
