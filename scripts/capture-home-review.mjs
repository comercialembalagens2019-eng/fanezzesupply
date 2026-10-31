import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Run against the production preview: node scripts/capture-home-review.mjs before|prototype|after
const phase = process.argv[2];
if (!["before", "prototype", "after"].includes(phase)) throw new Error("Use before, prototype or after");
const output = `docs/reviews/home-2026-10-30/${phase}`;
const baseUrl = process.env.HOME_REVIEW_URL ?? "http://127.0.0.1:4173";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PW_EXECUTABLE_PATH,
});
const page = await browser.newPage({ reducedMotion: "reduce" });
const user = { id: "00000000-0000-4000-8000-000000000062", aud: "authenticated", role: "authenticated", email: "visual@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-30T12:00:00Z" };
await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => {
  const path = new URL(route.request().url()).pathname;
  const response = path === "/auth/v1/token"
    ? { access_token: "simulated-visual-token", refresh_token: "simulated-refresh", token_type: "bearer", expires_in: 3600, user }
    : path === "/rest/v1/carts" ? { items: [] } : null;
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
});
const measurements = [];
async function capture(path, name, width, fullPage = true) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${baseUrl}${path}`);
  if (path === "/pedidos" && !name.includes("auth")) await page.waitForURL(/\/login/);
  await page.getByRole("heading").first().waitFor({ state: "visible" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll("img").forEach((img) => { img.loading = "eager"; });
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
  });
  const measure = await page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const { x, y, width, height } = el.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      viewport: innerWidth, pageWidth: document.documentElement.scrollWidth,
      header: rect("header .container-custom"), logo: rect('header a[aria-label="FNZ Supply — início"]'),
      footer: rect("footer .container-custom"),
      main: rect("main .container-wide, main .container-custom, form:not([role='search'])"),
      calculator: rect('[aria-label="Calculadora de preço"]'),
    };
  });
  measurements.push({ path, name, ...measure });
  await page.screenshot({ path: `${output}/${name}.png`, fullPage });
}
try {
  const widths = phase === "prototype" ? [1024, 1279, 1280, 1920] : [320, 390, 768, 1024, 1279, 1280, 1440, 1920];
  for (const width of widths) {
    await capture("/", `home-${width}-fold`, width, false);
    if (phase !== "prototype") await page.screenshot({ path: `${output}/home-${width}-full.png`, fullPage: true });
    if (phase === "after" && [1024, 1279].includes(width)) {
      await page.getByRole("region", { name: "Calculadora de preço", exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/home-${width}-calculator.png` });
    }
  }
  if (phase !== "prototype") {
    for (const path of ["/produtos", "/sobre", "/contato", "/pedidos", "/carrinho", "/login", "/cadastro", "/termos", "/privacidade"]) {
      await capture(path, `${path.slice(1)}-1920`, 1920);
    }
    await page.goto(baseUrl);
    await page.getByRole("button", { name: "Adicionar ao carrinho", exact: true }).click();
    await capture("/carrinho", "carrinho-filled-1920", 1920);
    await page.goto(`${baseUrl}/login`);
    await page.getByPlaceholder("seu@email.com").fill(user.email);
    await page.getByPlaceholder("••••••••").fill("Simulada123");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL(`${baseUrl}/`);
    await capture("/", "home-auth-1920", 1920, false);
    await capture("/", "home-auth-390", 390, false);
    await capture("/pedidos", "pedidos-auth-1920", 1920);
  }
  await writeFile(`${output}/measurements.json`, JSON.stringify(measurements, null, 2) + "\n");
  if (phase === "after") {
    const before = JSON.parse(await readFile("docs/reviews/home-2026-10-30/before/measurements.json", "utf8"));
    const comparison = measurements.map((current) => {
      const previous = before.find((entry) => entry.name === current.name);
      const equal = (key) => JSON.stringify(previous?.[key] && { x: previous[key].x, width: previous[key].width })
        === JSON.stringify(current[key] && { x: current[key].x, width: current[key].width });
      return {
        name: current.name, viewport: current.viewport, pageWidth: current.pageWidth,
        headerWidthPreserved: equal("header"), logoPositionPreserved: equal("logo"), footerWidthPreserved: equal("footer"),
        mainWidthBefore: previous?.main?.width ?? null, mainWidthAfter: current.main?.width ?? null,
        calculatorWidth: current.calculator?.width ?? null,
      };
    });
    await writeFile("docs/reviews/home-2026-10-30/comparison.json", JSON.stringify(comparison, null, 2) + "\n");
  }
  console.log(`${measurements.length} captures saved to ${output}`);
} finally {
  await browser.close();
}
