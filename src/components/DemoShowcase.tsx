import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ShoppingBag,
  CalendarDays,
  Sparkles,
} from "lucide-react";
export function DemoPreview() {
  return (
    <section
      className="marketing-section demo-preview-section"
      id="prueba-karpanda"
    >
      <div className="marketing-section-heading">
        <div>
          <p className="eyebrow">MENOS IMAGINAR. MÁS PROBAR.</p>
          <h2>
            Conoce la herramienta
            <br />
            usándola tú mismo.
          </h2>
        </div>
        <div>
          <p className="muted">
            Haz una venta o reserva una cita. Sin registrarte, sin datos reales
            y a tu propio ritmo.
          </p>
          <Link className="text-link" to="/demos">
            Ver las demos <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <DemoCards />
    </section>
  );
}
function DemoCards() {
  return (
    <div className="demo-selection-grid">
      {[
        {
          id: "ventas",
          title: "De un producto a una venta.",
          subtitle: "VENTAS E INVENTARIO",
          body: "Arma una venta, confirma un cobro ficticio y comprueba cómo cambia el inventario.",
          Icon: ShoppingBag,
          items: [
            "Productos de ejemplo",
            "Venta guiada en 3 pasos",
            "Stock que se actualiza",
          ],
        },
        {
          id: "reservas",
          title: "Un horario. Una reserva. Listo.",
          subtitle: "RESERVAS Y CITAS",
          body: "Elige un servicio, encuentra un espacio libre y organiza una agenda de ejemplo.",
          Icon: CalendarDays,
          items: [
            "Servicios y profesionales ficticios",
            "Horarios disponibles",
            "Confirmación y cancelación",
          ],
        },
      ].map((d) => (
        <article className={`demo-selection demo-selection-${d.id}`} key={d.id}>
          <div className="demo-selection-top">
            <d.Icon size={28} />
            <span>INTERACTIVA</span>
          </div>
          <p className="eyebrow">{d.subtitle}</p>
          <h3>{d.title}</h3>
          <p>{d.body}</p>
          <ul>
            {d.items.map((x) => (
              <li key={x}>
                <Check size={15} />
                {x}
              </li>
            ))}
          </ul>
          <Link className="button" to={`/demo/${d.id}`}>
            Probar {d.id === "ventas" ? "Ventas" : "Reservas"}{" "}
            <ArrowRight size={17} />
          </Link>
        </article>
      ))}
    </div>
  );
}
export function DemosPage() {
  return (
    <div className="container public-marketing">
      <section className="services-hero">
        <p className="eyebrow">TU PRÓXIMA HERRAMIENTA, EN ACCIÓN</p>
        <h1>
          Prueba primero.
          <br />
          <span>Imagina lo que sigue.</span>
        </h1>
        <p>
          Explora una experiencia de Karpanda con datos de ejemplo. Todo lo que
          hagas aquí es una simulación que puedes reiniciar.
        </p>
        <div className="demo-trust-line">
          <span>
            <Check size={15} />
            Sin registro
          </span>
          <span>
            <Check size={15} />
            Sin cobros
          </span>
          <span>
            <Check size={15} />
            También en tu celular
          </span>
        </div>
      </section>
      <DemoCards />
      <section className="demo-outro">
        <Sparkles size={24} />
        <h2>¿Tu negocio necesita algo distinto?</h2>
        <p>
          Estas demos muestran recorridos de ejemplo. Podemos conversar sobre
          las funciones, integraciones y condiciones que necesitas.
        </p>
        <Link className="text-link" to="/servicios#preparar-consulta">
          Preparar una consulta <ArrowUpRight size={17} />
        </Link>
      </section>
    </div>
  );
}
