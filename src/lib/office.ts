import { demoMode, supabase } from "./supabase";
import { readDemo, saveDemo, seedProducts } from "./data";
import { accountAction } from "./accounts";

export type Module = "orders" | "licenses" | "tickets";
export type OfficeRow = { id: string; [key: string]: any };
export type Activity = {
  id: string;
  action: string;
  message: string;
  created_at: string;
  internal?: boolean;
  actor_name?: string;
  actor_id?: string;
  changes?: Record<string, any>;
};
export type Listing = {
  items: OfficeRow[];
  total: number;
  page: number;
  pageSize: number;
};
export type Detail = {
  item: OfficeRow;
  history: Activity[];
  messages?: OfficeRow[];
  payments?: OfficeRow[];
  refunds?: OfficeRow[];
  licenses?: OfficeRow[];
  orders?: OfficeRow[];
  tickets?: OfficeRow[];
  counts?: Record<string, number>;
};
export type Options = {
  customers: OfficeRow[];
  products: OfficeRow[];
  staff: OfficeRow[];
};
export const label: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  cancelled: "Cancelado",
  refunded: "Devuelto · manual",
  demo: "Simulado",
  active: "Activa",
  suspended: "Suspendida",
  expired: "Vencida",
  revoked: "Revocada",
  open: "Abierto",
  in_progress: "En atención",
  resolved: "Resuelto",
  closed: "Cerrado",
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
  admin: "Administrador",
  pending_admin: "Administrador",
  customer: "Cliente",
};
export const shortId = (id?: string) =>
  id ? `#${id.slice(0, 8).toUpperCase()}` : "—";
export const dateTime = (date?: string | null) =>
  date
    ? new Date(date).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
export const dateOnly = (date?: string | null) =>
  date
    ? new Date(date).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Sin vencimiento";
