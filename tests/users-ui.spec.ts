import { test, expect, type Page } from "@playwright/test";
test.use({ baseURL: "http://127.0.0.1:5176" });

async function mockAccount(page: Page, temporary: boolean) {
  const user = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    aud: "authenticated",
    role: "authenticated",
    email: "qa@example.invalid",
    user_metadata: { name: "QA" },
    app_metadata: {
      role: temporary ? "pending_admin" : "admin",
      must_change_password: temporary,
    },
    created_at: "2026-01-01T00:00:00Z",
  };
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const token = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(
      JSON.stringify({ sub: user.id, exp: expires, role: "authenticated" }),
    ).toString("base64url"),
    "test-signature",
  ].join(".");
  await page.addInitScript(
    ({ user, token, expires }) => {
      if (!sessionStorage.getItem("mock-initialized")) {
        localStorage.setItem(
          "sb-mock-supabase-auth-token",
          JSON.stringify({
            access_token: token,
            refresh_token: "fixture-refresh",
            expires_in: 3600,
            expires_at: expires,
            token_type: "bearer",
            user,
          }),
        );
        sessionStorage.setItem("mock-initialized", "true");
      }
    },
    { user, token, expires },
  );
  await page.route("https://mock-supabase.test/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes("/rest/v1/kp_products"))
      return route.fulfill({ json: [] });
    if (path === "/auth/v1/user") return route.fulfill({ json: user });
    if (path === "/auth/v1/logout") return route.fulfill({ status: 204 });
    if (path.includes("/functions/v1/kp-accounts")) {
      const body = route.request().postDataJSON();
      if (body.action === "list")
        return route.fulfill({
          json: {
            users: [
              {
                ...user,
                name: "QA",
                role: "admin",
                must_change_password: false,
              },
              {
                ...user,
                id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                name: "Otro usuario",
                email: "otro@example.invalid",
                role: "admin",
                must_change_password: true,
              },
            ],
            nextPage: null,
          },
        });
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({
      status: 500,
      json: { error: "Unexpected mock request" },
    });
  });
}

test("cuenta temporal: cambio obligatorio, confirmación y cierre de sesión", async ({
  page,
}) => {
  await mockAccount(page, true);
  await page.goto("/admin");
  await expect(page).toHaveURL(/cambiar-contrasena/);
  await expect(
    page.getByRole("heading", { name: "Reemplaza tu contraseña temporal" }),
  ).toBeVisible();
  await page
    .getByLabel("Contraseña actual", { exact: true })
    .fill("Current-Example!1");
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("New-Example!22");
  await page
    .getByLabel("Confirmar nueva contraseña", { exact: true })
    .fill("Different-Example!22");
  await page.getByRole("button", { name: "Guardar nueva contraseña" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Las contraseñas nuevas no coinciden.",
  );
  await page
    .getByLabel("Confirmar nueva contraseña", { exact: true })
    .fill("New-Example!22");
  await page.getByRole("button", { name: "Guardar nueva contraseña" }).click();
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sb-mock-supabase-auth-token"),
    ),
  ).toBeNull();
});

test("contraseña personal: no repite cambio inicial y muestra gestión de usuarios", async ({
  page,
}) => {
  await mockAccount(page, false);
  await page.goto("/cambiar-contrasena");
  await expect(page).toHaveURL(/admin\/usuarios/);
  await expect(
    page.getByRole("heading", { name: "Gestión de usuarios" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "qa@example.invalid", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "otro@example.invalid", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cambiar mi contraseña" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /contraseña.*otro/i }),
  ).toHaveCount(0);
});
