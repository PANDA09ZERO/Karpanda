import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const demoMode =
  import.meta.env.VITE_DEMO_MODE === "true" || (!url && !key);
export const configError =
  !demoMode && (!url || !key)
    ? "Falta completar la URL y la clave pública de Supabase."
    : null;
export const supabase = !demoMode && url && key ? createClient(url, key) : null;