export const localInput = (date?: string | null) => {
  if (!date) return "";
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export async function office<T>(body: Record<string, any>): Promise<T> {
  if (demoMode) return demoOffice(body) as T;
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase.functions.invoke("kp-office", {
    body,
  });
  if (error) {
    let message = "No se pudo completar la operación.";
    if (error.context instanceof Response) {
      try {
        message = (await error.context.json()).error || message;
      } catch {
        /* keep fallback */
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export async function people<T>(body: Record<string, any>): Promise<T> {
  if (!demoMode) return accountAction<T>(body);
  return demoPeople(body) as T;
}
function rows(key: string): OfficeRow[] {
  return readDemo<OfficeRow[]>(key, []);
}
function paged(items: OfficeRow[], body: Record<string, any>) {
  const page = Math.max(1, Number(body.page) || 1);
  return {
    items: items.slice((page - 1) * 12, page * 12),
    total: items.length,
    page,
    pageSize: 12,
  };
}
function demoPeople(b: Record<string, any>): unknown {
  let users = rows("users");
  if (b.action === "create") {
    const u: OfficeRow = {
      ...b,
      id: crypto.randomUUID(),
      active: true,
      must_change_password: true,
      created_at: new Date().toISOString(),
    };
    users.unshift(u);
    saveDemo("users", users);
    return {
      id: u.id,
      email: u.email,
      temporaryPassword: "Demo: no es una cuenta real",
    };
  }
  if (b.action === "update" || b.action === "state") {
    users = users.map((u) => (u.id === b.id ? { ...u, ...b } : u));
    saveDemo("users", users);
    return { ok: true };
  }
  if (b.action === "detail") {
    const item = users.find((u) => u.id === b.id);
    if (!item) throw new Error("Usuario no encontrado.");
    const orders = rows("orders").filter((o) => o.user_id === b.id),
      licenses = rows("licenses").filter((o) => o.user_id === b.id),
      tickets = rows("tickets").filter((o) => o.user_id === b.id);
    return {
      item,
      orders,
      licenses,
      tickets,
      history: [],
      counts: {
        orders: orders.length,
        licenses: licenses.length,
        tickets: tickets.length,
      },
    };
  }
  users = users.filter(
    (u) =>
      (!b.q ||
        `${u.name} ${u.email} ${u.company}`
          .toLowerCase()
          .includes(String(b.q).toLowerCase())) &&
      (!b.role || u.role === b.role) &&
      (!b.status ||
        (b.status === "active" && u.active !== false) ||
        (b.status === "inactive" && u.active === false) ||
        (b.status === "pending" && u.must_change_password)),
  );
  const result = paged(users, b);
  return {
    users: result.items,
    total: result.total,
    page: result.page,
    pageSize: 12,
    nextPage: result.page * 12 < result.total ? result.page + 1 : null,
  };
}
function demoOffice(b: Record<string, any>): unknown {
  if (b.module === "options")
    return {
      customers: rows("users").filter((u) => u.active !== false),
      products: readDemo("products", seedProducts),
      staff: rows("users").filter((u) => u.role === "admin"),
    };
  if (b.module === "dashboard") {
    const orders = rows("orders"),
      payments = rows("payments"),
      refunds = rows("refunds"),
      tickets = rows("tickets"),
      licenses = rows("licenses");
    const inPeriod = (r: OfficeRow) =>
      r.created_at >= b.from && r.created_at < b.to;
    const gross = payments
        .filter(inPeriod)
        .reduce((s, p) => s + Number(p.amount), 0),
      returned = refunds
        .filter(inPeriod)
        .reduce((s, p) => s + Number(p.amount), 0);
    return {
      metrics: {
        customers: rows("users").filter(
          (u) => u.role === "customer" && inPeriod(u),
        ).length,
        users: rows("users").length,
        orders: orders.filter(inPeriod).length,
        pending_amount: orders
          .filter((o) => o.status === "pending")
          .reduce((s, o) => s + Number(o.amount), 0),
        gross,
        refunds: returned,
        net: gross - returned,
        active_licenses: licenses.filter(
          (l) => l.status === "active" && !l.archived_at,
        ).length,
        tickets: tickets.filter((t) =>
          ["open", "in_progress"].includes(t.status),
        ).length,
        unassigned: tickets.filter((t) => !t.assigned_to && t.status === "open")
          .length,
        overdue: 0,
      },
      previous: { customers: 0, orders: 0, net: 0 },
      series: [],
      top_products: [],
      activity: [],
      expiring: licenses.filter(
        (l) =>
          l.expires_at && Date.parse(l.expires_at) < Date.now() + 14 * 86400000,
      ),
    };
  }
  const module = b.module as string;
  let items = rows(module);
  const payload = b.payload || {};
  if (b.action === "mutate") {
    if (b.operation === "create") {
      const product = readDemo("products", seedProducts).find(
        (p) => p.id === payload.product_id,
      );
      const item = {
        ...payload,
        id: crypto.randomUUID(),
        user_id: payload.user_id || "demo-user",
        product_name: product?.name || "",
        status: module === "tickets" ? "open" : "active",
        priority: "normal",
        source: "manual",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      items.unshift(item);
      saveDemo(module, items);
      return item;
    }
    const item = items.find((i) => i.id === payload.id);
    if (!item) throw new Error("Registro no encontrado.");
    if (b.operation === "reply") {
      saveDemo("messages", [
        ...rows("messages"),
        {
          id: crypto.randomUUID(),
          ticket_id: item.id,
          body: payload.message,
          internal: payload.internal,
          author_name: "Mi empresa",
          created_at: new Date().toISOString(),
        },
      ]);
      return item;
    }
    const transitions: Record<string, string> = {
      cancel: "cancelled",
      confirm_payment: "paid",
      refund_manual: "refunded",
      suspend: "suspended",
      revoke: "revoked",
      archive: "revoked",
      restore: "suspended",
      reactivate: "active",
      renew: "active",
      progress: "in_progress",
      resolve: "resolved",
      close: "closed",
      reopen: "open",
    };
    if (b.operation === "confirm_payment" && item.status === "pending") {
      saveDemo("payments", [
        ...rows("payments"),
        {
          id: crypto.randomUUID(),
          order_id: item.id,
          amount: item.amount,
          reference: payload.reference,
          created_at: new Date().toISOString(),
        },
      ]);
      saveDemo("licenses", [
        ...rows("licenses"),
        {
          id: crypto.randomUUID(),
          order_id: item.id,
          user_id: item.user_id,
          product_id: item.product_id,
          product_name: item.product_name,
          status: "active",
          source: "payment",
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);
    }
    Object.assign(item, payload, {
      status: transitions[b.operation] || item.status,
      updated_at: new Date().toISOString(),
    });
    if (b.operation === "archive") item.archived_at = new Date().toISOString();
    if (b.operation === "restore") item.archived_at = null;
    saveDemo(module, items);
    return item;
  }
  items = items.map((r) => ({
    ...r,
    customer_name:
      rows("users").find((u) => u.id === r.user_id)?.name || "Mi empresa",
    effective_status:
      r.status === "active" &&
      r.expires_at &&
      Date.parse(r.expires_at) < Date.now()
        ? "expired"
        : r.status,
  }));
  if (b.action === "detail") {
    const item = items.find((i) => i.id === b.id);
    if (!item) throw new Error("Registro no encontrado.");
    return {
      item,
      history: [],
      messages: rows("messages").filter((m) => m.ticket_id === b.id),
      payments: rows("payments").filter((p) => p.order_id === b.id),
      refunds: [],
      licenses: rows("licenses").filter((l) => l.order_id === b.id),
    };
  }
  items = items.filter(
    (i) =>
      (!b.q ||
        `${i.product_name} ${i.subject} ${i.customer_name}`
          .toLowerCase()
          .includes(String(b.q).toLowerCase())) &&
      (!b.status ||
        i.effective_status === b.status ||
        (b.status === "pending_support" &&
          ["open", "in_progress"].includes(i.status))) &&
      (!b.user_id || i.user_id === b.user_id) &&
      (!b.priority || i.priority === b.priority) &&
      (module !== "licenses" || Boolean(i.archived_at) === Boolean(b.archived)),
  );
  if (b.from)
    items = items.filter(
      (i) => i.created_at >= b.from && (!b.to || i.created_at < b.to),
    );
  items.sort((a, c) =>
    String(c.created_at).localeCompare(String(a.created_at)),
  );
  return paged(items, b);
}
