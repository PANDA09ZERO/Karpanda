import { test, expect } from "@playwright/test";
test("Ventas: recorrido, comprobante ficticio, stock, límite y reinicio", async ({
  page,
}) => {
  await page.goto("/demo/ventas");
  await page.getByRole("button", { name: "Comenzar recorrido" }).click();
  const notebook = page
    .locator(".demo-product")
    .filter({
      has: page.getByRole("heading", { name: "Cuaderno kraft", exact: true }),
    });
  await notebook
    .getByRole("button", { name: "Agregar Cuaderno kraft" })
    .click();
  await notebook
    .getByRole("button", { name: "Agregar Cuaderno kraft" })
    .click();
  await expect(page.locator(".demo-total")).toContainText("S/ 36.00");
  await page
    .getByRole("button", { name: "Revisar venta", exact: true })
    .click();
  await expect(page.locator(".demo-order-lines")).toContainText("2 unidades");
  await page.getByRole("button", { name: "Confirmar venta de prueba" }).click();
  await expect(
    page.getByRole("heading", { name: "Venta de prueba registrada." }),
  ).toBeVisible();
  await expect(page.locator(".demo-receipt")).toContainText("DEMO-001");
  await page.getByRole("button", { name: "Simular otra venta" }).click();
  await expect(notebook).toContainText("Stock: 10");
  const thermos = page.getByRole("button", { name: "Agregar Termo de acero" });
  for (let i = 0; i < 6; i++) await thermos.click();
  await expect(thermos).toBeDisabled();
  await page.getByRole("button", { name: "Reiniciar demo" }).click();
  await expect(notebook).toContainText("Stock: 12");
  await expect(
    page.getByRole("button", { name: "Comenzar recorrido" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".demo-stat-grid article")
      .filter({ hasText: "Ventas simuladas" }),
  ).toContainText("0");
  expect(
    await page.evaluate(() => localStorage.getItem("karpanda:v1:orders")),
  ).toBeNull();
});
test("Reservas: horarios ocupados, confirmación, cancelación y reinicio", async ({
  page,
}) => {
  await page.goto("/demo/reservas");
  await page.getByRole("button", { name: "Comenzar recorrido" }).click();
  await page.getByRole("button", { name: "Ver horarios disponibles" }).click();
  await expect(
    page.getByRole("button", { name: "10:00, ocupado", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "09:00, disponible", exact: true })
    .click();
  await page.getByRole("button", { name: "Revisar reserva" }).click();
  await page
    .getByRole("button", { name: "Confirmar reserva de prueba" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tu reserva ficticia está lista." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Probar otra reserva" }).click();
  await page.getByRole("button", { name: "Ver horarios disponibles" }).click();
  await expect(
    page.getByRole("button", { name: "09:00, ocupado", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Cancelar reserva DEMO-002", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "09:00, disponible", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Reiniciar demo" }).click();
  await expect(page.locator(".demo-booking-list article")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Comenzar recorrido" }),
  ).toBeVisible();
});
test("Demos: rutas y móvil sin desbordamiento y venta desde barra resumida", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/demos", "/demo/ventas", "/demo/reservas"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        path + " " + width,
      ).toBeTruthy();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo/ventas");
  await page.getByRole("button", { name: "Comenzar recorrido" }).click();
  await page.getByRole("button", { name: "Agregar Cuaderno kraft" }).click();
  await expect(page.locator(".demo-mobile-cart")).toBeVisible();
  await page
    .locator(".demo-mobile-cart")
    .getByRole("button", { name: "Revisar venta" })
    .click();
  await page.getByRole("button", { name: "Confirmar venta de prueba" }).click();
  await expect(
    page.getByRole("heading", { name: "Venta de prueba registrada." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/demo-sales-phone.png",
    fullPage: true,
  });
  await page.goto("/demo/reservas");
  await page.getByRole("button", { name: "Comenzar recorrido" }).click();
  await page.getByRole("button", { name: "Ver horarios disponibles" }).click();
  await page.screenshot({
    path: "test-results/demo-booking-phone.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test.describe("Medición propia y datos privados", () => {
  test.use({ baseURL: "http://127.0.0.1:5176" });
  test("solo mide con permiso, no envía datos de formulario y se detiene al rechazar", async ({
    page,
  }) => {
    const events: Record<string, any>[] = [];
    await page.route("https://mock-supabase.test/**", async (r) => {
      if (r.request().url().includes("/functions/v1/kp-traffic")) {
        events.push(r.request().postDataJSON());
        expect(r.request().headers().authorization).toBeUndefined();
        return r.fulfill({ json: { accepted: true }, status: 202 });
      }
      return r.fulfill({ json: [] });
    });
    await page.route("https://www.googletagmanager.com/**", (r) =>
      r.fulfill({ contentType: "text/javascript", body: "" }),
    );
    await page.goto("/demo/ventas?email=private@example.invalid");
    await page.getByRole("button", { name: "Comenzar recorrido" }).click();
    expect(events).toHaveLength(0);
    await page.getByRole("button", { name: "Aceptar medición" }).click();
    await expect
      .poll(() => events.filter((e) => e.event === "page_view").length)
      .toBe(1);
    await page
      .getByLabel("Buscar producto de ejemplo")
      .fill("Dato que no debe medirse");
    await page.getByLabel("Buscar producto de ejemplo").fill("Cuaderno");
    await page.getByRole("button", { name: "Agregar Cuaderno kraft" }).click();
    await page
      .getByRole("button", { name: "Revisar venta", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar venta de prueba" })
      .click();
    await expect
      .poll(() => events.filter((e) => e.event === "demo_complete").length)
      .toBe(1);
    expect(JSON.stringify(events)).not.toContain("private@example");
    expect(JSON.stringify(events)).not.toContain("Dato que");
    expect(JSON.stringify(events)).not.toContain("Cuaderno");
    for (const e of events)
      expect(Object.keys(e).sort()).toEqual([
        "device",
        "event",
        "id",
        "path",
        "session",
        "source",
      ]);
    await page
      .getByRole("button", { name: "Preferencias de medición", exact: true })
      .click();
    await page.getByRole("button", { name: "Solo necesarias" }).click();
    const count = events.length;
    await page.getByRole("button", { name: "Reiniciar demo" }).click();
    await page.getByRole("button", { name: "Comenzar recorrido" }).click();
    expect(events).toHaveLength(count);
  });
  test("panel: muestra las métricas recibidas, cambia periodo y maneja ausencia de datos", async ({
    page,
  }) => {
    const actor = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      expires = Math.floor(Date.now() / 1000) + 3600;
    const user = {
      id: actor,
      email: "qa@example.invalid",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { role: "admin", must_change_password: false },
      user_metadata: { name: "QA" },
      created_at: "2026-01-01T00:00:00Z",
    };
    const token = [
      Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
      Buffer.from(
        JSON.stringify({ sub: actor, exp: expires, role: "authenticated" }),
      ).toString("base64url"),
      "fixture-signature",
    ].join(".");
    await page.addInitScript(
      ({ user, token, expires }) => {
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
      },
      { user, token, expires },
    );
    const report = {
      source: "karpanda",
      started_at: "2026-11-02T12:00:00Z",
      generated_at: "2026-11-02T14:00:00Z",
      days: 30,
      metrics: {
        views: 120,
        sessions: 42,
        starts: 12,
        completions: 8,
        consults: 2,
        recent_sessions: 3,
      },
      series: [
        { day: "2026-11-01", views: 40, sessions: 15 },
        { day: "2026-11-02", views: 80, sessions: 27 },
      ],
      pages: [
        { path: "/", views: 90 },
        { path: "/demo/ventas", views: 30 },
      ],
      sources: [
        { source: "direct", sessions: 20 },
        { source: "search", sessions: 22 },
      ],
      devices: [
        { device: "mobile", sessions: 30 },
        { device: "desktop", sessions: 12 },
      ],
      demos: [
        { path: "/demo/ventas", starts: 12, completions: 8, consults: 2 },
      ],
    };
    await page.route("https://mock-supabase.test/**", async (r) => {
      const path = new URL(r.request().url()).pathname;
      if (path === "/auth/v1/user") return r.fulfill({ json: user });
      if (path.includes("/functions/v1/kp-office")) {
        const body = r.request().postDataJSON();
        if (body.days === 7)
          return r.fulfill({
            json: {
              ...report,
              days: 7,
              metrics: {
                views: 0,
                sessions: 0,
                starts: 0,
                completions: 0,
                consults: 0,
                recent_sessions: 0,
              },
              series: [],
              pages: [],
              sources: [],
              devices: [],
              demos: [],
            },
          });
        return r.fulfill({ json: report });
      }
      return r.fulfill({ json: [] });
    });
    await page.goto("/admin/visitas");
    await expect(
      page
        .locator(".traffic-metrics article")
        .filter({ hasText: "Páginas vistas" }),
    ).toContainText("120");
    await expect(
      page
        .locator(".traffic-metrics article")
        .filter({ hasText: "Sesiones del periodo" }),
    ).toContainText("42");
    await expect(
      page.getByText("Medición propia de Karpanda", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Acceso directo", { exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: "test-results/traffic-dashboard-phone.png",
      fullPage: true,
    });
    await page.getByLabel("Periodo", { exact: true }).selectOption("7");
    await expect(
      page.getByRole("heading", {
        name: "Aquí empieza tu historial de visitas.",
      }),
    ).toBeVisible();
    await expect(
      page.locator(".traffic-metrics article").first(),
    ).toContainText("0");
  });
});
