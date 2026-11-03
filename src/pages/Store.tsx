import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { useApp } from "../context";
import {
  Badge,
  Empty,
  Loading,
  PageHeading,
  pandas,
  Price,
  ProductCard,
  ProductPreview,
} from "../components";
import { money, placeOrder } from "../lib/data";
import { demoMode } from "../lib/supabase";
import {
  FrequentlyAsked,
  Industries,
  Plans,
  PublicCTA,
  ServicePreview,
  SocialProof,
  WhyKarpanda,
  WorkingMethod,
} from "./PublicMarketing";
import { trackPublicAction } from "../lib/analytics";
import { productDemo, quoteProduct } from "../lib/catalog";
import { productContent } from "../lib/productContent";
import { ProductOverview } from "../components/ProductOverview";
export function Catalog() {
  const { products, loading } = useApp();
  const [category, setCategory] = useState("Todas");
  const [heroSlug, setHeroSlug] = useState("ventas");
  const heroSlugs = ["ventas", "reservas", "gestion", "educacion"];
  const heroLabels: Record<string, string> = {
    ventas: "Ventas",
    reservas: "Reservas",
    gestion: "Gestión",
    educacion: "Educación",
  };
  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroSlug((prev) => {
        const i = heroSlugs.indexOf(prev);
        return heroSlugs[(i + 1) % heroSlugs.length];
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, []);
  const heroProduct = products.find((p) => p.slug === heroSlug) || products[0];
  const categories = ["Todas", ...new Set(products.map((p) => p.category))];
  const selected = categories.includes(category) ? category : "Todas";
  const visible =
    selected === "Todas"
      ? products
      : products.filter((p) => p.category === selected);
  return (
    <div className="container public-marketing">
      <section className="hero">
        <div className="hero-copy">
          <Badge>SOFTWARE PARA NEGOCIOS</Badge>
          <h1>
            Tu próximo paso,
            <br />
            más simple.
          </h1>
          <p>
            Menos tareas repetitivas. Más tiempo para crecer.
            <br className="desktop-break" /> Encuentra el software que se adapta
            a tu negocio.
          </p>
          <div className="hero-actions">
            <a
              href="#soluciones"
              className="button"
              onClick={() => trackPublicAction("explore_catalog", "hero")}
            >
              Explorar soluciones <ArrowRight size={18} />
            </a>
            <Link to="/servicios" className="text-link">
              Tengo un proyecto en mente <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="hero-notes">
            <span>
              <Check size={14} /> Pensado para tu negocio
            </span>
            <span>
              <Check size={14} /> Desde cualquier pantalla
            </span>
          </div>
        </div>
        <div className="hero-visual hero-visual-demo">
          <div className="hero-demo">
            <div className="hero-demo-tabs" role="tablist" aria-label="Elegir demo">
              {heroSlugs.map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={heroSlug === s}
                  className={heroSlug === s ? "active" : ""}
                  onClick={() => setHeroSlug(s)}
                >
                  {heroLabels[s]}
                </button>
              ))}
            </div>
            <div className="hero-demo-preview">
              {heroProduct ? (
                <ProductPreview product={heroProduct} />
              ) : (
                <div className="loading">Cargando demo…</div>
              )}
            </div>
          </div>
          <Badge>Simple. Cercano. Karpanda.</Badge>
        </div>
      </section>
      <div className="public-intro-strip">
        <span>UN ECOSISTEMA PARA DAR EL SIGUIENTE PASO</span>
        <div>
          <span>Software</span>
          <i />
          <span>Desarrollo web</span>
          <i />
          <span>Soluciones a medida</span>
        </div>
      </div>
      <ServicePreview />
      <Industries />
      <SocialProof />
      <Plans />
      <section className="solutions" id="soluciones">
        <p className="eyebrow">ENCUENTRA TU PUNTO DE PARTIDA</p>
        <h2>Una solución para cada forma de crecer</h2>
        <p className="muted">
          Elige tu herramienta y prueba sus funciones con datos de ejemplo.
        </p>
        <Link className="text-link catalog-gallery-link" to="/demos">
          Ver todas las demos <ArrowUpRight size={16} />
        </Link>
        {categories.length > 0 && (
          <div
            className="catalog-filters"
            role="group"
            aria-label="Filtrar soluciones por categoría"
          >
            {categories.map((c) => (
              <button
                className={selected === c ? "selected" : ""}
                aria-pressed={selected === c}
                key={c}
                onClick={() => {
                  setCategory(c);
                  trackPublicAction("filter_catalog", c);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <Loading />
        ) : visible.length ? (
          <div className="product-grid">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Empty title="Estamos preparando nuevas soluciones">
            Pronto encontrarás nuestros productos aquí.
          </Empty>
        )}
        <p className="marketing-caption">
          Los planes y precios de esta versión son ilustrativos. Consulta sus
          condiciones antes de registrar un pedido.
        </p>
      </section>
      <WhyKarpanda />
      <WorkingMethod />
      <FrequentlyAsked />
      <PublicCTA />
    </div>
  );
}
export function Detail() {
  const { slug } = useParams();
  const { products, loading } = useApp();
  const p = products.find((p) => p.slug === slug);
  useEffect(() => {
    if (!p) return;
    const content = productContent(p);
    document.title = `${p.name} · Karpanda`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content.summary);
  }, [p]);
  if (loading) return <Loading />;
  if (!p) return <NotFound />;
  return (
    <div className="container detail">
      <p className="breadcrumb">
        <Link to="/">Catálogo</Link>
        <span>/</span>
        {p.category}
      </p>
      <PageHeading title={p.name}>
        <Badge>{p.category.toUpperCase()}</Badge>
        <span className="detail-subtitle">{productContent(p).subtitle}</span>
      </PageHeading>
      <div className="detail-grid">
        <ProductOverview product={p} />
        <aside className="plan">
          <Badge>
            {quoteProduct(p)
              ? "IMPLEMENTACIÓN A MEDIDA"
              : "SUSCRIPCIÓN MENSUAL"}
          </Badge>
          <h2>
            {quoteProduct(p) ? "Solución para tu institución" : "Plan Empresa"}
          </h2>
          {quoteProduct(p) ? (
            <>
              <h3>Por cotizar</h3>
              <p className="muted">
                Definimos contigo el alcance, los usuarios y la puesta en
                marcha.
              </p>
              <Link className="button full" to="/servicios#preparar-consulta">
                Consultar implementación <ArrowRight size={18} />
              </Link>
            </>
          ) : (
            <>
              <Price value={p.price} />
              <p className="muted">1 empresa · hasta 5 usuarios</p>
              <Link className="button full" to={`/compra/${p.slug}`}>
                Elegir este plan <ArrowRight size={18} />
              </Link>
            </>
          )}
          <ul className="plain-list">
            <li>Acceso desde el navegador</li>
            <li>Soporte para acompañarte</li>
            <li>
              {quoteProduct(p)
                ? "Alcance y acompañamiento según propuesta"
                : "Actualizaciones durante tu suscripción"}
            </li>
          </ul>
          <small className="muted">
            {quoteProduct(p)
              ? "El presupuesto se define según las necesidades de tu institución."
              : "Precio de ejemplo. Condiciones por definir."}
          </small>
        </aside>
      </div>
    </div>
  );
}
export function Checkout() {
  const { slug } = useParams();
  const { products, loading, user, notify } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const p = products.find((p) => p.slug === slug);
  if (loading) return <Loading />;
  if (!p) return <NotFound />;
  if (quoteProduct(p)) return <Navigate to={`/producto/${p.slug}`} replace />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!p) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      await placeOrder(p, String(form.get("buyer")).trim());
      notify(
        demoMode
          ? "Compra simulada completada. Puedes explorar tu espacio."
          : "Pedido registrado. Lo encontrarás pendiente de pago en tu cuenta.",
      );
      navigate("/cuenta/pedidos");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo registrar el pedido. Inténtalo otra vez.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container checkout">
      <ol className="steps" aria-label="Proceso de compra">
        <li>01&nbsp; Producto</li>
        <li aria-current="step">02&nbsp; Datos y pedido</li>
        <li>03&nbsp; Activación</li>
      </ol>
      <PageHeading title="Comienza a simplificar tu negocio.">
        Completa tus datos y revisa tu suscripción.
      </PageHeading>
      {!demoMode && !user ? (
        <div className="notice">
          <ShieldCheck />
          <div>
            <h2>Tu software empieza con tu cuenta.</h2>
            <p>Inicia sesión o regístrate para guardar tu pedido.</p>
            <Link
              className="button"
              to={`/acceso?next=${encodeURIComponent(`/compra/${p.slug}`)}`}
            >
              Iniciar sesión <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <form className="checkout-grid" onSubmit={(e) => void submit(e)}>
          <section className="panel checkout-form">
            <h2>Datos del comprador</h2>
            <label>
              Nombre o razón social
              <input
                name="buyer"
                required
                minLength={2}
                maxLength={160}
                autoComplete="organization"
                placeholder="Ej. Mi empresa"
                defaultValue={user?.user_metadata?.name || ""}
              />
            </label>
            <label>
              Correo de acceso
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nombre@empresa.com"
                defaultValue={user?.email || ""}
                readOnly={!!user}
              />
            </label>
            <p className="muted small">
              Usaremos tu cuenta para el acceso y las notificaciones.
            </p>
            {demoMode && (
              <div className="notice compact">
                Demostración local: no se procesa ningún pago.
              </div>
            )}
          </section>
          <aside className="order-summary">
            <h2>Tu pedido</h2>
            <h3>{p.name}</h3>
            <p className="muted">Plan Empresa · mensual</p>
            <div className="summary-row">
              <span>Suscripción mensual</span>
              <strong>{money(p.price)}</strong>
            </div>
            <div className="summary-row total">
              <strong>Total de ejemplo</strong>
              <strong>{money(p.price)}</strong>
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="button full" disabled={busy}>
              {busy
                ? "Registrando…"
                : demoMode
                  ? "Simular compra"
                  : "Registrar pedido"}
              <ArrowRight size={18} />
            </button>
            <p className="muted small">
              {demoMode
                ? "Entorno de demostración. No se solicitan datos bancarios."
                : "Tu pedido quedará pendiente. El pago y la activación requieren confirmación."}{" "}
              Impuestos y condiciones comerciales por definir.
            </p>
          </aside>
        </form>
      )}
    </div>
  );
}
export function HowItWorks() {
  return (
    <div className="container info-page">
      <PageHeading
        eyebrow="SIMPLE. CERCANO. KARPANDA."
        title="De descubrir a empezar, sin complicaciones."
      >
        Un espacio para encontrar y gestionar las herramientas de tu negocio.
      </PageHeading>
      <div className="info-grid">
        {[
          [
            "01",
            "Encuentra tu solución",
            "Explora el catálogo y conoce las funciones, usuarios y precio mensual de cada producto.",
          ],
          [
            "02",
            "Crea tu cuenta",
            "Regístrate con tu correo, elige un plan y revisa los datos de tu pedido.",
          ],
          [
            "03",
            "Activa y crece",
            "Con el pago verificado, tu licencia aparecerá en Mi software. El soporte te acompaña.",
          ],
        ].map(([n, title, body]) => (
          <article className="panel" key={n}>
            <Badge>{n}</Badge>
            <h2>{title}</h2>
            <p className="muted">{body}</p>
          </article>
        ))}
      </div>
      <section className="cta">
        <CheckCircle2 size={32} />
        <h2>Todo lo que necesitas, en un mismo lugar.</h2>
        <p>Consulta pedidos, licencias y solicitudes desde tu cuenta.</p>
        <Link className="button" to="/">
          Encontrar mi software <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
export function Terms() {
  return (
    <article className="container info-page prose">
      <PageHeading title="Términos y privacidad">
        Información de esta versión de Karpanda.
      </PageHeading>
      <h2>Versión inicial</h2>
      <p>
        Los productos, precios y planes presentados son ilustrativos. Las
        condiciones comerciales definitivas deben confirmarse antes de habilitar
        cobros reales. Esta versión no procesa pagos ni confirma automáticamente
        licencias.
      </p>
      <h2>Tus datos</h2>
      <p>
        Al conectar Supabase, el correo y la autenticación se gestionan en
        Supabase Auth. Karpanda almacena los pedidos y solicitudes de soporte
        asociados a tu cuenta. No introduzcas datos bancarios en los formularios
        de soporte.
      </p>
      <h2>Demostración local</h2>
      <p>
        En modo demostración, los pedidos y solicitudes se guardan en este
        navegador y no representan operaciones reales. Puedes borrarlos desde Mi
        cuenta.
      </p>
      <h2>Soporte</h2>
      <p>
        Si necesitas ayuda con tus datos o tu acceso, crea una solicitud desde
        el{" "}
        <Link to="/soporte">
          centro de soporte <ArrowUpRight size={14} />
        </Link>
        .
      </p>
      <h2 id="medicion">Medición de visitas y preferencias</h2>
      <p>
        Cuando la medición esté activada y la aceptes, Karpanda y Google
        Analytics 4 podrán ayudarnos a entender las visitas a la página pública,
        el origen del tráfico y la interacción con el catálogo y los servicios.
        No utilizamos esta integración para enviar el contenido de tus
        formularios, tu correo, contraseñas ni datos de pedidos. Las rutas
        privadas y de acceso se excluyen de nuestra medición de páginas.
      </p>
      <p>
        Karpanda mantiene su propio resumen desde esta actualización, separado
        del historial de Google Analytics. Cuenta páginas, sesiones del
        navegador y recorridos de demostración; no identifica personas únicas.
        Para reconocer una sesión se utiliza un identificador aleatorio de esta
        pestaña que se renueva después de 30 minutos de inactividad. El servidor
        guarda una huella temporal de la sesión que cambia cada día, categorías
        de origen y pantalla, y contadores agregados. La huella de red usada
        para limitar abusos también cambia cada día; no se guardan direcciones
        IP en texto ni el contenido de los formularios.
      </p>
      <p>
        La limpieza se ejecuta al recibir nuevas mediciones: elimina controles
        con más de dos horas, comprobantes técnicos de duplicados con más de
        siete días y sesiones con más de 90 días. Los totales por día y página
        se conservan para el historial. Las demostraciones usan datos ficticios
        y sus ventas y reservas solo viven en la pantalla; no se convierten en
        pedidos reales.
      </p>
      <p>
        Puedes elegir «Solo necesarias», seguir utilizando la web y cambiar tu
        preferencia desde el pie de página cuando la medición esté disponible.
        Guardamos la elección en este navegador durante un máximo de 180 días.
        Al rechazarla, detenemos nuestra medición y eliminamos las cookies de
        Analytics accesibles desde este sitio. Esto no elimina los datos que
        Google haya recibido anteriormente.
      </p>
      <p>
        Si Google Analytics todavía no se ha configurado, esta integración no
        carga su etiqueta ni envía visitas a Google. El resumen propio de
        Karpanda puede funcionar por separado si lo aceptas. Las preferencias de
        medición son independientes de los datos necesarios para iniciar sesión
        y utilizar el sistema.
      </p>
    </article>
  );
}
export function NotFound() {
  return (
    <div className="container info-page">
      <Empty title="No encontramos esta página">
        <p>
          La dirección puede haber cambiado o el producto ya no está publicado.
        </p>
        <Link className="button" to="/">
          Volver al catálogo <ArrowRight size={16} />
        </Link>
      </Empty>
    </div>
  );
}
export function AccountRedirect() {
  return <Navigate to="/cuenta" replace />;
}
