import { supabase } from "./supabase";

export type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  must_change_password: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};
export async function accountAction<T>(
  body: Record<string, unknown>,
): Promise<T> {
  if (!supabase) throw new Error("Esta acción requiere una cuenta real.");
  const { data, error } = await supabase.functions.invoke("kp-accounts", {
    body,
  });
  if (error) {
    let message = "No pudimos completar la solicitud. Inténtalo nuevamente.";
    if (error.context instanceof Response) {
      try {
        const payload = await error.context.json();
        if (payload.error) message = payload.error;
      } catch {
        /* Keep the user-facing fallback. */
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export const validPassword = (value: string) =>
  value.length >= 12 &&
  value.length <= 128 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^a-zA-Z0-9]/.test(value);
