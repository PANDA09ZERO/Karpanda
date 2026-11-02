import { test, expect } from "@playwright/test";
test("catálogo: cada solución con demo y educación sin un precio inventado", async ({
  page,
}) => {
  await page.goto("/#soluciones");
  for (const [title, path] of [
    ["Karpanda Ventas", "/demo/ventas"],
    ["Karpanda Reservas", "/demo/reservas"],
  ]) {
    const card = page
      .locator(".product-card")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(
      card.getByRole("link", { name: "Probar demo", exact: true }),
    ).toHaveAttribute("href", path);
  }
  await page.getByRole("button", { name: "Educación", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(0);
  await expect(page.locator(".catalog-education-card")).toContainText(
    "Adaptado a tu colegio",
  );
  await expect(page.locator(".catalog-education-card")).not.toContainText("S/");
  await page.getByRole("link", { name: "Probar demo del colegio" }).click();
  await expect(page).toHaveURL(/\/demo\/educacion$/);
  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 }),
  ).toBeVisible();
});
test("catálogo: tarjetas con demos adaptadas a teléfono y escritorio", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/#soluciones");
    await expect(page.locator(".catalog-education-card")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    if (width === 390)
      await page.screenshot({
        path: "test-results/catalog-with-demos-phone.png",
        fullPage: true,
      });
  }
});
