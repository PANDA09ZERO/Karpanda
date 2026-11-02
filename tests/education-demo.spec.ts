import { test, expect } from "@playwright/test";

test.describe("medición educativa", () => {
  test.use({ baseURL: "http://127.0.0.1:5176" });
  test("solo envía acciones consentidas, sin alias ni notas", async ({
    page,
  }) => {
    const events: Record<string, unknown>[] = [];
    await page.route("https://mock-supabase.test/**", (r) => {
      if (r.request().url().endsWith("/functions/v1/kp-traffic")) {
        events.push(r.request().postDataJSON());
        return r.fulfill({ status: 202, json: { accepted: true } });
      }
      return r.fulfill({ json: [] });
    });
    await page.route("https://www.googletagmanager.com/**", (r) =>
      r.fulfill({ body: "", contentType: "text/javascript" }),
    );
    await page.goto("/demo/educacion?alias=NO_ENVIAR");
    expect(events).toHaveLength(0);
    await page.getByRole("button", { name: "Aceptar medición" }).click();
    await expect.poll(() => events.length).toBe(1);
    await page.getByRole("button", { name: "Comenzar recorrido" }).click();
    await page
      .getByRole("button", { name: "Agregar alumno de ejemplo" })
      .click();
    await page.getByLabel("Alias ficticio").fill("ALIAS_PRIVADO_DE_PRUEBA");
    await page
      .getByRole("button", { name: "Guardar alumno", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Menú del sistema de demostración" })
      .getByRole("button", { name: "Académico", exact: true })
      .click();
    await page
      .getByLabel("Asistencia de ALIAS_PRIVADO_DE_PRUEBA", { exact: true })
      .selectOption("present");
    await page.getByRole("button", { name: "Guardar asistencia" }).click();
    await page
      .getByRole("button", { name: "Calificaciones", exact: true })
      .click();
    await page
      .getByLabel("Nota de ALIAS_PRIVADO_DE_PRUEBA", { exact: true })
      .fill("19.3");
    await page.getByRole("button", { name: "Guardar calificaciones" }).click();
    await expect
      .poll(() => events.filter((e) => e.event === "demo_complete").length)
      .toBe(1);
    expect(events.every((e) => e.path === "/demo/educacion")).toBeTruthy();
    expect(JSON.stringify(events)).not.toMatch(/ALIAS_PRIVADO|NO_ENVIAR|19\.3/);
    for (const e of events)
      expect(Object.keys(e).sort()).toEqual([
        "device",
        "event",
        "id",
        "path",
        "session",
        "source",
      ]);
  });
});

test("educación: alumno, asistencia, notas, expediente, libreta y reinicio", async ({
  page,
}) => {
  await page.goto("/demos");
  await page.getByRole("link", { name: "Probar Educación" }).click();
  const nav = page.getByRole("navigation", {
    name: "Menú del sistema de demostración",
  });
  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Comenzar recorrido" }).click();
  await page.getByRole("button", { name: "Agregar alumno de ejemplo" }).click();
  await page.getByLabel("Alias ficticio").fill("Alumno Estrella");
  await page
    .getByRole("button", { name: "Guardar alumno", exact: true })
    .click();
  await expect(page.locator(".edu-student")).toHaveCount(4);
  await nav.getByRole("button", { name: "Académico", exact: true }).click();
  await page
    .getByLabel("Asistencia de Alumno Estrella", { exact: true })
    .selectOption("present");
  await page
    .getByLabel("Asistencia de Alumna Luna", { exact: true })
    .selectOption("present");
  await page.getByRole("button", { name: "Guardar asistencia" }).click();
  await expect(page.getByRole("status")).toContainText("Asistencia guardada");
  await page
    .getByRole("button", { name: "Calificaciones", exact: true })
    .click();
  await page.getByLabel("Nota de Alumno Estrella", { exact: true }).fill("21");
  await page.getByRole("button", { name: "Guardar calificaciones" }).click();
  await expect(page.getByRole("alert")).toContainText("entre 0 y 20");
  await page.getByLabel("Nota de Alumno Estrella", { exact: true }).fill("18");
  await page.getByRole("button", { name: "Guardar calificaciones" }).click();
  await expect(page.locator(".edu-completed")).toContainText(
    "Recorrido académico completado",
  );
  await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.locator(".edu-stats")).toContainText("100%");
  await nav.getByRole("button", { name: "Alumnos", exact: true }).click();
  const student = page
    .locator(".edu-student")
    .filter({ hasText: "Alumno Estrella" });
  await student.locator("summary").click();
  await expect(student).toContainText("18 / 20");
  await student
    .getByRole("button", { name: "Ver libreta de este alumno" })
    .click();
  await expect(page.locator(".edu-report")).toContainText("Alumno Estrella");
  await expect(page.locator(".edu-report")).toContainText("18");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Descargar resumen de texto" })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "libreta-demo-colegio-panda.txt",
  );
  await page.getByRole("button", { name: "Reiniciar demo" }).click();
  await nav.getByRole("button", { name: "Alumnos", exact: true }).click();
  await expect(page.locator(".edu-student")).toHaveCount(3);
});

test("educación: teléfono, tablet, escritorio y filtros sin desbordamiento", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/demo/educacion");
    const nav = page.getByRole("navigation", {
      name: "Menú del sistema de demostración",
    });
    for (const label of ["Dashboard", "Alumnos", "Académico", "Documentos"]) {
      await nav.getByRole("button", { name: label, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${label} ${width}`,
      ).toBeTruthy();
    }
    await page
      .getByRole("button", { name: "Generar libreta de ejemplo" })
      .click();
    await expect(page.locator(".edu-report")).toContainText("Alumna Sol");
    await nav.getByRole("button", { name: "Académico", exact: true }).click();
    await page
      .getByLabel("Grupo", { exact: true })
      .selectOption("2.º secundaria");
    await expect(page.locator(".ds-record-grid > article")).toHaveCount(1);
    await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
    if (width === 390 || width === 1440) {
      await page.locator(".ds-guide > summary").click();
      await page.screenshot({
        path: `test-results/education-${width}.png`,
        fullPage: true,
      });
    }
  }
  expect(errors).toEqual([]);
});
