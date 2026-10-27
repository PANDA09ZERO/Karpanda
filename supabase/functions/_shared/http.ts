import { createClient, type User } from "npm:@supabase/supabase-js@2.118.0";
export const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
};
export const url = Deno.env.get("SUPABASE_URL")!;
export const admin = createClient(
  url,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  clientOptions,
);
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function requireValue(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new ApiError(message, status);
}
export function text(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
export function search(value: unknown) {
  return text(value, 80).replace(/[,()%\\]/g, "");
}
export function uuid(value: unknown) {
  const id = text(value, 36);
  requireValue(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    ),
    "Identificador no válido.",
  );
  return id;
}
export function unwrap<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}
export type Profile = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  must_change_password: boolean;
  company: string;
  phone: string;
};
export type Context = {
  user: User;
  profile: Profile;
  body: Record<string, any>;
  jwt: string;
  isAdmin: boolean;
};
export function serve(
  handler: (ctx: Context) => Promise<unknown>,
  allowTemporary = false,
) {
  Deno.serve(async (req: Request) => {
    const origin = req.headers.get("Origin");
    const origins = new Set([
      "https://karpanda.vercel.app",
      "https://karpanda-pandas16.vercel.app",
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:5175",
      "http://127.0.0.1:5176",
    ]);
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin":
        origin && origins.has(origin) ? origin : "https://karpanda.vercel.app",
      "Access-Control-Allow-Headers":
        "authorization, apikey, x-client-info, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    };
    const reply = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers });
    if (origin && !origins.has(origin))
      return reply({ error: "Origen no permitido." }, 403);
    if (req.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (req.method !== "POST")
      return reply({ error: "Método no permitido." }, 405);
    try {
      const raw = await req.text();
      requireValue(
        raw.length <= 20000,
        "La solicitud es demasiado grande.",
        413,
      );
      const body = JSON.parse(raw);
      requireValue(
        body && typeof body === "object" && !Array.isArray(body),
        "Solicitud no válida.",
      );
      const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      requireValue(jwt, "Inicia sesión para continuar.", 401);
      const {
        data: { user },
        error,
      } = await admin.auth.getUser(jwt);
      requireValue(
        !error && user,
        "La sesión no es válida. Inicia sesión nuevamente.",
        401,
      );
      const profile = unwrap(
        await admin.from("kp_profiles").select("*").eq("id", user.id).single(),
      ) as Profile;
      requireValue(
        profile?.active,
        "Esta cuenta está desactivada. Contacta con un administrador.",
        403,
      );
      requireValue(
        allowTemporary || !profile.must_change_password,
        "Cambia tu contraseña temporal antes de continuar.",
        403,
      );
      const isAdmin = profile.role === "admin" && !profile.must_change_password;
      return reply(await handler({ user, profile, body, jwt, isAdmin }));
    } catch (e) {
      if (e instanceof ApiError) return reply({ error: e.message }, e.status);
      const err = e as { code?: string; message?: string };
      if (err.code === "23505")
        return reply(
          {
            error:
              "La referencia o el registro ya existe. Revisa los datos para evitar duplicados.",
          },
          409,
        );
      if (err.code === "23503")
        return reply(
          { error: "El registro relacionado no existe o todavía está en uso." },
          409,
        );
      if (err.code === "23514" || err.code === "22P02" || err.code === "22007")
        return reply(
          { error: "Comprueba las fechas, límites y campos obligatorios." },
          400,
        );
      if (err.code === "P0001") return reply({ error: err.message }, 400);
      return reply(
        { error: "No se pudo completar la operación. Inténtalo nuevamente." },
        500,
      );
    }
  });
}
