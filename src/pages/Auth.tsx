import { useState, type FormEvent, type ReactNode } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useApp } from "../context";
import { demoMode, supabase } from "../lib/supabase";
import { Loading, PageHeading } from "../components";
export function Protected({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { user, authReady, isAdmin } = useApp();
  const location = useLocation();
  if (!authReady) return <Loading />;
  if (!demoMode && !user)
    return (
      <Navigate
        to={`/acceso?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  if (admin && !isAdmin)
    return (
      <div className="container info-page">
        <PageHeading title="Este espacio es para administradores.">
          Tu cuenta tiene acceso al portal del cliente.
        </PageHeading>
        <Link className="button" to="/cuenta">
          Ir a mi espacio
        </Link>
      </div>
    );
  return children;
}
export function Auth() {
  const { user, notify } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next") || "/cuenta";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/cuenta";
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user)
    return (
      <Navigate
        to={
          user.app_metadata.must_change_password
            ? "/cambiar-contrasena"
            : !params.has("next") && user.app_metadata.role === "admin"
              ? "/admin"
              : next
        }
        replace
      />
    );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const email = String(form.get("email"));
      const password = String(form.get("password"));
      const result = register
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name: String(form.get("name")) },
              emailRedirectTo: `${window.location.origin}/cuenta`,
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (register && !result.data.session) {
        notify(
          "Revisa tu correo para confirmar la cuenta y luego inicia sesión.",
        );
        setRegister(false);
      } else
        navigate(
          result.data.user?.app_metadata.must_change_password
            ? "/cambiar-contrasena"
            : !params.has("next") &&
                result.data.user?.app_metadata.role === "admin"
              ? "/admin"
              : next,
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page container">
      <section className="auth-intro">
        <span className="product-icon">
          <LockKeyhole size={26} />
        </span>
        <PageHeading title="Tu software, en un solo lugar.">
          Un acceso a tus herramientas, pedidos y soporte. Estamos contigo en
          cada paso.
        </PageHeading>
      </section>
      <section className="panel auth-form">
        <h2>{register ? "Crea tu cuenta" : "Bienvenido de nuevo"}</h2>
        {demoMode ? (
          <>
            <p className="muted">
              Estás explorando una demostración. Puedes conocer el portal sin
              crear una cuenta.
            </p>
            <Link className="button full" to={next}>
              Entrar a la demostración <ArrowRight size={16} />
            </Link>
          </>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            {register && (
              <label>
                Tu nombre
                <input
                  name="name"
                  required
                  autoComplete="name"
                  maxLength={160}
                />
              </label>
            )}
            <label>
              Correo electrónico
              <input
                name="email"
                required
                type="email"
                autoComplete="email"
                placeholder="nombre@empresa.com"
              />
            </label>
            <label>
              Contraseña
              <input
                name="password"
                required
                type="password"
                minLength={8}
                autoComplete={register ? "new-password" : "current-password"}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button full" disabled={busy}>
              {busy
                ? "Un momento…"
                : register
                  ? "Crear cuenta"
                  : "Iniciar sesión"}
              <ArrowRight size={16} />
            </button>
            <p className="small muted">
              {register ? "¿Ya tienes una cuenta?" : "¿Es tu primera vez?"}{" "}
              <button
                type="button"
                className="text-link button-plain"
                onClick={() => {
                  setRegister(!register);
                  setError("");
                }}
              >
                {register ? "Inicia sesión" : "Crea tu cuenta"}
              </button>
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
