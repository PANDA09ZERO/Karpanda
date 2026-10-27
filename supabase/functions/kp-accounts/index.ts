import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const allowedOrigins = new Set([
  "https://karpanda.vercel.app",
  "https://karpanda-pandas16.vercel.app",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5175",
]);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const url = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, options);
const strongPassword = (value: unknown): value is string =>
  typeof value === "string" && value.length >= 12 && value.length <= 128 &&
  /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^a-zA-Z0-9]/.test(value);

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://karpanda.vercel.app",
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowedOrigins.has(origin)) return reply({ error: "Origen no permitido." }, 403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply({ error: "Método no permitido." }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 8192) return reply({ error: "Solicitud demasiado grande." }, 413);
    const body = JSON.parse(raw);
    // AUTHENTICATION_START
    const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!jwt) return reply({ error: "Inicia sesión para continuar." }, 401);
    const { data: { user }, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !user) return reply({ error: "Tu sesión no es válida. Inicia sesión nuevamente." }, 401);

    if (body.action === "list") {
      if (user.app_metadata.role !== "admin" || user.app_metadata.must_change_password) {
        return reply({ error: "No tienes permisos para consultar usuarios." }, 403);
      }
      const page = Number.isInteger(body.page) && body.page > 0 && body.page <= 10000 ? body.page : 1;
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 50 });
      if (error) return reply({ error: "No se pudieron consultar los usuarios." }, 500);
      return reply({ users: data.users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata.name || u.email?.split("@")[0],
        role: u.app_metadata.role === "pending_admin" ? "admin" : u.app_metadata.role || "customer",
        must_change_password: u.app_metadata.must_change_password === true,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      })), nextPage: data.users.length === 50 ? page + 1 : null });
    }

    if (body.action === "change-password") {
      if (!strongPassword(body.password)) return reply({ error: "Usa al menos 12 caracteres, con mayúscula, minúscula, número y símbolo." }, 400);
      if (typeof body.currentPassword !== "string" || body.currentPassword.length > 128) return reply({ error: "Introduce tu contraseña actual." }, 400);
      if (body.currentPassword === body.password) return reply({ error: "La nueva contraseña debe ser diferente a la actual." }, 400);
      if (body.userId && body.userId !== user.id) return reply({ error: "Solo puedes cambiar tu propia contraseña." }, 403);
      // Reauthenticate independently: never change the caller's browser session while verifying a password.
      const verifier = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, options);
      const { data: verified, error: verificationError } = await verifier.auth.signInWithPassword({ email: user.email!, password: body.currentPassword });
      if (verificationError || verified.user?.id !== user.id) return reply({ error: "La contraseña actual no es correcta." }, 401);
      const metadata = { ...user.app_metadata, must_change_password: false };
      if (user.app_metadata.role === "pending_admin") metadata.role = "admin";
      const { error } = await admin.auth.admin.updateUserById(user.id, { password: body.password, app_metadata: metadata });
      await verifier.auth.signOut({ scope: "local" });
      if (error) return reply({ error: "No se pudo actualizar la contraseña. Inténtalo nuevamente." }, 400);
      // Revoke refresh tokens on every device. Existing access JWTs expire naturally.
      const { error: revokeError } = await admin.auth.admin.signOut(jwt, "global");
      if (revokeError) return reply({ ok: true, signInAgain: true, message: "Contraseña actualizada. Inicia sesión nuevamente." });
      return reply({ ok: true, signInAgain: true });
    }
    return reply({ error: "Acción no disponible." }, 400);
  } catch {
    return reply({ error: "No se pudo procesar la solicitud." }, 400);
  }
});
