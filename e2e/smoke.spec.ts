import { expect, test } from "@playwright/test";

// Uncaught exceptions on any page fail the test.
test.beforeEach(({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});

test("home shows the logo, price calculator and products", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "FNZ Supply — início" }).first()).toBeVisible();
  await expect(page.getByText("Calculadora de preço")).toBeVisible();
  await expect(page.getByText("Envelope COEX", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/stretch/i)).toHaveCount(0);
});

test("products page lists the envelopes", async ({ page }) => {
  await page.goto("/produtos");
  await expect(page.getByRole("heading", { name: "Nossos produtos" })).toBeVisible();
  await expect(page.getByText("Envelope Cinza").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Produto teste (admin)")).toHaveCount(0);
});

test("calculator adds to the cart", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await page.goto("/carrinho");
  await expect(page.getByText(/Envelope COEX/).filter({ visible: true }).first()).toBeVisible();
});

test("login form is in Portuguese with a single password toggle", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar na sua conta" })).toBeVisible();
  await expect(page.getByRole("button", { name: /mostrar senha/i })).toHaveCount(1);
});

test("legal pages show the company details", async ({ page }) => {
  await page.goto("/termos");
  await expect(page.getByText("56.008.033/0001-32").first()).toBeVisible();
});

test("unknown routes show the Portuguese 404", async ({ page }) => {
  await page.goto("/nao-existe");
  await expect(page.getByText(/não encontrada/i).first()).toBeVisible();
});
