import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { Badge, Empty, Loading, PageHeading } from "../components";
import { useApp } from "../context";
import {
  accountAction,
  validPassword,
  type ManagedUser,
} from "../lib/accounts";
import { demoMode, supabase } from "../lib/supabase";

export function PasswordForm({ forced = false }: { forced?: boolean }) {
  const { notify } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password"));
    const currentPassword = String(data.get("currentPassword"));
    setError("");
    if (!validPassword(password)) {
      setError(
        "Usa al menos 12 caracteres con mayúscula, minúscula, número y símbolo.",
      );
      return;
    }
    if (password !== data.get("confirmation")) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (password === currentPassword) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }
    setBusy(true);
    try {
      await accountAction({
        action: "change-password",
        currentPassword,
        password,
      });
      form.reset();
      await supabase!.auth.signOut({ scope: "local" });
      notify("Contraseña actualizada. Inicia sesión con tu nueva contraseña.");
      navigate("/acceso?changed=1", { replace: true });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo actualizar la contraseña.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel password-panel">
      <h2>
        <LockKeyhole size={22} />{" "}
        {forced ? "Reemplaza tu contraseña temporal" : "Cambiar mi contraseña"}
      </h2>
      <p className="muted">
        {forced
          ? "Antes de entrar al sistema, elige una contraseña personal. Solo tú podrás cambiarla con tu contraseña actual."
          : "Por seguridad, confirma tu contraseña actual. Después del cambio deberás iniciar sesión nuevamente."}
      </p>
      {demoMode ? (
        <p className="notice compact">
          El cambio de contraseña está disponible al iniciar sesión con una
          cuenta real.
        </p>
      ) : (
        <form onSubmit={(e) => void submit(e)}>
          <label>
            Contraseña actual
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </label>
          <label>
            Nueva contraseña
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              aria-describedby="password-help"
            />
          </label>
          <p id="password-help" className="muted small">
            Mínimo 12 caracteres. Incluye mayúscula, minúscula, número y
            símbolo.
          </p>
          <label>
            Confirmar nueva contraseña
            <input
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Actualizando…" : "Guardar nueva contraseña"}
          </button>
        </form>
      )}
    </section>
  );
}
export function ForcedPasswordChange() {
  const { user } = useApp();
  if (user && !user.app_metadata.must_change_password) {
    return (
      <Navigate
        to={
          user.app_metadata.role === "admin"
            ? "/admin/usuarios"
            : "/cuenta/seguridad"
        }
        replace
      />
    );
  }
  return (
    <div className="container info-page">
      <PageHeading title="Haz tuya esta cuenta.">
        {user?.email} · Configura tu contraseña personal para continuar.
      </PageHeading>
      <PasswordForm forced />
      <button
        className="text-link button-plain"
        style={{ marginTop: 24 }}
        onClick={() => void supabase?.auth.signOut({ scope: "local" })}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
export function Users() {
  const { user } = useApp();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (demoMode) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    void accountAction<{ users: ManagedUser[]; nextPage: number | null }>({
      action: "list",
      page,
    })
      .then((result) => {
        if (active) {
          setUsers(result.users);
          setNextPage(result.nextPage);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page]);
  return (
    <>
      <PageHeading title="Gestión de usuarios">
        Consulta las cuentas del sistema y gestiona tu contraseña personal.
      </PageHeading>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : users.length ? (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Acceso</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      {u.id === user?.id && (
                        <small className="green">Tu cuenta</small>
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <Badge>
                        {u.role === "admin" ? "Administrador" : "Cliente"}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        className={u.must_change_password ? "warning" : ""}
                      >
                        {u.must_change_password
                          ? "Cambio inicial pendiente"
                          : "Contraseña personal"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row user-pagination">
            <button
              className="button secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="muted small">Página {page}</span>
            <button
              className="button secondary"
              disabled={!nextPage}
              onClick={() => setPage(nextPage!)}
            >
              Siguiente
            </button>
          </div>
        </>
      ) : (
        <Empty
          title={
            demoMode
              ? "Los usuarios reales se muestran al conectar tu cuenta."
              : "No hay cuentas disponibles."
          }
        />
      )}
      <div className="section-title">
        <h2>Tu seguridad</h2>
      </div>
      <PasswordForm />
    </>
  );
}
