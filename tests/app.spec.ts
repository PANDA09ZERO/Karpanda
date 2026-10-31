import { test, expect } from "@playwright/test";
test("catálogo → producto → compra → pedidos → licencia persistente", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Tu próximo paso, más simple." }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page.screenshot({
    path: "test-results/catalogo-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Ver software" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Karpanda Ventas", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Elegir este plan" }).click();
  await page.getByLabel("Nombre o razón social").fill("Empresa de prueba");
  await page.getByLabel("Correo de acceso").fill("prueba@example.com");
  await page.getByRole("button", { name: "Simular compra" }).click();
  await expect(
    page.locator(".record-card").filter({ hasText: "Simulado" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Mi software", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Abrir mi software" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Karpanda Ventas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir mi software" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "software adquirido" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/cliente-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("administración guarda edición y publica productos en el catálogo", async ({
  page,
}) => {
  await page.goto("/admin/productos");
  await page.locator(".record-main-link").first().click();
  await page.getByRole("button", { name: "Editar producto" }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Karpanda Ventas Pro");
  await page.getByLabel("Precio mensual en soles").fill("210");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByText("S/ 210.00", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Retirar Karpanda Ventas Pro" })
    .click();
  await expect(
    page.getByRole("button", { name: "Publicar Karpanda Ventas Pro" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Volver a la tienda" }).click();
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page.goto("/admin");
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
});
test("soporte guarda y vuelve a mostrar la solicitud", async ({ page }) => {
  await page.goto("/cuenta/soporte");
  await page.getByRole("button", { name: "Nueva solicitud" }).click();
  await page.getByLabel("Asunto").fill("Consulta sobre inventario");
  await page
    .getByLabel("Tu mensaje")
    .fill("Necesito ayuda para configurar mi inventario inicial.");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(
    page.getByRole("heading", { name: "Consulta sobre inventario" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Consulta sobre inventario" }),
  ).toBeVisible();
});
test("móvil: imágenes visibles, menú y pantallas sin desbordamiento", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(3);
  for (const img of await page.locator("img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        img.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
        ),
      )
      .toBeTruthy();
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/catalogo-movil.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("link", { name: "Mi cuenta", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Hola, tu próximo paso empieza aquí." }),
  ).toBeVisible();
  for (const path of [
    "/",
    "/producto/ventas",
    "/compra/ventas",
    "/cuenta",
    "/admin",
    "/soporte",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
});
test("enlaces directos y recursos locales funcionan", async ({ page }) => {
  for (const path of [
    "/producto/reservas",
    "/como-funciona",
    "/terminos",
    "/cuenta/descargas",
    "/no-existe",
  ]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  const response = await page.request.get("/assets/karpanda-pandas.png");
  expect(response.ok()).toBeTruthy();
  expect((await response.body()).length).toBeGreaterThan(10000);
});
