import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import {
  admin,
  clientOptions,
  requireValue,
  search,
  serve,
  text,
  unwrap,
  url,
  uuid,
} from "../_shared/http.ts";
const strong = (p: unknown): p is string =>
  typeof p === "string" &&
  p.length >= 12 &&
  p.length <= 128 &&
  /[a-z]/.test(p) &&
  /[A-Z]/.test(p) &&
  /\d/.test(p) &&
  /[^a-zA-Z0-9]/.test(p);
const temporary = () =>
  "Kp!" +
  btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))),
  ).replace(/[+/=]/g, "x") +
  "9aA";
serve(async ({ user, profile, body, jwt, isAdmin }) => {
  if (body.action === "change-password") {
    requireValue(
      strong(body.password),
      "Usa al menos 12 caracteres, con mayúscula, minúscula, número y símbolo.",
    );
    requireValue(
      typeof body.currentPassword === "string" &&
        body.currentPassword.length <= 128,
      "Introduce tu contraseña actual.",
    );
    requireValue(
      body.password !== body.currentPassword,
      "La nueva contraseña debe ser diferente a la actual.",
    );
    requireValue(
      !body.userId || body.userId === user.id,
      "Solo puedes cambiar tu propia contraseña.",
      403,
    );
    const verifier = createClient(
      url,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      clientOptions,
    );
    const v = await verifier.auth.signInWithPassword({
      email: user.email!,
      password: body.currentPassword,
    });
    requireValue(
      !v.error && v.data.user?.id === user.id,
      "La contraseña actual no es correcta.",
      401,
    );
    const meta = {
      ...user.app_metadata,
      must_change_password: false,
      role: profile.role === "pending_admin" ? "admin" : profile.role,
      actor_id: user.id,
      operation_id: crypto.randomUUID(),
    };
    const result = await admin.auth.admin.updateUserById(user.id, {
      password: body.password,
      app_metadata: meta,
    });
    await verifier.auth.signOut({ scope: "local" });
    requireValue(
      !result.error,
      "No se pudo actualizar la contraseña. Inténtalo nuevamente.",
    );
    await admin.auth.admin.signOut(jwt, "global");
    return { ok: true, signInAgain: true };
  }
  requireValue(isAdmin, "No tienes permisos para gestionar usuarios.", 403);
  if (body.action === "list") {
    const page = Math.max(1, Math.min(100000, Number(body.page) || 1)),
      size = 12,
      q = search(body.q);
    let query = admin.from("kp_profiles").select("*", { count: "exact" });
    if (q)
      query = query.or(
        `name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`,
      );
    if (body.role === "admin")
      query = query.in("role", ["admin", "pending_admin"]);
    else if (body.role === "customer") query = query.eq("role", "customer");
    if (body.status === "active") query = query.eq("active", true);
    else if (body.status === "inactive") query = query.eq("active", false);
    else if (body.status === "pending")
      query = query.eq("must_change_password", true);
    if (body.from) {
      const from = new Date(body.from),
        to = body.to ? new Date(body.to) : new Date();
      requireValue(
        !isNaN(from.getTime()) && !isNaN(to.getTime()),
        "Fechas no válidas.",
      );
      query = query
        .gte("created_at", from.toISOString())
        .lt("created_at", to.toISOString());
    }
    const r = await query
      .order(
        ["name", "created_at", "last_sign_in_at"].includes(body.sort)
          ? body.sort
          : "created_at",
        { ascending: body.direction === "asc", nullsFirst: false },
      )
      .order("id")
      .range((page - 1) * size, page * size - 1);
    return {
      users: unwrap(r),
      total: r.count || 0,
      page,
      pageSize: size,
      nextPage: page * size < (r.count || 0) ? page + 1 : null,
    };
  }
  if (body.action === "detail") {
    const id = uuid(body.id),
      person = unwrap(
        await admin.from("kp_profiles").select("*").eq("id", id).maybeSingle(),
      );
    requireValue(person, "Usuario no encontrado.", 404);
    const [orders, licenses, tickets, history] = await Promise.all([
      admin
        .from("kp_orders")
        .select("id,product_name,amount,status,created_at", { count: "exact" })
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("kp_licenses")
        .select("id,product_name,status,expires_at,archived_at", {
          count: "exact",
        })
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("kp_tickets")
        .select("id,subject,status,priority,created_at", { count: "exact" })
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("kp_activity")
        .select("id,action,message,changes,created_at")
        .eq("entity", "users")
        .eq("entity_id", id)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);
    return {
      item: person,
      orders: unwrap(orders),
      licenses: unwrap(licenses),
      tickets: unwrap(tickets),
      history: unwrap(history),
      counts: {
        orders: orders.count || 0,
        licenses: licenses.count || 0,
        tickets: tickets.count || 0,
      },
    };
  }
  if (body.action === "create") {
    const name = text(body.name, 100),
      email = text(body.email, 254).toLowerCase();
    requireValue(
      name.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      "Introduce un nombre y correo válidos.",
    );
    requireValue(
      ["admin", "customer"].includes(body.role),
      "Selecciona un rol válido.",
    );
    const password = temporary(),
      r = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          company: text(body.company, 160),
          phone: text(body.phone, 40),
        },
        app_metadata: {
          role: body.role === "admin" ? "pending_admin" : "customer",
          must_change_password: true,
          actor_id: user.id,
          operation_id: crypto.randomUUID(),
        },
      });
    requireValue(
      !r.error,
      r.error?.message?.includes("registered")
        ? "Ya existe una cuenta con ese correo."
        : "No se pudo crear la cuenta. Revisa los datos.",
      409,
    );
    return { id: r.data.user!.id, email, temporaryPassword: password };
  }
  if (body.action === "update" || body.action === "state") {
    const id = uuid(body.id),
      target = unwrap(
        await admin.from("kp_profiles").select("*").eq("id", id).single(),
      );
    const original = await admin.auth.admin.getUserById(id);
    requireValue(
      !original.error && original.data.user,
      "La cuenta ya no está disponible.",
      404,
    );
    const old = original.data.user;
    if (body.action === "state")
      requireValue(
        id !== user.id,
        "No puedes desactivar tu propia cuenta administradora.",
      );
    const role =
      body.action === "update"
        ? body.role
        : target.role === "pending_admin"
          ? "admin"
          : target.role;
    requireValue(
      ["admin", "customer"].includes(role),
      "Selecciona un rol válido.",
    );
    if (id === user.id) {
      requireValue(
        role === "admin",
        "No puedes quitarte tu propio acceso administrativo.",
      );
      requireValue(
        !body.email || text(body.email, 254).toLowerCase() === target.email,
        "El correo de tu propia cuenta no se cambia desde este panel.",
      );
    }
    const active =
      body.action === "state" ? body.active === true : target.active;
    if (target.role === "admin" && (!active || role !== "admin")) {
      const r = await admin
        .from("kp_profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("active", true)
        .eq("must_change_password", false)
        .neq("id", id);
      unwrap(r);
      requireValue(
        (r.count || 0) > 0,
        "Debe quedar otro administrador activo con contraseña personal.",
      );
    }
    const changes: any = {
      app_metadata: {
        ...old.app_metadata,
        role:
          role === "admin" && target.must_change_password
            ? "pending_admin"
            : role,
        actor_id: user.id,
        operation_id: crypto.randomUUID(),
      },
    };
    if (body.action === "state")
      changes.ban_duration = active ? "none" : "876000h";
    else {
      const name = text(body.name, 100),
        email = text(body.email, 254).toLowerCase();
      requireValue(
        name.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        "Introduce nombre y correo válidos.",
      );
      changes.email = email;
      changes.email_confirm = true;
      changes.user_metadata = {
        ...old.user_metadata,
        name,
        company: text(body.company, 160),
        phone: text(body.phone, 40),
      };
    }
    const r = await admin.auth.admin.updateUserById(id, changes);
    requireValue(
      !r.error,
      "No se pudo actualizar la cuenta. Comprueba el correo y que quede otro administrador activo.",
      409,
    );
    return { ok: true };
  }
  requireValue(false, "Acción no disponible.");
}, true);
