import { admin } from "../_shared/http.ts";
const origins = new Set([
  "https://karpanda.vercel.app",
  "https://karpanda-pandas16.vercel.app",
]);
const uuid =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const key = crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);
async function digest(value: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        await key,
        new TextEncoder().encode(value),
      ),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": origins.has(origin)
      ? origin
      : "https://karpanda.vercel.app",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const reply = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers });
  if (!origins.has(origin)) return reply({ error: "Origen no permitido" }, 403);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (req.method !== "POST")
    return reply({ error: "Método no permitido" }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 1600)
      return reply({ error: "Solicitud demasiado grande" }, 413);
    const b = JSON.parse(raw);
    if (
      !b ||
      typeof b !== "object" ||
      !uuid.test(b.id) ||
      !uuid.test(b.session)
    )
      return reply({ error: "Solicitud no válida" }, 400);
    const paths = [
      "/",
      "/servicios",
      "/como-funciona",
      "/terminos",
      "/demos",
      "/demo/ventas",
      "/demo/reservas",
      "/demo/educacion",
      "/demo/gestion",
    ];
    if (
      typeof b.path !== "string" ||
      (!paths.includes(b.path) && !/^\/producto\/[a-z0-9-]{1,80}$/.test(b.path))
    )
      return reply({ error: "Ruta no permitida" }, 400);
    if (
      ![
        "page_view",
        "demo_start",
        "demo_step",
        "demo_complete",
        "demo_reset",
        "demo_consult",
      ].includes(b.event) ||
      !["direct", "search", "social", "referral"].includes(b.source) ||
      !["mobile", "tablet", "desktop"].includes(b.device)
    )
      return reply({ error: "Evento no válido" }, 400);
    if (
      b.event !== "page_view" &&
      ![
        "/demo/ventas",
        "/demo/reservas",
        "/demo/educacion",
        "/demo/gestion",
      ].includes(b.path)
    )
      return reply({ error: "Evento no permitido" }, 400);
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
    }).format(new Date());
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const [sessionHash, ipHash] = await Promise.all([
      digest("session:" + day + ":" + b.session),
      digest("rate:" + day + ":" + ip),
    ]);
    const r = await admin.rpc("kp_record_traffic", {
      p_id: b.id,
      p_session_hash: sessionHash,
      p_ip_hash: ipHash,
      p_path: b.path,
      p_event: b.event,
      p_source: b.source,
      p_device: b.device,
    });
    if (r.error)
      return reply({ error: "No se pudo registrar la medición" }, 503);
    return reply({ accepted: r.data === true }, 202);
  } catch {
    return reply({ error: "Solicitud no válida" }, 400);
  }
});
