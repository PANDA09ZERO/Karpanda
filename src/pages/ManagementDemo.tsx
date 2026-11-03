import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BriefcaseBusiness,
  CheckCircle2,
  Plus,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Clock,
} from "lucide-react";
import { DemoSystem } from "../components/DemoSystem";
import { Modal } from "../components/Modal";
import { trackDemoAction } from "../lib/analytics";
import { localDay } from "../lib/demoData";
import { money } from "../lib/data";
type Client = { id: number; name: string; sector: string; active: boolean };
type Task = {
  id: number;
  title: string;
  owner: string;
  status: "pending" | "progress" | "done";
};
type Project = {
  id: number;
  client: number;
  name: string;
  budget: number;
  due: string;
  paused: boolean;
  tasks: Task[];
};
const clientsSeed = (): Client[] => [
  { id: 1, name: "Café Aurora", sector: "Cafetería ficticia", active: true },
  { id: 2, name: "Tienda Brisa", sector: "Comercio de ejemplo", active: true },
];
const projectsSeed = (): Project[] => [
  {
    id: 1,
    client: 1,
    name: "Renovación del catálogo",
    budget: 150000,
    due: localDay(),
    paused: false,
    tasks: [
      {
        id: 1,
        title: "Definir productos",
        owner: "Equipo Panda",
        status: "done",
      },
      {
        id: 2,
        title: "Preparar propuesta visual",
        owner: "Equipo Diseño",
        status: "progress",
      },
    ],
  },
  {
    id: 2,
    client: 2,
    name: "Organizar la operación",
    budget: 240000,
    due: localDay(),
    paused: false,
    tasks: [
      {
        id: 1,
        title: "Revisar procesos",
        owner: "Equipo Panda",
        status: "pending",
      },
      {
        id: 2,
        title: "Preparar tablero de trabajo",
        owner: "Equipo Diseño",
        status: "pending",
      },
    ],
  },
];
const labels = {
  pending: "Pendiente",
  progress: "En curso",
  done: "Completada",
};
const completion = (p: Project) =>
  p.tasks.length
    ? Math.round(
        (p.tasks.filter((t) => t.status === "done").length / p.tasks.length) *
          100,
      )
    : 0;
