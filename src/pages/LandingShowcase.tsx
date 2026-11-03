import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Coffee,
  Bike,
  Flower2,
  Check,
  Phone,
  Mail,
  MapPin,
  Star,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { PageHeading } from "../components";

type LandingExample = {
  slug: string;
  title: string;
  tagline: string;
  accent: string;
  accentSoft: string;
  services: { name: string; desc: string }[];
  highlights: string[];
  testimonials: { name: string; text: string }[];
  benefits: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
};

const examples: LandingExample[] = [
  {
    slug: "spa",
    title: "Serenity Spa",
    tagline: "Bienestar, calma y cuidado personal en un solo lugar.",
    accent: "#7c5cff",
    accentSoft: "#ede9fe",
    services: [
      { name: "Masajes relajantes", desc: "Sesiones de 60 y 90 minutos para liberar tensión." },
      { name: "Tratamientos faciales", desc: "Limpieza profunda e hidratación para tu piel." },
      { name: "Aromaterapia", desc: "Aceites esenciales y ambiente controlado." },
      { name: "Días de spa", desc: "Paquetes completos para parejas y grupos." },
    ],
    highlights: [
      "Ambiente tranquilo y personalizado",
      "Reserva online en segundos",
      "Paquetes para parejas y grupos",
    ],
    benefits: [
      { title: "Reserva fácil", desc: "Agenda tu cita en menos de un minuto desde el celular." },
      { title: "Atención personalizada", desc: "Cada visita se adapta a tus necesidades." },
      { title: "Ambiente premium", desc: "Espacios diseñados para tu relajación." },
    ],
    faqs: [
      { q: "¿Cómo empiezo?", a: "Contáctanos y te guiamos paso a paso." },
      { q: "¿Incluye soporte?", a: "Sí, acompañamiento durante la implementación." },
      { q: "¿Se adapta a mi negocio?", a: "Personalizamos la página a tu marca." },
    ],
    testimonials: [
      { name: "Lucía", text: "Salí renovada. El ambiente es increíble." },
      { name: "Carlos", text: "La reserva online me ahorró mucho tiempo." },
    ],
  },
  {
    slug: "cafeteria",
    title: "Café Aroma",
    tagline: "Café de especialidad y repostería artesanal cada mañana.",
    accent: "#b45309",
    accentSoft: "#fef3c7",
    services: [
      { name: "Café de especialidad", desc: "Granos seleccionados y tostado artesanal." },
      { name: "Repostería artesanal", desc: "Pasteles y galletas hechos cada día." },
      { name: "Desayunos", desc: "Combos completos para empezar bien el día." },
      { name: "Eventos privados", desc: "Reserva el espacio para tu reunión." },
    ],
    highlights: [
      "Granos seleccionados",
      "Ambiente acogedor",
      "WiFi y espacio para trabajar",
    ],
    benefits: [
      { title: "Café de origen", desc: "Granos seleccionados de productores locales." },
      { title: "Hecho cada día", desc: "Repostería fresca todas las mañanas." },
      { title: "Tu espacio", desc: "WiFi, enchufes y ambiente para trabajar." },
    ],
    faqs: [
      { q: "¿Cómo empiezo?", a: "Contáctanos y te guiamos paso a paso." },
      { q: "¿Incluye soporte?", a: "Sí, acompañamiento durante la implementación." },
      { q: "¿Se adapta a mi negocio?", a: "Personalizamos la página a tu marca." },
    ],
    testimonials: [
      { name: "María", text: "El mejor café de la zona, sin duda." },
      { name: "Diego", text: "Perfecto para trabajar con WiFi y buena música." },
    ],
  },
  {
    slug: "motos",
    title: "Moto Center",
    tagline: "Venta, mantenimiento y accesorios para tu moto.",
    accent: "#dc2626",
    accentSoft: "#fee2e2",
    services: [
      { name: "Venta de motos", desc: "Modelos nuevos y seminuevos con garantía." },
      { name: "Mantenimiento", desc: "Servicio técnico especializado." },
      { name: "Accesorios y repuestos", desc: "Todo para personalizar tu moto." },
      { name: "Financiamiento", desc: "Planes a tu medida." },
    ],
    highlights: [
      "Taller especializado",
      "Garantía en repuestos",
      "Asesoría personalizada",
    ],
    benefits: [
      { title: "Taller experto", desc: "Mecánicos certificados para tu moto." },
      { title: "Repuestos garantizados", desc: "Calidad y garantía en cada pieza." },
      { title: "Financiamiento", desc: "Planes flexibles para tu compra." },
    ],
    faqs: [
      { q: "¿Cómo empiezo?", a: "Contáctanos y te guiamos paso a paso." },
      { q: "¿Incluye soporte?", a: "Sí, acompañamiento durante la implementación." },
      { q: "¿Se adapta a mi negocio?", a: "Personalizamos la página a tu marca." },
    ],
    testimonials: [
      { name: "Jorge", text: "Excelente atención y precios justos." },
      { name: "Ana", text: "El mantenimiento fue rápido y profesional." },
    ],
  },
];

function iconFor(slug: string) {
  if (slug === "spa") return Flower2;
  if (slug === "cafeteria") return Coffee;
  return Bike;
}

