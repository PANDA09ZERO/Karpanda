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
} from "lucide-react";
import { PageHeading } from "../components";

type LandingExample = {
  slug: string;
  title: string;
  tagline: string;
  accent: string;
  services: string[];
  highlights: string[];
};

const examples: LandingExample[] = [
  {
    slug: "spa",
    title: "Serenity Spa",
    tagline: "Bienestar, calma y cuidado personal en un solo lugar.",
    accent: "#7c5cff",
    services: [
      "Masajes relajantes",
      "Tratamientos faciales",
      "Aromaterapia",
      "Días de spa",
    ],
    highlights: [
      "Ambiente tranquilo y personalizado",
      "Reserva online en segundos",
      "Paquetes para parejas y grupos",
    ],
  },
  {
    slug: "cafeteria",
    title: "Café Aroma",
    tagline: "Café de especialidad y repostería artesanal cada mañana.",
    accent: "#b45309",
    services: [
      "Café de especialidad",
      "Repostería artesanal",
      "Desayunos",
      "Eventos privados",
    ],
    highlights: [
      "Granos seleccionados",
      "Ambiente acogedor",
      "WiFi y espacio para trabajar",
    ],
  },
  {
    slug: "motos",
    title: "Moto Center",
    tagline: "Venta, mantenimiento y accesorios para tu moto.",
    accent: "#dc2626",
    services: [
      "Venta de motos",
      "Mantenimiento y reparación",
      "Accesorios y repuestos",
      "Financiamiento",
    ],
    highlights: [
      "Taller especializado",
      "Garantía en repuestos",
      "Asesoría personalizada",
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
        <div className="industry-grid">
          {examples.map((e) => {
            const Icon = iconFor(e.slug);
            return (
              <Link
                key={e.slug}
                to={`/landing/${e.slug}`}
                className="industry-card"
              >
                <Icon size={28} />
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
    <div className="landing-example" style={{ ["--accent" as string]: example.accent }}>
      <header className="landing-hero">
        <div className="landing-hero-copy">
          <span className="eyebrow">EJEMPLO DE LANDING PAGE</span>
          <h1>{example.title}</h1>
          <p>{example.tagline}</p>
          <div className="hero-actions">
            <a href="#contacto" className="button">
              Contáctanos <ArrowRight size={18} />
            </a>
            <a href="#servicios" className="text-link">
              Ver servicios
            </a>
          </div>
        </div>
        <div className="landing-hero-visual">
          <Icon size={96} />
        </div>
      </header>

      <section className="landing-section" id="servicios">
        <h2>Servicios</h2>
        <div className="landing-service-grid">
          {example.services.map((s) => (
            <article key={s} className="landing-service-card">
              <Check size={18} />
              <span>{s}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2>Por qué elegirnos</h2>
        <ul className="landing-highlight-list">
          {example.highlights.map((h) => (
            <li key={h}>
              <Sparkles size={16} /> {h}
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section landing-gallery">
        <h2>Galería</h2>
        <div className="landing-gallery-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="landing-gallery-item" />
          ))}
        </div>
      </section>

      <section className="landing-section" id="contacto">
        <h2>Contacto</h2>
        <div className="landing-contact">
          <div>
            <Phone size={18} /> +51 999 999 999
          </div>
          <div>
            <Mail size={18} /> hola@{example.slug}.com
          </div>
          <div>
            <MapPin size={18} /> Tu ciudad, tu dirección
          </div>
        </div>
        <Link className="button secondary" to="/landing">
          Ver más ejemplos <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}