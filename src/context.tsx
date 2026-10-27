import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { configError, demoMode, supabase } from "./lib/supabase";
import { loadProducts } from "./lib/data";
import type { Product } from "./types";
type State = {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  products: Product[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
};
const Context = createContext<State | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(demoMode || !!configError);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(configError || "");
  const [notice, notify] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await loadProducts());
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos cargar el catálogo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user || null);
        setAuthReady(true);
      }
    });
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          if (error) setError(error.message);
          setUser(data.session?.user || null);
          setAuthReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setError("No se pudo consultar la sesión.");
          setAuthReady(true);
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => notify(""), 5500);
    return () => clearTimeout(t);
  }, [notice]);
  return (
    <Context.Provider
      value={{
        user,
        authReady,
        isAdmin: demoMode || user?.app_metadata?.role === "admin",
        products,
        loading,
        error,
        refresh,
        notify,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Cerrar aviso" onClick={() => notify("")}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useApp() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Falta el proveedor de la aplicación.");
  return ctx;
}
