import { test, expect } from "@playwright/test";
test.use({ baseURL: "http://127.0.0.1:5176" });
const actor = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  person = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  ticket = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const at = "2026-10-27T14:37:10.92285+00:00";
const accountBefore = {
  id: person,
  name: "Karen",
  email: "karen@example.invalid",
  role: "pending_admin",
  active: true,
  must_change_password: true,
  phone: "",
  company: "",
  created_at: "2026-10-27T03:29:48Z",
};
const accountAfter = {
  ...accountBefore,
  role: "admin",
  must_change_password: false,
};
const ticketBefore = {
  id: ticket,
  user_id: person,
  subject: "Consulta de configuración",
  message: "Necesito ayuda para configurar el sistema.",
  status: "in_progress",
  priority: "normal",
  assigned_to: null,
  updated_at: "2026-10-27T14:30:00Z",
};
const ticketAfter = {
  ...ticketBefore,
  status: "resolved",
  priority: "urgent",
  assigned_to: actor,
  updated_at: at,
  resolved_at: at,
};
test.beforeEach(async ({ page }) => {
  const user = {
    id: actor,
    email: "cristian@example.invalid",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { role: "admin", must_change_password: false },
    user_metadata: { name: "Cristian" },
    created_at: at,
  };
  const expires = Math.floor(Date.now() / 1000) + 3600;
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
  await page.route("https://mock-supabase.test/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/auth/v1/user") return route.fulfill({ json: user });
    if (path.includes("/rest/v1/")) return route.fulfill({ json: [] });
    const body = route.request().postDataJSON();
    if (path.endsWith("/kp-accounts"))
      return route.fulfill({
        json: {
          item: accountAfter,
          orders: [],
          licenses: [],
          tickets: [],
          counts: {},
          history: [
            {
              id: "user-change",
              action: "user.updated",
              message: "Datos o acceso de la cuenta actualizados",
              actor_id: actor,
              actor_name: "Cristian",
              created_at: at,
              changes: { before: accountBefore, after: accountAfter },
            },
          ],
        },
      });
    if (body.module === "options")
      return route.fulfill({
        json: { customers: [], products: [], staff: [] },
      });
    return route.fulfill({
      json: {
        item: {
          ...ticketAfter,
          customer_name: "Karen",
          customer_email: "karen@example.invalid",
          assigned_name: "Cristian",
        },
        messages: [],
        history: [
          {
            id: "ticket-change",
            action: "kp_tickets.UPDATE",
            message: "Cambio registrado en tickets",
            actor_id: actor,
            actor_name: "Cristian",
            created_at: at,
            internal: true,
            changes: { before: ticketBefore, after: ticketAfter },
          },
          {
            id: "status-change",
            action: "ticket.status",
            message: "Estado actualizado: resolved",
            actor_id: actor,
            actor_name: "Cristian",
            created_at: at,
            internal: false,
            changes: {},
          },
          {
            id: "timestamp-only",
            action: "kp_tickets.UPDATE",
            message: "Cambio registrado en tickets",
            actor_name: "Cristian",
            created_at: "2026-10-27T14:35:00Z",
            internal: true,
            changes: {
              before: ticketBefore,
              after: { ...ticketBefore, updated_at: at },
            },
          },
          {
            id: "reply",
            action: "ticket.reply",
            message: "Nueva respuesta",
            actor_name: "Cristian",
            created_at: "2026-10-27T14:35:00Z",
            internal: false,
            changes: {},
          },
        ],
      },
    });
  });
});
test("cuentas: cambios de acceso claros sin JSON ni datos que no cambiaron", async ({
  page,
}) => {
  await page.goto(`/admin/usuarios/${person}`);
  const history = page
    .getByRole("heading", { name: "Historial de la cuenta" })
    .locator("..");
  await expect(
    history
      .getByText("Contraseña personal configurada", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(history.locator(".history-changes > div")).toHaveCount(2);
  await expect(history).toContainText("Administrador · activación pendiente");
  await expect(history).toContainText(
    "Cambio de contraseña temporal pendiente",
  );
  await expect(history).not.toContainText("must_change_password");
  await expect(history).not.toContainText("pending_admin");
  await expect(history).not.toContainText(person);
  await expect(history).not.toContainText("karen@example.invalid");
  await expect(history.locator("pre")).toHaveCount(0);
  await expect(history.getByText("Ver cambios", { exact: true })).toHaveCount(
    0,
  );
});
test("soporte: antes y después, responsable y un solo aviso por estado", async ({
  page,
}) => {
  await page.goto(`/admin/soporte/${ticket}`);
  const history = page
    .getByRole("heading", { name: "Historial de la actividad" })
    .locator("..");
  await expect(history.locator(".audit-timeline > li")).toHaveCount(2);
  await expect(
    history.getByText("Solicitud resuelta", { exact: true }),
  ).toBeVisible();
  await expect(history).toContainText("En atención");
  await expect(history).toContainText("Resuelto");
  await expect(history).toContainText("Urgente");
  await expect(history).toContainText("Normal");
  await expect(history).toContainText("Sin asignar");
  await expect(history).toContainText("Cristian");
  await expect(history).toContainText("Solo administradores");
  for (const raw of [
    "resolved",
    "in_progress",
    "assigned_to",
    "updated_at",
    "Cambio registrado en tickets",
    actor,
    ticket,
  ])
    await expect(history).not.toContainText(raw);
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await history.screenshot({
    path: "test-results/readable-history-mobile.png",
  });
});
