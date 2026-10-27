import { test, expect } from "@playwright/test";
test.use({ baseURL: "http://127.0.0.1:5173" });
test("Supabase Karpanda: catálogo público y acceso protegido real", async ({
  page,
}) => {
  test.skip(
    !process.env.KARPANDA_LIVE_TEST,
    "La prueba remota requiere KARPANDA_LIVE_TEST=true y el servidor conectado en 5173.",
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(3);
  await expect(page.locator(".demo-banner")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.goto("/cuenta");
  await expect(page).toHaveURL(/acceso/);
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/acceso/);
  await page.goto("/compra/ventas");
  await expect(
    page.getByRole("heading", { name: "Tu software empieza con tu cuenta." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