export function LandingShowcase() {
  const { slug } = useParams();
  const example = examples.find((e) => e.slug === slug);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!slug) {
    return (
      <div className="container public-marketing">
        <PageHeading title="Ejemplos de landing pages">
          <span className="detail-subtitle">
            Páginas públicas de ejemplo para distintos negocios.
          </span>
        </PageHeading>
        <div className="industry-grid">
          {examples.map((e) => {
            const Icon = iconFor(e.slug);
            return (
              <Link
                key={e.slug}
                to={`/landing/${e.slug}`}
                className="industry-card"
                style={{ ["--accent" as string]: e.accent }}
              >
                <Icon size={32} />
                <h3>{e.title}</h3>
                <p>{e.tagline}</p>
                <span>
                  Ver ejemplo <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  if (!example) return null;

  const Icon = iconFor(example.slug);

  return (
    <div
      className="landing-example"
      style={
        {
          "--accent": example.accent,
          "--accent-soft": example.accentSoft,
        } as React.CSSProperties
      }
    >
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <Icon size={22} />
          <span>{example.title}</span>
        </div>
        <div className="landing-nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#beneficios">Beneficios</a>
          <a href="#testimonios">Testimonios</a>
          <a href="#contacto" className="landing-nav-cta">
            Contacto
          </a>
        </div>
        <button
          className="landing-nav-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menú"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {menuOpen && (
        <div className="landing-mobile-menu">
          <a href="#servicios" onClick={() => setMenuOpen(false)}>
            Servicios
          </a>
          <a href="#beneficios" onClick={() => setMenuOpen(false)}>
            Beneficios
          </a>
          <a href="#testimonios" onClick={() => setMenuOpen(false)}>
            Testimonios
          </a>
          <a href="#contacto" onClick={() => setMenuOpen(false)}>
            Contacto
          </a>
        </div>
      )}

      <header className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow">EJEMPLO DE LANDING PAGE</span>
          <h1>{example.title}</h1>
          <p>{example.tagline}</p>
          <div className="landing-hero-actions">
            <a href="#contacto" className="landing-btn-primary">
              Contáctanos <ArrowRight size={18} />
            </a>
            <a href="#servicios" className="landing-btn-ghost">
              Ver servicios <ChevronRight size={16} />
            </a>
          </div>
          <div className="landing-trust-row">
            <span className="landing-trust-badge">
              <Check size={14} /> Diseño responsive
            </span>
            <span className="landing-trust-badge">
              <Check size={14} /> Carga rápida
            </span>
            <span className="landing-trust-badge">
              <Check size={14} /> Soporte incluido
            </span>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-hero-card">
            <Icon size={64} strokeWidth={1.2} />
            <div className="landing-hero-card-lines">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </header>

      <section className="landing-section" id="servicios">
        <h2>Servicios</h2>
        <div className="landing-service-grid">
          {example.services.map((s) => (
            <article key={s.name} className="landing-service-card">
              <div className="landing-service-icon">
                <Check size={18} />
              </div>
              <div>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="beneficios">
        <h2>Beneficios</h2>
        <div className="landing-highlight-grid">
          {example.benefits.map((b) => (
            <div key={b.title} className="landing-highlight-card">
              <Sparkles size={20} />
              <div>
                <strong>{b.title}</strong>
                <span>{b.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="testimonios">
        <h2>Lo que dicen nuestros clientes</h2>
        <div className="landing-testimonial-grid">
          {example.testimonials.map((t) => (
            <article key={t.name} className="landing-testimonial-card">
              <div className="landing-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} fill="currentColor" />
                ))}
              </div>
              <p>“{t.text}”</p>
              <strong>{t.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-gallery">
        <h2>Galería</h2>
        <div className="landing-gallery-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="landing-gallery-item" />
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>Preguntas frecuentes</h2>
        <div className="landing-faq-list">
          {example.faqs.map((f) => (
            <details key={f.q} className="landing-faq-item">
              <summary>
                {f.q} <ChevronRight size={16} />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-section landing-cta-banner">
        <h2>¿Listo para empezar?</h2>
        <p>Conversemos sobre tu proyecto y construyamos tu landing.</p>
        <a href="#contacto" className="landing-btn-primary">
          Hablemos <ArrowRight size={18} />
        </a>
      </section>

      <section className="landing-section landing-contact-section" id="contacto">
        <h2>Contacto</h2>
        <div className="landing-contact-card">
          <div className="landing-contact-row">
            <Phone size={18} /> +51 999 999 999
          </div>
          <div className="landing-contact-row">
            <Mail size={18} /> hola@{example.slug}.com
          </div>
          <div className="landing-contact-row">
            <MapPin size={18} /> Tu ciudad, tu dirección
          </div>
          <a href="mailto:hola@example.com" className="landing-btn-primary">
            Escríbenos <ArrowRight size={16} />
          </a>
        </div>
        <Link
          className="landing-btn-ghost"
          to="/landing"
          style={{ marginTop: 20, display: "inline-flex" }}
        >
          Ver más ejemplos <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} {example.title}. Ejemplo de landing page por Karpanda.</span>
      </footer>
    </div>
  );
}