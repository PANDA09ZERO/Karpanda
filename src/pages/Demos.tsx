import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  FlaskConical,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  demoProducts,
  demoServices,
  demoStaff,
  demoTimes,
  localDay,
  bookingKey,
} from "../lib/demoData";
import { money } from "../lib/data";
import { trackDemoAction } from "../lib/analytics";

const cost = (cents: number) => money(cents / 100);
function scrollDemo() {
  requestAnimationFrame(() =>
    document.getElementById("demo-workspace")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    }),
  );
}
function DemoHeader({
  kind,
  step,
  reset,
}: {
  kind: "ventas" | "reservas";
  step: number;
  reset: () => void;
}) {
  const sales = kind === "ventas";
  const steps = sales
    ? ["Elige productos", "Revisa la venta", "Confirma y observa"]
    : ["Servicio y fecha", "Elige un horario", "Confirma la reserva"];
  return (
    <>
      <div className="demo-breadcrumb">
        <Link className="text-link" to="/demos">
          <ArrowLeft size={16} />
          Todas las demos
        </Link>
        <button className="button secondary" onClick={reset}>
          <RotateCcw size={15} />
          Reiniciar demo
        </button>
      </div>
      <div className="demo-heading">
        <div>
          <span className="demo-live-label">
            <FlaskConical size={14} />
            DEMOSTRACIÓN INTERACTIVA
          </span>
          <h1>
            {sales
              ? "Tu primera venta, paso a paso."
              : "Tu agenda, en un par de pasos."}
          </h1>
          <p>
            {sales
              ? "Elige un producto, registra una venta ficticia y mira el inventario."
              : "Elige un servicio y reserva un horario con datos de ejemplo."}
          </p>
        </div>
      </div>
      <div className="demo-safety">
        <FlaskConical size={19} />
        <p>
          Estás en una demostración. No se realizan cobros, pedidos reales ni
          reservas reales. Los cambios solo viven en esta pantalla y se
          reinician al salir.
        </p>
      </div>
      <ol className="demo-steps" aria-label="Pasos de la demostración">
        {steps.map((s, i) => (
          <li
            key={s}
            className={step > i + 1 ? "done" : step === i + 1 ? "current" : ""}
            aria-current={step === i + 1 ? "step" : undefined}
          >
            <span>{step > i + 1 ? <Check size={15} /> : i + 1}</span>
            <div>
              <small>PASO {i + 1}</small>
              <strong>{s}</strong>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
function DemoEnd({ kind }: { kind: "ventas" | "reservas" }) {
  return (
    <div className="demo-end-cta">
      <div>
        <strong>¿Te imaginas usándolo en tu negocio?</strong>
        <p>Revisa la solución o conversemos sobre una adaptación.</p>
      </div>
      <Link
        className="button"
        to={`/producto/${kind}`}
        onClick={() => trackDemoAction("demo_consult", kind)}
      >
        Conocer esta solución <ArrowUpRight size={16} />
      </Link>
      <Link
        className="text-link"
        to="/servicios#preparar-consulta"
        onClick={() => trackDemoAction("demo_consult", kind)}
      >
        Consultar una adaptación
      </Link>
    </div>
  );
}
type Sale = {
  id: number;
  lines: { id: string; qty: number }[];
  total: number;
  method: string;
};
export function SalesDemo() {
  const [step, setStep] = useState(0),
    [q, setQ] = useState(""),
    [category, setCategory] = useState("Todas"),
    [cart, setCart] = useState<Record<string, number>>({}),
    [sales, setSales] = useState<Sale[]>([]),
    [method, setMethod] = useState("Efectivo simulado"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const completed = useRef(false);
  const sold = (id: string) =>
    sales.reduce(
      (sum, s) => sum + (s.lines.find((l) => l.id === id)?.qty || 0),
      0,
    );
  const available = (id: string) => {
    const p = demoProducts.find((p) => p.id === id)!;
    return p.stock - sold(id);
  };
  const lines = demoProducts.filter((p) => cart[p.id] > 0);
  const total = lines.reduce((sum, p) => sum + p.price * cart[p.id], 0);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const latest = sales.at(-1);
  function reset() {
    setCart({});
    setSales([]);
    setStep(0);
    setQ("");
    setCategory("Todas");
    setError("");
    setNotice(
      "Demo reiniciada. El inventario vuelve a sus valores de ejemplo.",
    );
    completed.current = false;
    trackDemoAction("demo_reset", "ventas");
  }
  function start() {
    setStep(1);
    setNotice("Agrega al menos un producto a la venta.");
    completed.current = false;
    trackDemoAction("demo_start", "ventas");
    scrollDemo();
  }
  function quantity(id: string, change: number) {
    setCart((prev) => {
      const next = Math.max(
        0,
        Math.min(available(id), (prev[id] || 0) + change),
      );
      const value = { ...prev };
      if (next) value[id] = next;
      else delete value[id];
      return value;
    });
    setError("");
  }
  function review() {
    if (!count) return;
    setStep(2);
    trackDemoAction("demo_step", "ventas");
    scrollDemo();
  }
  function confirm() {
    if (completed.current) return;
    if (!lines.length || lines.some((p) => cart[p.id] > available(p.id))) {
      setError("Revisa las cantidades disponibles antes de continuar.");
      return;
    }
    completed.current = true;
    setSales((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        lines: lines.map((p) => ({ id: p.id, qty: cart[p.id] })),
        total,
        method,
      },
    ]);
    setCart({});
    setStep(3);
    setNotice("Venta ficticia completada. El inventario ya se actualizó.");
    trackDemoAction("demo_complete", "ventas");
    scrollDemo();
  }
  return (
    <div className="container demo-page">
      <DemoHeader kind="ventas" step={step === 3 ? 4 : step} reset={reset} />
      {step === 0 && (
        <section className="demo-start-panel">
          <div>
            <h2>Bienvenido a Panda Papelería.</h2>
            <p>
              Tienes seis productos y una tienda por organizar. Prueba una venta
              sin tocar los datos de ningún negocio real.
            </p>
          </div>
          <button className="button" onClick={start}>
            Comenzar recorrido <ArrowRight size={17} />
          </button>
        </section>
      )}
      <div className="demo-stat-grid">
        <article>
          <Package size={18} />
          <span>Unidades en stock</span>
          <strong>
            {demoProducts.reduce((n, p) => n + available(p.id), 0)}
          </strong>
        </article>
        <article>
          <ShoppingBag size={18} />
          <span>Ventas simuladas</span>
          <strong>{sales.length}</strong>
        </article>
        <article>
          <CheckCircle2 size={18} />
          <span>Total ficticio vendido</span>
          <strong>{cost(sales.reduce((n, s) => n + s.total, 0))}</strong>
        </article>
      </div>
      <div className="demo-workspace" id="demo-workspace">
        <section className="demo-main-panel">
          {step === 3 && latest ? (
            <div className="demo-receipt">
              <span className="demo-success-icon">
                <CheckCircle2 size={32} />
              </span>
              <p className="eyebrow">RECORRIDO COMPLETADO</p>
              <h2>Venta de prueba registrada.</h2>
              <p>
                Comprobante DEMO-{String(latest.id).padStart(3, "0")} ·{" "}
                {latest.method}
              </p>
              <div className="demo-receipt-lines">
                {latest.lines.map((l) => {
                  const p = demoProducts.find((p) => p.id === l.id)!;
                  return (
                    <div key={l.id}>
                      <span>
                        {l.qty} × {p.name}
                      </span>
                      <strong>{cost(p.price * l.qty)}</strong>
                    </div>
                  );
                })}
                <div className="demo-receipt-total">
                  <span>Total simulado</span>
                  <strong>{cost(latest.total)}</strong>
                </div>
              </div>
              <p className="demo-stock-confirmation">
                El stock de cada producto vendido se redujo por la cantidad
                elegida. Puedes verlo al comenzar otra venta.
              </p>
              <button className="button secondary" onClick={start}>
                Simular otra venta <ArrowRight size={16} />
              </button>
            </div>
          ) : step === 2 ? (
            <>
              <div className="demo-panel-heading">
                <div>
                  <p className="eyebrow">ANTES DE CONFIRMAR</p>
                  <h2>Revisa tu venta de ejemplo.</h2>
                </div>
                <button
                  className="text-link button-plain"
                  onClick={() => setStep(1)}
                >
                  Editar productos
                </button>
              </div>
              <div className="demo-order-lines">
                {lines.map((p) => (
                  <article key={p.id}>
                    <span className="demo-product-mark">{p.mark}</span>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {cart[p.id]} unidades × {cost(p.price)}
                      </small>
                    </div>
                    <b>{cost(p.price * cart[p.id])}</b>
                  </article>
                ))}
              </div>
              <div className="demo-explainer">
                <CheckCircle2 size={22} />
                <p>
                  Al confirmar, se genera un comprobante ficticio y se descuenta
                  el inventario. No se procesa ningún pago.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="demo-panel-heading">
                <div>
                  <p className="eyebrow">PANDA PAPELERÍA · NEGOCIO FICTICIO</p>
                  <h2>Productos</h2>
                </div>
                <span>{demoProducts.length} productos de ejemplo</span>
              </div>
              <label className="demo-search">
                <Search size={17} />
                <input
                  aria-label="Buscar producto de ejemplo"
                  placeholder="Busca un producto…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
              <div
                className="catalog-filters"
                role="group"
                aria-label="Categorías de la demo"
              >
                {["Todas", "Papelería", "Accesorios"].map((c) => (
                  <button
                    key={c}
                    aria-pressed={c === category}
                    className={c === category ? "selected" : ""}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="demo-product-grid">
                {demoProducts
                  .filter(
                    (p) =>
                      (category === "Todas" || p.category === category) &&
                      p.name.toLowerCase().includes(q.toLowerCase()),
                  )
                  .map((p) => (
                    <article className="demo-product" key={p.id}>
                      <div className="demo-product-visual">
                        <span>{p.mark}</span>
                        <small>{p.category}</small>
                      </div>
                      <h3>{p.name}</h3>
                      <p>
                        {cost(p.price)} <small>Stock: {available(p.id)}</small>
                      </p>
                      <button
                        className="button secondary"
                        disabled={
                          step === 0 || (cart[p.id] || 0) >= available(p.id)
                        }
                        onClick={() => quantity(p.id, 1)}
                        aria-label={`Agregar ${p.name}`}
                      >
                        <Plus size={15} />
                        Agregar
                      </button>
                    </article>
                  ))}
              </div>
              {!demoProducts.some(
                (p) =>
                  (category === "Todas" || p.category === category) &&
                  p.name.toLowerCase().includes(q.toLowerCase()),
              ) && (
                <p className="empty-copy muted">
                  No encontramos productos con ese nombre.
                </p>
              )}
            </>
          )}
        </section>
        <aside className="demo-summary" id="demo-sale-summary">
          <p className="eyebrow">TU VENTA DE EJEMPLO</p>
          <h2>{step === 3 ? "Así funciona Karpanda" : "Resumen de venta"}</h2>
          {step === 3 ? (
            <>
              <p>Producto → venta → inventario actualizado.</p>
              <ul className="demo-checklist">
                <li>
                  <Check size={15} />
                  Cantidades verificadas
                </li>
                <li>
                  <Check size={15} />
                  Comprobante simulado
                </li>
                <li>
                  <Check size={15} />
                  Stock actualizado
                </li>
              </ul>
            </>
          ) : (
            <>
              {!lines.length ? (
                <div className="demo-cart-empty">
                  <ShoppingBag size={30} />
                  <p>
                    {step === 0
                      ? "Comienza el recorrido para agregar productos."
                      : "Agrega productos y aparecerán aquí."}
                  </p>
                </div>
              ) : (
                <div className="demo-cart-lines">
                  {lines.map((p) => (
                    <div key={p.id}>
                      <strong>{p.name}</strong>
                      <div>
                        <span>{cost(p.price * cart[p.id])}</span>
                        <div className="demo-quantity">
                          <button
                            aria-label={`Quitar una unidad de ${p.name}`}
                            onClick={() => quantity(p.id, -1)}
                          >
                            <Minus size={13} />
                          </button>
                          <span>{cart[p.id]}</span>
                          <button
                            aria-label={`Añadir una unidad de ${p.name}`}
                            disabled={cart[p.id] >= available(p.id)}
                            onClick={() => quantity(p.id, 1)}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="demo-total">
                <span>Total simulado</span>
                <strong>{cost(total)}</strong>
              </div>
              {step === 2 && (
                <label>
                  Medio de pago de ejemplo
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option>Efectivo simulado</option>
                    <option>Tarjeta simulada</option>
                  </select>
                </label>
              )}
              {step === 1 ? (
                <button
                  className="button full"
                  disabled={!count}
                  onClick={review}
                >
                  Revisar venta <ArrowRight size={16} />
                </button>
              ) : step === 2 ? (
                <button className="button full" onClick={confirm}>
                  Confirmar venta de prueba <Check size={16} />
                </button>
              ) : null}
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <small className="muted">
            Demo sin conexión a pagos ni pedidos reales.
          </small>
        </aside>
      </div>
      {step === 1 && count > 0 && (
        <div className="demo-mobile-cart">
          <span>
            {count} productos <strong>{cost(total)}</strong>
          </span>
          <button className="button" onClick={review}>
            Revisar venta <ArrowRight size={16} />
          </button>
        </div>
      )}
      <p className="demo-notice" role="status">
        {notice}
      </p>
      {step === 3 && <DemoEnd kind="ventas" />}
    </div>
  );
}
type Booking = {
  id: string;
  day: string;
  staff: string;
  time: string;
  service: string;
  cancelled: boolean;
};
const initialBookings = (): Booking[] => [
  {
    id: "DEMO-001",
    day: localDay(),
    staff: demoStaff[0],
    time: "10:00",
    service: demoServices[0].id,
    cancelled: false,
  },
];
export function BookingDemo() {
  const [step, setStep] = useState(0),
    [service, setService] = useState<string>(demoServices[0].id),
    [staff, setStaff] = useState(demoStaff[0]),
    [day, setDay] = useState(localDay),
    [time, setTime] = useState(""),
    [bookings, setBookings] = useState(initialBookings),
    [latest, setLatest] = useState<Booking | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const completed = useRef(false);
  const selected = demoServices.find((s) => s.id === service)!;
  const occupied = (t: string) =>
    bookings.some(
      (b) =>
        !b.cancelled &&
        bookingKey(b.day, b.staff, b.time) === bookingKey(day, staff, t),
    );
  function reset() {
    setStep(0);
    setService(demoServices[0].id);
    setStaff(demoStaff[0]);
    setDay(localDay());
    setTime("");
    setBookings(initialBookings());
    setLatest(null);
    setError("");
    setNotice("Demo reiniciada. La agenda vuelve a los datos de ejemplo.");
    completed.current = false;
    trackDemoAction("demo_reset", "reservas");
  }
  function start() {
    setStep(1);
    setTime("");
    setLatest(null);
    completed.current = false;
    setNotice("Elige un servicio, profesional y fecha.");
    trackDemoAction("demo_start", "reservas");
    scrollDemo();
  }
  function next() {
    if (!day || day < localDay()) {
      setError("Elige una fecha de hoy en adelante.");
      return;
    }
    setError("");
    setTime("");
    setStep(2);
    trackDemoAction("demo_step", "reservas");
    scrollDemo();
  }
  function review() {
    if (!time || occupied(time)) {
      setError("Elige un horario disponible.");
      return;
    }
    setError("");
    setStep(3);
    trackDemoAction("demo_step", "reservas");
    scrollDemo();
  }
  function confirm() {
    if (completed.current) return;
    if (!time || occupied(time)) {
      setError("Ese horario ya no está disponible. Elige otro.");
      setStep(2);
      return;
    }
    completed.current = true;
    const booking: Booking = {
      id: `DEMO-${String(bookings.length + 1).padStart(3, "0")}`,
      day,
      staff,
      time,
      service,
      cancelled: false,
    };
    setBookings((prev) => [...prev, booking]);
    setLatest(booking);
    setStep(4);
    setNotice("Reserva de ejemplo confirmada. Su horario ahora está ocupado.");
    trackDemoAction("demo_complete", "reservas");
    scrollDemo();
  }
  function cancel(id: string) {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, cancelled: true } : b)),
    );
    if (latest?.id === id) setLatest({ ...latest, cancelled: true });
    setNotice(
      "Reserva de ejemplo cancelada. El horario vuelve a estar disponible.",
    );
  }
  return (
    <div className="container demo-page">
      <DemoHeader kind="reservas" step={step} reset={reset} />
      {step === 0 && (
        <section className="demo-start-panel">
          <div>
            <h2>Bienvenido a Estudio Panda.</h2>
            <p>
              Organiza la agenda de un negocio ficticio. Ya hay una cita de
              ejemplo a las 10:00 con Sofía para que puedas probar los horarios
              ocupados.
            </p>
          </div>
          <button className="button" onClick={start}>
            Comenzar recorrido <ArrowRight size={17} />
          </button>
        </section>
      )}
      <div className="demo-stat-grid">
        <article>
          <CalendarDays size={18} />
          <span>Reservas de ejemplo</span>
          <strong>{bookings.filter((b) => !b.cancelled).length}</strong>
        </article>
        <article>
          <UserRound size={18} />
          <span>Profesionales ficticios</span>
          <strong>{demoStaff.length}</strong>
        </article>
        <article>
          <Clock size={18} />
          <span>Servicios para explorar</span>
          <strong>{demoServices.length}</strong>
        </article>
      </div>
      <div className="demo-workspace" id="demo-workspace">
        <section className="demo-main-panel">
          {step === 4 && latest ? (
            <div className="demo-receipt">
              <span className="demo-success-icon">
                <CheckCircle2 size={32} />
              </span>
              <p className="eyebrow">RECORRIDO COMPLETADO</p>
              <h2>
                {latest.cancelled
                  ? "Reserva de ejemplo cancelada."
                  : "Tu reserva ficticia está lista."}
              </h2>
              <p>{latest.id} · Cliente de ejemplo</p>
              <div className="demo-receipt-lines">
                <div>
                  <span>Servicio</span>
                  <strong>{selected.name}</strong>
                </div>
                <div>
                  <span>Profesional</span>
                  <strong>{latest.staff}</strong>
                </div>
                <div>
                  <span>Fecha</span>
                  <strong>
                    {new Date(latest.day + "T12:00:00").toLocaleDateString(
                      "es-PE",
                    )}
                  </strong>
                </div>
                <div>
                  <span>Hora</span>
                  <strong>{latest.time}</strong>
                </div>
              </div>
              <p className="demo-stock-confirmation">
                {latest.cancelled
                  ? "El horario vuelve a estar disponible en la agenda de ejemplo."
                  : "La agenda marca este espacio como ocupado hasta que canceles la reserva de ejemplo."}
              </p>
              <button className="button secondary" onClick={start}>
                Probar otra reserva <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="demo-panel-heading">
                <div>
                  <p className="eyebrow">ESTUDIO PANDA · NEGOCIO FICTICIO</p>
                  <h2>
                    {step < 2
                      ? "¿Qué te gustaría reservar?"
                      : step === 2
                        ? "Encuentra tu horario."
                        : "Revisa antes de confirmar."}
                  </h2>
                </div>
              </div>
              {step < 2 ? (
                <>
                  <div
                    className="demo-service-options"
                    role="group"
                    aria-label="Servicios de ejemplo"
                  >
                    {demoServices.map((s) => (
                      <button
                        key={s.id}
                        disabled={step === 0}
                        aria-pressed={s.id === service}
                        className={s.id === service ? "selected" : ""}
                        onClick={() => setService(s.id)}
                      >
                        <span>
                          <strong>{s.name}</strong>
                          <small>
                            {s.duration} min · {cost(s.price)} ficticios
                          </small>
                        </span>
                        {s.id === service ? (
                          <CheckCircle2 size={21} />
                        ) : (
                          <CalendarDays size={21} />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="demo-booking-fields">
                    <label>
                      Profesional
                      <select
                        disabled={step === 0}
                        value={staff}
                        onChange={(e) => setStaff(e.target.value)}
                      >
                        {demoStaff.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Fecha de la cita
                      <input
                        type="date"
                        disabled={step === 0}
                        min={localDay()}
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                      />
                    </label>
                  </div>
                  {step === 1 && (
                    <button className="button" onClick={next}>
                      Ver horarios disponibles <ArrowRight size={16} />
                    </button>
                  )}
                </>
              ) : step === 2 ? (
                <>
                  <p className="muted">
                    {selected.name} · {staff} ·{" "}
                    {new Date(day + "T12:00:00").toLocaleDateString("es-PE")}
                  </p>
                  <div className="demo-time-grid">
                    {demoTimes.map((t) => (
                      <button
                        key={t}
                        disabled={occupied(t)}
                        aria-pressed={time === t}
                        className={time === t ? "selected" : ""}
                        onClick={() => {
                          setTime(t);
                          setError("");
                        }}
                        aria-label={`${t}${occupied(t) ? ", ocupado" : ", disponible"}`}
                      >
                        <strong>{t}</strong>
                        <small>{occupied(t) ? "Ocupado" : "Disponible"}</small>
                      </button>
                    ))}
                  </div>
                  <div className="demo-step-actions">
                    <button
                      className="button secondary"
                      onClick={() => setStep(1)}
                    >
                      Cambiar servicio o fecha
                    </button>
                    <button
                      className="button"
                      disabled={!time}
                      onClick={review}
                    >
                      Revisar reserva <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="demo-booking-review">
                    <span className="demo-product-mark">
                      <CalendarDays size={28} />
                    </span>
                    <h3>{selected.name}</h3>
                    <p>{staff}</p>
                    <strong>
                      {new Date(day + "T12:00:00").toLocaleDateString("es-PE")}{" "}
                      · {time}
                    </strong>
                    <p>
                      {selected.duration} minutos · {cost(selected.price)} de
                      ejemplo
                    </p>
                  </div>
                  <div className="demo-explainer">
                    <CheckCircle2 size={22} />
                    <p>
                      La confirmación solo modifica esta agenda de demostración.
                      No se envían mensajes, correos ni invitaciones.
                    </p>
                  </div>
                  <div className="demo-step-actions">
                    <button
                      className="button secondary"
                      onClick={() => setStep(2)}
                    >
                      Cambiar horario
                    </button>
                    <button className="button" onClick={confirm}>
                      Confirmar reserva de prueba <Check size={16} />
                    </button>
                  </div>
                </>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
        </section>
        <aside className="demo-summary">
          <p className="eyebrow">TU AGENDA DE EJEMPLO</p>
          <h2>Reservas</h2>
          <div className="demo-booking-list">
            {bookings.map((b) => (
              <article key={b.id}>
                <div>
                  <strong>
                    {demoServices.find((s) => s.id === b.service)?.name}
                  </strong>
                  <span
                    className={`state-pill ${b.cancelled ? "state-closed" : "state-active"}`}
                  >
                    {b.cancelled ? "Cancelada" : "Confirmada"}
                  </span>
                </div>
                <p>
                  {b.staff}
                  <br />
                  {new Date(b.day + "T12:00:00").toLocaleDateString(
                    "es-PE",
                  )} · {b.time}
                </p>
                <small>{b.id} · Cliente de ejemplo</small>
                {!b.cancelled && (
                  <button
                    className="text-link button-plain"
                    onClick={() => cancel(b.id)}
                    aria-label={`Cancelar reserva ${b.id}`}
                  >
                    Cancelar reserva de ejemplo
                  </button>
                )}
              </article>
            ))}
          </div>
          <small className="muted">
            Al cancelar una cita ficticia, su horario vuelve a quedar libre.
          </small>
        </aside>
      </div>
      <p className="demo-notice" role="status">
        {notice}
      </p>
      {step === 4 && <DemoEnd kind="reservas" />}
    </div>
  );
}
