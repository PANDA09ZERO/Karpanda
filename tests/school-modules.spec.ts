import { test, expect, type Page } from "@playwright/test";
async function module(page: Page, label: string) {
  const nav = page.getByRole("navigation", {
    name: "Menú del sistema de demostración",
  });
  await nav.waitFor();
  const target = nav.getByRole("button", { name: label, exact: true });
  if (await target.isVisible()) await target.click();
  else {
    await nav.getByRole("button", { name: "Más módulos del colegio" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: label, exact: true })
      .click();
  }
}

test("colegio: matrícula genera cargo, pagos parciales, cancelación y reinicio", async ({
  page,
}) => {
  await page.goto("/demo/educacion");
  await module(page, "Alumnos");
  await page.getByRole("button", { name: "Agregar alumno de ejemplo" }).click();
  await page.getByLabel("Alias ficticio").fill("Alumno Cometa");
  await page
    .getByRole("button", { name: "Guardar alumno", exact: true })
    .click();
  await module(page, "Matrículas");
  await page
    .getByRole("button", { name: "Nueva matrícula", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Guardar matrícula de ejemplo" })
    .click();
  await expect(page.locator(".edu-school-module")).toContainText(
    "Alumno Cometa",
  );
  await module(page, "Pagos");
  const bill = page.locator(".edu-bill").filter({ hasText: "Alumno Cometa" });
  await expect(bill).toContainText("S/ 200.00");
  await bill.getByRole("button", { name: /Registrar pago/ }).click();
  await page.getByLabel("Importe simulado (S/)", { exact: true }).fill("250");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Guardar pago de ejemplo" })
    .click();
  await expect(page.getByRole("alert")).toContainText("no superar");
  await page.getByLabel("Importe simulado (S/)", { exact: true }).fill("80");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Guardar pago de ejemplo" })
    .click();
  await expect(bill).toContainText("Pago parcial");
  await expect(bill.locator(".ds-price")).toHaveText("S/ 120.00");
  await bill.getByRole("button", { name: /Registrar pago/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Guardar pago de ejemplo" })
    .click();
  await expect(bill).toContainText("Pagado");
  await expect(
    bill.getByRole("button", { name: /Registrar pago/ }),
  ).toHaveCount(0);
  await module(page, "Dashboard");
  await expect(page.locator(".edu-office-kpis")).toContainText("S/ 550.00");
  await module(page, "Matrículas");
  const registration = page
    .locator(".edu-school-module .ds-card")
    .filter({ hasText: "Alumno Cometa" });
  await registration.locator("summary").click();
  await registration
    .getByRole("button", { name: /Cancelar matrícula/ })
    .click();
  await expect(registration).toContainText("Cancelada");
  await page.getByRole("button", { name: "Reiniciar demo" }).click();
  await module(page, "Pagos");
  await expect(
    page.locator(".edu-bill").filter({ hasText: "Alumno Cometa" }),
  ).toHaveCount(0);
});

test("colegio: horarios detectan cruces y profesores mantienen sus asignaciones", async ({
  page,
}) => {
  await page.goto("/demo/educacion");
  await module(page, "Cursos y horarios");
  await page
    .getByRole("button", { name: "Agregar horario", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Aula de ejemplo").fill("Aula C");
  await dialog
    .getByRole("button", { name: "Guardar horario de ejemplo" })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("se cruza");
  await dialog.getByLabel("Hora inicial", { exact: true }).fill("11:00");
  await dialog.getByLabel("Hora final", { exact: true }).fill("12:00");
  await dialog
    .getByRole("button", { name: "Guardar horario de ejemplo" })
    .click();
  await expect(page.locator(".edu-schedule-list > article")).toHaveCount(4);
  await module(page, "Profesores y familias");
  await page
    .getByRole("button", { name: "Agregar profesor", exact: true })
    .click();
  await page
    .getByLabel("Alias de ejemplo", { exact: true })
    .fill("Profesora Estrella");
  await dialog
    .getByRole("button", { name: "Guardar registro de ejemplo" })
    .click();
  const teacher = page
    .locator(".edu-school-module .ds-card")
    .filter({ hasText: "Profesora Estrella" });
  await teacher.getByRole("button", { name: "Desactivar profesor" }).click();
  await expect(teacher).toContainText("Inactivo");
  await teacher.getByRole("button", { name: "Activar profesor" }).click();
  await expect(teacher).toContainText("Activo");
  const family = page
    .locator(".edu-school-module .ds-card")
    .filter({ hasText: "Familia Brisa" });
  await family.getByLabel("Alumna Luna", { exact: true }).check();
  await module(page, "Alumnos");
  const student = page
    .locator(".edu-student")
    .filter({ hasText: "Alumna Luna" });
  await student.locator("summary").click();
  await expect(student).toContainText("Familia Brisa");
  await student
    .getByRole("button", { name: "Editar alumno de ejemplo" })
    .click();
  await page.getByLabel("Alias ficticio").fill("Alumna Luna Brillante");
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await expect(
    page.locator(".edu-student").filter({ hasText: "Alumna Luna Brillante" }),
  ).toBeVisible();
});

test("colegio: documentos resuelven avisos y reportes filtran/exportan", async ({
  page,
}) => {
  await page.goto("/demo/educacion");
  await module(page, "Alertas");
  const absence = page
    .locator(".edu-school-module .ds-record-grid > article")
    .filter({ hasText: "Ausencia registrada" });
  await absence.getByRole("button", { name: "Revisar módulo" }).click();
  await expect(
    page.getByRole("button", { name: "Asistencia", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await module(page, "Alertas");
  const initial = await page
    .locator(".edu-school-module .ds-record-grid > article")
    .count();
  await module(page, "Documentos");
  const record = page
    .locator(".edu-document-checklist article")
    .filter({ hasText: "Alumna Luna" });
  await record.getByRole("checkbox").nth(0).check();
  await record.getByRole("checkbox").nth(1).check();
  await module(page, "Alertas");
  await expect(
    page.locator(".edu-school-module .ds-record-grid > article"),
  ).toHaveCount(initial - 1);
  await page
    .getByRole("button", { name: "Marcar revisada", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Revisadas", exact: true }).click();
  await expect(
    page.locator(".edu-school-module .ds-record-grid > article"),
  ).toHaveCount(1);
  await module(page, "Reportes");
  await page
    .getByLabel("Grupo del reporte", { exact: true })
    .selectOption("2.º secundaria");
  await expect(
    page.locator(".edu-school-module > .ds-record-grid > article"),
  ).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar reporte CSV" }).click();
  expect((await download).suggestedFilename()).toBe("reporte-demo-colegio.csv");
  await page
    .getByLabel("Rol de ejemplo", { exact: true })
    .selectOption("apoderado");
  await expect(page.locator(".edu-role-record")).toContainText("Familia Brisa");
});

test("colegio: módulos adicionales y menú Más en teléfonos", async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/demo/educacion");
    for (const name of [
      "Profesores y familias",
      "Cursos y horarios",
      "Matrículas",
      "Pagos",
      "Alertas",
      "Reportes",
    ]) {
      await module(page, name);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${name} ${width}`,
      ).toBeTruthy();
    }
    await module(page, "Dashboard");
    await page.locator(".ds-guide > summary").click();
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `test-results/school-complete-${width}.png`,
        fullPage: true,
      });
  }
});
