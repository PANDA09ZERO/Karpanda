import { test, expect } from "@playwright/test";

test("sistema de ventas: dashboard, inventario y comprobante comparten los cambios", async ({
  page,
}) => {
  await page.goto("/demo/ventas");
  const nav = page.getByRole("navigation", {
    name: "Menú del sistema de demostración",
  });
  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeVisible();
  await expect(page.locator(".ds-guide")).toContainText("Elige productos");
  await nav.getByRole("button", { name: "Inventario", exact: true }).click();
  const product = page
    .locator(".ds-product-detail")
    .filter({ hasText: "Cuaderno kraft" });
  await product.locator("summary").click();
  await expect(product).toContainText("12 unidades");
  await nav.getByRole("button", { name: "Punto de venta" }).click();
  await page.getByRole("button", { name: "Agregar Cuaderno kraft" }).click();
  await page
    .getByRole("button", { name: "Revisar venta", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar venta de prueba" }).click();
  await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.locator(".ds-activity")).toContainText("Venta DEMO-001");
  await expect(page.locator(".demo-stat-grid")).toContainText("S/ 18.00");
  await nav.getByRole("button", { name: "Inventario", exact: true }).click();
  await product.locator("summary").click();
  await expect(product).toContainText("11 unidades");
  await nav.getByRole("button", { name: "Ventas", exact: true }).click();
  await page.locator(".ds-sale-detail summary").click();
  await expect(page.locator(".ds-sale-detail")).toContainText(
    "1 × Cuaderno kraft",
  );
  await page.getByRole("button", { name: "Reiniciar demo" }).click();
  await expect(page.locator(".ds-activity")).toContainText(
    "Tu primera venta empieza aquí",
  );
});

test("sistema de reservas: servicios, agenda, detalles y dashboard actualizados", async ({
  page,
}) => {
  await page.goto("/demo/reservas");
  const nav = page.getByRole("navigation", {
    name: "Menú del sistema de demostración",
  });
  await nav.getByRole("button", { name: "Servicios y equipo" }).click();
  await page
    .getByRole("button", { name: "Reservar este servicio" })
    .nth(1)
    .click();
  await expect(
    page.getByRole("button", { name: /Diagnóstico de negocio/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Ver horarios disponibles" }).click();
  await page
    .getByRole("button", { name: "09:00, disponible", exact: true })
    .click();
  await page.getByRole("button", { name: "Revisar reserva" }).click();
  await page
    .getByRole("button", { name: "Confirmar reserva de prueba" })
    .click();
  await nav.getByRole("button", { name: "Agenda", exact: true }).click();
  const appointment = page
    .locator(".ds-record-grid > article")
    .filter({ hasText: "Diagnóstico de negocio" });
  await appointment.locator("summary").click();
  await expect(appointment).toContainText("DEMO-002");
  await expect(appointment).toContainText("30 minutos");
  await appointment
    .getByRole("button", { name: "Cancelar cita DEMO-002" })
    .click();
  await expect(appointment).toContainText("Cancelada");
  await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.locator(".ds-timeline button")).toHaveCount(1);
});

test("sistemas: menús, vistas y tarjetas en móvil y escritorio", async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const kind of ["ventas", "reservas"]) {
      await page.goto(`/demo/${kind}`);
      const nav = page.getByRole("navigation", {
        name: "Menú del sistema de demostración",
      });
      for (const label of kind === "ventas"
        ? ["Dashboard", "Inventario", "Ventas"]
        : ["Dashboard", "Agenda", "Servicios y equipo"]) {
        await nav.getByRole("button", { name: label, exact: true }).click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${kind} ${label} ${width}`,
        ).toBeTruthy();
      }
      await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
      if (width === 390 || width === 1440) {
        await page.locator(".ds-guide > summary").click();
        await page.screenshot({
          path: `test-results/system-${kind}-${width}.png`,
          fullPage: true,
        });
      }
      if (width === 390) {
        const box = await nav.boundingBox();
        expect(box!.y + box!.height).toBeLessThanOrEqual(845);
        expect(box!.y).toBeGreaterThan(700);
      }
    }
  }
});
