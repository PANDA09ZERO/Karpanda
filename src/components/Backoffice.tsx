import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowRight, Check, Filter, Search, X } from "lucide-react";
import { Modal } from "../components";
import { dateTime, label, type Activity, type OfficeRow } from "../lib/office";
import {
  activityNote,
  activityTitle,
  readableChanges,
  readableHistory,
  type PeopleNames,
} from "../lib/activity";

export function StatePill({ state }: { state?: string }) {
  return (
    <span className={`state-pill state-${state || "unknown"}`}>
      {label[state || ""] || state || "—"}
    </span>
  );
}
export type Column = { label: string; render: (row: OfficeRow) => ReactNode };
export function Records({
  items,
  columns,
  base,
  title,
  actions,
}: {
  items: OfficeRow[];
  columns: Column[];
  base: string;
  title: (r: OfficeRow) => string;
  actions?: (r: OfficeRow) => ReactNode;
}) {
  return (
    <>
      <div className="desktop-records table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label}>{c.label}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                {columns.map((c) => (
                  <td key={c.label}>{c.render(r)}</td>
                ))}
                <td>
                  <div className="record-actions">
                    <Link className="text-link" to={`${base}/${r.id}`}>
                      Ver detalle <ArrowRight size={15} />
                    </Link>
                    {actions?.(r)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-records">
        {items.map((r) => (
          <article className="record-card" key={r.id}>
            <div className="record-card-title">
              <Link to={`${base}/${r.id}`}>{title(r)}</Link>
              <ArrowRight size={18} />
            </div>
            <dl>
              {columns.map((c) => (
                <div key={c.label}>
                  <dt>{c.label}</dt>
                  <dd>{c.render(r)}</dd>
                </div>
              ))}
            </dl>
            <div className="record-actions">
              <Link className="button secondary" to={`${base}/${r.id}`}>
                Ver detalle
              </Link>
              {actions?.(r)}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
type SelectFilter = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
};
export function Filters({
  placeholder = "Buscar…",
  statuses,
  extra = [],
  date = true,
  sorts = [
    { value: "created_at.desc", label: "Más recientes" },
    { value: "created_at.asc", label: "Más antiguos" },
  ],
}: {
  placeholder?: string;
  statuses?: { value: string; label: string }[];
  extra?: SelectFilter[];
  date?: boolean;
  sorts?: { value: string; label: string }[];
}) {
  const [params, setParams] = useSearchParams();
  const [advanced, setAdvanced] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = new URLSearchParams(params);
    for (const [k, v] of data.entries()) {
      if (v) next.set(k, String(v));
      else next.delete(k);
    }
    next.delete("page");
    setParams(next);
  }
  return (
    <form className="bento-card filters-panel" onSubmit={submit}>
      <div className="filters-main">
        <label className="search-field">
          <span>Buscar</span>
          <div>
            <Search size={17} />
            <input
              name="q"
              key={params.get("q")}
              defaultValue={params.get("q") || ""}
              placeholder={placeholder}
            />
          </div>
        </label>
        {statuses && (
          <label>
            Estado
            <select
              name="status"
              key={params.get("status")}
              defaultValue={params.get("status") || ""}
            >
              <option value="">Todos</option>
              {statuses.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {extra.map((s) => (
          <label key={s.name}>
            {s.label}
            <select name={s.name} defaultValue={params.get(s.name) || ""}>
              <option value="">Todos</option>
              {s.options.map((o) => (
                <option value={o.value} key={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          className="button secondary filter-toggle"
          onClick={() => setAdvanced(!advanced)}
          aria-expanded={advanced}
        >
          <Filter size={16} /> Filtros
        </button>
        <button className="button">Aplicar</button>
      </div>
      <div className={`filters-advanced ${advanced ? "expanded" : ""}`}>
        <label>
          Ordenar
          <select
            name="order"
            defaultValue={params.get("order") || "created_at.desc"}
          >
            {sorts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {date && (
          <>
            <label>
              Desde
              <input
                name="fromDate"
                type="date"
                defaultValue={params.get("fromDate") || ""}
              />
            </label>
            <label>
              Hasta
              <input
                name="toDate"
                type="date"
                defaultValue={params.get("toDate") || ""}
              />
            </label>
          </>
        )}
        <button
          type="button"
          className="text-link button-plain"
          onClick={() => setParams({})}
        >
          <X size={15} /> Limpiar filtros
        </button>
      </div>
      {(params.has("user_id") ||
        params.has("expiring") ||
        params.has("unassigned") ||
        params.has("from")) && (
        <p className="small green filter-context">
          Vista filtrada desde un detalle o indicador.{" "}
          <button
            type="button"
            className="text-link button-plain"
            onClick={() => setParams({})}
          >
            Ver todo
          </button>
        </p>
      )}
    </form>
  );
}
export function Pagination({
  total,
  page,
  size = 12,
}: {
  total: number;
  page: number;
  size?: number;
}) {
  const [params, setParams] = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / size));
  function go(n: number) {
    const p = new URLSearchParams(params);
    p.set("page", String(n));
    setParams(p);
  }
  return (
    <div className="pagination">
      <span className="muted small">
        {total} registros · Página {page} de {pages}
      </span>
      <div>
        <button
          className="button secondary"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          Anterior
        </button>
        <button
          className="button secondary"
          disabled={page >= pages}
          onClick={() => go(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
export function queryFilters(params: URLSearchParams) {
  const values = Object.fromEntries(params);
  const [sort, direction] = (values.order || "created_at.desc").split(".");
  return {
    ...values,
    page: Math.max(1, Number(values.page) || 1),
    sort,
    direction,
    archived: values.archived === "true",
    expiring: values.expiring === "true",
    unassigned: values.unassigned === "true",
    overdue: values.overdue === "true",
    from: values.fromDate
      ? new Date(values.fromDate + "T00:00:00").toISOString()
      : values.from,
    to: values.toDate
      ? new Date(
          new Date(values.toDate + "T00:00:00").getTime() + 86400000,
        ).toISOString()
      : values.to,
  };
}
export function AuditTimeline({
  history,
  title = "Historial",
  names = {},
}: {
  history: Activity[];
  title?: string;
  names?: PeopleNames;
}) {
  const people = {
    ...Object.fromEntries(
      history
        .filter((h) => h.actor_id && h.actor_name)
        .map((h) => [h.actor_id!, h.actor_name!]),
    ),
    ...names,
  };
  const entries = readableHistory(history);
  return (
    <section className="bento-card">
      <h2>{title}</h2>
      {entries.length ? (
        <ol className="audit-timeline">
          {entries.map((h) => (
            <li key={h.id}>
              <span className="timeline-dot" />
              <div>
                <strong>{activityTitle(h)}</strong>
                <p>
                  {h.actor_name && <>{h.actor_name} · </>}
                  {dateTime(h.created_at)}{" "}
                  {h.internal && (
                    <span className="internal-tag">Solo administradores</span>
                  )}
                </p>
                {activityNote(h) && (
                  <blockquote className="history-note">
                    {activityNote(h)}
                  </blockquote>
                )}
                {readableChanges(h, people).length > 0 && (
                  <dl className="history-changes">
                    {readableChanges(h, people).map((change) => (
                      <div key={change.label}>
                        <dt>{change.label}</dt>
                        <dd>
                          {change.before !== undefined ? (
                            <>
                              <span className="history-before">
                                <span className="sr-only">Antes: </span>
                                {change.before}
                              </span>
                              <ArrowRight size={14} aria-hidden="true" />
                              <span className="history-after">
                                <span className="sr-only">Ahora: </span>
                                {change.after}
                              </span>
                            </>
                          ) : (
                            <span className="history-after">
                              {change.after}
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">
          Todavía no hay cambios registrados para este elemento.
        </p>
      )}
    </section>
  );
}
export function InfoGrid({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="info-grid-detail">
      {items.map((i) => (
        <div key={i.label}>
          <dt>{i.label}</dt>
          <dd>{i.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
export type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  help?: string;
};
export function MutationDialog({
  title,
  description,
  fields,
  initial = {},
  save,
  close,
  extra,
}: {
  title: string;
  description?: string;
  fields: Field[];
  initial?: Record<string, any>;
  save: (data: Record<string, any>) => Promise<void>;
  close: () => void;
  extra?: ReactNode;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget),
      data: Record<string, any> = {};
    for (const f of fields) {
      const raw = f.disabled ? initial[f.name] : form.get(f.name);
      data[f.name] =
        f.type === "checkbox"
          ? raw === "on" || raw === true
          : f.type === "number"
            ? raw === ""
              ? undefined
              : Number(raw)
            : f.type === "datetime-local" && raw
              ? new Date(String(raw)).toISOString()
              : String(raw ?? "").trim();
    }
    setBusy(true);
    setError("");
    try {
      await save(data);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={title} close={close}>
      <form onSubmit={(e) => void submit(e)}>
        {description && <p className="muted">{description}</p>}
        {extra}
        {fields.map((f) =>
          f.type === "checkbox" ? (
            <label className="checkbox-label" key={f.name}>
              <input
                name={f.name}
                type="checkbox"
                required={f.required}
                defaultChecked={initial[f.name] === true}
              />
              <span>{f.label}</span>
            </label>
          ) : (
            <label key={f.name}>
              {f.label}
              {f.options ? (
                <select
                  name={f.name}
                  required={f.required}
                  defaultValue={initial[f.name] ?? ""}
                  disabled={f.disabled}
                >
                  <option value="">Seleccionar…</option>
                  {f.options.map((o) => (
                    <option value={o.value} key={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  name={f.name}
                  required={f.required}
                  minLength={f.min}
                  maxLength={f.max || 2000}
                  rows={4}
                  defaultValue={initial[f.name] ?? ""}
                />
              ) : (
                <input
                  name={f.name}
                  type={f.type || "text"}
                  required={f.required}
                  min={f.type === "number" ? f.min : undefined}
                  max={f.type === "number" ? f.max : undefined}
                  minLength={f.type !== "number" ? f.min : undefined}
                  maxLength={f.type !== "number" ? f.max || 160 : undefined}
                  defaultValue={initial[f.name] ?? ""}
                  disabled={f.disabled}
                />
              )}{" "}
              {f.help && <small className="muted">{f.help}</small>}
            </label>
          ),
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            onClick={close}
            disabled={busy}
          >
            Cancelar
          </button>
          <button className="button" disabled={busy}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
