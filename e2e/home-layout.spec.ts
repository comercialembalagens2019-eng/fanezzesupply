import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("home width, module order and calculator placement follow each viewport", async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1279, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const calculator = page.getByRole("region", { name: "Calculadora de preço", exact: true });
    await expect(calculator).toHaveCount(1);
    await expect(calculator.getByRole("button", { name: "Adicionar ao carrinho" })).toHaveCount(1);
    const order = await page.locator(".home-purchase-grid > *").evaluateAll((nodes) => nodes.map((el) => el.className));
    expect(order).toEqual(width >= 1280
      ? ["home-banner", "home-calculator", "home-differentials", "home-materials"]
      : ["home-banner", "home-differentials", "home-materials", "home-calculator"]);
    const calcBox = (await calculator.boundingBox())!;
    const banner = (await page.locator(".home-banner").boundingBox())!;
    const materials = (await page.locator(".home-materials").boundingBox())!;
    if (width >= 1280) {
      expect(calcBox.width).toBe(360);
      expect(calcBox.y).toBeCloseTo(banner.y);
      expect(calcBox.x).toBeGreaterThan(banner.x + banner.width);
    } else {
      expect(calcBox.width).toBeLessThanOrEqual(560);
      expect(calcBox.y).toBeGreaterThan(materials.y + materials.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const mainWidth = (await page.locator("main .container-wide").boundingBox())!.width;
    expect(mainWidth).toBe(Math.min(1440, width - (width >= 1280 ? 64 : width >= 768 ? 48 : 32)));
    await expect(page.getByRole("heading", { name: "Pedido rápido" })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Veja o tamanho antes de comprar" })).toHaveCount(1);
  }
});

test("every purchase control retains its actual node, focus and calculator state in both resize directions", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const calculator = page.getByRole("region", { name: "Calculadora de preço", exact: true });
  await calculator.getByLabel("Produto", { exact: true }).selectOption("envelope-cinza");
  await calculator.getByLabel("Tamanho", { exact: true }).selectOption("32x40");
  await calculator.getByRole("button", { name: "2.000", exact: true }).click();
  const controls = page.locator(".home-purchase-grid").locator("a, button, select, input");
  const count = await controls.count();
  // Includes material links as well as banner links, both selects and quantity buttons.
  for (let i = 0; i < count; i++) {
    const original = await controls.nth(i).elementHandle();
    await original!.evaluate((el) => (el as HTMLElement).focus());
    for (const width of [1279, 1280, 1279, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => original!.evaluate((el) => el.isConnected && document.activeElement === el)).toBe(true);
      await expect(calculator.getByLabel("Produto", { exact: true })).toHaveValue("envelope-cinza");
      await expect(calculator.getByLabel("Tamanho", { exact: true })).toHaveValue("32x40");
      await expect(calculator.getByRole("button", { name: "2.000", exact: true })).toHaveAttribute("aria-pressed", "true");
    }
  }
  const search = page.getByRole("combobox", { name: "Buscar produtos" });
  await search.focus();
  await page.setViewportSize({ width: 1279, height: 900 });
  await expect(search).toBeFocused();
});

test("Tab follows header then actual purchase module order at desktop and stacked widths", async ({ page }) => {
  for (const width of [390, 1279, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const headerLinks = page.locator("header a, header button, header input");
    const controls = page.locator(".home-purchase-grid a, .home-purchase-grid button, .home-purchase-grid select");
    const visibleHeader = await headerLinks.elementHandles();
    const visibleControls = [];
    for (const el of [...visibleHeader, ...await controls.elementHandles()]) {
      if (await el.isVisible()) visibleControls.push(el);
    }
    for (const el of visibleControls) {
      await page.keyboard.press("Tab");
      expect(await el.evaluate((node) => document.activeElement === node)).toBe(true);
    }
  }
});

test("material anchor, precise links, size guide and quick order remain functional", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Escolher embalagens", exact: true }).click();
  await expect(page).toHaveURL(/#materiais$/);
  const materials = page.getByRole("region", { name: "Escolha o material" });
  const headerBottom = await page.locator("header").evaluate((el) => el.getBoundingClientRect().bottom);
  expect((await materials.boundingBox())!.y).toBeGreaterThanOrEqual(headerBottom);
  expect((await materials.boundingBox())!.y).toBeLessThan(150);
  await expect(materials.getByRole("heading", { level: 3 })).toHaveText(["Envelope", "Envelope COEX", "Envelope Cinza"]);
  await expect(page.getByRole("link", { name: "Pedir orçamento", exact: true })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Pedir orçamento", exact: true })).toHaveAttribute("href", /wa\.me/);
  const guide = page.getByRole("region", { name: "Veja o tamanho antes de comprar" });
  await guide.getByRole("button", { name: "Envelope Cinza", exact: true }).click();
  await guide.getByRole("button", { name: /^32x40 cm, Envelope Cinza/ }).click();
  await expect(guide.getByRole("link", { name: "Comprar este tamanho" })).toHaveAttribute("href", "/produtos?produto=envelope-cinza&q=32x40");
  const quick = page.getByRole("region", { name: "Pedido rápido" });
  await quick.getByRole("button", { name: "Adicionar", exact: true }).first().click();
  await page.goto("/carrinho");
  await expect(page.getByRole("spinbutton", { name: "Quantidade de Envelope COEX - 19x25", exact: true })).toHaveValue("500");
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
    await expect(page.getByRole("region", { name: "Calculadora de preço", exact: true }).getByRole("button", { name: "Adicionar ao carrinho" })).toBeVisible();
  }
});

test("catalog search stays usable after scrolling with the taller mobile header", async ({ page }) => {
  for (const width of [390, 639, 640, 1280]) {
    await page.setViewportSize({ width, height: 450 });
    await page.goto("/produtos");
    const filters = page.getByRole("region", { name: "Filtros do catálogo", exact: true });
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

test("side packing tips only appear where they fit, without horizontal scroll", async ({ page }) => {
  for (const width of [2103, 2104, 2200, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const tips = page.getByRole("complementary", { name: "Dicas de embalagem" });
    if (width >= 2104) {
      await expect(tips).toBeVisible();
      // Both cards sit in the same (left) column, one above the other.
      const [top, bottom] = await tips.locator("img").evaluateAll((imgs) => imgs.map((img) => img.getBoundingClientRect().toJSON()));
      expect(bottom.y).toBeGreaterThan(top.y + top.height);
      expect(Math.abs(bottom.x - top.x)).toBeLessThan(1);
    } else {
      await expect(tips).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
