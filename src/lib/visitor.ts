export type Consent = "accepted" | "rejected" | null;
export const consentEvent = "karpanda:analytics-consent";
export const settingsEvent = "karpanda:analytics-settings";
// Renew consent because the site now also records its own aggregate statistics.
const key = "karpanda:analytics-consent:v2";
let memoryChoice: Consent = null;
export function publicPath(path: string) {
  return (
    [
      "/",
      "/servicios",
      "/como-funciona",
      "/terminos",
      "/demos",
      "/demo/ventas",
      "/demo/reservas",
    ].includes(path) || /^\/producto\/[a-z0-9-]+$/.test(path)
  );
}
export function readConsent(): Consent {
  if (memoryChoice) return memoryChoice;
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v &&
      Number.isFinite(v.at) &&
      Date.now() >= v.at &&
      Date.now() - v.at < 180 * 86400000 &&
      ["accepted", "rejected"].includes(v.choice)
      ? v.choice
      : null;
  } catch {
    return null;
  }
}
export function writeConsent(choice: Exclude<Consent, null>) {
  try {
    localStorage.setItem(key, JSON.stringify({ choice, at: Date.now() }));
    memoryChoice = null;
  } catch {
    memoryChoice = choice;
  }
}
