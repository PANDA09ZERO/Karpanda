import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  KeyRound,
  LifeBuoy,
  Plus,
  Send,
} from "lucide-react";
import { Empty, Loading, PageHeading } from "../components";
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
import { demoMode } from "../lib/supabase";
import {
  dateOnly,
  dateTime,
  label,
  localInput,
  office,
  shortId,
  type Detail,
  type Listing,
  type Module,
  type OfficeRow,
  type Options,
} from "../lib/office";
import { money } from "../lib/data";
import { useRemote } from "../lib/useRemote";

const paths: Record<Module, string> = {
  orders: "pedidos",
  licenses: "licencias",
  tickets: "soporte",
};
const titles: Record<Module, string> = {
  orders: "Pedidos",
  licenses: "Licencias y suscripciones",
  tickets: "Centro de soporte",
};
const statusOptions: Record<Module, string[]> = {
  orders: ["pending", "paid", "cancelled", "refunded"],
  licenses: ["active", "suspended", "expired", "revoked"],
  tickets: ["open", "in_progress", "resolved", "closed"],
};
const priorities = ["low", "normal", "high", "urgent"].map((value) => ({
  value,
  label: label[value],
}));
const reason: Field = {
  name: "reason",
  label: "Motivo / nota interna",
  type: "textarea",
  required: true,
  min: 3,
  max: 2000,
};
const limits: Field[] = [
  { name: "plan_name", label: "Plan", required: true, max: 100 },
  {
    name: "expires_at",
    label: "Vencimiento (vacío = sin vencimiento)",
    type: "datetime-local",
  },
  {
    name: "user_limit",
    label: "Límite de usuarios",
    type: "number",
    min: 1,
    max: 10000,
    required: true,
  },
  {
    name: "activation_limit",
    label: "Límite de activaciones",
    type: "number",
    min: 1,
    max: 10000,
    required: true,
  },
];
function toOptions(items: OfficeRow[], caption: (r: OfficeRow) => string) {
  return items.map((r) => ({ value: r.id, label: caption(r) }));
}
function useOptions(admin: boolean, needed: boolean) {
  const [options, setOptions] = useState<Options & { licenses?: OfficeRow[] }>({
      customers: [],
      products: [],
      staff: [],
    }),
    [q, setQ] = useState(""),
    [error, setError] = useState("");
  const load = useCallback(async (search = "") => {
    try {
      setOptions(await office({ module: "options", q: search }));
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar las opciones.",
      );
    }
  }, []);
  useEffect(() => {
    if (needed) void load();
  }, [needed, load]);
  return {
    options,
    q,
    setQ,
    error,
    load,
    search: admin ? (
      <div className="option-lookup">
        <label>
          Buscar cliente por nombre o correo
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en las cuentas activas"
          />
        </label>
        <button
          type="button"
          className="button secondary"
          onClick={() => void load(q)}
        >
          Buscar cliente
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    ) : null,
  };
}

