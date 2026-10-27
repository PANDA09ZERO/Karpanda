import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Empty, Loading, PageHeading, Modal } from "../components";
import {
  AuditTimeline,
  Filters,
  InfoGrid,
  MutationDialog,
  Pagination,
  Records,
  StatePill,
  queryFilters,
  type Column,
  type Field,
} from "../components/Backoffice";
import { useApp } from "../context";
import {
  dateOnly,
  dateTime,
  label,
  people,
  shortId,
  type Detail,
  type OfficeRow,
} from "../lib/office";
import { useRemote } from "../lib/useRemote";
import { money } from "../lib/data";
import { PasswordForm } from "./Users";
const userFields: Field[] = [
  { name: "name", label: "Nombre completo", required: true, min: 2, max: 100 },
  {
    name: "email",
    label: "Correo electrónico",
    type: "email",
    required: true,
    max: 254,
  },
  { name: "company", label: "Empresa", max: 160 },
  { name: "phone", label: "Teléfono", type: "tel", max: 40 },
  {
    name: "role",
    label: "Rol",
    required: true,
    options: [
      { value: "customer", label: "Cliente" },
      { value: "admin", label: "Administrador" },
    ],
  },
];
type UserList = {
  users: OfficeRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  nextPage?: number | null;
};
export function ManageUsers() {
  const location = useLocation(),
    customersOnly = location.pathname.startsWith("/admin/clientes");
  const base = customersOnly ? "/admin/clientes" : "/admin/usuarios";
  const [params, setParams] = useSearchParams();
  const { user, notify } = useApp();
  const [create, setCreate] = useState(params.has("new"));
  const [editing, setEditing] = useState<OfficeRow | null>(null);
  const [credential, setCredential] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const { data, loading, error, reload } = useRemote<UserList>("people", {
    action: "list",
    ...queryFilters(params),
    role: customersOnly ? "customer" : params.get("role") || undefined,
  });
  const close = useCallback(() => {
    setCreate(false);
    setEditing(null);
    if (params.has("new")) {
      const p = new URLSearchParams(params);
      p.delete("new");
      setParams(p, { replace: true });
    }
  }, [params, setParams]);
  useEffect(() => {
    if (params.has("new")) setCreate(true);
  }, [params]);
  const cols: Column[] = [
    {
      label: "Usuario",
      render: (r) => (
        <>
          <strong>{r.name}</strong>
          {r.id === user?.id && <small className="green">Tu cuenta</small>}
          <small>{r.company}</small>
        </>
      ),
    },
    { label: "Correo", render: (r) => r.email },
    { label: "Rol", render: (r) => <StatePill state={r.role} /> },
    {
      label: "Estado",
      render: (r) => (
        <span
          className={`state-pill ${r.active === false ? "state-revoked" : "state-active"}`}
        >
          {r.active === false ? "Desactivado" : "Activo"}
        </span>
      ),
    },
    {
      label: "Acceso",
      render: (r) => (
        <span
          className={`state-pill ${r.must_change_password ? "state-pending" : "state-active"}`}
        >
          {r.must_change_password
            ? "Cambio inicial pendiente"
            : "Contraseña personal"}
        </span>
      ),
    },
  ];
  async function save(payload: Record<string, any>) {
    const r = await people<{ email: string; temporaryPassword: string }>({
      action: editing ? "update" : "create",
      ...(editing ? { id: editing.id } : {}),
      ...payload,
    });
    if (r.temporaryPassword) setCredential(r);
    notify(
      editing
        ? "Datos de la cuenta actualizados."
        : "Cuenta creada. Guarda la contraseña temporal antes de cerrar.",
    );
    reload();
  }
  return (
    <div className="office-layout">
      <div className="office-heading">
        <PageHeading
          eyebrow="PERSONAS Y RELACIONES"
          title={customersOnly ? "Clientes" : "Gestión de usuarios"}
        >
          {customersOnly
            ? "Conoce el historial y las herramientas de cada cliente."
            : "Cuentas, roles y seguridad, con un historial verificable."}
        </PageHeading>
        <button className="button" onClick={() => setCreate(true)}>
          <Plus size={18} />
          {customersOnly ? "Nuevo cliente" : "Nuevo usuario"}
        </button>
      </div>
      <Filters
        placeholder="Nombre, correo o empresa…"
        date={false}
        statuses={[
          { value: "active", label: "Activos" },
          { value: "inactive", label: "Desactivados" },
          { value: "pending", label: "Cambio inicial pendiente" },
        ]}
        extra={
          customersOnly
            ? []
            : [
                {
                  name: "role",
                  label: "Rol",
                  options: [
                    { value: "admin", label: "Administradores" },
                    { value: "customer", label: "Clientes" },
                  ],
                },
              ]
        }
        sorts={[
          { value: "created_at.desc", label: "Más recientes" },
          { value: "name.asc", label: "Nombre A–Z" },
          { value: "last_sign_in_at.desc", label: "Último acceso" },
        ]}
      />
      {error && (
        <p className="error" role="alert">
          {error}{" "}
          <button className="text-link button-plain" onClick={reload}>
            Reintentar
          </button>
        </p>
      )}
      {loading ? (
        <Loading />
      ) : data?.users.length ? (
        <>
          <Records
            items={data.users}
            columns={cols}
            base={base}
            title={(r) => r.name || r.email}
            actions={(r) => (
              <button
                className="text-link button-plain"
                onClick={() => setEditing(r)}
              >
                Editar
              </button>
            )}
          />
          <Pagination
            total={data.total ?? data.users.length}
            page={data.page ?? Number(params.get("page") || 1)}
            size={data.pageSize || 12}
          />
        </>
      ) : (
        <Empty title="No hay cuentas que coincidan.">
          <p>Prueba otros filtros o crea una cuenta nueva.</p>
        </Empty>
      )}
      <div className="section-title">
        <h2>Tu seguridad</h2>
      </div>
      <PasswordForm />
      {(create || editing) && (
        <MutationDialog
          title={
            editing
              ? "Editar usuario"
              : customersOnly
                ? "Crear cliente"
                : "Crear usuario"
          }
          description={
            editing
              ? "Los cambios de datos y rol quedan registrados. No se puede quitar el propio acceso ni desactivar al último administrador."
              : "La cuenta tendrá una contraseña temporal y deberá cambiarla al primer acceso. No se envían correos automáticamente."
          }
          fields={userFields.map((f) => ({
            ...f,
            disabled: Boolean(
              editing?.id === user?.id && ["role", "email"].includes(f.name),
            ),
          }))}
          initial={
            editing
              ? {
                  ...editing,
                  role:
                    editing.role === "pending_admin" ? "admin" : editing.role,
                }
              : { role: customersOnly ? "customer" : "customer" }
          }
          save={save}
          close={close}
        />
      )}{" "}
      {credential && (
        <CredentialCard
          credential={credential}
          close={() => setCredential(null)}
        />
      )}
    </div>
  );
}
function CredentialCard({
  credential,
  close,
}: {
  credential: { email: string; temporaryPassword: string };
  close: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Modal title="Cuenta creada" close={close}>
      <section className="credential-card">
        <ShieldCheck size={34} />
        <p>
          Entrega estos datos a su propietario. La contraseña se muestra solo
          ahora y no queda guardada en el navegador.
        </p>
        <dl>
          <dt>Usuario</dt>
          <dd>{credential.email}</dd>
          <dt>Contraseña temporal</dt>
          <dd className="temporary-password">{credential.temporaryPassword}</dd>
        </dl>
        <button
          className="button secondary"
          onClick={() =>
            void navigator.clipboard
              .writeText(`${credential.email}\n${credential.temporaryPassword}`)
              .then(() => setCopied(true))
              .catch(() => setCopied(false))
          }
        >
          <Copy size={16} />
          {copied ? "Copiado" : "Copiar acceso"}
        </button>
        <button className="button" onClick={close}>
          Ya guardé los datos
        </button>
      </section>
    </Modal>
  );
}
export function UserDetail() {
  const { id } = useParams();
  const { user, notify } = useApp();
  const { data, loading, error, reload } = useRemote<Detail>("people", {
    action: "detail",
    id,
  });
  const [mode, setMode] = useState("");
  const close = useCallback(() => setMode(""), []);
  const r = data?.item;
  const own = r?.id === user?.id;
  async function save(payload: Record<string, any>) {
    await people(
      mode === "edit"
        ? { action: "update", id, ...payload }
        : { action: "state", id, active: r?.active === false },
    );
    notify("Cuenta actualizada.");
    reload();
  }
  if (loading) return <Loading />;
  if (error || !r)
    return (
      <div className="office-layout">
        <Link className="text-link" to="/admin/usuarios">
          <ArrowLeft size={16} />
          Usuarios
        </Link>
        <p className="error" role="alert">
          {error || "Usuario no encontrado."}
        </p>
      </div>
    );
  return (
    <div className="office-layout">
      <Link className="text-link back-link" to="/admin/usuarios">
        <ArrowLeft size={16} /> Volver a usuarios
      </Link>
      <div className="office-heading">
        <PageHeading
          eyebrow={
            r.role === "customer" ? "FICHA DEL CLIENTE" : "FICHA DE USUARIO"
          }
          title={r.name}
        >
          {r.email}
        </PageHeading>
        <StatePill state={r.role} />
      </div>
      <div className="office-detail-grid">
        <div className="detail-primary">
          <section className="bento-card">
            <div className="card-heading">
              <h2>Información general</h2>
              <UserRound size={22} />
            </div>
            <InfoGrid
              items={[
                { label: "Nombre", value: r.name },
                { label: "Correo", value: r.email },
                { label: "Empresa", value: r.company || "No registrada" },
                { label: "Teléfono", value: r.phone || "No registrado" },
                {
                  label: "Estado",
                  value: r.active === false ? "Desactivado" : "Activo",
                },
                { label: "Registro", value: dateTime(r.created_at) },
                { label: "Último acceso", value: dateTime(r.last_sign_in_at) },
                {
                  label: "Seguridad",
                  value: r.must_change_password
                    ? "Cambio inicial pendiente"
                    : "Contraseña personal",
                },
              ]}
            />
          </section>
          <div className="profile-totals">
            {[
              ["orders", "Pedidos", "/admin/pedidos"],
              ["licenses", "Licencias", "/admin/licencias"],
              ["tickets", "Solicitudes", "/admin/soporte"],
            ].map(([key, title, path]) => (
              <Link
                className="bento-card"
                key={key}
                to={`${path}?user_id=${r.id}`}
              >
                <span>{title}</span>
                <strong>{data?.counts?.[key] || 0}</strong>
                <ArrowUpRightIcon />
              </Link>
            ))}
          </div>
          <Related
            title="Pedidos recientes"
            items={data?.orders || []}
            base="/admin/pedidos"
            all={`/admin/pedidos?user_id=${r.id}`}
            type="orders"
          />
          <Related
            title="Licencias"
            items={data?.licenses || []}
            base="/admin/licencias"
            all={`/admin/licencias?user_id=${r.id}`}
            type="licenses"
          />
          <Related
            title="Solicitudes de soporte"
            items={data?.tickets || []}
            base="/admin/soporte"
            all={`/admin/soporte?user_id=${r.id}`}
            type="tickets"
          />
          <AuditTimeline
            history={data?.history || []}
            title="Historial de la cuenta"
          />
        </div>
        <aside className="detail-secondary">
          <section className="bento-card action-panel">
            <h2>Gestionar cuenta</h2>
            <button className="button" onClick={() => setMode("edit")}>
              Editar datos y rol
            </button>
            <button
              className="button secondary danger-text"
              disabled={own}
              onClick={() => setMode("state")}
            >
              {r.active === false ? "Reactivar cuenta" : "Desactivar cuenta"}
            </button>
            <p className="muted small">
              {own
                ? "No puedes desactivar tu propia cuenta ni quitarte el acceso administrativo."
                : "Desactivar conserva pedidos, licencias y soporte. No se elimina el historial."}
            </p>
            {own && (
              <Link className="text-link" to="/admin/usuarios">
                Cambiar mi contraseña <ArrowRight size={16} />
              </Link>
            )}
          </section>
        </aside>
      </div>
      {mode && (
        <MutationDialog
          title={
            mode === "edit"
              ? "Editar cuenta"
              : r.active === false
                ? "Reactivar cuenta"
                : "Desactivar cuenta"
          }
          description={
            mode === "state"
              ? "La acción se aplica al acceso de esta cuenta y se registra en auditoría. No se eliminan sus datos."
              : undefined
          }
          fields={
            mode === "edit"
              ? userFields.map((f) => ({
                  ...f,
                  disabled: Boolean(own && ["role", "email"].includes(f.name)),
                }))
              : [
                  {
                    name: "acknowledged",
                    label:
                      r.active === false
                        ? "Confirmo que deseo reactivar esta cuenta."
                        : "Confirmo que deseo desactivar el acceso de esta cuenta.",
                    type: "checkbox",
                    required: true,
                  },
                ]
          }
          initial={{
            ...r,
            role: r.role === "pending_admin" ? "admin" : r.role,
          }}
          save={save}
          close={close}
        />
      )}
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={18} aria-hidden="true" />;
}
function Related({
  title,
  items,
  base,
  all,
  type,
}: {
  title: string;
  items: OfficeRow[];
  base: string;
  all: string;
  type: string;
}) {
  return (
    <section className="bento-card">
      <div className="card-heading">
        <h2>{title}</h2>
        <Link className="text-link" to={all}>
          Ver todos <ArrowRight size={15} />
        </Link>
      </div>
      {items.length ? (
        <div className="related-records">
          {items.map((r) => (
            <Link to={`${base}/${r.id}`} key={r.id}>
              <div>
                <strong>{r.subject || r.product_name}</strong>
                <small>
                  {shortId(r.id)} ·{" "}
                  {type === "licenses"
                    ? dateOnly(r.expires_at)
                    : dateOnly(r.created_at)}
                </small>
              </div>
              <StatePill state={r.status} />
              {type === "orders" && <b>{money(r.amount)}</b>}
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="muted">Todavía no hay registros relacionados.</p>
      )}
    </section>
  );
}
