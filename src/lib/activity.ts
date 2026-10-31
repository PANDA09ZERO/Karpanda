import { dateTime, label, type Activity } from "./office";
import { money } from "./data";

type RecordValue = Record<string, unknown>;
export type PeopleNames = Record<string, string>;
export type ReadableChange = { label: string; before?: string; after: string };
const fields: Record<string, string> = {
  name: "Nombre",
  email: "Correo electrónico",
  phone: "Teléfono",
  company: "Empresa",
  role: "Tipo de usuario",
  active: "Acceso al sistema",
  must_change_password: "Contraseña de acceso",
  status: "Estado",
  priority: "Prioridad",
  assigned_to: "Responsable",
  subject: "Asunto",
  message: "Mensaje",
  plan_name: "Plan",
  starts_at: "Inicio de vigencia",
  expires_at: "Vencimiento",
  user_limit: "Usuarios permitidos",
  activation_limit: "Activaciones permitidas",
  source: "Origen de la licencia",
  archived_at: "Archivo de la licencia",
  notes: "Nota administrativa",
  reference: "Referencia",
  reason: "Motivo",
  product_name: "Producto",
  buyer_name: "Cliente",
  amount: "Importe",
  currency: "Moneda",
  quantity: "Cantidad",
  unit_price: "Precio unitario",
  subtotal: "Subtotal",
  tax: "Impuestos",
  price: "Precio mensual",
  published: "Visible en el catálogo",
  category: "Categoría",
  description: "Descripción",
  app_url: "Dirección del software",
  body: "Respuesta",
};
const titles: Record<string, string> = {
  "user.created": "Cuenta creada",
  "user.updated": "Datos de la cuenta actualizados",
  "kp_products.insert": "Producto creado",
  "kp_products.update": "Producto actualizado",
  "kp_products.delete": "Producto eliminado",
  "kp_orders.insert": "Pedido registrado",
  "kp_orders.update": "Pedido actualizado",
  "kp_licenses.insert": "Licencia creada",
  "kp_licenses.update": "Licencia actualizada",
  "kp_tickets.insert": "Solicitud de soporte creada",
  "kp_tickets.update": "Solicitud de soporte actualizada",
  "kp_payments.insert": "Pago recibido registrado",
  "kp_refunds.insert": "Devolución externa registrada",
  "order.confirm_payment": "Pago recibido registrado",
  "order.cancel": "Pedido cancelado",
  "order.refund_manual": "Devolución externa registrada",
  "order.note": "Nota administrativa añadida",
  "license.create": "Licencia creada",
  "license.edit": "Datos de la licencia actualizados",
  "license.renew": "Licencia renovada",
  "license.suspend": "Licencia suspendida",
  "license.revoke": "Licencia revocada",
  "license.reactivate": "Licencia reactivada",
  "license.archive": "Licencia archivada",
  "license.restore": "Licencia restaurada",
  "ticket.reply": "Nueva respuesta en la conversación",
};
function object(value: unknown): RecordValue | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : undefined;
}
function actionOf(h: Activity) {
  return (h.action || "").toLowerCase();
}
function snapshot(h: Activity) {
  return { before: object(h.changes?.before), after: object(h.changes?.after) };
}
function isSnapshot(h: Activity) {
  return Boolean(h.changes && ("before" in h.changes || "after" in h.changes));
}
function isEmpty(value: unknown) {
  return value === null || value === undefined || value === "";
}
function format(field: string, value: unknown, names: PeopleNames): string {
  if (field === "assigned_to")
    return isEmpty(value)
      ? "Sin asignar"
      : names[String(value)] || "Responsable asignado";
  if (field === "archived_at")
    return isEmpty(value) ? "Sin archivar" : "Archivada";
  if (field === "expires_at" && isEmpty(value)) return "Sin vencimiento";
  if (isEmpty(value)) return "Sin registrar";
  if (field === "active") return value ? "Habilitado" : "Desactivado";
  if (field === "must_change_password")
    return value
      ? "Cambio de contraseña temporal pendiente"
      : "Contraseña personal configurada";
  if (field === "published") return value ? "Sí" : "No";
  if (field === "role")
    return value === "pending_admin"
      ? "Administrador · activación pendiente"
      : label[String(value)] || "Tipo de usuario actualizado";
  if (field === "status" || field === "priority")
    return label[String(value)] || "Actualizado";
  if (field === "source")
    return value === "payment"
      ? "Pago confirmado"
      : value === "manual"
        ? "Emisión manual"
        : "Actualizado";
  if (["starts_at", "expires_at"].includes(field))
    return Number.isNaN(Date.parse(String(value)))
      ? "Fecha actualizada"
      : dateTime(String(value));
  if (["amount", "price", "unit_price", "subtotal", "tax"].includes(field))
    return Number.isFinite(Number(value))
      ? money(Number(value))
      : "Importe actualizado";
  if (field === "currency")
    return value === "PEN" ? "Soles (PEN)" : "Moneda actualizada";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "Información actualizada";
}
export function readableChanges(
  h: Activity,
  names: PeopleNames = {},
): ReadableChange[] {
  const { before, after } = snapshot(h);
  if (isSnapshot(h)) {
    const source = after || before || {};
    return Object.entries(fields).flatMap(([key, title]) => {
      if (
        !(key in source) ||
        (before && after && Object.is(before[key], after[key]))
      )
        return [];
      if (!before && isEmpty(source[key])) return [];
      const next = format(key, source[key], names),
        old = before && after ? format(key, before[key], names) : undefined;
      return [
        {
          label: title,
          ...(old !== undefined
            ? {
                before:
                  key === "assigned_to" && old === next
                    ? "Responsable anterior"
                    : old,
              }
            : {}),
          after: next,
        },
      ];
    });
  }
  return Object.entries(h.changes || {}).flatMap(([key, value]) =>
    fields[key] && !isEmpty(value)
      ? [{ label: fields[key], after: format(key, value, names) }]
      : [],
  );
}
function statusTitle(status: unknown, action: string) {
  const state = String(status || "");
  if (action.startsWith("ticket") || action.startsWith("kp_tickets"))
    return (
      (
        {
          open: "Solicitud abierta",
          in_progress: "Comenzó la atención de la solicitud",
          resolved: "Solicitud resuelta",
          closed: "Solicitud cerrada",
        } as Record<string, string>
      )[state] || "Estado de la solicitud actualizado"
    );
  if (action.startsWith("order") || action.startsWith("kp_orders"))
    return (
      (
        {
          pending: "Pedido pendiente de pago",
          paid: "Pedido marcado como pagado",
          cancelled: "Pedido cancelado",
          refunded: "Devolución externa registrada",
        } as Record<string, string>
      )[state] || "Estado del pedido actualizado"
    );
  if (action.startsWith("license") || action.startsWith("kp_licenses"))
    return (
      (
        {
          active: "Licencia activada",
          suspended: "Licencia suspendida",
          expired: "Licencia vencida",
          revoked: "Licencia revocada",
        } as Record<string, string>
      )[state] || "Estado de la licencia actualizado"
    );
  return "Estado actualizado";
}
function automatic(message: string) {
  return (
    !message ||
    /^Cambio registrado en /i.test(message) ||
    /^Estado actualizado:/i.test(message) ||
    message === "Datos o acceso de la cuenta actualizados"
  );
}
export function activityTitle(h: Activity) {
  const action = actionOf(h),
    { before, after } = snapshot(h);
  if (
    action === "user.updated" &&
    before?.must_change_password === true &&
    after?.must_change_password === false
  )
    return "Contraseña personal configurada";
  if (
    action === "user.updated" &&
    before &&
    after &&
    before.active !== after.active
  )
    return after.active
      ? "Acceso a la cuenta reactivado"
      : "Acceso a la cuenta desactivado";
  if (
    after?.status &&
    before?.status !== after.status &&
    action.endsWith(".update")
  )
    return statusTitle(after.status, action);
  if (action === "order.status" || action === "ticket.status")
    return statusTitle(
      h.changes?.status || h.message?.split(":").slice(1).join(":").trim(),
      action,
    );
  if (action === "ticket.reply")
    return h.internal
      ? "Nota para el equipo añadida"
      : "Nueva respuesta en la conversación";
  return (
    titles[action] ||
    (!automatic(h.message) ? h.message : "Actividad registrada")
  );
}
export function activityNote(h: Activity) {
  const action = actionOf(h);
  return /^(order|license)\./.test(action) &&
    !action.endsWith(".status") &&
    !automatic(h.message)
    ? h.message
    : undefined;
}
export function readableHistory(history: Activity[]) {
  return history.filter((h) => {
    if (isSnapshot(h) && readableChanges(h).length === 0) return false;
    const action = actionOf(h);
    if (action !== "ticket.status" && action !== "order.status") return true;
    const status =
      h.changes?.status || h.message?.split(":").slice(1).join(":").trim();
    // A single operation writes a business snapshot and a public status entry.
    // Keep one readable entry when both are visible; retain all stored audit data.
    return !history.some((other) => {
      if (
        other === h ||
        actionOf(other) !==
          (action === "ticket.status"
            ? "kp_tickets.update"
            : "kp_orders.update")
      )
        return false;
      const { before, after } = snapshot(other);
      return Boolean(
        before &&
        after &&
        before.status !== after.status &&
        after.status === status &&
        other.actor_name === h.actor_name &&
        other.created_at === h.created_at,
      );
    });
  });
}
