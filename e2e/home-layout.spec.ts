import { expect, test } from "@playwright/test";

test("home follows the approved order without horizontal scroll at every width", async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const headings = await page.locator("main h1, main h2").allInnerTexts();
    expect(headings.slice(0, 6)).toEqual([
      "Pequenos detalhes.\nGrandes envios.",
      "Já sabe o que precisa?",
      "Encontre seu envelope",
      "Veja o tamanho antes de comprar",
      "Sua marca acompanha cada pedido.",
      "Perguntas frequentes",
    ]);
    // The quick buy bar overlaps the bottom of the hero photo.
    const hero = (await page.getByRole("region", { name: /Pequenos detalhes/ }).boundingBox())!;
    const quick = (await page.getByRole("region", { name: "Já sabe o que precisa?", exact: true }).boundingBox())!;
    expect(quick.y).toBeLessThan(hero.y + hero.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("hero, cards, banner and help links lead to real destinations", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Encontrar minha embalagem" }).click();
  await expect(page).toHaveURL(/#envelopes$/);
  const cards = page.getByRole("region", { name: "Encontre seu envelope" });
  await expect(cards.getByRole("heading", { level: 3 })).toHaveText(["Envelope", "Envelope COEX", "Envelope Cinza"]);
  await expect(cards.getByRole("link", { name: "Ver opções de Envelope Cinza" })).toHaveAttribute("href", "/produtos?produto=envelope-cinza");
  await expect(page.getByRole("link", { name: "Criar meu personalizado" })).toHaveAttribute("href", /wa\.me/);
  await expect(page.getByRole("link", { name: "Falar com a FNZ" })).toHaveAttribute("href", /wa\.me/);
  await page.getByRole("link", { name: "Abrir guia de medidas" }).click();
  await expect(page).toHaveURL(/#guia-de-tamanhos$/);
  const guide = page.getByRole("region", { name: "Veja o tamanho antes de comprar" });
  await guide.getByRole("button", { name: "Envelope Cinza", exact: true }).click();
  await guide.getByRole("button", { name: /^32x40 cm, Envelope Cinza/ }).click();
  await expect(guide.getByRole("link", { name: "Comprar este tamanho" })).toHaveAttribute("href", "/produtos?produto=envelope-cinza&q=32x40");
});

test("header links reach home sections from another page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/produtos");
  await page.locator("header").getByRole("link", { name: "Guia de medidas" }).click();
  await expect(page).toHaveURL(/\/#guia-de-tamanhos$/);
  await expect(page.getByRole("heading", { name: "Veja o tamanho antes de comprar" })).toBeInViewport();
});

test("quick buy prices from the catalog and adds the chosen variant to the cart", async ({ page }) => {
  await page.goto("/");
  const quick = page.getByRole("region", { name: "Já sabe o que precisa?", exact: true });
  await expect(quick.getByText("R$ 240,00")).toBeVisible();
  await quick.getByLabel("Material").selectOption("envelope-cinza");
  await quick.getByLabel("Tamanho").selectOption("32x40");
  await quick.getByLabel("Quantidade").selectOption("500");
  await expect(quick.getByText("R$ 180,00")).toBeVisible();
  await quick.getByLabel("Quantidade").selectOption("1000");
  await expect(quick.getByText("R$ 260,00")).toBeVisible();
  await quick.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await quick.getByLabel("Material").selectOption("envelope");
  await quick.getByLabel("Cor").selectOption("Branco");
  await quick.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.goto("/carrinho");
  await expect(page.getByRole("spinbutton", { name: "Quantidade de Envelope Cinza - 32x40", exact: true })).toHaveValue("1000");
  await expect(page.getByRole("spinbutton", { name: "Quantidade de Envelope - 20x30 • Branco", exact: true })).toHaveValue("4000");
});

test("header search selects exact material, size, color and quantity through to cart", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Buscar produtos" }).fill("Envelope");
  await page.getByRole("listbox", { name: "Sugestões" }).getByRole("option", { name: /^Envelope Envelopes$/ }).click();
  await expect(page).toHaveURL(/produto=envelope$/);
  await page.getByRole("combobox", { name: "Tamanho", exact: true }).click();
  await page.getByRole("option", { name: "32x40", exact: true }).click();
  await page.getByRole("combobox", { name: "Cor", exact: true }).click();
  await page.getByRole("option", { name: "Branco", exact: true }).click();
  await page.getByRole("spinbutton", { name: "Quantidade (unidades)", exact: true }).fill("2500");
  await page.getByRole("button", { name: "Adicionar ao carrinho", exact: true }).click();
  await page.goto("/carrinho");
  await expect(page.getByRole("spinbutton", { name: "Quantidade de Envelope - 32x40 • Branco", exact: true })).toHaveValue("2500");
});

test("layout reflows at 200% equivalent viewport without horizontal page scroll", async ({ page }) => {
  // Browser zoom at 200% halves the CSS viewport, unlike CSS zoom/transforms.
  for (const physicalWidth of [640, 780, 2048, 2558, 2560, 3840]) {
    await page.setViewportSize({ width: physicalWidth / 2, height: 450 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("region", { name: "Já sabe o que precisa?", exact: true }).getByRole("button", { name: "Adicionar ao carrinho" })).toBeVisible();
  }
});

test("catalog search stays usable after scrolling with the taller mobile header", async ({ page }) => {
  for (const width of [390, 639, 640, 1280]) {
    await page.setViewportSize({ width, height: 450 });
    await page.goto("/produtos");
    const filters = page.getByRole("region", { name: "Filtros do catálogo", exact: true });
    // Measure after the page's entrance animation, whose transform shifts sticky elements by fractions of a pixel.
    await expect(filters).toBeVisible();
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"));
    const search = filters.getByRole("searchbox", { name: "Buscar produtos", exact: true });
    const header = page.locator("header");
    const headerHeight = (await header.boundingBox())!.height;
    const padding = await page.locator("main").evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
    expect(padding).toBe(headerHeight);
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(600);
    if (width < 640) {
      await expect(filters).toHaveCSS("position", "static");
      expect((await filters.boundingBox())!.y).toBeLessThan(0);
    } else {
      await expect(filters).toHaveCSS("position", "sticky");
      expect((await filters.boundingBox())!.y).toBe(headerHeight);
    }
    // Clicking scrolls a non-sticky mobile search back into view, without an overlay.
    await search.click();
    await expect(search).toBeFocused();
    expect((await search.boundingBox())!.y).toBeGreaterThanOrEqual(headerHeight);
    expect(await search.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === el;
    })).toBe(true);
    await search.fill("32x40");
    await expect(search).toHaveValue("32x40");
  }
});
