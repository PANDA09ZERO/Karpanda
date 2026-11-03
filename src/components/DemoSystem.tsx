import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  LayoutDashboard,
  ShoppingBag,
  Package,
  ReceiptText,
  CalendarDays,
  Sparkles,
  CircleHelp,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  School,
  CalendarRange,
  CreditCard,
  Bell,
  ChartNoAxesCombined,
  MoreHorizontal,
} from "lucide-react";
import { Modal } from "./Modal";
import { measurementConfigured, settingsEvent } from "../lib/analytics";

export function DemoSystem({
  kind,
  view,
  onView,
  guide,
  children,
}: {
  kind: "ventas" | "reservas" | "educacion" | "gestion";
  view: string;
  onView: (view: string) => void;
  guide: ReactNode;
  children: ReactNode;
}) {
  const sales = kind === "ventas";
  const education = kind === "educacion";
  const management = kind === "gestion";
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const brand = education
    ? "Colegio Panda"
    : management
      ? "Panda Studio"
      : sales
        ? "Panda Papelería"
        : "Estudio Panda";
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);
  const items = education
    ? [
        { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
        { id: "students", label: "Alumnos", Icon: Users },
        { id: "academic", label: "Académico", Icon: BookOpen },
        { id: "documents", label: "Documentos", Icon: FileText },
        { id: "institution", label: "Profesores y familias", Icon: Users },
        { id: "planning", label: "Cursos y horarios", Icon: CalendarRange },
        { id: "enrollment", label: "Matrículas", Icon: School },
        { id: "payments", label: "Pagos", Icon: CreditCard },
        { id: "alerts", label: "Alertas", Icon: Bell },
        { id: "reports", label: "Reportes", Icon: ChartNoAxesCombined },
      ]
    : management
      ? [
          { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
          { id: "clients", label: "Clientes", Icon: Users },
          { id: "projects", label: "Proyectos y tareas", Icon: BookOpen },
          { id: "reports", label: "Reportes", Icon: ChartNoAxesCombined },
        ]
      : sales
        ? [
            { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
            { id: "work", label: "Punto de venta", Icon: ShoppingBag },
            { id: "inventory", label: "Inventario", Icon: Package },
            { id: "history", label: "Ventas", Icon: ReceiptText },
          ]
        : [
            { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
            { id: "work", label: "Nueva reserva", Icon: CalendarDays },
            { id: "agenda", label: "Agenda", Icon: CalendarDays },
            { id: "services", label: "Servicios y equipo", Icon: Sparkles },
          ];
  return (
    <div
      className={`demo-system ${education ? "demo-system-education" : management ? "demo-system-management" : sales ? "demo-system-sales" : "demo-system-booking"}`}
    >
      <div className="ds-banner">
        <span>
          <span className="ds-live-dot" />
          Sistema de ejemplo · Todo es ficticio
        </span>
        <Link to="/demos">
          <ArrowLeft size={14} /> Salir de la demo
        </Link>
      </div>
      <div className="ds-layout">
        <aside className="ds-sidebar">
          <div className="ds-brand">
            <span>
              {education ? (
                <GraduationCap size={23} />
              ) : sales ? (
                <ShoppingBag size={23} />
              ) : (
                <Sparkles size={23} />
              )}
            </span>
            <div>
              <strong>{brand}</strong>
              <small>
                {education
                  ? "Gestión educativa"
                  : management
                    ? "Clientes y proyectos"
                    : sales
                      ? "Ventas e inventario"
                      : "Agenda y servicios"}
              </small>
            </div>
          </div>
          <p className="ds-nav-caption">
            {education ? "MI INSTITUCIÓN" : "MI NEGOCIO"}
          </p>
          <nav aria-label="Menú del sistema de demostración">
            {items.map(({ id, label, Icon }, index) => (
              <button
                key={id}
                className={`${view === id ? "active" : ""} ${education && index > 3 ? "ds-extra-nav" : ""}`}
                aria-current={view === id ? "page" : undefined}
                onClick={() => onView(id)}
              >
                <Icon size={19} />
                <span>{label}</span>
              </button>
            ))}
            {education && (
              <button
                className={`ds-more-nav ${items.slice(4).some((i) => i.id === view) ? "active" : ""}`}
                aria-label="Más módulos del colegio"
                aria-haspopup="dialog"
                onClick={() => setMoreOpen(true)}
              >
                <MoreHorizontal size={19} />
                <span>Más</span>
              </button>
            )}
          </nav>
          <div className="ds-sidebar-note">
            <CircleHelp size={20} />
            <strong>Explora con confianza</strong>
            <p>Las acciones solo cambian los datos de esta demo.</p>
            <a
              href="#demo-guide"
              onClick={() => {
                const guide = document.getElementById(
                  "demo-guide",
                ) as HTMLDetailsElement | null;
                if (guide) guide.open = true;
              }}
            >
              Ver instrucciones <ArrowUpRight size={14} />
            </a>
          </div>
          <small className="ds-powered">Un sistema creado con Karpanda</small>
        </aside>
        <div className="ds-body">
          <header className="ds-topbar">
            <div>
              <small>{brand.toUpperCase()} / ESPACIO DE TRABAJO</small>
              <h1>{items.find((i) => i.id === view)?.label}</h1>
            </div>
            <div className="ds-profile">
              <span>AD</span>
              <div>
                <strong>Administrador</strong>
                <small>Cuenta de ejemplo</small>
              </div>
            </div>
          </header>
          <div className="ds-content">
            <details className="ds-guide" id="demo-guide" open>
              <summary>
                <CircleHelp size={18} />
                <span>Tu guía para explorar el sistema</span>
                <small>Ver / ocultar</small>
              </summary>
              <div>{guide}</div>
            </details>
            {children}
            <footer className="ds-footer">
              <span>Karpanda · Demostración sin cobros ni datos reales.</span>
              {measurementConfigured && (
                <button
                  className="button-plain text-link"
                  onClick={() => window.dispatchEvent(new Event(settingsEvent))}
                >
                  Preferencias de medición
                </button>
              )}
            </footer>
          </div>
        </div>
      </div>
      {moreOpen && (
        <Modal
          title="Módulos del colegio"
          close={closeMore}
          className="ds-school-menu"
        >
          <div className="ds-more-grid">
            {items.slice(4).map(({ id, label, Icon }) => (
              <button
                key={id}
                className={view === id ? "active" : ""}
                onClick={() => {
                  onView(id);
                  closeMore();
                }}
              >
                <Icon size={23} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

export function DemoDashboard({
  kind,
  children,
  action,
  onAction,
}: {
  kind: "ventas" | "reservas";
  children: ReactNode;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="ds-overview">
      <div className="ds-welcome">
        <div>
          <p className="eyebrow">TU NEGOCIO, DE UN VISTAZO</p>
          <h2>
            {kind === "ventas"
              ? "Cada venta, todo bajo control."
              : "Una agenda clara. Un día más simple."}
          </h2>
          <p>
            {kind === "ventas"
              ? "Consulta tus existencias, registra ventas y sigue los resultados en un solo lugar."
              : "Organiza tus citas, consulta los horarios y conoce los servicios de tu equipo."}
          </p>
        </div>
        <button className="button" onClick={onAction}>
          {action}
          <ArrowUpRight size={17} />
        </button>
      </div>
      {children}
    </section>
  );
}
