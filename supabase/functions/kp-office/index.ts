import {
  admin,
  requireValue,
  search,
  serve,
  text,
  unwrap,
  uuid,
} from "../_shared/http.ts";

const tables = {
  orders: "kp_order_reporting",
  licenses: "kp_licenses",
  tickets: "kp_tickets",
} as const;
const statuses = {
  orders: ["pending", "paid", "cancelled", "refunded"],
  licenses: ["active", "suspended", "expired", "revoked"],
  tickets: ["open", "in_progress", "resolved", "closed"],
};
async function enrich(items: any[]) {
  const ids = [
    ...new Set(
      items.flatMap((r) => [r.user_id, r.assigned_to]).filter(Boolean),
    ),
  ];
  const people = ids.length
    ? unwrap(
        await admin.from("kp_profiles").select("id,name,email").in("id", ids),
      ) || []
    : [];
  return items.map((r) => ({
    ...r,
    customer_name:
      r.customer_name || people.find((p) => p.id === r.user_id)?.name,
    customer_email:
      r.customer_email || people.find((p) => p.id === r.user_id)?.email,
    assigned_name: people.find((p) => p.id === r.assigned_to)?.name,
    effective_status:
      r.status === "active" &&
      r.expires_at &&
      Date.parse(r.expires_at) < Date.now()
        ? "expired"
        : r.status,
  }));
}
serve(async ({ user, profile, body, isAdmin }) => {
  const module = body.module as keyof typeof tables;
  const action = body.action;
  if (module === ("dashboard" as string)) {
    requireValue(isAdmin, "Acceso administrativo requerido.", 403);
    return unwrap(
      await admin.rpc("kp_dashboard", {
        p_actor: user.id,
        p_from: body.from,
        p_to: body.to,
      }),
    );
  }
  if (module === ("options" as string)) {
    if (!isAdmin) {
      const [products, licenses] = await Promise.all([
        admin
          .from("kp_products")
          .select("id,name")
          .eq("published", true)
          .limit(500),
        admin
          .from("kp_licenses")
          .select("id,product_name,product_id")
          .eq("user_id", user.id)
          .is("archived_at", null)
          .limit(200),
      ]);
      return {
        customers: [],
        staff: [],
        products: unwrap(products),
        licenses: unwrap(licenses),
      };
    }
    const q = search(body.q);
    let people = admin
      .from("kp_profiles")
      .select("id,name,email,role,must_change_password")
      .eq("active", true)
      .order("name")
      .limit(200);
    if (q) people = people.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    const [customers, products, staff] = await Promise.all([
      people,
      admin
        .from("kp_products")
        .select("id,name,price,published")
        .order("name")
        .limit(500),
      admin
        .from("kp_profiles")
        .select("id,name,email")
        .eq("role", "admin")
        .eq("active", true)
        .eq("must_change_password", false)
        .order("name")
        .limit(100),
    ]);
    return {
      customers: unwrap(customers),
      products: unwrap(products),
      staff: unwrap(staff),
    };
  }
  requireValue(module in tables, "Módulo no disponible.");
  if (action === "mutate") {
    const payload = body.payload || {};
    if (module === "tickets")
      return unwrap(
        await admin.rpc("kp_ticket_action", {
          p_actor: user.id,
          p_action: body.operation,
          p_payload: payload,
        }),
      );
    requireValue(isAdmin, "Acceso administrativo requerido.", 403);
    return unwrap(
      await admin.rpc("kp_admin_action", {
        p_actor: user.id,
        p_module: module,
        p_action: body.operation,
        p_payload: payload,
      }),
    );
  }
  if (action === "list") {
    const page = Math.max(1, Math.min(100000, Number(body.page) || 1));
    const size = 12;
    let query = admin.from(tables[module]).select("*", { count: "exact" });
    if (!isAdmin) query = query.eq("user_id", user.id);
    if (isAdmin && body.user_id)
      query = query.eq("user_id", uuid(body.user_id));
    if (module === "licenses") {
      query = body.archived
        ? query.not("archived_at", "is", null)
        : query.is("archived_at", null);
      if (body.status === "expired")
        query = query.or(
          `status.eq.expired,and(status.eq.active,expires_at.lt.${new Date().toISOString()})`,
        );
      else if (body.status === "active")
        query = query
          .eq("status", "active")
          .lte("starts_at", new Date().toISOString())
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      else if (statuses.licenses.includes(body.status))
        query = query.eq("status", body.status);
      if (body.expiring)
        query = query
          .eq("status", "active")
          .gte("expires_at", new Date().toISOString())
          .lte(
            "expires_at",
            new Date(Date.now() + 14 * 86400000).toISOString(),
          );
    } else if (body.status === "pending_support" && module === "tickets")
      query = query.in("status", ["open", "in_progress"]);
    else if (statuses[module].includes(body.status))
      query = query.eq("status", body.status);
    if (module === "tickets") {
      if (["low", "normal", "high", "urgent"].includes(body.priority))
        query = query.eq("priority", body.priority);
      if (body.unassigned)
        query = query
          .is("assigned_to", null)
          .in("status", ["open", "in_progress"]);
      if (body.overdue)
        query = query
          .in("status", ["open", "in_progress"])
          .lt("updated_at", new Date(Date.now() - 48 * 3600000).toISOString());
    }
    const q = search(body.q);
    if (q) {
      const columns =
        module === "orders"
          ? ["product_name", "buyer_name", "customer_name", "customer_email"]
          : module === "licenses"
            ? ["product_name", "plan_name"]
            : ["subject"];
      query = query.or(columns.map((c) => `${c}.ilike.%${q}%`).join(","));
    }
    if (body.product_id && module !== "tickets")
      query = query.eq("product_id", uuid(body.product_id));
    if (body.from) {
      const from = new Date(body.from);
      requireValue(!isNaN(from.getTime()), "Fecha inicial no válida.");
      const to = body.to ? new Date(body.to) : new Date();
      requireValue(!isNaN(to.getTime()), "Fecha final no válida.");
      if (module === "orders" && body.periodField === "financial")
        query = query.or(
          `and(payment_date.gte.${from.toISOString()},payment_date.lt.${to.toISOString()}),and(refund_date.gte.${from.toISOString()},refund_date.lt.${to.toISOString()})`,
        );
      else
        query = query
          .gte("created_at", from.toISOString())
          .lt("created_at", to.toISOString());
    }
    const allowedSort =
      module === "licenses"
        ? ["created_at", "expires_at"]
        : module === "orders"
          ? ["created_at", "amount"]
          : ["created_at", "updated_at"];
    const sort = allowedSort.includes(body.sort) ? body.sort : "created_at";
    const result = await query
      .order(sort, { ascending: body.direction === "asc", nullsFirst: false })
      .order("id")
      .range((page - 1) * size, page * size - 1);
    const items = await enrich(unwrap(result) || []);
    if (!isAdmin)
      for (const row of items) {
        delete row.notes;
        delete row.customer_email;
      }
    return { items, total: result.count || 0, page, pageSize: size };
  }
  if (action === "detail") {
    const id = uuid(body.id);
    let query = admin.from(tables[module]).select("*").eq("id", id);
    if (!isAdmin) query = query.eq("user_id", user.id);
    const result = await query.maybeSingle();
    const record = unwrap(result);
    requireValue(record, "Registro no disponible.", 404);
    const item = (await enrich([record]))[0];
    let historyQuery = admin
      .from("kp_activity")
      .select("id,actor_id,action,message,internal,changes,created_at")
      .eq("entity", module)
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!isAdmin) historyQuery = historyQuery.eq("internal", false);
    const history = unwrap(await historyQuery) || [];
    const actorIds = [
      ...new Set(history.map((h) => h.actor_id).filter(Boolean)),
    ];
    const actors = actorIds.length
      ? unwrap(
          await admin.from("kp_profiles").select("id,name").in("id", actorIds),
        ) || []
      : [];
    const timeline = history.map((h) => ({
      ...h,
      actor_name: actors.find((a) => a.id === h.actor_id)?.name || "Sistema",
    }));
    if (module === "orders") {
      const [payments, refunds, licenses] = await Promise.all([
        admin.from("kp_payments").select("*").eq("order_id", id),
        admin.from("kp_refunds").select("*").eq("order_id", id),
        admin
          .from("kp_licenses")
          .select("id,product_name,status,expires_at")
          .eq("order_id", id),
      ]);
      const paymentRows = unwrap(payments) || [];
      const refundRows = unwrap(refunds) || [];
      if (!isAdmin)
        for (const row of [...paymentRows, ...refundRows]) delete row.reason;
      return {
        item,
        history: timeline,
        payments: paymentRows,
        refunds: refundRows,
        licenses: unwrap(licenses),
      };
    }
    if (module === "tickets") {
      let messagesQuery = admin
        .from("kp_ticket_messages")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at");
      if (!isAdmin) messagesQuery = messagesQuery.eq("internal", false);
      const messages = unwrap(await messagesQuery) || [];
      const ids = [
        ...new Set([item.user_id, ...messages.map((m) => m.author_id)]),
      ];
      const people =
        unwrap(
          await admin.from("kp_profiles").select("id,name").in("id", ids),
        ) || [];
      return {
        item,
        history: timeline,
        messages: messages.map((m) => ({
          ...m,
          author_name:
            people.find((p) => p.id === m.author_id)?.name || "Usuario",
        })),
      };
    }
    if (!isAdmin) delete item.notes;
    return { item, history: timeline };
  }
  requireValue(false, "Acción no disponible.");
});
