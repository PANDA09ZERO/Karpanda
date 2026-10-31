import { test, expect } from "@playwright/test";
test("página pública: catálogo filtrado, preguntas y resumen de proyecto", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(page.locator(".service-idea")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Citas y servicios", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText(
    "Karpanda Reservas",
  );
  await page.getByRole("button", { name: "Todas", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page
    .locator(".faq-list summary")
    .filter({ hasText: "¿Necesito saber de tecnología para empezar?" })
    .click();
  await expect(page.locator("details[open]")).toContainText(
    "Puedes comenzar contándonos",
  );
  await page
    .getByRole("link", { name: "Explorar servicios", exact: true })
    .click();
  await expect(page).toHaveURL(/\/servicios/);
  await page
    .getByLabel("¿Qué te gustaría construir?")
    .selectOption("automatizacion");
  await page
    .getByLabel("¿Qué quieres conseguir?")
    .fill("Conectar pedidos y reportes");
  await page
    .getByLabel("¿Cómo lo resuelves hoy?")
    .fill("Uso dos hojas de cálculo");
  await page.getByRole("button", { name: "Copiar resumen" }).click();
  await expect(
    page.getByRole("button", { name: "Resumen copiado" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "Conectar pedidos y reportes",
  );
  await page.getByRole("link", { name: "Abrir soporte y pegar" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("público: móvil, tablet y escritorio sin desbordamiento", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/servicios", "/servicios#preparar-consulta"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width} ${path}`,
      ).toBeTruthy();
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/public-home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".why-illustration img").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/public-home-mobile.png",
    fullPage: true,
  });
  await page.goto("/servicios");
  await page.screenshot({
    path: "test-results/public-services-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("sin ID: no carga Google aunque exista una preferencia anterior", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "karpanda:analytics-consent:v1",
      JSON.stringify({ choice: "accepted", at: Date.now() }),
    ),
  );
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(3);
  await expect(page.locator("#karpanda-ga4")).toHaveCount(0);
  await expect(page.getByLabel("Preferencias de medición")).toHaveCount(0);
});
test.describe("Analytics con ID de prueba aislado", () => {
  test.use({ baseURL: "http://127.0.0.1:5176" });
  test.beforeEach(async ({ page }) => {
    await page.route("https://mock-supabase.test/**", (r) =>
      r.fulfill({ json: [] }),
    );
    await page.route("https://www.googletagmanager.com/**", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: "/* isolated test: no Google requests */",
      }),
    );
  });
  test("consentimiento, SPA sin duplicados, privacidad y retirada", async ({
    page,
    context,
  }) => {
    await page.goto("/?email=privado@example.invalid");
    await expect(
      page.getByRole("button", { name: "Aceptar medición" }),
    ).toBeVisible();
    await expect(page.locator("#karpanda-ga4")).toHaveCount(0);
    await page.getByRole("button", { name: "Solo necesarias" }).click();
    await expect(page.locator("#karpanda-ga4")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Preferencias de medición", exact: true })
      .click();
    await page.getByRole("button", { name: "Aceptar medición" }).click();
    await expect(page.locator("#karpanda-ga4")).toHaveCount(1);
    const views = () =>
      page.evaluate(() =>
        ((window as any).dataLayer || [])
          .map((x: any) => Array.from(x))
          .filter((x: any) => x[0] === "event" && x[1] === "page_view"),
      );
    await expect.poll(async () => (await views()).length).toBe(1);
    expect(JSON.stringify(await views())).not.toContain("privado");
    await page
      .locator("nav#main-nav")
      .getByRole("link", { name: "Servicios", exact: true })
      .click();
    await expect.poll(async () => (await views()).length).toBe(2);
    await page
      .locator("nav#main-nav")
      .getByRole("link", { name: "Mi cuenta", exact: true })
      .click();
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    expect((await views()).length).toBe(2);
    expect(
      await page.evaluate(() => (window as any)["ga-disable-G-TEST123456"]),
    ).toBe(true);
    await page
      .locator("nav#main-nav")
      .getByRole("link", { name: "Servicios", exact: true })
      .click();
    await expect.poll(async () => (await views()).length).toBe(3);
    await context.addCookies([
      { name: "_ga", value: "fixture", url: "http://127.0.0.1:5176" },
    ]);
    await page
      .getByRole("button", { name: "Preferencias de medición", exact: true })
      .click();
    await page.getByRole("button", { name: "Solo necesarias" }).click();
    expect((await context.cookies()).some((c) => c.name === "_ga")).toBe(false);
    await page
      .locator("nav#main-nav")
      .getByRole("link", { name: "Inicio", exact: true })
      .click();
    expect((await views()).length).toBe(3);
  });
  test("preferencia aceptada persistente: una única visita al recargar", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "karpanda:analytics-consent:v1",
        JSON.stringify({ choice: "accepted", at: Date.now() }),
      ),
    );
    await page.goto("/servicios");
    await expect(page.locator("#karpanda-ga4")).toHaveCount(1);
    const count = () =>
      page.evaluate(
        () =>
          ((window as any).dataLayer || []).filter(
            (x: any) => x[0] === "event" && x[1] === "page_view",
          ).length,
      );
    await expect.poll(count).toBe(1);
    await page.reload();
    await expect.poll(count).toBe(1);
  });
});
