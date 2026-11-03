import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Package,
  BriefcaseBusiness,
  Globe,
} from "lucide-react";
import type { Product } from "../types";
import { productContent } from "../lib/productContent";
import { productDemo } from "../lib/catalog";

export function ProductPreview({ product }: { product: Product }) {
  const info = productContent(product);
  const Icon =
    info.kind === "educacion"
      ? GraduationCap
      : info.kind === "reservas"
        ? CalendarDays
        : info.kind === "gestion"
          ? BriefcaseBusiness
          : info.kind.startsWith("landing")
            ? Globe
            : Package;
  return (
    <section
      className={`product-system-preview product-system-${info.kind}`}
      aria-label={`Vista resumida de ${product.name}`}
    >
      <div className="psp-window">
        <span />
        <span />
        <span />
        <small>Vista previa · Datos de ejemplo</small>
      </div>
      <div className="psp-layout">
        <aside className="psp-sidebar">
          <div>
            <Icon size={23} />
            <strong>{info.brand}</strong>
          </div>
          {info.nav.map((name, i) => (
            <span key={name} className={i === 0 ? "selected" : ""}>
              {i === 0 && <LayoutDashboard size={14} />} {name}
            </span>
          ))}
        </aside>
        <div className="psp-body">
          <header>
            <div>
              <small>ESPACIO DE TRABAJO</small>
              <h3>{info.brand}</h3>
            </div>
            <span>DEMO</span>
          </header>
          <div className="psp-stats">
            {info.stats.map(([name, value]) => (
              <div key={name}>
                <small>{name}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="psp-workspace">
            {info.kind === "ventas" ? (
              <>
                <div className="psp-panel">
                  <strong>Inventario de tu tienda</strong>
                  {demoStock().map(([name, stock]) => (
                    <div className="psp-line" key={name}>
                      <span>{name}</span>
                      <b>{stock}</b>
                    </div>
                  ))}
                </div>
                <div className="psp-panel">
                  <strong>Actividad de ventas</strong>
                  <p>Tu primera venta empieza aquí.</p>
                  <small>
                    El stock y el historial se actualizan al confirmar una venta
                    de prueba.
                  </small>
                </div>
              </>
            ) : info.kind === "reservas" ? (
              <>
                <div className="psp-panel">
                  <strong>Agenda de ejemplo</strong>
                  <div className="psp-appointment">
                    <b>10:00</b>
                    <span>
                      Asesoría inicial<small>Sofía · Confirmada</small>
                    </span>
                  </div>
                  <div className="psp-line">
                    <span>11:00</span>
                    <small>Disponible</small>
                  </div>
                  <div className="psp-line">
                    <span>14:00</span>
                    <small>Disponible</small>
                  </div>
                </div>
                <div className="psp-panel">
                  <strong>Tu equipo</strong>
                  <p>Sofía · 1 cita confirmada</p>
                  <p>Mateo · Sin citas</p>
                  <small>
                    Cada profesional tiene su propia disponibilidad.
                  </small>
                </div>
              </>
            ) : info.kind === "gestion" ? (
              <>
                <div className="psp-panel">
                  <strong>Proyectos en marcha</strong>
                  {[
                    ["Renovación del catálogo", 50],
                    ["Organizar la operación", 0],
                  ].map(([name, value]) => (
                    <div className="psp-progress" key={name}>
                      <span>
                        {name}
                        <b>{value}%</b>
                      </span>
                      <i>
                        <span style={{ width: `${value}%` }} />
                      </i>
                    </div>
                  ))}
                </div>
                <div className="psp-panel">
                  <strong>Directorio de clientes</strong>
                  <p>Café Aurora</p>
                  <p>Tienda Brisa</p>
                  <small>Clientes, proyectos y tareas conectados.</small>
                </div>
              </>
            ) : info.kind === "educacion" ? (
              <>
                <div className="psp-panel">
                  <strong>Seguimiento académico</strong>
                  <div className="psp-line">
                    <span>Matemática</span>
                    <b>12.7 / 20</b>
                  </div>
                  <div className="psp-line">
                    <span>Comunicación</span>
                    <b>14.7 / 20</b>
                  </div>
                  <small>Promedios de las notas del escenario inicial.</small>
                </div>
                <div className="psp-panel">
                  <strong>Operación del colegio</strong>
                  <p>3 matrículas activas de ejemplo</p>
                  <p>Expedientes y avisos por revisar</p>
                  <small>
                    Alumnos, asistencia, notas y documentos en un mismo espacio.
                  </small>
                </div>
              </>
            ) : info.kind.startsWith("landing") ? (
              <>
                <div className="psp-panel">
                  <strong>Secciones de la página</strong>
                  <div className="psp-line">
                    <span>Hero y mensaje</span>
                    <b>Principal</b>
                  </div>
                  <div className="psp-line">
                    <span>Servicios o productos</span>
                    <b>Destacado</b>
                  </div>
                  <div className="psp-line">
                    <span>Contacto</span>
                    <b>Directo</b>
                  </div>
                </div>
                <div className="psp-panel">
                  <strong>Dispositivos</strong>
                  <p>Se adapta a celular, tablet y computadora.</p>
                  <small>Diseño responsive y carga rápida.</small>
                </div>
              </>
            ) : (
              <div className="psp-panel">
                <strong>{product.name}</strong>
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="psp-caption">
        Resumen visual del escenario de demostración. Abre la demo para realizar
        acciones y explorar los detalles.
      </p>
    </section>
  );
}
function demoStock() {
  return [
    ["Cuaderno kraft", "12 unidades"],
    ["Agenda semanal", "8 unidades"],
    ["Termo de acero", "6 unidades"],
  ];
}

export function ProductOverview({ product }: { product: Product }) {
  const info = productContent(product);
  const demo = productDemo(product);
  return (
    <div className="product-overview">
      <section className="product-introduction">
        <p className="eyebrow">{info.audience}</p>
        <h2>Qué puedes hacer con {product.name}</h2>
        <p>{info.summary}</p>
        {demo && (
          <Link className="button product-demo-link" to={demo}>
            Probar una demo interactiva <ArrowRight size={17} />
          </Link>
        )}
        {info.kind.startsWith("landing") && (
          <Link
            className="button product-demo-link"
            to={landingExample(product.slug)}
          >
            Ver ejemplo en vivo <ArrowRight size={17} />
          </Link>
        )}
      </section>
      {!info.kind.startsWith("landing") && <ProductPreview product={product} />}
      {screenshotFor(info.kind) && (
        <section className="product-screenshot-section">
          <p className="eyebrow">CAPTURA REAL</p>
          <h2>Así se ve en uso</h2>
          <div className="screenshot-frame">
            <img
              src={screenshotFor(info.kind)!}
              alt={`Captura real del demo de ${product.name}`}
              loading="lazy"
            />
          </div>
          <p className="muted">
            Imagen tomada del escenario de demostración. Los datos son ficticios y
            se pueden reiniciar desde la demo.
          </p>
          {demo && (
            <Link className="button secondary product-demo-link" to={demo}>
              Abrir la demo interactiva <ArrowRight size={17} />
            </Link>
          )}
        </section>
      )}
      <section className="product-module-section">
        <p className="eyebrow">EL SISTEMA POR DENTRO</p>
        <h2>Módulos que trabajan juntos</h2>
        <div className="product-module-grid">
          {info.modules.map(([title, body]) => (
            <article key={title}>
              <CheckCircle2 size={21} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      {info.steps.length > 0 && (
        <section className="product-walkthrough">
          <p className="eyebrow">ASÍ LO PUEDES PROBAR</p>
          <h2>Un recorrido sencillo</h2>
          <ol>
            {info.steps.map((step, i) => (
              <li key={step}>
                <span>0{i + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <p className="muted">
            La demo utiliza datos ficticios y se puede reiniciar. El alcance
            final y las condiciones de implementación se acuerdan según el
            producto y el plan.
          </p>
        </section>
      )}
      <section className="product-faq">
        <p className="eyebrow">PREGUNTAS FRECUENTES</p>
        <h2>Antes de empezar</h2>
        <div className="faq-list">
          {productFaqs(info.kind.startsWith("landing") ? "landing" : info.kind).map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function productFaqs(kind: string): [string, string][] {
  const common: [string, string][] = [
    [
      "¿La demo usa datos reales?",
      "No. La demo utiliza datos ficticios que puedes modificar y reiniciar cuando quieras.",
    ],
    [
      "¿Puedo usarlo desde el celular?",
      "Sí. La interfaz se adapta a computadoras, tabletas y teléfonos.",
    ],
  ];
  const specific: Record<string, [string, string][]> = {
    landing: [
      [
        "¿Puedo actualizar el contenido yo mismo?",
        "Sí. Te dejamos una guía simple para actualizar textos e imágenes.",
      ],
      [
        "¿Incluye dominio y hosting?",
        "Se acuerda en la propuesta según tus necesidades.",
      ],
    ],
    ventas: [
      [
        "¿El stock se actualiza al vender?",
        "Sí. Al confirmar una venta de prueba, las existencias y el historial se actualizan.",
      ],
      [
        "¿Puedo exportar la información?",
        "Sí. Puedes revisar y exportar el historial de ventas y el inventario.",
      ],
    ],
    reservas: [
      [
        "¿Se evitan los cruces de horarios?",
        "Sí. Solo se muestran horarios disponibles para el profesional y servicio elegidos.",
      ],
      [
        "¿Qué pasa si cancelo una cita?",
        "El horario se libera y vuelve a estar disponible en la agenda.",
      ],
    ],
    gestion: [
      [
        "¿Puedo asignar responsables a las tareas?",
        "Sí. Cada tarea puede tener un responsable y un estado de avance.",
      ],
      [
        "¿Se pueden generar reportes por cliente?",
        "Sí. Puedes filtrar por cliente y descargar un resumen de avances y presupuestos.",
      ],
    ],
    educacion: [
      [
        "¿Incluye matrículas y pagos?",
        "Sí. Puedes crear matrículas con cargos ficticios y registrar abonos.",
      ],
      [
        "¿Se puede imprimir la libreta?",
        "Sí. Puedes generar e imprimir una libreta de ejemplo por alumno.",
      ],
    ],
  };
  return [...(specific[kind] || []), ...common];
}function screenshotFor(kind: string): string | null {
  const map: Record<string, string> = {
    ventas: "/screenshots/ventas.png",
    reservas: "/screenshots/reservas.png",
    gestion: "/screenshots/gestion.png",
    educacion: "/screenshots/educacion.png",
  };
  return map[kind] || null;
}

function landingExample(slug: string) {
  const map: Record<string, string> = {
    "landing-corporativa": "/landing/spa",
    "landing-campana": "/landing/cafeteria",
    "landing-catalogo": "/landing/motos",
  };
  return map[slug] || "/landing";
}
