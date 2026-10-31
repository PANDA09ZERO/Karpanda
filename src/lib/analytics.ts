type Consent = "accepted" | "rejected" | null;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
    [key: `ga-disable-${string}`]: boolean;
  }
}
const id = String(import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
export const analyticsConfigured = /^G-[A-Z0-9]+$/.test(id);
const key = "karpanda:analytics-consent:v1";
export const consentEvent = "karpanda:analytics-consent";
export const settingsEvent = "karpanda:analytics-settings";
let initialized = false;
let lastPath = "";
let previousPage = "";
let memoryChoice: Consent = null;
export function publicPath(path: string) {
  return (
    ["/", "/servicios", "/como-funciona", "/terminos"].includes(path) ||
    /^\/producto\/[a-z0-9-]+$/.test(path)
  );
}
export function readConsent(): Consent {
  if (memoryChoice) return memoryChoice;
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value &&
      Date.now() - value.at < 180 * 86400000 &&
      ["accepted", "rejected"].includes(value.choice)
      ? value.choice
      : null;
  } catch {
    return null;
  }
}
function send(...args: any[]) {
  window.gtag?.(...args);
}
function clearCookies() {
  const names = document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter((n) => /^_ga(?:_|$)|^_gid$|^_gat/.test(n));
  const parts = location.hostname.split(".");
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
    for (let i = 0; i < parts.length - 1; i++)
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${parts.slice(i).join(".")}`;
  }
}
export function setConsent(choice: Exclude<Consent, null>) {
  try {
    localStorage.setItem(key, JSON.stringify({ choice, at: Date.now() }));
    memoryChoice = null;
  } catch {
    /* A browser that blocks storage keeps the explicit choice for this tab only. */
    memoryChoice = choice;
  }
  if (choice === "rejected") {
    pauseAnalytics();
    clearCookies();
  }
  window.dispatchEvent(new Event(consentEvent));
}
export function pauseAnalytics() {
  if (!analyticsConfigured) return;
  window[`ga-disable-${id}`] = true;
  if (initialized)
    send("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  lastPath = "";
}
export function trackPage(path: string, title: string) {
  if (
    !analyticsConfigured ||
    readConsent() !== "accepted" ||
    !publicPath(path)
  ) {
    pauseAnalytics();
    return;
  }
  window[`ga-disable-${id}`] = false;
  if (!initialized) {
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer!.push(arguments);
    };
    send("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    send("js", new Date());
    send("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    send("config", id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + path,
      page_referrer: externalReferrer(),
    });
    const script = document.createElement("script");
    script.async = true;
    script.id = "karpanda-ga4";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.append(script);
  } else send("consent", "update", { analytics_storage: "granted" });
  if (lastPath === path) return;
  const page = location.origin + path;
  send("set", {
    page_location: page,
    page_title: title,
    page_referrer: previousPage || externalReferrer(),
  });
  send("event", "page_view", {
    send_to: id,
    page_title: title,
    page_location: page,
    page_referrer: previousPage || externalReferrer(),
  });
  previousPage = page;
  lastPath = path;
}
function externalReferrer() {
  try {
    const ref = new URL(document.referrer);
    return ref.origin === location.origin ? "" : ref.origin + "/";
  } catch {
    return "";
  }
}
export function trackPublicAction(
  action:
    | "explore_catalog"
    | "view_service"
    | "filter_catalog"
    | "consult_service"
    | "open_faq",
  label: string,
) {
  if (
    !analyticsConfigured ||
    !initialized ||
    readConsent() !== "accepted" ||
    !publicPath(location.pathname)
  )
    return;
  send("event", action, {
    send_to: id,
    content_id: label.slice(0, 80),
    page_location: location.origin + location.pathname,
  });
}
