import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock,
  Eye,
  FlaskConical,
  Globe,
  Monitor,
  RefreshCw,
  Smartphone,
  Users,
} from "lucide-react";
import { Loading, PageHeading } from "../components";
import { useRemote } from "../lib/useRemote";
import { dateTime } from "../lib/office";
export type TrafficReport = {
  source: string;
  started_at: string | null;
  generated_at: string;
  days: number;
  metrics: {
    views: number;
    sessions: number;
    starts: number;
    completions: number;
    consults: number;
    recent_sessions: number;
  };
  series: { day: string; views: number; sessions: number }[];
  pages: { path: string; views: number }[];
  sources: { source: string; sessions: number }[];
  devices: { device: string; sessions: number }[];
  demos: {
    path: string;
    starts: number;
    completions: number;
    consults: number;
  }[];
};
const names: Record<string, string> = {
  "/": "Inicio",
  "/servicios": "Servicios",
  "/demos": "Galería de demos",
  "/demo/ventas": "Demo de Ventas",
  "/demo/reservas": "Demo de Reservas",
  "/como-funciona": "Cómo funciona",
  "/terminos": "Términos y privacidad",
};
const pageName = (path: string) =>
  names[path] ||
  (/^\/producto\/[a-z0-9-]+$/.test(path)
    ? `Producto · ${path.split("/").at(-1)}`
    : "Página pública");
