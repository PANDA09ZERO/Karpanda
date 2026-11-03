import { test, expect } from "@playwright/test";
test("Gestión: cliente, proyecto, tarea, reportes y reinicio conectados", async ({
  page,
}) => {
  await page.goto("/demos");
  await page.getByRole("link", { name: "Probar Gestión", exact: true }).click();
  await page.getByRole("button", { name: "Comenzar recorrido" }).click();
  await page
    .getByRole("button", { name: "Agregar cliente", exact: true })
    .click();
  await page.getByLabel("Nombre ficticio del cliente").fill("Negocio Cometa");
  await page
    .getByRole("button", { name: "Guardar cliente", exact: true })
    .click();
  const nav = page.getByRole("navigation", {
    name: "Menú del sistema de demostración",
  });
  await nav
    .getByRole("button", { name: "Proyectos y tareas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nuevo proyecto", exact: true })
    .click();
  await page
    .getByLabel("Nombre del proyecto", { exact: true })
    .fill("Proyecto Cometa");
  await page
    .getByLabel("Cliente del formulario", { exact: true })
    .selectOption("3");
  await page
    .getByRole("button", { name: "Crear proyecto", exact: true })
    .click();
  const project = page
    .locator(".management-project")
    .filter({ hasText: "Proyecto Cometa" });
  await project.locator("summary").click();
  await project
    .getByRole("combobox", {
      name: "Estado de Preparar propuesta inicial en Proyecto Cometa",
    })
    .selectOption("done");
  await expect(project).toContainText("100% completado");
  await expect(
    page.getByText("Recorrido de gestión completado", { exact: true }),
  ).toBeVisible();
  await project
    .getByRole("button", { name: "Agregar tarea", exact: true })
    .click();
  await page
    .getByLabel("Nombre de la tarea", { exact: true })
    .fill("Preparar entrega");
  await page
    .getByRole("button", { name: "Guardar tarea", exact: true })
    .click();
  await expect(project).toContainText("50% completado");
  await project.getByRole("button", { name: "Pausar proyecto" }).click();
  await expect(project.getByRole("combobox").first()).toBeDisabled();
  await project.getByRole("button", { name: "Reanudar proyecto" }).click();
  await nav.getByRole("button", { name: "Reportes", exact: true }).click();
  await page
    .getByLabel("Cliente del proyecto", { exact: true })
    .selectOption("3");
  await expect(page.locator(".management-project")).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar reporte" }).click();
  expect((await download).suggestedFilename()).toBe("reporte-demo-gestion.txt");
  await page.getByRole("button", { name: "Reiniciar demo" }).click();
  await nav.getByRole("button", { name: "Clientes", exact: true }).click();
  await expect(page.locator(".management-client")).toHaveCount(2);
});
test("Gestión: módulos y formularios en teléfonos y escritorio", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/demo/gestion");
    const nav = page.getByRole("navigation", {
      name: "Menú del sistema de demostración",
    });
    for (const name of [
      "Dashboard",
      "Clientes",
      "Proyectos y tareas",
      "Reportes",
    ]) {
      await nav.getByRole("button", { name, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
    await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
    await page.locator(".ds-guide > summary").click();
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `test-results/management-${width}.png`,
        fullPage: true,
      });
  }
  expect(errors).toEqual([]);
});

test("Educación: producto administrable, cotización y demo editable", async ({
  page,
}) => {
  await page.goto("/admin/productos/44444444-4444-4444-8444-444444444444");
  await expect(
    page.getByRole("heading", { name: "Karpanda Educación", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".office-detail-grid")).toContainText(
    "Por cotizar",
  );
  await page
    .getByRole("button", { name: "Editar producto", exact: true })
    .click();
  await page.locator('select[name="demo_path"]').selectOption("/demo/gestion");
  await page
    .getByRole("button", { name: "Guardar producto", exact: true })
    .click();
  await page.goto("/producto/educacion");
  await expect(page.locator(".plan")).toContainText("Por cotizar");
  await expect(
    page.getByRole("link", { name: "Consultar implementación", exact: true }),
  ).toBeVisible();
  await page.goto("/compra/educacion");
  await expect(page).toHaveURL(/\/producto\/educacion$/);
  await expect(
    page.getByRole("link", { name: "Probar una demo interactiva" }),
  ).toHaveAttribute("href", "/demo/gestion");
});
