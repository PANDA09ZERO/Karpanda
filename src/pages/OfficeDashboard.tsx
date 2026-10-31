import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Clock,
  KeyRound,
  LifeBuoy,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Loading, PageHeading } from "../components";
import { dateOnly, dateTime, shortId, type OfficeRow } from "../lib/office";
import { money } from "../lib/data";
import { useRemote } from "../lib/useRemote";
import { activityTitle } from "../lib/activity";
type DashboardData = {
  metrics: Record<string, number>;
  previous: Record<string, number>;
  series: { day: string; gross: number; refunds: number }[];
  top_products: OfficeRow[];
  activity: OfficeRow[];
  expiring: OfficeRow[];
};
function Change({ value, previous }: { value: number; previous: number }) {
  if (!previous)
    return (
      <span className="metric-change muted">
        Sin base anterior para comparar
      </span>
    );
  const delta = Math.round(((value - previous) / Math.abs(previous)) * 100);
  return (
    <span className={`metric-change ${delta >= 0 ? "positive" : "negative"}`}>
      {delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{" "}
      {Math.abs(delta)}% frente al periodo anterior
    </span>
  );
}
const entityPaths: Record<string, string> = {
  orders: "/admin/pedidos",
  licenses: "/admin/licencias",
  tickets: "/admin/soporte",
  users: "/admin/usuarios",
  products: "/admin/productos",
};
export function OfficeDashboard() {
  const [period, setPeriod] = useState("30"),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const range = useMemo(() => {
    const to = new Date();
    to.setHours(24, 0, 0, 0);
    const from = new Date(to);
    from.setDate(from.getDate() - Number(period === "custom" ? 30 : period));
    return {
      from:
        period === "custom" && start
          ? new Date(start + "T00:00:00").toISOString()
          : from.toISOString(),
      to:
        period === "custom" && end
          ? new Date(
              new Date(end + "T00:00:00").getTime() + 86400000,
            ).toISOString()
          : to.toISOString(),
    };
  }, [period, start, end]);
  const { data, loading, error, reload } = useRemote<DashboardData>("office", {
    module: "dashboard",
    ...range,
  });
  const p = new URLSearchParams(range).toString();
  const financial = `/admin/pedidos?${p}&periodField=financial`;
  const metrics = data?.metrics || {};
  const prev = data?.previous || {};
  const series = data?.series || [];
  const max = Math.max(
    1,
    ...series.flatMap((s) => [Number(s.gross), Number(s.refunds)]),
  );
  return (
    <div className="office-layout dashboard-office">
      <div className="office-heading">
        <PageHeading
          eyebrow="EL PULSO DE TU NEGOCIO"
          title="Tu negocio, de un vistazo."
        >
          Decisiones claras, herramientas conectadas y datos reales.
        </PageHeading>
        <div className="range-picker">
          <label>
            Periodo
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>
          {period === "custom" && (
            <>
              <label>
                Desde
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </label>
              <label>
                Hasta
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
            </>
          )}
        </div>
      </div>
      {error ? (
        <div className="error" role="alert">
          {error}{" "}
          <button className="button-plain text-link" onClick={reload}>
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="dashboard-metrics">
              <Link
                to={financial}
                className="bento-card metric-card revenue-card"
              >
                <span className="metric-icon">
                  <ChartNoAxesCombined size={22} />
                </span>
                <span>Ingresos netos registrados</span>
                <strong>{money(metrics.net || 0)}</strong>
                <Change value={metrics.net || 0} previous={prev.net || 0} />
                <div className="revenue-breakdown">
                  <span>
                    Pagos confirmados <b>{money(metrics.gross || 0)}</b>
                  </span>
                  <span>
                    Devoluciones registradas{" "}
                    <b>{money(metrics.refunds || 0)}</b>
                  </span>
                </div>
                <small>Pagos menos devoluciones del periodo · PEN</small>
              </Link>
              <Link
                to={`/admin/pedidos?${p}`}
                className="bento-card metric-card"
              >
                <ShoppingBag size={21} />
                <span>Pedidos del periodo</span>
                <strong>{metrics.orders || 0}</strong>
                <Change
                  value={metrics.orders || 0}
                  previous={prev.orders || 0}
                />
              </Link>
              <Link
                to={`/admin/clientes?${p}`}
                className="bento-card metric-card"
              >
                <Users size={21} />
                <span>Nuevos clientes</span>
                <strong>{metrics.customers || 0}</strong>
                <Change
                  value={metrics.customers || 0}
                  previous={prev.customers || 0}
                />
              </Link>
              <Link
                to="/admin/licencias?status=active"
                className="bento-card metric-card"
              >
                <KeyRound size={21} />
                <span>Licencias activas ahora</span>
                <strong>{metrics.active_licenses || 0}</strong>
                <small className="muted">Vigentes y sin archivar</small>
              </Link>
              <Link
                to="/admin/soporte?status=pending_support"
                className="bento-card metric-card"
              >
                <LifeBuoy size={21} />
                <span>Tickets por atender</span>
                <strong>{metrics.tickets || 0}</strong>
                <small className="muted">Abiertos y en atención · Ahora</small>
              </Link>
              <Link
                to={`/admin/pedidos?${p}&status=pending`}
                className="bento-card metric-card"
              >
                <Clock size={21} />
                <span>Importe pendiente</span>
                <strong className="money-metric">
                  {money(metrics.pending_amount || 0)}
                </strong>
                <small className="muted">No se incluye en los ingresos</small>
              </Link>
              <Link
                to="/admin/usuarios?status=active"
                className="bento-card metric-card"
              >
                <Users size={21} />
                <span>Cuentas activas</span>
                <strong>{metrics.users || 0}</strong>
                <small className="muted">
                  Administradores y clientes · Ahora
                </small>
              </Link>
            </div>
            <div className="office-bento">
              <section className="bento-card chart-card span-two">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">EVOLUCIÓN DEL PERIODO</p>
                    <h2>Pagos y devoluciones</h2>
                  </div>
                  <span className="chart-legend">
                    <i />
                    Pagos <i className="refund-dot" />
                    Devoluciones
                  </span>
                </div>
                {series.some((s) => Number(s.gross) || Number(s.refunds)) ? (
                  <div
                    className="financial-chart"
                    role="img"
                    aria-label="Importes diarios de pagos confirmados y devoluciones"
                  >
                    <div className="chart-y">
                      <span>{money(max)}</span>
                      <span>{money(max / 2)}</span>
                      <span>S/ 0</span>
                    </div>
                    <div className="financial-bars">
                      {series.map((s) => (
                        <div
                          className="bar-pair"
                          key={s.day}
                          title={`${s.day} · Pagos: ${money(s.gross)} · Devoluciones: ${money(s.refunds)}`}
                        >
                          <span
                            style={{
                              height: `${(Number(s.gross) / max) * 100}%`,
                            }}
                          />
                          <span
                            className="refund-bar"
                            style={{
                              height: `${(Number(s.refunds) / max) * 100}%`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="chart-empty">
                    <ChartNoAxesCombined size={38} />
                    <h3>Tu evolución empieza con el primer pago.</h3>
                    <p>
                      No hay pagos ni devoluciones registrados en este periodo.
                    </p>
                  </div>
                )}
                <div className="chart-dates">
                  <span>{dateOnly(range.from)}</span>
                  <span>
                    {dateOnly(new Date(Date.parse(range.to) - 1).toISOString())}
                  </span>
                </div>
                {series.length > 0 && (
                  <details className="data-disclosure">
                    <summary>Ver importes por día</summary>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Día</th>
                            <th>Pagos</th>
                            <th>Devoluciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {series.map((s) => (
                            <tr key={s.day}>
                              <td>{s.day}</td>
                              <td>{money(s.gross)}</td>
                              <td>{money(s.refunds)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </section>
              <section className="bento-card quick-actions">
                <p className="eyebrow">SIGUIENTE PASO</p>
                <h2>Acciones rápidas</h2>
                <Link to="/admin/usuarios?new=1">
                  <Users size={20} />
                  <span>
                    Crear una cuenta<small>Cliente o administrador</small>
                  </span>
                  <Plus size={16} />
                </Link>
                <Link to="/admin/licencias?new=1">
                  <KeyRound size={20} />
                  <span>
                    Emitir licencia manual
                    <small>Con motivo y trazabilidad</small>
                  </span>
                  <Plus size={16} />
                </Link>
                <Link to="/admin/soporte?unassigned=true">
                  <LifeBuoy size={20} />
                  <span>
                    Tickets sin responsable
                    <small>{metrics.unassigned || 0} por asignar</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
                {metrics.overdue > 0 && (
                  <Link
                    className="attention-link"
                    to="/admin/soporte?overdue=true"
                  >
                    <Clock size={20} />
                    <span>
                      Sin actividad en 48 horas
                      <small>{metrics.overdue} solicitudes</small>
                    </span>
                    <ArrowRight size={16} />
                  </Link>
                )}
              </section>
              <section className="bento-card">
                <div className="card-heading">
                  <h2>Productos con más pagos</h2>
                  <Link className="text-link" to={financial}>
                    <ArrowUpRight size={18} />
                    <span className="sr-only">Ver pedidos financieros</span>
                  </Link>
                </div>
                <p className="muted small">
                  Importes brutos confirmados, antes de devoluciones.
                </p>
                {data.top_products.length ? (
                  <ol className="ranking-list">
                    {data.top_products.map((r, i) => (
                      <li key={r.product_id}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <Link
                          to={`/admin/pedidos?${p}&periodField=financial&product_id=${r.product_id}`}
                        >
                          <strong>{r.product_name}</strong>
                          <small>{r.orders} pedidos confirmados</small>
                        </Link>
                        <b>{money(r.amount)}</b>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted empty-copy">
                    Todavía no hay productos con pagos confirmados.
                  </p>
                )}
              </section>
              <section className="bento-card span-two">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">ANTICÍPATE</p>
                    <h2>Licencias próximas a vencer</h2>
                  </div>
                  <Link
                    className="text-link"
                    to="/admin/licencias?expiring=true"
                  >
                    Ver todas <ArrowRight size={16} />
                  </Link>
                </div>
                {data.expiring.length ? (
                  <div className="expiry-list">
                    {data.expiring.map((r) => (
                      <Link key={r.id} to={`/admin/licencias/${r.id}`}>
                        <div>
                          <strong>{r.product_name}</strong>
                          <small>{r.customer}</small>
                        </div>
                        <span>{dateOnly(r.expires_at)}</span>
                        <ArrowUpRight size={17} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="calm-empty">
                    <KeyRound size={26} />
                    <p>No hay licencias que venzan en los próximos 14 días.</p>
                  </div>
                )}
              </section>
              <section className="bento-card span-three">
                <div className="card-heading">
                  <h2>Actividad reciente</h2>
                  <span className="muted small">
                    Últimos movimientos del sistema
                  </span>
                </div>
                {data.activity.length ? (
                  <div className="dashboard-activity">
                    {data.activity.map((a) => (
                      <Link
                        key={a.id}
                        to={
                          a.entity === "products"
                            ? "/admin/productos"
                            : `${entityPaths[a.entity] || "/admin"}/${a.entity_id}`
                        }
                      >
                        <span className="activity-symbol">
                          <ArrowUpRight size={18} />
                        </span>
                        <div>
                          <strong>
                            {activityTitle(
                              a as import("../lib/office").Activity,
                            )}
                          </strong>
                          <small>
                            {a.actor_name || "Sistema"} · {shortId(a.entity_id)}
                          </small>
                        </div>
                        <time>{dateTime(a.created_at)}</time>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="muted">
                    Las operaciones que registres aparecerán aquí.
                  </p>
                )}
              </section>
            </div>
          </>
        )
      )}
    </div>
  );
}
