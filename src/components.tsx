import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Download,
  LayoutDashboard,
  LockKeyhole,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { demoMode, supabase } from "./lib/supabase";
import { useApp } from "./context";
import { money } from "./lib/data";
import type { Product } from "./types";
export const logo = "/assets/karpanda-logo.png";
export const pandas = "/assets/karpanda-pandas.png";
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Karpanda, inicio">
      <img src={logo} width="90" height="86" alt="Panda tecnológico Karpanda" />
      <span>
        Karpanda<small>SOFTWARE</small>
      </span>
    </Link>
  );
}
export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`badge ${className}`}>{children}</span>;
}
export function Loading() {
  return (
    <div className="empty" role="status">
      <div className="spinner" />
      Cargando tu espacio…
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Package size={32} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Status({ status }: { status: string }) {
  return (
    <Badge className={status === "pending" ? "warning" : ""}>
      {(
        {
          pending: "Pendiente de pago",
          paid: "Pagado",
          demo: "Simulado",
          active: "Activo",
          open: "Abierto",
          closed: "Cerrado",
          expired: "Vencido",
        } as Record<string, string>
      )[status] || status}
    </Badge>
  );
}
export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Brand />
          <button
            className="menu-toggle button-plain"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            id="main-nav"
            className={open ? "top-nav open" : "top-nav"}
            aria-label="Navegación principal"
          >
            <NavLink end to="/">
              Catálogo
            </NavLink>
            <NavLink to="/como-funciona">Cómo funciona</NavLink>
            <NavLink to="/soporte">Soporte</NavLink>
            <Link className="button secondary account-link" to="/cuenta">
              Mi cuenta
            </Link>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
export function Footer() {
  return (
    <footer className="footer container">
      <div>
        <strong>Karpanda Software</strong>
        <p>Tecnología que te acompaña a crecer.</p>
      </div>
      <nav aria-label="Pie de página">
        <Link to="/como-funciona">Documentación</Link>
        <Link to="/soporte">Soporte</Link>
        <Link to="/terminos">Términos y privacidad</Link>
      </nav>
    </footer>
  );
}
export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <div className="category">
        <span className="product-icon">
          <img src="/assets/ventas.svg" width="24" height="24" alt="" />
        </span>
        <span>{product.category}</span>
      </div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="card-bottom">
        <span className="price">
          S/ {product.price}
          <small>/ mes</small>
        </span>
        <Link className="button secondary" to={`/producto/${product.slug}`}>
          Ver software <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
const clientNav = [
  ["Mi software", "/cuenta", LayoutDashboard],
  ["Mis pedidos", "/cuenta/pedidos", ShoppingBag],
  ["Mis licencias", "/cuenta/licencias", BookOpen],
  ["Descargas", "/cuenta/descargas", Download],
  ["Soporte", "/cuenta/soporte", LifeBuoy],
  ["Mi cuenta", "/cuenta/perfil", Users],
  ["Contraseña", "/cuenta/seguridad", LockKeyhole],
] as const;
const adminNav = [
  ["Resumen", "/admin", LayoutDashboard],
  ["Productos", "/admin/productos", Package],
  ["Pedidos", "/admin/pedidos", ShoppingBag],
  ["Licencias", "/admin/licencias", BookOpen],
  ["Soporte", "/admin/soporte", LifeBuoy],
  ["Usuarios", "/admin/usuarios", Users],
  ["Clientes", "/admin/clientes", Users],
] as const;
export function PortalLayout({ admin = false }: { admin?: boolean }) {
  const { user, notify, isAdmin } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  async function logout() {
    const { error } = await supabase!.auth.signOut();
    if (error) notify(error.message);
  }
  return (
    <div className="portal">
      <aside className={open ? "sidebar show" : "sidebar"}>
        <Brand />
        <button
          className="menu-toggle sidebar-close button-plain"
          aria-label="Cerrar navegación"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <p className="nav-label">{admin ? "ADMINISTRACIÓN" : "MI ESPACIO"}</p>
        <nav aria-label={admin ? "Administración" : "Área del cliente"}>
          {(admin ? adminNav : clientNav).map(([name, path, Icon]) => (
            <NavLink
              end={path === "/cuenta" || path === "/admin"}
              key={path}
              to={path}
            >
              <Icon size={18} />
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-help">
          <strong>¿Necesitas ayuda?</strong>
          <p>Estamos para acompañarte.</p>
          <Link to="/soporte">
            Contactar con soporte <ArrowUpRight size={14} />
          </Link>
        </div>
        {isAdmin && !admin && (
          <Link className="back-store" to="/admin">
            <LayoutDashboard size={16} /> Administración
          </Link>
        )}
        <Link className="back-store" to="/">
          <ArrowLeft size={16} /> Volver a la tienda
        </Link>
        {supabase && user && (
          <button
            className="back-store button-plain"
            onClick={() => void logout()}
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        )}
      </aside>
      <div className="portal-right">
        <header className="portal-header">
          <button
            className="menu-toggle button-plain"
            aria-label="Mostrar navegación"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </button>
          <span>{admin ? "Panel de administración" : "Área del cliente"}</span>
          <span className="user-label">
            {user?.user_metadata?.name || user?.email || "Mi empresa"}
            <span className="avatar">{admin ? "AD" : "ME"}</span>
          </span>
        </header>
        <main className="portal-content" id="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export function PageHeading({
  title,
  children,
  eyebrow,
}: {
  title: string;
  children?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
export function ProductPreview({ product }: { product: Product }) {
  return (
    <div
      className="software-preview"
      aria-label={`Vista ilustrativa de ${product.name}`}
    >
      <aside>
        <strong>Karpanda</strong>
        {["Resumen", "Ventas", "Productos", "Clientes", "Reportes"].map(
          (s, i) => (
            <span className={i === 0 ? "selected" : ""} key={s}>
              {s}
            </span>
          ),
        )}
      </aside>
      <div className="preview-body">
        <h3>
          Resumen de {product.slug === "reservas" ? "reservas" : "ventas"}
        </h3>
        <p>Hoy · Mi negocio · Ejemplo</p>
        <div className="preview-stats">
          {[
            ["Ventas del día", "S/ 1,850"],
            ["Pedidos", "24"],
            ["Productos", "186"],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div
          className="chart"
          role="img"
          aria-label="Gráfico ilustrativo de actividad"
        >
          {[38, 60, 45, 78, 67, 91, 85, 65, 95, 73, 88, 106].map((h, i) => (
            <span key={i} style={{ height: `${h / 1.1}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
export function Price({ value }: { value: number }) {
  return (
    <div className="big-price">
      {money(value)}
      <small>/ mes</small>
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    const onCancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    d.addEventListener("cancel", onCancel);
    return () => {
      d.removeEventListener("cancel", onCancel);
      d.close();
    };
  }, [close]);
  return (
    <dialog ref={ref} className="modal" aria-labelledby="modal-title">
      <div className="modal-title">
        <h2 id="modal-title">{title}</h2>
        <button
          className="button-plain"
          aria-label="Cerrar diálogo"
          onClick={close}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function DemoBanner() {
  return demoMode ? (
    <div className="demo-banner">
      <span>Vista de demostración · Datos de ejemplo</span>
      <Link to="/admin">
        Explorar administración <ArrowRight size={14} />
      </Link>
    </div>
  ) : null;
}
