import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  LifeBuoy,
  Plus,
} from "lucide-react";
import { Badge, Empty, Loading, PageHeading, Status } from "../components";
import { useApp } from "../context";
import { createTicket, loadOrders, money, readDemo } from "../lib/data";
import { demoMode, supabase } from "../lib/supabase";
import type { License, Order, Ticket } from "../types";
export function useOrders(admin = false) {
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    void loadOrders(admin)
      .then((d) => {
        if (alive) setOrders(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [admin, user?.id]);
  return { orders, loading, error };
}
export function useLicenses() {
  const { user } = useApp();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        if (demoMode) {
          const orders = readDemo<Order[]>("orders", []);
          if (alive)
            setLicenses(
              orders
                .filter(
                  (o, i, a) =>
                    a.findIndex((v) => v.product_id === o.product_id) === i,
                )
                .map((o) => ({
                  id: `DEMO-${o.id.slice(0, 8).toUpperCase()}`,
                  product_id: o.product_id,
                  product_name: o.product_name,
                  status: "active",
                  expires_at: null,
                })),
            );
        } else if (supabase && user) {
          const { data, error } = await supabase
            .from("kp_licenses")
            .select(
              "id,product_id,product_name,status,expires_at,starts_at,archived_at,plan_name,user_limit,kp_products(app_url)",
            )
            .eq("user_id", user.id)
            .is("archived_at", null)
            .order("created_at", { ascending: false });
          if (error) throw error;
          if (alive)
            setLicenses(
              data.map((l) => ({
                ...l,
                product_name: l.product_name,
                app_url: (Array.isArray(l.kp_products)
                  ? l.kp_products[0]
                  : l.kp_products
                )?.app_url,
              })),
            );
        }
      } catch (e) {
        if (alive)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudieron consultar las licencias.",
          );
      } finally {
        if (alive) setLoading(false);
      }
    }
    void run();
    return () => {
      alive = false;
    };
  }, [user?.id]);
  return { licenses, error, loading };
}
export function ClientHome() {
  const { licenses, loading, error } = useLicenses();
  const { notify } = useApp();
  const { orders } = useOrders();
  function access(l: License) {
    if (demoMode) {
      notify(
        "Vista de demostración. El software adquirido se abrirá al configurar su dirección y activar la licencia.",
      );
      return;
    }
    const url = l.app_url;
    if (url && /^https:\/\//.test(url))
      window.open(url, "_blank", "noopener,noreferrer");
    else
      notify(
        "Tu producto aún no tiene una dirección de acceso configurada. Contacta con soporte.",
      );
  }
  return (
    <>
      <PageHeading title="Hola, tu próximo paso empieza aquí.">
        Gestiona tus herramientas, suscripciones y soporte.
      </PageHeading>
      {demoMode && <Badge>Estás explorando una demostración</Badge>}
      <h2 className="section-title">Mi software</h2>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : licenses.length ? (
        <div className="license-list">
          {licenses.map((l) => (
            <article className="panel license software-access-card" key={l.id}>
              <div>
                <Status status={demoMode ? "demo" : l.status} />
                <h2>
                  {demoMode ? (
                    l.product_name
                  ) : (
                    <Link
                      className="record-main-link"
                      to={`/cuenta/licencias/${l.id}`}
                      aria-label={`Ver detalle: ${l.product_name}`}
                    >
                      {l.product_name}
                    </Link>
                  )}
                </h2>
                <p className="muted">
                  {l.plan_name || "Plan Empresa"} · hasta {l.user_limit || 5}{" "}
                  usuarios
                </p>
                <p className="small muted">Licencia: {l.id}</p>
                <p className="green small">
                  {l.expires_at
                    ? `Vigente hasta ${new Date(l.expires_at).toLocaleDateString("es-PE")}`
                    : demoMode
                      ? "Suscripción de demostración"
                      : "Sin fecha de vencimiento registrada"}
                </p>
              </div>
              <div className="license-actions">
                <button
                  className="button"
                  disabled={
                    l.status !== "active" ||
                    (!!l.starts_at && Date.parse(l.starts_at) > Date.now()) ||
                    (!!l.expires_at && Date.parse(l.expires_at) < Date.now())
                  }
                  onClick={() => access(l)}
                >
                  Abrir mi software <ArrowUpRight size={16} />
                </button>
                <Link className="button secondary" to="/cuenta/descargas">
                  Descargas
                </Link>
                {!demoMode && (
                  <Link className="text-link" to={`/cuenta/licencias/${l.id}`}>
                    Ver detalle de licencia
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Tu próximo software te espera">
          <p>Cuando tu licencia esté activa, aparecerá aquí.</p>
          <Link className="button" to="/">
            Explorar catálogo <ArrowRight size={16} />
          </Link>
        </Empty>
      )}
      <div className="two-panels">
        <section className="soft-panel">
          <h2>Estamos contigo.</h2>
          <p className="muted">
            Encuentra guías o crea una solicitud
            <br />
            asociada a tu producto.
          </p>
          <Link className="button secondary" to="/cuenta/soporte">
            Solicitar soporte
          </Link>
        </section>
        <section className="soft-panel">
          <h2>Último pedido</h2>
          {orders[0] ? (
            <>
              <p className="muted">
                {orders[0].product_name} · {orders[0].id.slice(0, 8)}
              </p>
              <div className="row">
                <strong className="price">{money(orders[0].amount)}</strong>
                <Status status={orders[0].status} />
              </div>
            </>
          ) : (
            <>
              <p className="muted">Aún no has registrado pedidos.</p>
              <Link className="text-link" to="/">
                Encuentra tu solución <ArrowRight size={16} />
              </Link>
            </>
          )}
        </section>
      </div>
    </>
  );
}
export function Orders({ admin = false }: { admin?: boolean }) {
  const { orders, loading, error } = useOrders(admin);
  return (
    <>
      <PageHeading title={admin ? "Pedidos de la tienda" : "Mis pedidos"}>
        Consulta el estado y el detalle de cada pedido.
      </PageHeading>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : orders.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Producto</th>
                <th>Fecha</th>
                <th>Importe</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span title={o.id}>{o.id.slice(0, 8).toUpperCase()}</span>
                  </td>
                  <td>{o.product_name}</td>
                  <td>{new Date(o.created_at).toLocaleDateString("es-PE")}</td>
                  <td>{money(o.amount)}</td>
                  <td>
                    <Status status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="Aún no hay pedidos">
          <Link className="button secondary" to="/">
            Ir al catálogo
          </Link>
        </Empty>
      )}
      {!demoMode && (
        <p className="muted small">
          Los pedidos pendientes no habilitan licencias. La confirmación de pago
          se realiza por el servidor al integrar la pasarela.
        </p>
      )}
    </>
  );
}
type Release = {
  id: string;
  product_id: string;
  version: string;
  storage_path: string;
  created_at: string;
};
export function Downloads() {
  const { notify } = useApp();
  const { licenses } = useLicenses();
  const [releases, setReleases] = useState<Release[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase
      .from("kp_releases")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (alive) {
          if (error) setError(error.message);
          else setReleases(data || []);
        }
      });
    return () => {
      alive = false;
    };
  }, []);
  async function download(r: Release) {
    setBusy(r.id);
    try {
      const { data, error } = await supabase!.storage
        .from("kp-downloads")
        .createSignedUrl(r.storage_path, 60);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "No se pudo generar la descarga.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageHeading title="Tus descargas, siempre a mano.">
        Versiones autorizadas de tus productos.
      </PageHeading>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {releases.length ? (
        <div className="license-list">
          {releases.map((r) => (
            <div className="panel row" key={r.id}>
              <div>
                <h2>
                  {licenses.find((l) => l.product_id === r.product_id)
                    ?.product_name || "Software"}
                </h2>
                <p className="muted">Versión {r.version}</p>
              </div>
              <button
                className="button secondary"
                disabled={busy === r.id}
                onClick={() => void download(r)}
              >
                <Download size={16} />{" "}
                {busy === r.id ? "Preparando…" : "Descargar"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="No hay archivos publicados todavía">
          <p>
            Si tu producto incluye instaladores, aparecerán aquí cuando estén
            disponibles.
          </p>
          <Link className="text-link" to="/cuenta/soporte">
            Consultar con soporte <ArrowRight size={16} />
          </Link>
        </Empty>
      )}
    </>
  );
}
export function Support({ admin = false }: { admin?: boolean }) {
  const { user, notify } = useApp();
  const location = useLocation();
  const publicPage = !location.pathname.startsWith("/cuenta") && !admin;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const reload = useCallback(async () => {
    if (demoMode) {
      setTickets(readDemo<Ticket[]>("tickets", []));
      return;
    }
    if (!supabase || !user) return;
    let q = supabase
      .from("kp_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (!admin) q = q.eq("user_id", user.id);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setTickets(data as Ticket[]);
  }, [user?.id, admin]);
  useEffect(() => {
    void reload();
  }, [reload]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await createTicket(
        String(data.get("subject")).trim(),
        String(data.get("message")).trim(),
        user?.id,
      );
      form.reset();
      await reload();
      notify(
        demoMode
          ? "Solicitud guardada en esta demostración."
          : "Tu solicitud se envió correctamente.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo enviar la solicitud.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function closeTicket(id: string) {
    const { error } = await supabase!
      .from("kp_tickets")
      .update({ status: "closed" })
      .eq("id", id);
    if (error) setError(error.message);
    else await reload();
  }
  return (
    <div className={publicPage ? "container info-page" : ""}>
      <PageHeading
        eyebrow="ESTAMOS CONTIGO"
        title={
          admin ? "Solicitudes de soporte" : "Hagamos simple el siguiente paso."
        }
      >
        Cuéntanos qué necesitas. Tu consulta queda asociada a tu cuenta.
      </PageHeading>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!admin && (demoMode || user) ? (
        <form className="panel support-form" onSubmit={(e) => void submit(e)}>
          <h2>
            <LifeBuoy size={22} /> Crear una solicitud
          </h2>
          <label>
            Asunto
            <input
              name="subject"
              placeholder="¿En qué podemos ayudarte?"
              required
              minLength={3}
              maxLength={160}
            />
          </label>
          <label>
            Tu mensaje
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={5000}
              rows={5}
              placeholder="Cuéntanos sobre tu producto o tu consulta…"
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Enviando…" : "Enviar solicitud"}
            <ArrowRight size={16} />
          </button>
        </form>
      ) : !admin ? (
        <div className="notice">
          <p>Inicia sesión para enviar y consultar tus solicitudes.</p>
          <Link className="button" to="/acceso?next=/cuenta/soporte">
            Iniciar sesión
          </Link>
        </div>
      ) : null}
      {tickets.length > 0 && (
        <section className="ticket-list">
          <h2>{admin ? "Todas las solicitudes" : "Mis solicitudes"}</h2>
          {tickets.map((t) => (
            <article key={t.id} className="panel">
              <div className="row">
                <h3>{t.subject}</h3>
                <Status status={t.status} />
              </div>
              <p className="ticket-message muted">{t.message}</p>
              <small className="muted">
                {new Date(t.created_at).toLocaleString("es-PE")}
              </small>
              {admin && supabase && t.status === "open" && (
                <button
                  className="button secondary"
                  onClick={() => void closeTicket(t.id)}
                >
                  Marcar resuelto
                </button>
              )}
            </article>
          ))}
        </section>
      )}
      {admin && !tickets.length && (
        <Empty title="No hay solicitudes pendientes" />
      )}
    </div>
  );
}
export function Profile() {
  const { user, notify } = useApp();
  function reset() {
    ["orders", "tickets", "products"].forEach((k) =>
      localStorage.removeItem(`karpanda:v1:${k}`),
    );
    window.location.assign("/cuenta");
  }
  return (
    <>
      <PageHeading title="Mi cuenta">Tu espacio en Karpanda.</PageHeading>
      <section className="panel profile">
        <h2>{user?.user_metadata?.name || "Visitante de demostración"}</h2>
        <p className="muted">
          {user?.email || "No se ha creado una cuenta real."}
        </p>
        {demoMode ? (
          <>
            <p>
              Los pedidos y solicitudes de esta demostración se guardan
              únicamente en este navegador.
            </p>
            <button className="button secondary" onClick={reset}>
              Restablecer demostración
            </button>
          </>
        ) : (
          <button
            className="button secondary"
            onClick={() =>
              void supabase!.auth.signOut().then(({ error }) => {
                if (error) notify(error.message);
              })
            }
          >
            Cerrar sesión
          </button>
        )}
        <Link className="text-link" to="/terminos">
          Términos y privacidad <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
