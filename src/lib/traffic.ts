import { publicPath, readConsent } from "./visitor";
const url = String(import.meta.env.VITE_SUPABASE_URL || "");
const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");
export const trafficConfigured =
  import.meta.env.VITE_DEMO_MODE !== "true" &&
  import.meta.env.VITE_TRAFFIC_ENABLED !== "false" &&
  /^https:\/\//.test(url) &&
  Boolean(key);
export type DemoEvent =
  "demo_start" | "demo_step" | "demo_complete" | "demo_reset" | "demo_consult";
let lastPage = "";
let memorySession: {
  id: string;
  at: number;
  source: string;
  device: string;
} | null = null;
function source() {
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (host === location.hostname) return "direct";
    if (/(^|\.)(google\.[a-z.]+|bing.com|duckduckgo.com)$/.test(host))
      return "search";
    if (
      /(^|\.)(facebook.com|instagram.com|t.co|twitter.com|x.com|linkedin.com|tiktok.com|wa.me|whatsapp.com)$/.test(
        host,
      )
    )
      return "social";
    return "referral";
  } catch {
    return "direct";
  }
}
function session() {
  let value = memorySession;
  try {
    value =
      JSON.parse(
        sessionStorage.getItem("karpanda:visit-session:v1") || "null",
      ) || value;
  } catch {
    /* Keep a tab-local fallback. */
  }
  if (
    !value ||
    !Number.isFinite(value.at) ||
    Date.now() - value.at > 30 * 60000 ||
    !/^[a-f0-9-]{36}$/i.test(value.id)
  )
    value = {
      id: crypto.randomUUID(),
      at: Date.now(),
      source: source(),
      device:
        innerWidth < 768 ? "mobile" : innerWidth < 1100 ? "tablet" : "desktop",
    };
  value.at = Date.now();
  memorySession = value;
  try {
    sessionStorage.setItem("karpanda:visit-session:v1", JSON.stringify(value));
  } catch {
    /* Measurement still works for this tab. */
  }
  return value;
}
export function forgetTraffic() {
  lastPage = "";
  memorySession = null;
  try {
    sessionStorage.removeItem("karpanda:visit-session:v1");
  } catch {
    /* No persistent state is required. */
  }
}
export function trafficPage(path: string) {
  if (!publicPath(path) || readConsent() !== "accepted") {
    lastPage = "";
    return;
  }
  if (lastPage === path) return;
  lastPage = path;
  record("page_view", path);
}
export function trafficDemo(event: DemoEvent) {
  record(event, location.pathname);
}
function record(event: "page_view" | DemoEvent, path: string) {
  if (
    !trafficConfigured ||
    readConsent() !== "accepted" ||
    !publicPath(path) ||
    typeof crypto.randomUUID !== "function"
  )
    return;
  const visit = session();
  const payload = {
    id: crypto.randomUUID(),
    session: visit.id,
    event,
    path,
    source: visit.source,
    device: visit.device,
  };
  void fetch(url + "/functions/v1/kp-traffic", {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    credentials: "omit",
    cache: "no-store",
    keepalive: true,
    body: JSON.stringify(payload),
  }).catch(() => {
    /* Offline visits are not counted; never delay the visitor. */
  });
}