export function OfficeList({
  module,
  admin = true,
}: {
  module: Module;
  admin?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useApp();
  const [creating, setCreating] = useState(params.has("new"));
  const close = useCallback(() => {
    setCreating(false);
    if (params.has("new")) {
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);
  const { data, loading, error, reload } = useRemote<Listing>("office", {
    module,
    action: "list",
    ...queryFilters(params),
  });
  const choice = useOptions(admin, creating);
  const base = `/${admin ? "admin" : "cuenta"}/${paths[module]}`;
  useEffect(() => {
    if (params.has("new")) setCreating(true);
  }, [params]);
  const cols: Column[] =
    module === "orders"
      ? [
          {
            label: "Pedido",
            render: (r) => (
              <>
                <strong>{shortId(r.id)}</strong>
                <small>{r.product_name}</small>
              </>
            ),
          },
          ...(admin
            ? [
                {
                  label: "Cliente",
                  render: (r: OfficeRow) => (
                    <Link
                      className="text-link"
                      to={`/admin/clientes/${r.user_id}`}
                    >
                      {r.customer_name || r.buyer_name || "Cliente"}
                    </Link>
                  ),
                },
              ]
            : []),
          { label: "Importe", render: (r) => money(r.amount) },
          { label: "Estado", render: (r) => <StatePill state={r.status} /> },
          { label: "Fecha", render: (r) => dateOnly(r.created_at) },
        ]
      : module === "licenses"
        ? [
            {
              label: "Producto / licencia",
              render: (r) => (
                <>
                  <strong>{r.product_name}</strong>
                  <small>
                    {shortId(r.id)} · {r.plan_name || "Plan Empresa"}
                  </small>
                </>
              ),
            },
            ...(admin
              ? [
                  {
                    label: "Cliente",
                    render: (r: OfficeRow) => (
                      <Link to={`/admin/clientes/${r.user_id}`}>
                        {r.customer_name || "Cliente"}
                      </Link>
                    ),
                  },
                ]
              : []),
            {
              label: "Estado",
              render: (r) => (
                <StatePill
                  state={
                    r.archived_at ? "Archivada" : r.effective_status || r.status
                  }
                />
              ),
            },
            { label: "Vencimiento", render: (r) => dateOnly(r.expires_at) },
            {
              label: "Origen",
              render: (r) =>
                r.source === "payment" ? "Pago confirmado" : "Manual",
            },
          ]
        : [
            {
              label: "Solicitud",
              render: (r) => (
                <>
                  <strong>{r.subject}</strong>
                  <small>{shortId(r.id)}</small>
                </>
              ),
            },
            ...(admin
              ? [
                  {
                    label: "Cliente",
                    render: (r: OfficeRow) => (
                      <Link to={`/admin/clientes/${r.user_id}`}>
                        {r.customer_name || "Cliente"}
                      </Link>
                    ),
                  },
                ]
              : []),
            { label: "Estado", render: (r) => <StatePill state={r.status} /> },
            {
              label: "Prioridad",
              render: (r) => <StatePill state={r.priority || "normal"} />,
            },
            {
              label: "Última actividad",
              render: (r) => dateTime(r.updated_at || r.created_at),
            },
          ];
  const fields: Field[] =
    module === "licenses"
      ? [
          {
            name: "user_id",
            label: "Cliente",
            required: true,
            options: toOptions(
              choice.options.customers,
              (r) => `${r.name} · ${r.email}`,
            ),
          },
          {
            name: "product_id",
            label: "Producto",
            required: true,
            options: toOptions(choice.options.products, (r) => r.name),
          },
          {
            name: "order_id",
            label: "Pedido pagado relacionado (opcional)",
            help: "Solo puede vincularse un pedido pagado del mismo cliente y producto.",
          },
          {
            name: "starts_at",
            label: "Inicio de vigencia",
            type: "datetime-local",
            required: true,
          },
          ...limits,
          reason,
        ]
      : [
          {
            name: "subject",
            label: "Asunto",
            required: true,
            min: 3,
            max: 160,
          },
          {
            name: "message",
            label: "Tu mensaje",
            type: "textarea",
            required: true,
            min: 10,
            max: 5000,
          },
          ...(admin
            ? [
                {
                  name: "user_id",
                  label: "Cliente (vacío = mi cuenta)",
                  options: toOptions(
                    choice.options.customers,
                    (r) => `${r.name} · ${r.email}`,
                  ),
                },
              ]
            : []),
          {
            name: "product_id",
            label: "Producto relacionado (opcional)",
            options: toOptions(choice.options.products, (r) => r.name),
          },
          ...(!admin && choice.options.licenses?.length
            ? [
                {
                  name: "license_id",
                  label: "Licencia relacionada (opcional)",
                  options: toOptions(
                    choice.options.licenses,
                    (r) => `${r.product_name} · ${shortId(r.id)}`,
                  ),
                },
              ]
            : []),
        ];
  async function create(payload: Record<string, any>) {
    const record = await office<OfficeRow>({
      module,
      action: "mutate",
      operation: "create",
      payload,
    });
    notify(
      module === "licenses"
        ? "Licencia registrada con su historial."
        : "Solicitud registrada correctamente.",
    );
    navigate(`${base}/${record.id}`);
  }
  return (
    <div className="office-layout">
      <div className="office-heading">
        <PageHeading
          eyebrow={admin ? "ADMINISTRACIÓN" : "MI ESPACIO"}
          title={
            admin
              ? titles[module]
              : module === "orders"
                ? "Mis pedidos"
                : module === "licenses"
                  ? "Mis licencias"
                  : "Mis solicitudes"
          }
        >
          {module === "orders"
            ? "Cada operación, su estado y su historial."
            : module === "licenses"
              ? "Accesos, vigencias y límites en un mismo espacio."
              : "Conversaciones claras y seguimiento de cada consulta."}
        </PageHeading>
        {((module === "licenses" && admin) || module === "tickets") && (
          <button className="button" onClick={() => setCreating(true)}>
            <Plus size={18} />
            {module === "licenses" ? "Nueva licencia" : "Nueva solicitud"}
          </button>
        )}
      </div>
      <Filters
        placeholder={
          module === "tickets"
            ? "Asunto de la solicitud…"
            : module === "orders"
              ? "Producto, cliente o empresa…"
              : "Producto o plan…"
        }
        statuses={statusOptions[module].map((value) => ({
          value,
          label: label[value],
        }))}
        extra={
          module === "tickets"
            ? [{ name: "priority", label: "Prioridad", options: priorities }]
            : module === "licenses"
              ? [
                  {
                    name: "archived",
                    label: "Archivo",
                    options: [
                      { value: "false", label: "Sin archivar" },
                      { value: "true", label: "Archivadas" },
                    ],
                  },
                ]
              : []
        }
        sorts={[
          { value: "created_at.desc", label: "Más recientes" },
          { value: "created_at.asc", label: "Más antiguos" },
          ...(module === "orders"
            ? [{ value: "amount.desc", label: "Mayor importe" }]
            : module === "licenses"
              ? [{ value: "expires_at.asc", label: "Próximo vencimiento" }]
              : [{ value: "updated_at.desc", label: "Última actividad" }]),
        ]}
      />
      {error && (
        <div className="error" role="alert">
          {error}{" "}
          <button className="text-link button-plain" onClick={reload}>
            Reintentar
          </button>
        </div>
      )}
      {loading ? (
        <Loading />
      ) : data?.items.length ? (
        <>
          <Records
            items={data.items}
            columns={cols}
            base={base}
            title={(r) => r.subject || r.product_name || shortId(r.id)}
          />
          <Pagination
            total={data.total}
            page={data.page}
            size={data.pageSize}
          />
        </>
      ) : (
        <Empty title="No hay registros en esta vista.">
          <p>Prueba otros filtros o registra el primer elemento.</p>
        </Empty>
      )}
      {module === "orders" && admin && (
        <p className="muted small record-footnote">
          Los pagos y devoluciones manuales registran operaciones externas. Este
          panel no ejecuta cobros ni transferencias.
        </p>
      )}
      {creating && (
        <MutationDialog
          title={
            module === "licenses"
              ? "Crear licencia manual"
              : "Nueva solicitud de soporte"
          }
          description={
            module === "licenses"
              ? "La licencia quedará vinculada a su cliente y producto. Los cambios conservan su historial."
              : "Describe tu consulta. Podrás seguir la conversación desde el detalle."
          }
          fields={fields}
          initial={
            module === "licenses"
              ? {
                  starts_at: localInput(new Date().toISOString()),
                  expires_at: localInput(
                    new Date(Date.now() + 30 * 86400000).toISOString(),
                  ),
                  user_limit: 5,
                  activation_limit: 1,
                  plan_name: "Plan Empresa",
                }
              : {}
          }
          extra={admin ? choice.search : null}
          save={create}
          close={close}
        />
      )}
    </div>
  );
}

export function OfficeDetail({
  module,
  admin = true,
}: {
  module: Module;
  admin?: boolean;
}) {
  const { id } = useParams();
  const { notify } = useApp();
  const { data, loading, error, reload } = useRemote<Detail>("office", {
    module,
    action: "detail",
    id,
  });
  const [action, setAction] = useState("");
  const close = useCallback(() => setAction(""), []);
  const choice = useOptions(admin, Boolean(action));
  const base = `/${admin ? "admin" : "cuenta"}/${paths[module]}`;
  const r = data?.item;
  const titlesAction: Record<string, string> = {
    edit: "Editar licencia",
    renew: "Renovar vigencia",
    suspend: "Suspender licencia",
    revoke: "Revocar licencia",
    reactivate: "Reactivar licencia",
    archive: "Archivar licencia",
    restore: "Restaurar licencia",
    confirm_payment: "Registrar pago recibido",
    refund_manual: "Registrar devolución realizada",
    cancel: "Cancelar pedido pendiente",
    note: "Añadir nota interna",
    update: "Asignación y prioridad",
    progress: "Comenzar atención",
    resolve: "Resolver solicitud",
    close: "Cerrar solicitud",
    reopen: "Reabrir solicitud",
  };
  const actionFields: Field[] =
    module === "orders"
      ? [
          ...(["confirm_payment", "refund_manual"].includes(action)
            ? [
                {
                  name: "reference",
                  label:
                    action === "confirm_payment"
                      ? "Referencia del pago externo"
                      : "Referencia de la devolución externa",
                  required: true,
                  min: 3,
                  max: 160,
                },
                {
                  name: "acknowledged",
                  label:
                    action === "confirm_payment"
                      ? "Confirmo que el pago ya fue recibido por un medio externo."
                      : "Confirmo que la devolución ya fue realizada por un medio externo.",
                  type: "checkbox",
                  required: true,
                },
              ]
            : []),
          reason,
        ]
      : module === "licenses"
        ? action === "edit"
          ? [...limits, reason]
          : action === "renew"
            ? [
                {
                  name: "expires_at",
                  label: "Nuevo vencimiento",
                  type: "datetime-local",
                  required: true,
                },
                reason,
              ]
            : [reason]
        : action === "update"
          ? [
              {
                name: "priority",
                label: "Prioridad",
                required: true,
                options: priorities,
              },
              {
                name: "assigned_to",
                label: "Responsable (vacío = sin asignar)",
                options: toOptions(choice.options.staff, (r) => r.name),
              },
            ]
          : [reason];
  async function mutate(payload: Record<string, any>) {
    await office({
      module,
      action: "mutate",
      operation: action,
      payload: { id, ...payload },
    });
    notify("Cambio guardado en el historial.");
    reload();
  }
  if (loading) return <Loading />;
  if (error || !r)
    return (
      <div className="office-layout">
        <Link className="text-link" to={base}>
          <ArrowLeft size={16} />
          Volver al listado
        </Link>
        <p className="error" role="alert">
          {error || "Registro no encontrado."}
        </p>
        <button className="button secondary" onClick={reload}>
          Reintentar
        </button>
      </div>
    );
  const effective = r.effective_status || r.status;
  const initial =
    action === "renew"
      ? {
          expires_at: localInput(
            new Date(
              Math.max(
                Date.parse(r.expires_at || "") || Date.now(),
                Date.now(),
              ) +
                30 * 86400000,
            ).toISOString(),
          ),
        }
      : { ...r, expires_at: localInput(r.expires_at) };
  return (
    <div className="office-layout">
      <Link className="text-link back-link" to={base}>
        <ArrowLeft size={16} /> Volver a {paths[module]}
      </Link>
      <div className="office-heading">
        <PageHeading
          eyebrow={shortId(r.id)}
          title={r.subject || r.product_name}
        >
          {module === "orders"
            ? "Detalle del pedido"
            : module === "licenses"
              ? "Detalle de licencia"
              : "Detalle de soporte"}{" "}
          · {dateTime(r.created_at)}
        </PageHeading>
        <StatePill state={r.archived_at ? "Archivada" : effective} />
      </div>
      <div className="office-detail-grid">
        <div className="detail-primary">
          <section className="bento-card">
            <h2>
              {module === "orders"
                ? "Resumen del pedido"
                : module === "licenses"
                  ? "Datos de la licencia"
                  : "Datos de la solicitud"}
            </h2>
            <InfoGrid
              items={[
                {
                  label: "Cliente",
                  value: admin ? (
                    <Link
                      className="text-link"
                      to={`/admin/clientes/${r.user_id}`}
                    >
                      {r.customer_name || r.buyer_name || "Cliente"}
                    </Link>
                  ) : (
                    r.customer_name || "Mi cuenta"
                  ),
                },
                ...(admin
                  ? [{ label: "Correo", value: r.customer_email }]
                  : []),
                {
                  label: "Identificador",
                  value: <span className="long-id">{r.id}</span>,
                },
                ...(module === "orders"
                  ? [
                      { label: "Plan", value: r.plan_name || "Plan Empresa" },
                      { label: "Moneda", value: r.currency || "PEN" },
                      { label: "Cantidad", value: r.quantity || 1 },
                      {
                        label: "Precio unitario",
                        value: money(r.unit_price ?? r.amount),
                      },
                      {
                        label: "Subtotal",
                        value: money(r.subtotal ?? r.amount),
                      },
                      {
                        label: "Impuestos registrados",
                        value: money(r.tax || 0),
                      },
                      {
                        label: "Total histórico",
                        value: (
                          <strong className="detail-total">
                            {money(r.amount)}
                          </strong>
                        ),
                      },
                    ]
                  : module === "licenses"
                    ? [
                        { label: "Plan", value: r.plan_name || "Plan Empresa" },
                        {
                          label: "Origen",
                          value:
                            r.source === "payment"
                              ? "Pago confirmado"
                              : "Emisión manual",
                        },
                        {
                          label: "Inicio",
                          value: dateTime(r.starts_at || r.created_at),
                        },
                        {
                          label: "Vencimiento",
                          value: r.expires_at
                            ? dateTime(r.expires_at)
                            : "Sin vencimiento",
                        },
                        {
                          label: "Usuarios permitidos",
                          value: r.user_limit || 5,
                        },
                        {
                          label: "Activaciones permitidas",
                          value: r.activation_limit || 1,
                        },
                        {
                          label: "Pedido relacionado",
                          value: r.order_id ? (
                            <Link
                              className="text-link"
                              to={`/${admin ? "admin" : "cuenta"}/pedidos/${r.order_id}`}
                            >
                              {shortId(r.order_id)}
                            </Link>
                          ) : (
                            "Sin pedido · manual"
                          ),
                        },
                      ]
                    : [
                        {
                          label: "Prioridad",
                          value: <StatePill state={r.priority || "normal"} />,
                        },
                        {
                          label: "Responsable",
                          value: r.assigned_name || "Sin asignar",
                        },
                        {
                          label: "Última actividad",
                          value: dateTime(r.updated_at || r.created_at),
                        },
                        { label: "Resolución", value: dateTime(r.resolved_at) },
                        {
                          label: "Licencia relacionada",
                          value: r.license_id ? (
                            <Link
                              className="text-link"
                              to={`/${admin ? "admin" : "cuenta"}/licencias/${r.license_id}`}
                            >
                              {shortId(r.license_id)}
                            </Link>
                          ) : (
                            "Sin licencia asociada"
                          ),
                        },
                      ]),
              ]}
            />
            {admin && module === "licenses" && r.notes && (
              <div className="internal-note">
                <strong>Nota administrativa</strong>
                <p>{r.notes}</p>
              </div>
            )}
          </section>
          {module === "orders" && (
            <>
              <section className="bento-card">
                <h2>Pagos y devoluciones</h2>
                {!(data?.payments?.length || data?.refunds?.length) ? (
                  <p className="muted">
                    No se han registrado movimientos. El pedido no habilita una
                    licencia hasta confirmar el pago.
                  </p>
                ) : (
                  <div className="payment-movements">
                    {[
                      ...(data?.payments || []).map((p) => ({
                        ...p,
                        kind: "Pago confirmado · manual",
                      })),
                      ...(data?.refunds || []).map((p) => ({
                        ...p,
                        kind: "Devolución registrada · manual",
                      })),
                    ].map((p: OfficeRow) => (
                      <article key={p.id}>
                        <div className="row">
                          <strong>{p.kind}</strong>
                          <b>{money(p.amount)}</b>
                        </div>
                        <p>Referencia: {p.reference}</p>
                        <small className="muted">
                          {dateTime(p.created_at)}
                        </small>
                        {admin && p.reason && (
                          <p className="internal-note">{p.reason}</p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
              <section className="bento-card">
                <h2>Licencias relacionadas</h2>
                {data?.licenses?.length ? (
                  <div className="related-records">
                    {data.licenses.map((l) => (
                      <Link
                        key={l.id}
                        to={`/${admin ? "admin" : "cuenta"}/licencias/${l.id}`}
                      >
                        <KeyRound size={18} />
                        <span>
                          {l.product_name}
                          <small>{shortId(l.id)}</small>
                        </span>
                        <StatePill state={l.status} />
                        <ArrowRight size={16} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="muted">
                    Todavía no se ha emitido una licencia para este pedido.
                  </p>
                )}
              </section>
            </>
          )}
          {module === "tickets" && (
            <TicketConversation
              ticket={r}
              messages={data?.messages || []}
              admin={admin}
              reload={reload}
            />
          )}
          <AuditTimeline
            history={data?.history || []}
            title={admin ? "Historial y auditoría" : "Seguimiento"}
          />
        </div>
        <aside className="detail-secondary">
          <section className="bento-card action-panel">
            <h2>{admin ? "Gestionar" : "Acciones"}</h2>
            {admin && module === "orders" && (
              <>
                {r.status === "pending" && (
                  <>
                    <button
                      className="button"
                      onClick={() => setAction("confirm_payment")}
                    >
                      Registrar pago recibido
                    </button>
                    <button
                      className="button secondary danger-text"
                      onClick={() => setAction("cancel")}
                    >
                      Cancelar pedido
                    </button>
                  </>
                )}
                {r.status === "paid" && (
                  <button
                    className="button secondary"
                    onClick={() => setAction("refund_manual")}
                  >
                    Registrar devolución externa
                  </button>
                )}
                <button
                  className="button secondary"
                  onClick={() => setAction("note")}
                >
                  Añadir nota interna
                </button>
                <p className="muted small">
                  Registrar un pago o devolución no ejecuta movimientos
                  bancarios. Indica una referencia verificable y el motivo.
                </p>
              </>
            )}
            {admin && module === "licenses" && (
              <>
                {r.archived_at ? (
                  <button
                    className="button"
                    onClick={() => setAction("restore")}
                  >
                    Restaurar licencia
                  </button>
                ) : (
                  <>
                    <button
                      className="button"
                      onClick={() => setAction("edit")}
                    >
                      Editar límites y plan
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => setAction("renew")}
                    >
                      Renovar vigencia
                    </button>
                    {effective === "active" ? (
                      <button
                        className="button secondary"
                        onClick={() => setAction("suspend")}
                      >
                        Suspender
                      </button>
                    ) : (
                      <button
                        className="button secondary"
                        onClick={() => setAction("reactivate")}
                      >
                        Reactivar
                      </button>
                    )}
                    {r.status !== "revoked" && (
                      <button
                        className="button secondary danger-text"
                        onClick={() => setAction("revoke")}
                      >
                        Revocar licencia
                      </button>
                    )}
                    <button
                      className="button secondary"
                      onClick={() => setAction("archive")}
                    >
                      Archivar
                    </button>
                  </>
                )}
                <p className="muted small">
                  Cada cambio requiere un motivo. Archivar conserva la licencia
                  y su historial.
                </p>
              </>
            )}
            {module === "tickets" && (
              <>
                {admin && (
                  <button
                    className="button secondary"
                    onClick={() => setAction("update")}
                  >
                    Asignar / cambiar prioridad
                  </button>
                )}
                {admin && r.status === "open" && (
                  <button
                    className="button secondary"
                    onClick={() => setAction("progress")}
                  >
                    Comenzar atención
                  </button>
                )}
                {admin && ["open", "in_progress"].includes(r.status) && (
                  <button
                    className="button"
                    onClick={() => setAction("resolve")}
                  >
                    Marcar resuelto
                  </button>
                )}
                {["resolved", "closed"].includes(r.status) ? (
                  <button
                    className="button secondary"
                    onClick={() => setAction("reopen")}
                  >
                    Reabrir solicitud
                  </button>
                ) : (
                  <button
                    className="button secondary"
                    onClick={() => setAction("close")}
                  >
                    Cerrar solicitud
                  </button>
                )}
              </>
            )}
            {!admin && module !== "tickets" && (
              <>
                <p className="muted">¿Necesitas ayuda con este registro?</p>
                <Link className="button secondary" to="/cuenta/soporte?new=1">
                  <LifeBuoy size={18} /> Solicitar soporte
                </Link>
              </>
            )}
          </section>
        </aside>
      </div>
      {action && (
        <MutationDialog
          title={titlesAction[action]}
          description={
            action === "confirm_payment"
              ? "Confirma únicamente un pago ya recibido. La licencia mensual se emitirá una sola vez junto con el cambio del pedido."
              : action === "refund_manual"
                ? "Registra una devolución total ya realizada por un medio externo. El pedido se marcará devuelto y su licencia será revocada."
                : undefined
          }
          fields={actionFields}
          initial={initial}
          save={mutate}
          close={close}
        />
      )}
    </div>
  );
}

function TicketConversation({
  ticket,
  messages,
  admin,
  reload,
}: {
  ticket: OfficeRow;
  messages: OfficeRow[];
  admin: boolean;
  reload: () => void;
}) {
  const [message, setMessage] = useState(""),
    [internal, setInternal] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await office({
        module: "tickets",
        action: "mutate",
        operation: "reply",
        payload: { id: ticket.id, message, internal: admin && internal },
      });
      setMessage("");
      setInternal(false);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="bento-card conversation">
      <h2>Conversación</h2>
      <article className="message-bubble">
        <div>
          <strong>{ticket.customer_name || "Cliente"}</strong>
          <time>{dateTime(ticket.created_at)}</time>
        </div>
        <p>{ticket.message}</p>
      </article>
      {messages.map((m) => (
        <article
          className={`message-bubble ${m.internal ? "internal" : ""}`}
          key={m.id}
        >
          <div>
            <strong>{m.author_name || "Usuario"}</strong>
            <time>{dateTime(m.created_at)}</time>
          </div>
          {m.internal && (
            <span className="internal-tag">
              Nota interna · solo administradores
            </span>
          )}
          <p>{m.body}</p>
        </article>
      ))}
      {ticket.status === "closed" ? (
        <p className="muted">
          Reabre la solicitud para continuar la conversación.
        </p>
      ) : (
        <form onSubmit={(e) => void submit(e)}>
          <label>
            {internal ? "Nota interna" : "Tu respuesta"}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minLength={2}
              maxLength={5000}
              required
              rows={4}
              placeholder="Escribe aquí…"
            />
          </label>
          {admin && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
              />{" "}
              Solo administradores (nota interna)
            </label>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            <Send size={16} />
            {busy
              ? "Enviando…"
              : internal
                ? "Guardar nota interna"
                : "Enviar respuesta"}
          </button>
        </form>
      )}
    </section>
  );
}

export function PublicSupport() {
  const { user, authReady } = useApp();
  if (!authReady) return <Loading />;
  return (
    <div className="container info-page">
      {user || demoMode ? (
        <OfficeList module="tickets" admin={false} />
      ) : (
        <>
          <PageHeading
            eyebrow="ESTAMOS CONTIGO"
            title="Hagamos simple el siguiente paso."
          >
            Inicia sesión para crear una solicitud, conversar con soporte y
            seguir su estado.
          </PageHeading>
          <Link className="button" to="/acceso?next=/cuenta/soporte">
            Iniciar sesión <ArrowRight size={17} />
          </Link>
        </>
      )}
    </div>
  );
}
