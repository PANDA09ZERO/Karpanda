import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ShoppingBag,
  CalendarDays,
  Sparkles,
  GraduationCap,
  BriefcaseBusiness,
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
          body: "Entra a Panda Papelería: un sistema con dashboard, punto de venta, inventario e historial.",
          Icon: ShoppingBag,
          items: [
            "Dashboard y menú propios",
            "Venta guiada en 3 pasos",
            "Stock que se actualiza",
          ],
        },
        {
          id: "educacion",
          title: "Tu colegio, conectado.",
          subtitle: "GESTIÓN EDUCATIVA",
          body: "Explora Colegio Panda: alumnos, profesores, familias, matrículas, pagos, horarios y gestión académica.",
          Icon: GraduationCap,
          items: [
            "Dashboard académico propio",
            "Matrículas y pagos conectados",
            "Asistencia, notas, libretas y reportes",
          ],
        },
        {
          id: "gestion",
          title: "De un cliente a un proyecto.",
          subtitle: "GESTIÓN DE NEGOCIOS",
          body: "Organiza Panda Studio: clientes, proyectos, responsables, tareas y reportes en un mismo lugar.",
          Icon: BriefcaseBusiness,
          items: [
            "Dashboard y clientes conectados",
            "Proyectos y tareas con seguimiento",
            "Reportes de presupuestos simulados",
          ],
        },
        {
          id: "reservas",
          title: "Un horario. Una reserva. Listo.",
          subtitle: "RESERVAS Y CITAS",
          body: "Explora Estudio Panda: un sistema con dashboard, agenda, reservas, servicios y equipo.",
          Icon: CalendarDays,
          items: [
            "Dashboard y agenda del negocio",
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
            Probar{" "}
            {d.id === "ventas"
              ? "Ventas"
              : d.id === "gestion"
                ? "Gestión"
                : d.id === "educacion"
                  ? "Educación"
                  : "Reservas"}{" "}
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