export function ManagementDemo() {
  const [view, setView] = useState("dashboard"),
    [clients, setClients] = useState(clientsSeed),
    [projects, setProjects] = useState(projectsSeed),
    [modal, setModal] = useState<string | null>(null),
    [form, setForm] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState(""),
    [clientFilter, setClientFilter] = useState("Todos"),
    [statusFilter, setStatusFilter] = useState("Todos"),
    [activity, setActivity] = useState([
      "Se prepararon dos clientes y sus proyectos ficticios",
    ]),
    [started, setStarted] = useState(false),
    [created, setCreated] = useState(false),
    [finished, setFinished] = useState(false);
  const completed = useRef(false);
  const close = useCallback(() => setModal(null), []);
  const log = (text: string) =>
    setActivity((prev) => [text, ...prev].slice(0, 8));
  const clientName = (id: number) =>
    clients.find((c) => c.id === id)?.name || "Cliente de ejemplo";
  const pending = projects
    .flatMap((p) => p.tasks)
    .filter((t) => t.status !== "done").length;
  function reset() {
    setClients(clientsSeed());
    setProjects(projectsSeed());
    setView("dashboard");
    setModal(null);
    setError("");
    setSearch("");
    setClientFilter("Todos");
    setStatusFilter("Todos");
    setStarted(false);
    setCreated(false);
    setFinished(false);
    completed.current = false;
    setActivity(["Escenario de ejemplo restaurado"]);
    setNotice(
      "Demo reiniciada. Se restauraron los clientes, proyectos y tareas originales.",
    );
    trackDemoAction("demo_reset", "gestion");
  }
  function start() {
    setStarted(true);
    setView("clients");
    setNotice(
      "Explora un cliente. Después crea un proyecto y completa una de sus tareas.",
    );
    trackDemoAction("demo_start", "gestion");
  }
  function open(kind: string) {
    const c = kind.startsWith("edit:")
      ? clients.find((c) => c.id === Number(kind.split(":")[1]))
      : null;
    setForm({
      name: c?.name || "",
      sector: c?.sector || "",
      client: String(clients.find((c) => c.active)?.id || ""),
      budget: "500",
      due: localDay(),
      owner: "Equipo Panda",
    });
    setError("");
    setModal(kind);
  }
  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function save(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      if (form.name.trim().length < 2)
        throw Error("Escribe un nombre de ejemplo de al menos dos caracteres.");
      if (modal === "client") {
        setClients((prev) => [
          ...prev,
          {
            id: Math.max(0, ...prev.map((c) => c.id)) + 1,
            name: form.name.trim(),
            sector: form.sector.trim() || "Negocio de ejemplo",
            active: true,
          },
        ]);
        log("Cliente ficticio agregado al directorio.");
      } else if (modal?.startsWith("edit:")) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === Number(modal.split(":")[1])
              ? {
                  ...c,
                  name: form.name.trim(),
                  sector: form.sector.trim() || "Negocio de ejemplo",
                }
              : c,
          ),
        );
        log("Datos de un cliente actualizados.");
      } else if (modal === "project") {
        const budget = Number(form.budget);
        if (!Number.isFinite(budget) || budget < 0 || budget > 999999.99)
          throw Error("El presupuesto debe estar entre 0 y 999999.99 soles.");
        if (!clients.some((c) => c.id === Number(form.client) && c.active))
          throw Error("Elige un cliente activo.");
        if (!form.due) throw Error("Elige una fecha de entrega.");
        setProjects((prev) => [
          ...prev,
          {
            id: Math.max(0, ...prev.map((p) => p.id)) + 1,
            client: Number(form.client),
            name: form.name.trim(),
            budget: Math.round(budget * 100),
            due: form.due,
            paused: false,
            tasks: [
              {
                id: 1,
                title: "Preparar propuesta inicial",
                owner: form.owner,
                status: "pending",
              },
            ],
          },
        ]);
        setCreated(true);
        setClientFilter(form.client);
        setStatusFilter("Todos");
        if (!started) {
          setStarted(true);
          trackDemoAction("demo_start", "gestion");
        }
        trackDemoAction("demo_step", "gestion");
        log("Proyecto creado y primera tarea asignada.");
      } else if (modal?.startsWith("task:")) {
        const id = Number(modal.split(":")[1]);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  tasks: [
                    ...p.tasks,
                    {
                      id: Math.max(0, ...p.tasks.map((t) => t.id)) + 1,
                      title: form.name.trim(),
                      owner: form.owner,
                      status: "pending",
                    },
                  ],
                }
              : p,
          ),
        );
        log("Tarea agregada al proyecto.");
      }
      close();
      setNotice("Cambios guardados en esta demostración.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Revisa los datos de ejemplo.",
      );
    }
  }
  function taskStatus(project: number, task: number, status: Task["status"]) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project
          ? {
              ...p,
              tasks: p.tasks.map((t) => (t.id === task ? { ...t, status } : t)),
            }
          : p,
      ),
    );
    log(`Tarea actualizada: ${labels[status]}.`);
    setNotice(
      "La tarea, el avance del proyecto y el dashboard se actualizaron.",
    );
    if (created && status === "done" && !completed.current) {
      completed.current = true;
      setFinished(true);
      trackDemoAction("demo_complete", "gestion");
    }
  }
  function exportReport() {
    const text = [
      "PANDA STUDIO · REPORTE FICTICIO",
      "Presupuestos de proyectos, no ingresos ni cobros.",
      ...projects
        .filter(
          (p) => clientFilter === "Todos" || String(p.client) === clientFilter,
        )
        .map(
          (p) =>
            `${clientName(p.client)} | ${p.name} | ${completion(p)}% completado | ${money(p.budget / 100)} de presupuesto | Entrega ${p.due}`,
        ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-demo-gestion.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Reporte de ejemplo descargado.");
  }
  const visible = projects.filter(
    (p) =>
      (clientFilter === "Todos" || String(p.client) === clientFilter) &&
      (statusFilter === "Todos" ||
        (statusFilter === "Completados"
          ? completion(p) === 100
          : statusFilter === "Pausados"
            ? p.paused
            : !p.paused && completion(p) < 100)),
  );
  const guide = (
    <>
      <div className="demo-breadcrumb">
        <Link to="/demos" className="text-link">
          <ArrowLeft size={16} />
          Todas las demos
        </Link>
        <button className="button secondary" onClick={reset}>
          <RotateCcw size={15} />
          Reiniciar demo
        </button>
      </div>
      <div className="demo-heading">
        <h2>De un cliente a un proyecto organizado.</h2>
        <p>
          Explora el directorio, crea un proyecto y completa una tarea para ver
          cómo se actualizan los resultados.
        </p>
      </div>
      <div className="demo-safety">
        <BriefcaseBusiness size={19} />
        <p>
          Negocios, tareas y presupuestos ficticios. Usa solo nombres de
          ejemplo. No se envían mensajes ni se cobran importes; todo se reinicia
          al salir.
        </p>
      </div>
      <ol className="demo-steps" aria-label="Pasos de la demostración">
        {["Explora clientes", "Crea un proyecto", "Completa una tarea"].map(
          (s, i) => {
            const done = [started, created, finished][i];
            return (
              <li key={s} className={done ? "done" : ""}>
                <span>{done ? <Check size={15} /> : i + 1}</span>
                <div>
                  <small>PASO {i + 1}</small>
                  <strong>{s}</strong>
                </div>
              </li>
            );
          },
        )}
      </ol>
    </>
  );
  return (
    <DemoSystem kind="gestion" view={view} onView={setView} guide={guide}>
      <div className="ds-page management-demo">
        <div className="demo-stat-grid">
          <article>
            <Users size={19} />
            <span>Clientes activos</span>
            <strong>{clients.filter((c) => c.active).length}</strong>
          </article>
          <article>
            <BriefcaseBusiness size={19} />
            <span>Proyectos en seguimiento</span>
            <strong>
              {projects.filter((p) => completion(p) < 100 && !p.paused).length}
            </strong>
          </article>
          <article>
            <Clock size={19} />
            <span>Tareas pendientes</span>
            <strong>{pending}</strong>
          </article>
        </div>
        {view === "dashboard" && (
          <>
            <section className="ds-welcome">
              <div>
                <p className="eyebrow">PANDA STUDIO · NEGOCIO FICTICIO</p>
                <h2>Tu equipo sabe qué sigue.</h2>
                <p>
                  Clientes, proyectos y tareas conectados. Un espacio para
                  organizar el trabajo y revisar sus avances.
                </p>
              </div>
              <button className="button" onClick={start}>
                {started ? "Continuar recorrido" : "Comenzar recorrido"}
                <ArrowRight size={16} />
              </button>
            </section>
            <div className="ds-dashboard-grid">
              <section className="ds-card">
                <p className="eyebrow">PROYECTOS EN MARCHA</p>
                <h3>Así avanza tu trabajo</h3>
                <div className="management-progress">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setClientFilter(String(p.client));
                        setView("projects");
                      }}
                    >
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {clientName(p.client)}
                          {p.paused ? " · Pausado" : ""}
                        </small>
                      </span>
                      <b>{completion(p)}%</b>
                      <i>
                        <span style={{ width: `${completion(p)}%` }} />
                      </i>
                    </button>
                  ))}
                </div>
              </section>
              <section className="ds-card">
                <p className="eyebrow">LO ÚLTIMO EN EL EQUIPO</p>
                <h3>Actividad reciente</h3>
                <ol className="edu-activity-list">
                  {activity.slice(0, 5).map((a, i) => (
                    <li key={`${a}:${i}`}>
                      <span />
                      <div>
                        <strong>{a}</strong>
                        <small>Sesión de demostración</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <div className="ds-shortcuts">
              <button
                onClick={() => {
                  setView("projects");
                  open("project");
                }}
              >
                <Plus size={24} />
                <span>
                  <strong>Crear un proyecto</strong>
                  <small>Vincula un cliente y asigna la primera tarea.</small>
                </span>
                <ArrowRight size={17} />
              </button>
              <button onClick={() => setView("reports")}>
                <Download size={24} />
                <span>
                  <strong>Revisar los reportes</strong>
                  <small>Consulta avances y presupuestos simulados.</small>
                </span>
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
        {view === "clients" && (
          <section>
            <div className="ds-module-heading">
              <div>
                <p className="eyebrow">DIRECTORIO DEL NEGOCIO</p>
                <h2>Clientes</h2>
                <p>
                  Abre una tarjeta para consultar sus proyectos y gestionar sus
                  datos de ejemplo.
                </p>
              </div>
              <button className="button" onClick={() => open("client")}>
                <Plus size={16} />
                Agregar cliente
              </button>
            </div>
            <label className="demo-search">
              <Users size={17} />
              <input
                aria-label="Buscar cliente de ejemplo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o actividad…"
              />
            </label>
            <div className="ds-record-grid">
              {clients
                .filter((c) =>
                  (c.name + " " + c.sector)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((c) => (
                  <article className="ds-card management-client" key={c.id}>
                    <details>
                      <summary>
                        <span
                          className={`state-pill ${c.active ? "state-active" : "state-closed"}`}
                        >
                          {c.active ? "Activo" : "Archivado"}
                        </span>
                        <h3>{c.name}</h3>
                        <p>{c.sector}</p>
                        <small>Ver detalle +</small>
                      </summary>
                      <dl className="edu-info-list">
                        <div>
                          <dt>Proyectos</dt>
                          <dd>
                            {projects.filter((p) => p.client === c.id).length}
                          </dd>
                        </div>
                        <div>
                          <dt>Presupuestos ficticios</dt>
                          <dd>
                            {money(
                              projects
                                .filter((p) => p.client === c.id)
                                .reduce((n, p) => n + p.budget, 0) / 100,
                            )}
                          </dd>
                        </div>
                      </dl>
                      <button
                        className="button secondary full"
                        onClick={() => open(`edit:${c.id}`)}
                      >
                        Editar cliente
                      </button>
                      <button
                        className="text-link button-plain"
                        onClick={() => {
                          setClientFilter(String(c.id));
                          setView("projects");
                        }}
                      >
                        Ver proyectos <ArrowRight size={15} />
                      </button>
                      <button
                        className="text-link button-plain"
                        onClick={() => {
                          setClients((prev) =>
                            prev.map((p) =>
                              p.id === c.id ? { ...p, active: !p.active } : p,
                            ),
                          );
                          log("Estado de un cliente actualizado.");
                        }}
                      >
                        {c.active ? "Archivar cliente" : "Reactivar cliente"}
                      </button>
                    </details>
                  </article>
                ))}
            </div>
          </section>
        )}
        {(view === "projects" || view === "reports") && (
          <section>
            <div className="ds-module-heading">
              <div>
                <p className="eyebrow">
                  {view === "projects"
                    ? "ORGANIZA LA EJECUCIÓN"
                    : "AVANCE Y PRESUPUESTOS"}
                </p>
                <h2>
                  {view === "projects"
                    ? "Proyectos y tareas"
                    : "Reportes del negocio"}
                </h2>
                <p>
                  {view === "projects"
                    ? "Abre un proyecto, asigna tareas y cambia sus estados."
                    : "Los importes son presupuestos ficticios; no representan ingresos, pagos ni facturas."}
                </p>
              </div>
              <button
                className="button"
                disabled={view === "projects" && !clients.some((c) => c.active)}
                onClick={() =>
                  view === "projects" ? open("project") : exportReport()
                }
              >
                {view === "projects" ? (
                  <Plus size={16} />
                ) : (
                  <Download size={16} />
                )}{" "}
                {view === "projects" ? "Nuevo proyecto" : "Descargar reporte"}
              </button>
            </div>
            <div className="ds-card edu-academic-controls">
              <label>
                Cliente del proyecto
                <select
                  aria-label="Cliente del proyecto"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option>Todos</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.active ? "" : " (archivado)"}
                    </option>
                  ))}
                </select>
              </label>
              {view === "projects" && (
                <label>
                  Estado del proyecto
                  <select
                    aria-label="Estado del proyecto"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {["Todos", "En seguimiento", "Completados", "Pausados"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </label>
              )}
            </div>
            <div className="ds-record-grid">
              {(view === "reports"
                ? projects.filter(
                    (p) =>
                      clientFilter === "Todos" ||
                      String(p.client) === clientFilter,
                  )
                : visible
              ).map((p) => (
                <article className="ds-card management-project" key={p.id}>
                  <details open={view === "reports"}>
                    <summary>
                      <span
                        className={`state-pill ${p.paused ? "state-closed" : "state-active"}`}
                      >
                        {p.paused
                          ? "Pausado"
                          : completion(p) === 100
                            ? "Completado"
                            : "En seguimiento"}
                      </span>
                      <h3>{p.name}</h3>
                      <p>{clientName(p.client)}</p>
                      <strong>{completion(p)}% completado</strong>
                      <small>
                        {view === "projects"
                          ? "Ver tareas y detalle +"
                          : "Resumen del proyecto"}
                      </small>
                    </summary>
                    <dl className="edu-info-list">
                      <div>
                        <dt>Presupuesto ficticio</dt>
                        <dd>{money(p.budget / 100)}</dd>
                      </div>
                      <div>
                        <dt>Entrega prevista</dt>
                        <dd>{p.due.split("-").reverse().join("/")}</dd>
                      </div>
                      <div>
                        <dt>Tareas terminadas</dt>
                        <dd>
                          {p.tasks.filter((t) => t.status === "done").length} de{" "}
                          {p.tasks.length}
                        </dd>
                      </div>
                    </dl>
                    {view === "projects" && (
                      <>
                        <div className="management-task-list">
                          {p.tasks.map((t) => (
                            <label key={t.id}>
                              <strong>{t.title}</strong>
                              <small>{t.owner}</small>
                              <select
                                aria-label={`Estado de ${t.title} en ${p.name}`}
                                value={t.status}
                                disabled={p.paused}
                                onChange={(e) =>
                                  taskStatus(
                                    p.id,
                                    t.id,
                                    e.target.value as Task["status"],
                                  )
                                }
                              >
                                {Object.entries(labels).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ))}
                        </div>
                        <button
                          className="button secondary full"
                          disabled={p.paused}
                          onClick={() => open(`task:${p.id}`)}
                        >
                          Agregar tarea
                        </button>
                        <button
                          className="text-link button-plain"
                          onClick={() => {
                            setProjects((prev) =>
                              prev.map((x) =>
                                x.id === p.id ? { ...x, paused: !x.paused } : x,
                              ),
                            );
                            log(
                              `Proyecto ${p.paused ? "reanudado" : "pausado"}.`,
                            );
                          }}
                        >
                          {p.paused ? "Reanudar proyecto" : "Pausar proyecto"}
                        </button>
                      </>
                    )}
                  </details>
                </article>
              ))}
            </div>
            {view === "projects" && !visible.length && (
              <div className="ds-card ds-empty">
                <BriefcaseBusiness size={30} />
                <p>No hay proyectos que coincidan con los filtros.</p>
              </div>
            )}
          </section>
        )}
        {finished && (
          <section className="edu-completed">
            <CheckCircle2 size={26} />
            <div>
              <strong>Recorrido de gestión completado</strong>
              <p>
                Creaste un proyecto y completaste una tarea. Revisa sus
                resultados en el dashboard.
              </p>
            </div>
          </section>
        )}
        <p className="demo-notice" role="status">
          {notice}
        </p>
        <div className="ds-footer">
          <span>¿Te gustaría organizar así tu negocio?</span>
          <Link
            className="text-link"
            to="/producto/gestion"
            onClick={() => trackDemoAction("demo_consult", "gestion")}
          >
            Conocer Karpanda Gestión <ArrowRight size={16} />
          </Link>
        </div>
        {modal && (
          <Modal
            title={
              modal === "client"
                ? "Agregar cliente de ejemplo"
                : modal.startsWith("edit:")
                  ? "Editar cliente de ejemplo"
                  : modal === "project"
                    ? "Nuevo proyecto de ejemplo"
                    : "Agregar tarea de ejemplo"
            }
            close={close}
          >
            <form className="edu-module-form" onSubmit={save}>
              <label>
                {modal === "client" || modal.startsWith("edit:")
                  ? "Nombre ficticio del cliente"
                  : modal === "project"
                    ? "Nombre del proyecto"
                    : "Nombre de la tarea"}
                <input
                  required
                  maxLength={60}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </label>
              {modal === "client" || modal.startsWith("edit:") ? (
                <label>
                  Actividad de ejemplo
                  <input
                    maxLength={60}
                    value={form.sector}
                    onChange={(e) => set("sector", e.target.value)}
                  />
                </label>
              ) : (
                <>
                  {modal === "project" && (
                    <>
                      <label>
                        Cliente
                        <select
                          aria-label="Cliente del formulario"
                          value={form.client}
                          onChange={(e) => set("client", e.target.value)}
                          required
                        >
                          {clients
                            .filter((c) => c.active)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <div className="edu-form-pair">
                        <label>
                          Presupuesto simulado (S/)
                          <input
                            type="number"
                            required
                            min="0"
                            max="999999.99"
                            step="0.01"
                            value={form.budget}
                            onChange={(e) => set("budget", e.target.value)}
                          />
                        </label>
                        <label>
                          Entrega prevista
                          <input
                            type="date"
                            required
                            value={form.due}
                            onChange={(e) => set("due", e.target.value)}
                          />
                        </label>
                      </div>
                    </>
                  )}
                  <label>
                    Responsable de ejemplo
                    <select
                      aria-label="Responsable de ejemplo"
                      value={form.owner}
                      onChange={(e) => set("owner", e.target.value)}
                    >
                      <option>Equipo Panda</option>
                      <option>Equipo Diseño</option>
                    </select>
                  </label>
                </>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="button full">
                {modal === "project"
                  ? "Crear proyecto"
                  : modal?.startsWith("task:")
                    ? "Guardar tarea"
                    : "Guardar cliente"}
              </button>
            </form>
          </Modal>
        )}
      </div>
    </DemoSystem>
  );
}
