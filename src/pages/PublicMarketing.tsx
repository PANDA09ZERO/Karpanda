import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Check,
  Code2,
  Workflow,
  PanelsTopLeft,
  ShoppingBag,
  Globe,
  MessagesSquare,
  Compass,
  Sparkles,
  Copy,
  CheckCheck,
} from "lucide-react";
import { trackPublicAction } from "../lib/analytics";
import { pandas } from "../components";

export const serviceIdeas = [
  {
    id: "web",
    icon: Globe,
    title: "Tu negocio en la web",
    tag: "PRESENCIA DIGITAL",
    description:
      "Una página que explique lo que haces y haga más fácil dar el siguiente paso.",
    examples: [
      "Páginas corporativas",
      "Landing pages de campañas",
      "Portafolios y catálogos",
    ],
    outcome: "Para que te encuentren, te entiendan y te contacten.",
  },
  {
    id: "gestion",
    icon: PanelsTopLeft,
    title: "Sistemas que ponen orden",
    tag: "SOFTWARE A MEDIDA",
    description:
      "Conecta la información de tu negocio en una herramienta pensada para tu forma de trabajar.",
    examples: [
      "Paneles administrativos",
      "Gestión de clientes y pedidos",
      "Reservas y seguimiento",
    ],
    outcome: "Para tener una visión más clara de tu operación.",
  },
  {
    id: "tienda",
    icon: ShoppingBag,
    title: "Un catálogo que vende tu idea",
    tag: "EXPERIENCIAS COMERCIALES",
    description:
      "Presenta productos o servicios con información clara y un recorrido sencillo para tus clientes.",
    examples: [
      "Catálogos de productos",
      "Solicitudes de cotización",
      "Tiendas con alcance definido",
    ],
    outcome: "Para mostrar mejor lo que ofreces.",
  },
  {
    id: "automatizacion",
    icon: Workflow,
    title: "Menos tareas repetidas",
    tag: "AUTOMATIZACIÓN",
    description:
      "Identifica los pasos que puedes simplificar y conecta las herramientas que ya utilizas.",
    examples: [
      "Formularios y flujos de trabajo",
      "Integraciones entre sistemas",
      "Reportes e indicadores",
    ],
    outcome: "Para dedicar más tiempo a lo que necesita tu atención.",
  },
];
const questions = [
  [
    "¿Qué diferencia hay entre el software del catálogo y un proyecto a medida?",
    "El catálogo presenta herramientas con un plan y funciones definidas. Un proyecto a medida comienza con tus necesidades: primero acordamos qué resolver, el alcance y una propuesta antes de desarrollarlo.",
  ],
  [
    "¿Necesito saber de tecnología para empezar?",
    "No. Puedes comenzar contándonos qué haces hoy, dónde pierdes tiempo y qué te gustaría mejorar. Esa conversación ayuda a definir una solución comprensible y útil.",
  ],
  [
    "¿Puedo usar Karpanda desde mi celular?",
    "La página y el portal de Karpanda se adaptan a móviles, tabletas y computadoras. En un proyecto a medida, los dispositivos y navegadores que se deben cubrir se definen en el alcance.",
  ],
  [
    "¿Cómo se define el precio de un servicio a medida?",
    "Depende de las funciones, las integraciones y el trabajo necesario. Primero se revisa el alcance; después se confirma la propuesta. Las ideas de servicios de esta página no incluyen una tarifa ni un plazo cerrado.",
  ],
  [
    "¿Cómo se activa una licencia del catálogo?",
    "Crea tu cuenta y registra el pedido. La activación se realiza después de verificar el pago. Actualmente, registrar un pedido no realiza un cobro automático.",
  ],
  [
    "¿Dónde puedo pedir ayuda o consultar una idea?",
    "Desde el centro de soporte puedes iniciar sesión y abrir una solicitud. Si todavía estás definiendo tu proyecto, la página de servicios incluye una guía para preparar tu consulta.",
  ],
];
export function ServicePreview() {
  return (
    <section className="marketing-section" id="servicios">
      <div className="marketing-section-heading">
        <div>
          <p className="eyebrow">DE LA IDEA A UNA HERRAMIENTA ÚTIL</p>
          <h2>
            Tu negocio tiene su forma.
            <br />
            Tu tecnología también puede.
          </h2>
        </div>
        <div>
          <p className="muted">
            Además de las soluciones del catálogo, explora ideas de proyectos
            que podemos definir contigo.
          </p>
          <Link className="text-link" to="/servicios">
            Explorar servicios <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="service-ideas-grid">
        {serviceIdeas.map((s) => (
          <Link
            to={`/servicios#${s.id}`}
            className={`service-idea service-${s.id}`}
            key={s.id}
            onClick={() => trackPublicAction("view_service", s.id)}
          >
            <div className="service-idea-top">
              <s.icon size={26} />
              <ArrowUpRight size={18} />
            </div>
            <span className="eyebrow">{s.tag}</span>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
            <div className="service-example">
              {s.examples[0]}
              <span>·</span>
              {s.examples[1]}
            </div>
          </Link>
        ))}
      </div>
      <p className="marketing-caption">
        Ideas de servicios a medida. Alcance, disponibilidad y propuesta se
        confirman antes de iniciar.
      </p>
    </section>
  );
}
export function WorkingMethod() {
  return (
    <section className="working-method marketing-section" id="proceso">
      <div className="method-intro">
        <p className="eyebrow">PASOS CLAROS. SIN ENREDOS.</p>
        <h2>
          Primero entendemos.
          <br />
          Después construimos.
        </h2>
        <p>
          No necesitas llegar con todas las respuestas. Empezamos con el
          problema que quieres resolver.
        </p>
        <Link to="/servicios#preparar-consulta" className="text-link">
          Preparar mi idea <ArrowRight size={17} />
        </Link>
      </div>
      <ol>
        {[
          [
            "01",
            "Conversamos",
            "Nos cuentas cómo trabajas, qué necesitas y qué quieres mejorar.",
          ],
          [
            "02",
            "Definimos un camino",
            "Acordamos funciones, prioridades y una propuesta con alcance claro.",
          ],
          [
            "03",
            "Construimos y revisamos",
            "Revisamos contigo lo desarrollado y ajustamos según lo acordado.",
          ],
          [
            "04",
            "Te acompañamos a empezar",
            "Preparamos la entrega y definimos las condiciones de soporte y evolución.",
          ],
        ].map(([n, title, body]) => (
          <li key={n}>
            <span>{n}</span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function FrequentlyAsked() {
  return (
    <section className="marketing-section faq-section" id="preguntas">
      <div>
        <p className="eyebrow">ANTES DE DAR EL SIGUIENTE PASO</p>
        <h2>
          Preguntas reales.
          <br />
          Respuestas claras.
        </h2>
        <p className="muted">
          Si tu consulta es distinta, estamos al otro lado de tu cuenta.
        </p>
        <Link className="text-link" to="/soporte">
          Ir a soporte <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="faq-list">
        {questions.map(([title, answer], i) => (
          <details
            key={title}
            onToggle={(e) => {
              if (e.currentTarget.open)
                trackPublicAction("open_faq", `faq_${i + 1}`);
            }}
          >
            <summary>
              {title}
              <span>+</span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export function WhyKarpanda() {
  return (
    <section className="why-karpanda marketing-section" id="karpanda">
      <div className="why-illustration">
        <img
          src={pandas}
          alt="Dos pandas de Karpanda colaborando frente a una computadora"
          width="660"
          height="330"
          loading="lazy"
        />
        <span className="illustration-note">
          <Sparkles size={16} /> La tecnología también puede sentirse cercana.
        </span>
      </div>
      <div className="why-copy">
        <p className="eyebrow">TECNOLOGÍA CON SENTIDO</p>
        <h2>
          Más claridad para ti.
          <br />
          Más espacio para crecer.
        </h2>
        <p className="muted">
          Karpanda nace de una idea sencilla: las herramientas deben ayudarte a
          trabajar mejor. El punto de partida es tu negocio y las personas que
          lo hacen posible.
        </p>
        <ul>
          {[
            [
              Compass,
              "Un objetivo antes que una función",
              "Definimos qué problema queremos resolver.",
            ],
            [
              Code2,
              "Herramientas que se entienden",
              "Buscamos recorridos claros y funciones que tengan sentido.",
            ],
            [
              MessagesSquare,
              "Comunicación durante el proceso",
              "Revisamos contigo los pasos y las decisiones del proyecto.",
            ],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof Compass;
            return (
              <li key={String(title)}>
                <I size={21} />
                <div>
                  <strong>{String(title)}</strong>
                  <p>{String(body)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
export function PublicCTA() {
  return (
    <section className="public-cta">
      <span className="eyebrow">UN PASO A LA VEZ, JUNTOS</span>
      <h2>
        Tu próxima buena idea
        <br />
        merece una herramienta a su altura.
      </h2>
      <p>
        Encuentra una solución lista para explorar o empieza a darle forma a tu
        proyecto.
      </p>
      <div>
        <Link className="button" to="/servicios#preparar-consulta">
          Tengo una idea <ArrowUpRight size={18} />
        </Link>
        <a className="button secondary" href="/#soluciones">
          Ver catálogo <ArrowRight size={17} />
        </a>
      </div>
      <span className="cta-circuit" aria-hidden="true" />
    </section>
  );
}
export function ServicesPage() {
  const [selected, setSelected] = useState("web"),
    [goal, setGoal] = useState(""),
    [current, setCurrent] = useState(""),
    [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const service = serviceIdeas.find((s) => s.id === selected)!;
  const brief = `Hola, quiero consultar un proyecto de ${service.title.toLowerCase()}.\n\nObjetivo: ${goal.trim() || "Por definir en la conversación."}\nCómo trabajo hoy: ${current.trim() || "Por definir en la conversación."}\n\nMe gustaría revisar el alcance, la disponibilidad y una propuesta.`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      setError("");
      trackPublicAction("consult_service", selected);
    } catch {
      setError(
        "No se pudo copiar automáticamente. Selecciona y copia el resumen que aparece debajo.",
      );
    }
  }
  return (
    <div className="container public-marketing">
      <section className="services-hero">
        <Link className="text-link" to="/">
          Karpanda <ArrowRight size={15} /> Servicios
        </Link>
        <p className="eyebrow">UN PUNTO DE PARTIDA PARA TU PROYECTO</p>
        <h1>
          Ideas que toman forma.
          <br />
          <span>Herramientas que ayudan.</span>
        </h1>
        <p>
          Una página, un sistema o un proceso más simple. Exploremos qué
          necesita tu negocio antes de elegir cómo construirlo.
        </p>
        <a href="#preparar-consulta" className="button">
          Preparar una consulta <ArrowDown size={17} />
        </a>
      </section>
      <div className="service-details">
        {serviceIdeas.map((s, i) => (
          <section id={s.id} className="service-detail" key={s.id}>
            <div className="service-number">
              0{i + 1}
              <s.icon size={46} />
            </div>
            <div>
              <p className="eyebrow">{s.tag}</p>
              <h2>{s.title}</h2>
              <p>{s.description}</p>
              <strong className="service-outcome">{s.outcome}</strong>
            </div>
            <div>
              <p className="small muted">PODEMOS EXPLORAR</p>
              <ul>
                {s.examples.map((x) => (
                  <li key={x}>
                    <Check size={17} />
                    {x}
                  </li>
                ))}
              </ul>
              <a
                className="text-link"
                href="#preparar-consulta"
                onClick={() => {
                  setSelected(s.id);
                  setCopied(false);
                  trackPublicAction("view_service", s.id);
                }}
              >
                Quiero consultar esta idea <ArrowUpRight size={16} />
              </a>
            </div>
          </section>
        ))}
      </div>
      <section
        className="project-brief marketing-section"
        id="preparar-consulta"
      >
        <div>
          <p className="eyebrow">DE LA CABEZA AL PAPEL</p>
          <h2>
            Empieza por contarnos
            <br />
            qué quieres mejorar.
          </h2>
          <p className="muted">
            Prepara un resumen y cópialo para crear tu solicitud en soporte.
            Puedes usarlo aunque todavía no tengas todos los detalles.
          </p>
          <div className="brief-note">
            <MessagesSquare size={22} />
            <p>
              El resumen se prepara en tu navegador. No se envía ni se guarda al
              escribir. Para enviarlo a Karpanda, inicia sesión y pégalo en una
              solicitud de soporte.
            </p>
          </div>
        </div>
        <div className="brief-form">
          <label>
            ¿Qué te gustaría construir?
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setCopied(false);
              }}
            >
              {serviceIdeas.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            ¿Qué quieres conseguir?
            <textarea
              rows={3}
              maxLength={700}
              placeholder="Por ejemplo: presentar mis servicios y recibir consultas más claras."
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value);
                setCopied(false);
              }}
            />
          </label>
          <label>
            ¿Cómo lo resuelves hoy?
            <textarea
              rows={2}
              maxLength={700}
              placeholder="Por ejemplo: uso hojas de cálculo y mensajes por separado."
              value={current}
              onChange={(e) => {
                setCurrent(e.target.value);
                setCopied(false);
              }}
            />
          </label>
          <details className="brief-preview">
            <summary>Ver mi resumen</summary>
            <pre>{brief}</pre>
          </details>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="brief-actions">
            <button className="button" onClick={() => void copy()}>
              {copied ? <CheckCheck size={17} /> : <Copy size={17} />}{" "}
              {copied ? "Resumen copiado" : "Copiar resumen"}
            </button>
            <Link className="button secondary" to="/cuenta/soporte?new=1">
              {copied ? "Abrir soporte y pegar" : "Ir a soporte"}{" "}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <small className="muted">
            Consultar una idea no genera un pedido ni un compromiso de compra.
          </small>
        </div>
      </section>
      <FrequentlyAsked />
      <PublicCTA />
    </div>
  );
}
