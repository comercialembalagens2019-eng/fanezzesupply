import { expect, test, type Page } from "@playwright/test";

const fakeUser = {
  id: "00000000-0000-4000-8000-000000000060",
  aud: "authenticated", role: "authenticated", email: "cliente@example.test",
  email_confirmed_at: "2026-10-30T12:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {},
  created_at: "2026-10-30T12:00:00Z",
};
const fakeSession = {
  access_token: "simulated-access-token", refresh_token: "simulated-refresh-token",
  token_type: "bearer", expires_in: 3600, user: fakeUser,
};

// Every Supabase HTTP request is intercepted: no real accounts, carts or payments.
async function mockAuth(page: Page, options: { signupSession?: boolean; admin?: boolean } = {}) {
  const signups: URL[] = [];
  const unexpectedRequests: string[] = [];
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    const url = new URL(route.request().url());
    let json: unknown;
    if (url.pathname === "/auth/v1/signup") {
      signups.push(url);
      json = options.signupSession ? fakeSession : { ...fakeUser, email_confirmed_at: null };
    } else if (url.pathname === "/auth/v1/token") {
      json = fakeSession;
    } else if (url.pathname === "/auth/v1/user") {
      json = fakeUser;
    } else if (url.pathname === "/rest/v1/user_roles") {
      json = options.admin ? { role: "admin" } : null;
    } else if (url.pathname === "/rest/v1/carts") {
      json = route.request().method() === "GET" ? { items: [] } : null;
    } else if (url.pathname.startsWith("/rest/v1/")) {
      json = route.request().headers().accept?.includes("object") ? null : [];
    } else {
      unexpectedRequests.push(url.pathname);
      await route.abort();
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(json) });
  });
  return { signups, unexpectedRequests };
}

async function cartToAuth(page: Page, action: "Criar Conta" | "Fazer Login" = "Criar Conta") {
  await page.goto("/");
  await page.getByRole("button", { name: "Adicionar ao carrinho", exact: true }).click();
  await page.goto("/carrinho");
  await page.getByRole("button", { name: "Finalizar Pedido" }).click();
  await page.getByRole("dialog").getByRole("link", { name: action, exact: true }).click();
}

async function register(page: Page) {
  await page.getByLabel("Nome *", { exact: true }).fill("Cliente Simulado");
  await page.getByLabel("E-mail *", { exact: true }).fill(fakeUser.email);
  await page.getByLabel("Telefone *", { exact: true }).fill("47999999999");
  await page.getByLabel("Senha *", { exact: true }).fill("Simulada123");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
}

async function login(page: Page) {
  await page.getByPlaceholder("seu@email.com").fill(fakeUser.email);
  await page.getByPlaceholder("••••••••").fill("Simulada123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

async function expectCart(page: Page) {
  await expect(page).toHaveURL(/\/carrinho$/);
  await expect(page.getByRole("heading", { name: "Carrinho de Compras" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: /Quantidade de Envelope COEX/ })).toHaveValue("1000");
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("checkout, login and signup retain the cart destination through links and reload", async ({ page }) => {
  await mockAuth(page);
  await cartToAuth(page, "Fazer Login");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcarrinho$/);
  await page.getByRole("link", { name: "Cadastre-se", exact: true }).click();
  await expect(page).toHaveURL(/\/cadastro\?returnTo=%2Fcarrinho$/);
  await page.reload();
  await page.getByRole("link", { name: "Já tem conta? Entrar" }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcarrinho$/);
  await page.reload();
  await login(page);
  await expectCart(page);
});

test("signup with session returns to the cart without reopening checkout", async ({ page }) => {
  const mocked = await mockAuth(page, { signupSession: true });
  await cartToAuth(page);
  await register(page);
  await expectCart(page);
  expect(mocked.unexpectedRequests).toEqual([]);
  expect(mocked.signups[0].searchParams.get("redirect_to")).toBe("http://127.0.0.1:4173/login?returnTo=%2Fcarrinho");
});

for (const confirmation of ["password login", "email link"]) {
  test(`signup without session retains the cart through ${confirmation}`, async ({ page }) => {
    const mocked = await mockAuth(page);
    await cartToAuth(page);
    await register(page);
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fcarrinho$/);
    await expect(page.getByText("Confirme seu e-mail", { exact: true }).first()).toBeVisible();
    const redirect = mocked.signups[0].searchParams.get("redirect_to");
    expect(redirect).toBe("http://127.0.0.1:4173/login?returnTo=%2Fcarrinho");
    if (confirmation === "password login") {
      await page.reload();
      await login(page);
    } else {
      // Simulate the same-browser redirect from Supabase after email verification.
      // Leave the app first, like following a link from the email provider.
      await page.goto("about:blank");
      await page.goto(`${redirect}#${new URLSearchParams({
        access_token: fakeSession.access_token, refresh_token: fakeSession.refresh_token,
        token_type: "bearer", expires_in: "3600", type: "signup",
      })}`);
    }
    await expectCart(page);
    expect(mocked.unexpectedRequests).toEqual([]);
  });
}

test("products is an allowed signup and login destination", async ({ page }) => {
  await mockAuth(page);
  await page.goto("/cadastro?returnTo=%2Fprodutos");
  await page.getByRole("link", { name: "Já tem conta? Entrar" }).click();
  await page.reload();
  await login(page);
  await expect(page).toHaveURL(/\/produtos$/);
});

test("invalid returnTo is dropped from auth links and email confirmation", async ({ page }) => {
  const mocked = await mockAuth(page);
  for (const destination of ["https://example.test", "//example.test", "/\\example.test", "/admin", "/carrinho?x=1"]) {
    await page.goto(`/login?${new URLSearchParams({ returnTo: destination })}`);
    await expect(page.getByRole("link", { name: "Cadastre-se", exact: true })).toHaveAttribute("href", "/cadastro");
    await page.goto(`/cadastro?${new URLSearchParams({ returnTo: destination })}`);
    await expect(page.getByRole("link", { name: "Já tem conta? Entrar" })).toHaveAttribute("href", "/login");
  }
  await register(page);
  await expect(page).toHaveURL(/\/login$/);
  expect(mocked.signups[0].searchParams.get("redirect_to")).toBe("http://127.0.0.1:4173/login");
  await page.goto("/login?returnTo=https%3A%2F%2Fexample.test");
  await login(page);
  await expect(page).toHaveURL("http://127.0.0.1:4173/");
});

test("admin without explicit destination keeps the admin landing page", async ({ page }) => {
  await mockAuth(page, { admin: true });
  await page.goto("/login");
  await login(page);
  await expect(page).toHaveURL(/\/admin$/);
});

test("explicit cart destination takes precedence over admin landing page", async ({ page }) => {
  await mockAuth(page, { admin: true });
  await cartToAuth(page, "Fazer Login");
  await login(page);
  await expectCart(page);
});