const number = (n: number) => Number(n || 0).toLocaleString("es-PE");
export function TrafficDashboard() {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useRemote<TrafficReport>("office", {
    module: "traffic",
    days,
  });
  const metrics = data?.metrics;
  const max = Math.max(1, ...(data?.series || []).map((s) => Number(s.views)));
  return (
    <div className="office-layout traffic-dashboard">
      <div className="office-heading">
        <PageHeading
          eyebrow="LO QUE PASA EN TU PÁGINA"
          title="Visitas y demos, de un vistazo."
        >
          Conoce qué páginas se exploran y cómo se usan tus demostraciones.
        </PageHeading>
        <div className="range-picker">
          <label>
            Periodo
            <select
              aria-label="Periodo"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </label>
          <button
            className="button secondary"
            disabled={loading}
            onClick={reload}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </div>
      {error ? (
        <div className="error" role="alert">
          No pudimos cargar las visitas. {error}{" "}
          <button className="text-link button-plain" onClick={reload}>
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <Loading />
      ) : (
        data &&
        metrics && (
          <>
            <div className="traffic-source-note">
              <Globe size={20} />
              <div>
                <strong>
                  {data.source === "demo"
                    ? "Vista de ejemplo · sin tráfico de producción"
                    : "Medición propia de Karpanda"}
                </strong>
                <p>
                  {data.started_at
                    ? `Disponible desde ${dateTime(data.started_at)}. `
                    : ""}
                  Solo incluye actividad aceptada por los visitantes desde esta
                  actualización. No importa el historial de Google Analytics.
                </p>
              </div>
            </div>
            <div className="traffic-metrics">
              {[
                {
                  label: "Páginas vistas",
                  value: metrics.views,
                  Icon: Eye,
                  help: "Cada página pública visitada con permiso.",
                },
                {
                  label: "Sesiones del periodo",
                  value: metrics.sessions,
                  Icon: Users,
                  help: "Sesiones del navegador; no personas únicas.",
                },
                {
                  label: "Demos iniciadas",
                  value: metrics.starts,
                  Icon: FlaskConical,
                  help: "Veces que se comenzó un recorrido.",
                },
                {
                  label: "Recorridos completados",
                  value: metrics.completions,
                  Icon: CheckCircle2,
                  help: "Ventas o reservas ficticias confirmadas.",
                },
              ].map((m) => (
                <article className="bento-card metric-card" key={m.label}>
                  <m.Icon size={22} />
                  <span>{m.label}</span>
                  <strong>{number(m.value)}</strong>
                  <small className="muted">{m.help}</small>
                </article>
              ))}
            </div>
            <div className="traffic-content-grid">
              <section className="bento-card traffic-chart-card">
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">DÍA A DÍA · HORA DE PERÚ</p>
                    <h2>Páginas vistas</h2>
                  </div>
                  <span className="state-pill state-active">
                    <Clock size={12} />
                    {number(metrics.recent_sessions)} sesiones en 30 min
                  </span>
                </div>
                {data.series.some((s) => Number(s.views) > 0) ? (
                  <>
                    <div
                      className="traffic-chart"
                      role="img"
                      aria-label={`Páginas vistas por día; máximo ${max}`}
                    >
                      <span className="traffic-chart-max">{number(max)}</span>
                      <div>
                        {data.series.map((s) => (
                          <div
                            className="traffic-chart-column"
                            key={s.day}
                            title={`${s.day}: ${s.views} páginas vistas`}
                          >
                            <span
                              style={{
                                height: `${(Number(s.views) / max) * 100}%`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="chart-dates">
                      <span>{data.series[0]?.day}</span>
                      <span>{data.series.at(-1)?.day}</span>
                    </div>
                  </>
                ) : (
                  <div className="traffic-empty">
                    <ChartNoAxesCombined size={36} />
                    <h3>Aquí empieza tu historial de visitas.</h3>
                    <p>
                      Cuando alguien acepte la medición y navegue por la web,
                      verás su actividad agregada.
                    </p>
                    <Link className="text-link" to="/demos">
                      Abrir las demos <ArrowUpRight size={15} />
                    </Link>
                  </div>
                )}
                <details className="data-disclosure">
                  <summary>Ver cifras de cada día</summary>
                  <div className="daily-totals">
                    {data.series.map((s) => (
                      <article key={s.day}>
                        <strong>{s.day}</strong>
                        <dl>
                          <div>
                            <dt>Páginas vistas</dt>
                            <dd>{number(s.views)}</dd>
                          </div>
                          <div>
                            <dt>Sesiones</dt>
                            <dd>{number(s.sessions)}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </details>
              </section>
              <section className="bento-card">
                <div className="card-heading">
                  <h2>Las páginas más exploradas</h2>
                  <Eye size={20} />
                </div>
                {data.pages.length ? (
                  <ol className="traffic-ranking">
                    {data.pages.map((p, i) => (
                      <li key={p.path}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <Link to={p.path}>
                          <strong>{pageName(p.path)}</strong>
                          <small>{p.path}</small>
                        </Link>
                        <b>{number(p.views)}</b>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="muted empty-copy">
                    Todavía no hay páginas medidas en este periodo.
                  </p>
                )}
              </section>
              <section className="bento-card">
                <div className="card-heading">
                  <h2>¿De dónde llegan?</h2>
                  <Globe size={20} />
                </div>
                <TrafficBreakdown
                  items={data.sources.map((s) => ({
                    label:
                      (
                        {
                          direct: "Acceso directo",
                          search: "Buscadores",
                          social: "Redes sociales",
                          referral: "Otros sitios",
                        } as Record<string, string>
                      )[s.source] || "Otros sitios",
                    value: s.sessions,
                  }))}
                />
                <p className="muted small">
                  Origen de la sesión, sin guardar direcciones completas ni
                  búsquedas.
                </p>
              </section>
              <section className="bento-card">
                <div className="card-heading">
                  <h2>¿Desde qué pantallas?</h2>
                  <Monitor size={20} />
                </div>
                <TrafficBreakdown
                  items={data.devices.map((s) => ({
                    label:
                      (
                        {
                          mobile: "Teléfono",
                          tablet: "Tableta",
                          desktop: "Computadora",
                        } as Record<string, string>
                      )[s.device] || "Otra pantalla",
                    value: s.sessions,
                  }))}
                />
              </section>
            </div>
            <section className="bento-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">DEL INTERÉS A LA EXPERIENCIA</p>
                  <h2>Cómo se usan tus demos</h2>
                </div>
                <Link className="text-link" to="/demos">
                  Abrir galería <ArrowRight size={16} />
                </Link>
              </div>
              <div className="traffic-demo-grid">
                {["/demo/ventas", "/demo/reservas"].map((path) => {
                  const row = data.demos.find((d) => d.path === path);
                  return (
                    <article key={path}>
                      <span className="demo-live-label">
                        <FlaskConical size={14} />
                        INTERACTIVA
                      </span>
                      <h3>{pageName(path)}</h3>
                      <dl>
                        <div>
                          <dt>Recorridos iniciados</dt>
                          <dd>{number(row?.starts || 0)}</dd>
                        </div>
                        <div>
                          <dt>Recorridos completados</dt>
                          <dd>{number(row?.completions || 0)}</dd>
                        </div>
                        <div>
                          <dt>Clics para conocer la solución</dt>
                          <dd>{number(row?.consults || 0)}</dd>
                        </div>
                      </dl>
                      <Link className="text-link" to={path}>
                        Probar demo <ArrowUpRight size={15} />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
            <p className="muted small traffic-footnote">
              Actualizado: {dateTime(data.generated_at)}. Una sesión se renueva
              tras 30 minutos de inactividad o al cambiar de día. Los
              bloqueadores, la falta de conexión y las visitas sin permiso no se
              incluyen. Los clics de consulta indican interés, no ventas.
            </p>
          </>
        )
      )}
    </div>
  );
}
function TrafficBreakdown({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const total = items.reduce((n, s) => n + Number(s.value), 0);
  return total ? (
    <div className="traffic-breakdown">
      {items.map((s) => (
        <div key={s.label}>
          <div>
            <span>{s.label}</span>
            <strong>
              {number(s.value)}{" "}
              <small>{Math.round((Number(s.value) / total) * 100)}%</small>
            </strong>
          </div>
          <span className="traffic-breakdown-track">
            <i style={{ width: `${(Number(s.value) / total) * 100}%` }} />
          </span>
        </div>
      ))}
    </div>
  ) : (
    <p className="muted empty-copy">Aún no hay sesiones registradas.</p>
  );
}
