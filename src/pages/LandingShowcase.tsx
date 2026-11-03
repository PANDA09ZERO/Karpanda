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
} from "lucide-react";
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

  if (!slug) {
    return (
      <div className="container public-marketing">
        <PageHeading title="Ejemplos de landing pages">
          <span className="detail-subtitle">
            Páginas públicas de ejemplo para distintos negocios.
          </span>
        </PageHeading>
        <div className="landing-gallery-grid" style={{ marginBottom: 24 }}>
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
              Ver servicios
            </a>
          </div>
        </div>
        <div className="landing-hero-visual">
          <Icon size={120} strokeWidth={1.2} />
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

      <section className="landing-section">
        <h2>Por qué elegirnos</h2>
        <div className="landing-highlight-grid">
          {example.highlights.map((h) => (
            <div key={h} className="landing-highlight-card">
              <Sparkles size={20} />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
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
        <Link className="landing-btn-ghost" to="/landing" style={{ marginTop: 16, display: "inline-flex" }}>
          Ver más ejemplos <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}