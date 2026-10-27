import { test, expect } from "@playwright/test";
const client = "b1111111-1111-4111-8111-111111111111";
const order = "d1111111-1111-4111-8111-111111111111";
const license = "e1111111-1111-4111-8111-111111111111";
const ticket = "f1111111-1111-4111-8111-111111111111";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ client, order, license, ticket }) => {
      if (sessionStorage.getItem("office-fixture")) return;
      const created_at = new Date().toISOString();
      const save = (key: string, value: unknown) =>
        localStorage.setItem(`karpanda:v1:${key}`, JSON.stringify(value));
      save("users", [
        {
          id: client,
          name: "Empresa de prueba",
          email: "cliente@example.invalid",
          role: "customer",
          active: true,
          company: "Empresa QA",
          created_at,
        },
      ]);
      save("orders", [
        {
          id: order,
          user_id: client,
          product_id: "11111111-1111-4111-8111-111111111111",
          product_name: "Karpanda Ventas",
          amount: 199,
          status: "pending",
          created_at,
        },
      ]);
      save("licenses", [
        {
          id: license,
          user_id: client,
          product_id: "11111111-1111-4111-8111-111111111111",
          product_name: "Karpanda Ventas",
          plan_name: "Empresa",
          status: "active",
          user_limit: 5,
          activation_limit: 1,
          expires_at: new Date(Date.now() + 10 * 86400000).toISOString(),
          created_at,
        },
      ]);
      save("tickets", [
        {
          id: ticket,
          user_id: client,
          subject: "Consulta de configuración",
          message: "Necesito ayuda con la configuración inicial.",
          status: "open",
          priority: "high",
          created_at,
          updated_at: created_at,
        },
      ]);
      sessionStorage.setItem("office-fixture", "true");
    },
    { client, order, license, ticket },
  );
});
test("fichas enlazan cliente, pedidos y licencias; operaciones conservan estados", async ({
  page,
}) => {
  await page.goto(`/admin/clientes/${client}`);
  await expect(
    page.getByRole("heading", { name: "Empresa de prueba", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Karpanda Ventas/ })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(order));
  await page
    .getByRole("button", { name: "Registrar pago recibido", exact: true })
    .click();
  await page.getByLabel("Referencia del pago externo").fill("DEMO-ONLY-123");
  await page.getByLabel("Confirmo que el pago ya fue recibido").check();
  await page
    .getByLabel("Motivo / nota interna")
    .fill("Operación de demostración");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.locator(".office-heading .state-pill")).toHaveText(
    "Pagado",
  );
  await expect(
    page.getByRole("heading", { name: "Licencias relacionadas" }),
  ).toBeVisible();
  await page.goto(`/admin/licencias/${license}`);
  await page.getByRole("button", { name: "Suspender", exact: true }).click();
  await page
    .getByLabel("Motivo / nota interna")
    .fill("Suspensión de demostración");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.locator(".office-heading .state-pill")).toHaveText(
    "Suspendida",
  );
  await page.reload();
  await expect(page.locator(".office-heading .state-pill")).toHaveText(
    "Suspendida",
  );
});
test("soporte mantiene conversación, prioridad y resolución", async ({
  page,
}) => {
  await page.goto(`/admin/soporte/${ticket}`);
  await page
    .getByLabel("Respuesta")
    .fill("Ya estamos revisando tu configuración.");
  await page.getByRole("button", { name: "Enviar respuesta" }).click();
  await expect(
    page.getByText("Ya estamos revisando tu configuración.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Marcar resuelto" }).click();
  await page
    .getByLabel("Motivo / nota interna")
    .fill("Configuración verificada");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.locator(".office-heading .state-pill")).toHaveText(
    "Resuelto",
  );
  await page.getByRole("button", { name: "Reabrir solicitud" }).click();
  await page
    .getByLabel("Motivo / nota interna")
    .fill("Nueva consulta del cliente");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.locator(".office-heading .state-pill")).toHaveText(
    "Abierto",
  );
});
test("móvil: cada registro tiene su tarjeta y los detalles no desbordan", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/admin/pedidos",
    "/admin/licencias",
    "/admin/soporte",
    "/admin/usuarios",
    "/admin/clientes",
    "/admin/productos",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.locator(".mobile-records .record-card").first(),
    ).toBeVisible();
    await expect(page.locator(".desktop-records")).not.toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      "/admin",
      `/admin/clientes/${client}`,
      `/admin/licencias/${license}`,
      `/admin/pedidos/${order}`,
      `/admin/soporte/${ticket}`,
    ]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} at ${width}`,
      ).toBeTruthy();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  await expect(page.getByText("Ingresos netos registrados")).toBeVisible();
  await page.screenshot({
    path: "test-results/bento-dashboard-mobile.png",
    fullPage: true,
  });
  await page.goto("/admin/licencias");
  await page.screenshot({
    path: "test-results/bento-licenses-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
