import { useCallback, useState } from "react";
import {
  Plus,
  Users,
  BookOpen,
  CalendarDays,
  CreditCard,
  Download,
  AlertTriangle,
  Check,
  FileText,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { Modal } from "./Modal";
import { money } from "../lib/data";
import { localDay } from "../lib/demoData";
import {
  schoolGroups,
  schoolCourses,
  attendanceLabels,
  gradeKey,
  type Attendance,
  type SchoolStudent,
} from "../lib/demoSchoolData";
import type { SchoolOffice } from "../lib/schoolOffice";
type Props = {
  office: SchoolOffice;
  students: SchoolStudent[];
  attendance: Record<number, Attendance>;
  grades: Record<string, number | null>;
  navigate: (v: string) => void;
};
const cash = (value: number) => money(value / 100);
export function schoolAlerts({
  office,
  students,
  attendance,
  grades,
}: Omit<Props, "navigate">) {
  return students.flatMap((s) => {
    const list: {
      key: string;
      student: string;
      title: string;
      detail: string;
      view: string;
    }[] = [];
    if (attendance[s.id] === "absent")
      list.push({
        key: `absence:${s.id}`,
        student: s.name,
        title: "Ausencia registrada",
        detail: "Revisa el registro de asistencia de hoy.",
        view: "attendance",
      });
    for (const c of schoolCourses) {
      const n = grades[gradeKey(s.id, c)];
      if (typeof n === "number" && n < 11)
        list.push({
          key: `grade:${s.id}:${c}:${n}`,
          student: s.name,
          title: "Acompañamiento académico",
          detail: `${c}: ${n}/20. Requiere revisión en este escenario.`,
          view: "grades",
        });
    }
    const missing = ["ficha", "autorizacion"].filter(
      (d) => !office.documents[`${s.id}:${d}`],
    );
    if (missing.length)
      list.push({
        key: `docs:${s.id}:${missing.join(":")}`,
        student: s.name,
        title: "Expediente incompleto",
        detail: `${missing.length} documentos de ejemplo por revisar.`,
        view: "documents",
      });
    return list;
  });
}
export function SchoolOverview(props: Props) {
  const { office, navigate } = props;
  const bills = office.bills.filter((b) => !b.void);
  const due = bills.reduce((n, b) => n + b.total - b.paid, 0);
  const received = office.bills.reduce((n, b) => n + b.paid, 0);
  const alerts = schoolAlerts(props).filter(
    (a) => !office.closedAlerts.includes(a.key),
  );
  return (
    <>
      <div className="edu-office-kpis">
        <button onClick={() => navigate("enrollment")}>
          <GraduationCap size={22} />
          <small>Matrículas activas</small>
          <strong>{office.registrations.filter((e) => e.active).length}</strong>
        </button>
        <button onClick={() => navigate("payments")}>
          <CreditCard size={22} />
          <small>Recaudación ficticia</small>
          <strong>{cash(received)}</strong>
        </button>
        <button onClick={() => navigate("payments")}>
          <CreditCard size={22} />
          <small>Saldo pendiente</small>
          <strong>{cash(due)}</strong>
        </button>
        <button onClick={() => navigate("alerts")}>
          <AlertTriangle size={22} />
          <small>Alertas por revisar</small>
          <strong>{alerts.length}</strong>
        </button>
      </div>
      <div className="ds-dashboard-grid edu-office-overview">
        <section className="ds-card">
          <p className="eyebrow">OPERACIÓN DEL COLEGIO</p>
          <h3>Actividad reciente</h3>
          <ol className="edu-activity-list">
            {office.activity.slice(0, 5).map((text, i) => (
              <li key={`${i}:${text}`}>
                <span />
                <div>
                  <strong>{text}</strong>
                  <small>Sesión de demostración</small>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="ds-card">
          <p className="eyebrow">ACCESOS RÁPIDOS</p>
          <h3>Tu institución, conectada</h3>
          <div className="edu-module-links">
            {[
              ["institution", "Profesores y familias"],
              ["planning", "Cursos y horarios"],
              ["enrollment", "Matrículas del periodo"],
              ["payments", "Pagos y comprobantes"],
              ["reports", "Reportes y vistas por rol"],
            ].map(([v, label]) => (
              <button key={v} onClick={() => navigate(v)}>
                {label}
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function SchoolModules(props: Props & { view: string }) {
  const { office, students, attendance, grades, navigate, view } = props;
  const [modal, setModal] = useState<string | null>(null),
    [form, setForm] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [group, setGroup] = useState("Todos"),
    [day, setDay] = useState("Todos"),
    [billFilter, setBillFilter] = useState("Todos"),
    [showClosed, setShowClosed] = useState(false),
    [role, setRole] = useState("profesor"),
    [roleStudent, setRoleStudent] = useState(1);
  const close = useCallback(() => setModal(null), []);
  const studentName = (id: number) =>
    students.find((s) => s.id === id)?.name || "Alumno de ejemplo";
  const eligible = students.filter(
    (s) => !office.registrations.some((e) => e.active && e.student === s.id),
  );
  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  function open(kind: string) {
    const bill = office.bills.find((b) => kind === `pay:${b.id}`);
    setForm({
      name: "",
      course: schoolCourses[0],
      teacher: String(office.staff.find((t) => t.active)?.id || ""),
      student: String(eligible[0]?.id || ""),
      group: schoolGroups[0],
      day: "Lunes",
      start: "08:00",
      end: "09:00",
      room: "Aula C",
      amount: bill ? String((bill.total - bill.paid) / 100) : "",
      method: "Efectivo simulado",
    });
    setError("");
    setModal(kind);
  }
  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      if (modal === "teacher") {
        if (form.name.trim().length < 2)
          throw Error("Escribe un alias ficticio de al menos dos caracteres.");
        office.setStaff((prev) => [
          ...prev,
          {
            id: Math.max(0, ...prev.map((t) => t.id)) + 1,
            name: form.name.trim(),
            course: form.course,
            active: true,
          },
        ]);
        office.log(`Profesor de ejemplo ${form.name.trim()} agregado.`);
      }
      if (modal === "family") {
        if (form.name.trim().length < 2)
          throw Error(
            "Escribe un alias de familia de al menos dos caracteres.",
          );
        office.setFamilies((prev) => [
          ...prev,
          {
            id: Math.max(0, ...prev.map((f) => f.id)) + 1,
            name: form.name.trim(),
            students: form.student ? [Number(form.student)] : [],
          },
        ]);
        office.log("Familia de ejemplo agregada.");
      }
      if (modal === "enroll") {
        const student = students.find((s) => s.id === Number(form.student));
        if (!student) throw Error("Selecciona un alumno sin matrícula activa.");
        office.enroll(student);
      }
      if (modal === "schedule") {
        if (!form.room.trim()) throw Error("Indica un aula de ejemplo.");
        office.addSlot({
          course: form.course,
          teacher: Number(form.teacher),
          group: form.group,
          day: form.day,
          start: form.start,
          end: form.end,
          room: form.room.trim(),
        });
      }
      if (modal?.startsWith("pay:")) {
        const value = Number(form.amount);
        if (
          !Number.isFinite(value) ||
          Math.abs(value * 100 - Math.round(value * 100)) > 0.00001
        )
          throw Error("Usa un importe válido con hasta dos decimales.");
        office.pay(
          Number(modal.split(":")[1]),
          Math.round(value * 100),
          form.method,
        );
      }
      setNotice("Operación completada en la demo. El dashboard se actualizó.");
      close();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Revisa los datos de ejemplo.",
      );
    }
  }
  function exportCsv() {
    const rows = [
      [
        "Alumno ficticio",
        "Grado",
        "Asistencia hoy",
        ...schoolCourses,
        "Saldo simulado PEN",
      ],
      ...students
        .filter((s) => group === "Todos" || s.group === group)
        .map((s) => [
          s.name,
          s.group,
          attendanceLabels[attendance[s.id] || "pending"],
          ...schoolCourses.map(
            (c) => grades[gradeKey(s.id, c)] ?? "Sin registrar",
          ),
          (
            office.bills
              .filter((b) => b.student === s.id && !b.void)
              .reduce((n, b) => n + b.total - b.paid, 0) / 100
          ).toFixed(2),
        ]),
    ];
    const text = rows
      .map((row) =>
        row
          .map((cell) => {
            let value = String(cell);
            if (/^[=+@\-\t\r]/.test(value)) value = "'" + value;
            return '"' + value.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-demo-colegio.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Reporte de ejemplo descargado.");
  }
  const activeAlerts = schoolAlerts(props).filter((a) =>
    showClosed
      ? office.closedAlerts.includes(a.key)
      : !office.closedAlerts.includes(a.key),
  );
  const moduleNames: Record<string, [string, string]> = {
    institution: [
      "Profesores y familias",
      "Gestiona el equipo docente y vincula alumnos con sus familias de ejemplo.",
    ],
    planning: [
      "Cursos y horarios",
      "Organiza los cursos por grado, profesor y horario del periodo de ejemplo.",
    ],
    enrollment: [
      "Matrículas del periodo",
      "Una matrícula activa crea su cargo ficticio; cada alumno tiene una por periodo.",
    ],
    payments: [
      "Pagos y comprobantes",
      "Registra pagos totales o parciales. No se procesa dinero ni se solicitan datos bancarios.",
    ],
    alerts: [
      "Centro de alertas",
      "Revisa ausencias, notas bajas y documentos pendientes. No se envían notificaciones reales.",
    ],
    reports: [
      "Reportes y vistas por rol",
      "Consulta el resumen de la institución y explora cómo se vería para docentes y familias.",
    ],
  };
  if (!moduleNames[view]) return null;
  const heading = moduleNames[view];
  return (
    <section className="edu-school-module">
      <div className="ds-module-heading">
        <div>
          <p className="eyebrow">
            COLEGIO PANDA · PERIODO {new Date().getFullYear()}
          </p>
          <h2>{heading[0]}</h2>
          <p>{heading[1]}</p>
        </div>
        {view === "institution" ? (
          <button className="button" onClick={() => open("teacher")}>
            <Plus size={16} />
            Agregar profesor
          </button>
        ) : view === "planning" ? (
          <button
            className="button"
            disabled={!office.staff.some((t) => t.active)}
            onClick={() => open("schedule")}
          >
            <Plus size={16} />
            Agregar horario
          </button>
        ) : view === "enrollment" ? (
          <button
            className="button"
            disabled={!eligible.length}
            onClick={() => open("enroll")}
          >
            <Plus size={16} />
            Nueva matrícula
          </button>
        ) : view === "reports" ? (
          <button className="button" onClick={exportCsv}>
            <Download size={16} />
            Exportar reporte CSV
          </button>
        ) : null}
      </div>
      {view === "institution" && (
        <>
          <h3 className="edu-section-title">Equipo docente</h3>
          <div className="ds-record-grid">
            {office.staff.map((t) => (
              <article className="ds-card" key={t.id}>
                <span className="ds-avatar">
                  <Users size={19} />
                </span>
                <h3>{t.name}</h3>
                <p>{t.course}</p>
                <span
                  className={`state-pill ${t.active ? "state-active" : "state-closed"}`}
                >
                  {t.active ? "Activo" : "Inactivo"}
                </span>
                <dl className="edu-info-list">
                  <div>
                    <dt>Horarios asignados</dt>
                    <dd>
                      {office.slots.filter((s) => s.teacher === t.id).length}
                    </dd>
                  </div>
                  <div>
                    <dt>Grados</dt>
                    <dd>
                      {[
                        ...new Set(
                          office.slots
                            .filter((s) => s.teacher === t.id)
                            .map((s) => s.group),
                        ),
                      ].join(", ") || "Sin asignar"}
                    </dd>
                  </div>
                </dl>
                <button
                  className="button secondary full"
                  disabled={
                    t.active && office.slots.some((s) => s.teacher === t.id)
                  }
                  onClick={() => {
                    office.setStaff((prev) =>
                      prev.map((p) =>
                        p.id === t.id ? { ...p, active: !p.active } : p,
                      ),
                    );
                    office.log(`Estado del profesor ${t.name} actualizado.`);
                  }}
                >
                  {t.active ? "Desactivar profesor" : "Activar profesor"}
                </button>
                {office.slots.some((s) => s.teacher === t.id) && (
                  <small className="muted">
                    Retira sus horarios antes de desactivarlo.
                  </small>
                )}
              </article>
            ))}
          </div>
          <div className="ds-module-heading">
            <div>
              <h3>Familias y apoderados</h3>
              <p>
                Marca o desmarca alumnos para actualizar sus vínculos en la
                demo.
              </p>
            </div>
            <button className="button secondary" onClick={() => open("family")}>
              <Plus size={16} />
              Agregar familia
            </button>
          </div>
          <div className="ds-record-grid">
            {office.families.map((f) => (
              <article className="ds-card" key={f.id}>
                <h3>{f.name}</h3>
                <p className="muted">
                  Apoderado ficticio · Acceso ilustrativo de lectura
                </p>
                <fieldset className="edu-family-checks">
                  <legend>Alumnos vinculados</legend>
                  {students.map((s) => (
                    <label key={s.id}>
                      <input
                        type="checkbox"
                        checked={f.students.includes(s.id)}
                        onChange={(e) => {
                          office.setFamilies((prev) =>
                            prev.map((p) =>
                              p.id === f.id
                                ? {
                                    ...p,
                                    students: e.target.checked
                                      ? [...p.students, s.id]
                                      : p.students.filter((id) => id !== s.id),
                                  }
                                : p,
                            ),
                          );
                          office.log(
                            `Vínculo familiar actualizado para ${s.name}.`,
                          );
                        }}
                      />
                      {s.name}
                    </label>
                  ))}
                </fieldset>
              </article>
            ))}
          </div>
        </>
      )}
      {view === "planning" && (
        <>
          <div className="ds-card edu-period-card">
            <CalendarDays size={27} />
            <div>
              <h3>Año académico {new Date().getFullYear()}</h3>
              <p>
                Secundaria · {schoolGroups.length} grados ·{" "}
                {schoolCourses.length} cursos · Periodo de ejemplo activo
              </p>
              <small>
                La demo trabaja con un único periodo para conservar un recorrido
                claro.
              </small>
            </div>
            <span className="state-pill state-active">Vigente</span>
          </div>
          <div className="ds-record-grid">
            {schoolCourses.map((c) => (
              <article className="ds-card" key={c}>
                <BookOpen size={24} />
                <h3>{c}</h3>
                <p>Escala 0–20 · Disponible en ambos grados</p>
                <p className="muted">
                  {office.staff
                    .filter((t) => t.active && t.course === c)
                    .map((t) => t.name)
                    .join(", ") || "Sin profesor especialista activo"}
                </p>
                <button
                  className="text-link button-plain"
                  onClick={() => navigate("academic")}
                >
                  Ver asistencia y notas <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
          <div className="ds-module-heading">
            <div>
              <h3>Horario semanal</h3>
              <p>
                Se comprueban cruces de profesor, grado y aula al agregar una
                clase.
              </p>
            </div>
          </div>
          <div className="ds-card edu-academic-controls">
            <label>
              Grado del horario
              <select
                aria-label="Grado del horario"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              >
                <option>Todos</option>
                {schoolGroups.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label>
              Día del horario
              <select
                aria-label="Día del horario"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                {[
                  "Todos",
                  "Lunes",
                  "Martes",
                  "Miércoles",
                  "Jueves",
                  "Viernes",
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="edu-schedule-list">
            {office.slots
              .filter(
                (s) =>
                  (group === "Todos" || s.group === group) &&
                  (day === "Todos" || s.day === day),
              )
              .sort(
                (a, b) =>
                  ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].indexOf(
                    a.day,
                  ) -
                    [
                      "Lunes",
                      "Martes",
                      "Miércoles",
                      "Jueves",
                      "Viernes",
                    ].indexOf(b.day) || a.start.localeCompare(b.start),
              )
              .map((s) => (
                <article className="ds-card" key={s.id}>
                  <div>
                    <span className="state-pill state-active">{s.day}</span>
                    <h3>
                      {s.start} – {s.end}
                    </h3>
                  </div>
                  <div>
                    <strong>{s.course}</strong>
                    <p>
                      {s.group} · {s.room}
                    </p>
                    <small>
                      {office.staff.find((t) => t.id === s.teacher)?.name}
                    </small>
                  </div>
                  <button
                    className="button secondary"
                    aria-label={`Retirar horario ${s.id}`}
                    onClick={() => {
                      office.setSlots((prev) =>
                        prev.filter((p) => p.id !== s.id),
                      );
                      office.log(`Horario de ${s.course} retirado.`);
                    }}
                  >
                    Retirar clase
                  </button>
                </article>
              ))}
          </div>
          {!office.slots.some(
            (s) =>
              (group === "Todos" || s.group === group) &&
              (day === "Todos" || s.day === day),
          ) && <p className="ds-empty">No hay clases para estos filtros.</p>}
        </>
      )}
      {view === "enrollment" && (
        <>
          {!eligible.length && (
            <p className="edu-info-banner">
              Todos los alumnos tienen una matrícula activa.{" "}
              <button
                className="button-plain text-link"
                onClick={() => navigate("students")}
              >
                Agregar un alumno de ejemplo
              </button>
            </p>
          )}
          <div className="ds-record-grid">
            {[...office.registrations].reverse().map((r) => (
              <article className="ds-card" key={r.id}>
                <details>
                  <summary>
                    <span
                      className={`state-pill ${r.active ? "state-active" : "state-closed"}`}
                    >
                      {r.active ? "Activa" : "Cancelada"}
                    </span>
                    <h3>{studentName(r.student)}</h3>
                    <p>{r.group}</p>
                    <small>DEMO-M{r.id} · Ver detalle +</small>
                  </summary>
                  <dl className="edu-info-list">
                    <div>
                      <dt>Fecha</dt>
                      <dd>{r.date.split("-").reverse().join("/")}</dd>
                    </div>
                    <div>
                      <dt>Periodo</dt>
                      <dd>{new Date().getFullYear()}</dd>
                    </div>
                    <div>
                      <dt>Cursos</dt>
                      <dd>{schoolCourses.join(", ")}</dd>
                    </div>
                  </dl>
                  <p className="muted">
                    Cancelar anula cargos sin pagos. Los pagos de ejemplo
                    previos se conservan; no hay reembolsos automáticos.
                  </p>
                  {r.active && (
                    <button
                      className="button secondary full"
                      aria-label={`Cancelar matrícula DEMO-M${r.id}`}
                      onClick={() => office.cancelEnrollment(r.id)}
                    >
                      Cancelar matrícula de ejemplo
                    </button>
                  )}
                </details>
              </article>
            ))}
          </div>
        </>
      )}
      {view === "payments" && (
        <>
          <div className="edu-office-kpis">
            <article>
              <small>Recaudado (simulado)</small>
              <strong>
                {cash(office.bills.reduce((n, b) => n + b.paid, 0))}
              </strong>
            </article>
            <article>
              <small>Por cobrar</small>
              <strong>
                {cash(
                  office.bills
                    .filter((b) => !b.void)
                    .reduce((n, b) => n + b.total - b.paid, 0),
                )}
              </strong>
            </article>
          </div>
          <div className="ds-card edu-academic-controls">
            <label>
              Estado del cargo
              <select
                aria-label="Estado del cargo"
                value={billFilter}
                onChange={(e) => setBillFilter(e.target.value)}
              >
                {["Todos", "Pendientes", "Pagados", "Anulados"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="ds-record-grid">
            {office.bills
              .filter(
                (b) =>
                  billFilter === "Todos" ||
                  (billFilter === "Anulados"
                    ? b.void
                    : billFilter === "Pagados"
                      ? !b.void && b.paid === b.total
                      : !b.void && b.paid < b.total),
              )
              .map((b) => (
                <article className="ds-card edu-bill" key={b.id}>
                  <span
                    className={`state-pill ${b.void ? "state-closed" : b.paid === b.total ? "state-active" : "state-pending"}`}
                  >
                    {b.void
                      ? "Anulado"
                      : b.paid === b.total
                        ? "Pagado"
                        : b.paid
                          ? "Pago parcial"
                          : "Pendiente"}
                  </span>
                  <h3>{studentName(b.student)}</h3>
                  <p>{b.concept}</p>
                  <strong className="ds-price">{cash(b.total - b.paid)}</strong>
                  <small className="muted">
                    Saldo · Total {cash(b.total)} · Abonado {cash(b.paid)}
                  </small>
                  <details className="edu-payment-history">
                    <summary>Ver detalle y abonos</summary>
                    <p>
                      Referencia DEMO-C{b.id} · Matrícula DEMO-M{b.enrollment}
                    </p>
                    {office.payments
                      .filter((p) => p.charge === b.id)
                      .map((p) => (
                        <p key={p.id}>
                          DEMO-P{p.id} · {cash(p.amount)} · {p.method} ·{" "}
                          {p.date}
                        </p>
                      ))}
                    {b.paid > 0 &&
                      !office.payments.some((p) => p.charge === b.id) && (
                        <p>Abono incluido en los datos iniciales de ejemplo.</p>
                      )}
                  </details>
                  {!b.void && b.paid < b.total && (
                    <button
                      className="button secondary full"
                      aria-label={`Registrar pago DEMO-C${b.id}`}
                      onClick={() => open(`pay:${b.id}`)}
                    >
                      Registrar pago de ejemplo
                    </button>
                  )}
                </article>
              ))}
          </div>
        </>
      )}
      {view === "alerts" && (
        <>
          <div className="edu-tabs" role="group" aria-label="Estado de alertas">
            <button
              className={!showClosed ? "active" : ""}
              onClick={() => setShowClosed(false)}
            >
              Por revisar
            </button>
            <button
              className={showClosed ? "active" : ""}
              onClick={() => setShowClosed(true)}
            >
              Revisadas
            </button>
          </div>
          <div className="ds-record-grid">
            {activeAlerts.map((a) => (
              <article className="ds-card" key={a.key}>
                <AlertTriangle size={25} />
                <h3>{a.title}</h3>
                <strong>{a.student}</strong>
                <p>{a.detail}</p>
                <div className="edu-alert-actions">
                  <button
                    className="text-link button-plain"
                    onClick={() => navigate(a.view)}
                  >
                    Revisar módulo <ArrowRight size={15} />
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      office.setClosedAlerts((prev) =>
                        showClosed
                          ? prev.filter((k) => k !== a.key)
                          : [...prev, a.key],
                      );
                      office.log(
                        `Alerta ${showClosed ? "reabierta" : "revisada"}: ${a.title}.`,
                      );
                    }}
                  >
                    {showClosed ? "Reabrir" : "Marcar revisada"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!activeAlerts.length && (
            <div className="ds-card ds-empty">
              <Check size={30} />
              <h3>No hay alertas en esta vista</h3>
              <p>
                Los avisos se recalculan cuando cambian notas, asistencia o
                documentos.
              </p>
            </div>
          )}
        </>
      )}
      {view === "reports" && (
        <>
          <div className="ds-card edu-academic-controls">
            <label>
              Grupo del reporte
              <select
                aria-label="Grupo del reporte"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              >
                <option>Todos</option>
                {schoolGroups.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <p>
              Exportación local de datos ficticios. No es un acta ni una libreta
              oficial.
            </p>
          </div>
          <div className="ds-record-grid">
            {students
              .filter((s) => group === "Todos" || s.group === group)
              .map((s) => (
                <article className="ds-card" key={s.id}>
                  <h3>{s.name}</h3>
                  <p>{s.group}</p>
                  <dl className="edu-info-list">
                    <div>
                      <dt>Asistencia</dt>
                      <dd>{attendanceLabels[attendance[s.id] || "pending"]}</dd>
                    </div>
                    {schoolCourses.map((c) => (
                      <div key={c}>
                        <dt>{c}</dt>
                        <dd>{grades[gradeKey(s.id, c)] ?? "Pendiente"} / 20</dd>
                      </div>
                    ))}
                    <div>
                      <dt>Saldo ficticio</dt>
                      <dd>
                        {cash(
                          office.bills
                            .filter((b) => b.student === s.id && !b.void)
                            .reduce((n, b) => n + b.total - b.paid, 0),
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
          </div>
          <section className="ds-card edu-role-preview">
            <p className="eyebrow">PERSPECTIVAS DEL SISTEMA</p>
            <h3>Explora una vista por rol</h3>
            <p>
              Vista ilustrativa de lectura. Cambiarla no inicia sesión ni
              concede permisos.
            </p>
            <div className="edu-academic-controls">
              <label>
                Rol de ejemplo
                <select
                  aria-label="Rol de ejemplo"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="profesor">Profesor</option>
                  <option value="alumno">Alumno</option>
                  <option value="apoderado">Apoderado</option>
                </select>
              </label>
              {role !== "profesor" && (
                <label>
                  Alumno de la vista
                  <select
                    aria-label="Alumno de la vista"
                    value={roleStudent}
                    onChange={(e) => setRoleStudent(Number(e.target.value))}
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {role === "profesor" ? (
              <div className="edu-module-links">
                {office.staff
                  .filter((t) => t.active)
                  .map((t) => (
                    <div key={t.id}>
                      <strong>
                        {t.name} · {t.course}
                      </strong>
                      <p>
                        {office.slots.filter((s) => s.teacher === t.id).length}{" "}
                        clases asignadas ·{" "}
                        {
                          students.filter((s) =>
                            office.slots.some(
                              (slot) =>
                                slot.teacher === t.id && slot.group === s.group,
                            ),
                          ).length
                        }{" "}
                        alumnos en sus grados
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="edu-role-record">
                <strong>{studentName(roleStudent)}</strong>
                <p>
                  {role === "apoderado"
                    ? `Familias vinculadas: ${
                        office.families
                          .filter((f) => f.students.includes(roleStudent))
                          .map((f) => f.name)
                          .join(", ") || "Sin familia vinculada"
                      }`
                    : "Mi resumen académico de ejemplo"}
                </p>
                <p>
                  Asistencia:{" "}
                  {attendanceLabels[attendance[roleStudent] || "pending"]}
                </p>
                {schoolCourses.map((c) => (
                  <p key={c}>
                    {c}: {grades[gradeKey(roleStudent, c)] ?? "Sin registrar"} /
                    20
                  </p>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      {notice && (
        <p className="demo-notice" role="status">
          {notice}
        </p>
      )}
      {modal && (
        <Modal
          title={
            modal === "teacher"
              ? "Agregar profesor de ejemplo"
              : modal === "family"
                ? "Agregar familia de ejemplo"
                : modal === "enroll"
                  ? "Nueva matrícula de ejemplo"
                  : modal === "schedule"
                    ? "Agregar horario de ejemplo"
                    : "Registrar pago de ejemplo"
          }
          close={close}
        >
          <form className="edu-module-form" onSubmit={submit}>
            {(modal === "teacher" || modal === "family") && (
              <label>
                Alias de ejemplo
                <input
                  required
                  maxLength={40}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={
                    modal === "teacher" ? "Profesora Estrella" : "Familia Nube"
                  }
                />
              </label>
            )}
            {(modal === "teacher" || modal === "schedule") && (
              <label>
                Curso
                <select
                  aria-label="Curso del formulario"
                  value={form.course}
                  onChange={(e) => set("course", e.target.value)}
                >
                  {schoolCourses.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            {(modal === "enroll" || modal === "family") && (
              <label>
                Alumno
                <select
                  aria-label="Alumno del formulario"
                  value={form.student}
                  onChange={(e) => set("student", e.target.value)}
                  required={modal === "enroll"}
                >
                  <option value="">
                    {modal === "family"
                      ? "Sin vincular por ahora"
                      : "Selecciona un alumno"}
                  </option>
                  {(modal === "enroll" ? eligible : students).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.group}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {modal === "enroll" && (
              <p className="edu-info-banner">
                Se inscribe en sus dos cursos y se crea un cargo ficticio de S/
                200.00.
              </p>
            )}
            {modal === "schedule" && (
              <>
                <label>
                  Profesor
                  <select
                    aria-label="Profesor del horario"
                    value={form.teacher}
                    onChange={(e) => set("teacher", e.target.value)}
                    required
                  >
                    {office.staff
                      .filter((t) => t.active)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Grado
                  <select
                    aria-label="Grado del formulario"
                    value={form.group}
                    onChange={(e) => set("group", e.target.value)}
                  >
                    {schoolGroups.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Día
                  <select
                    aria-label="Día del formulario"
                    value={form.day}
                    onChange={(e) => set("day", e.target.value)}
                  >
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(
                      (d) => (
                        <option key={d}>{d}</option>
                      ),
                    )}
                  </select>
                </label>
                <div className="edu-form-pair">
                  <label>
                    Hora inicial
                    <input
                      required
                      type="time"
                      value={form.start}
                      onChange={(e) => set("start", e.target.value)}
                    />
                  </label>
                  <label>
                    Hora final
                    <input
                      required
                      type="time"
                      value={form.end}
                      onChange={(e) => set("end", e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  Aula de ejemplo
                  <input
                    required
                    maxLength={30}
                    value={form.room}
                    onChange={(e) => set("room", e.target.value)}
                  />
                </label>
              </>
            )}
            {modal?.startsWith("pay:") && (
              <>
                <p>
                  Saldo pendiente:{" "}
                  <strong>
                    {cash(
                      (office.bills.find(
                        (b) => b.id === Number(modal.split(":")[1]),
                      )?.total || 0) -
                        (office.bills.find(
                          (b) => b.id === Number(modal.split(":")[1]),
                        )?.paid || 0),
                    )}
                  </strong>
                </p>
                <label>
                  Importe simulado (S/)
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={(e) => set("amount", e.target.value)}
                  />
                </label>
                <label>
                  Medio de pago
                  <select
                    value={form.method}
                    onChange={(e) => set("method", e.target.value)}
                  >
                    <option>Efectivo simulado</option>
                    <option>Transferencia simulada</option>
                  </select>
                </label>
                <p className="muted">
                  No se realiza ningún cobro ni transferencia.
                </p>
              </>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button full" type="submit">
              Guardar{" "}
              {modal?.startsWith("pay:")
                ? "pago"
                : modal === "schedule"
                  ? "horario"
                  : modal === "enroll"
                    ? "matrícula"
                    : "registro"}{" "}
              de ejemplo
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}

export function SchoolDocumentChecklist({
  office,
  students,
}: {
  office: SchoolOffice;
  students: SchoolStudent[];
}) {
  return (
    <section className="ds-card edu-document-checklist">
      <p className="eyebrow">CONTROL DOCUMENTAL</p>
      <h3>Expedientes por completar</h3>
      <p>Simula la recepción de documentos. No se suben archivos.</p>
      <div className="ds-record-grid">
        {students.map((s) => (
          <article className="ds-card" key={s.id}>
            <h3>{s.name}</h3>
            {[
              ["ficha", "Ficha de matrícula"],
              ["autorizacion", "Autorización familiar"],
            ].map(([id, label]) => (
              <label className="edu-document-check" key={id}>
                <input
                  type="checkbox"
                  checked={Boolean(office.documents[`${s.id}:${id}`])}
                  onChange={(e) => {
                    office.setDocuments((prev) => ({
                      ...prev,
                      [`${s.id}:${id}`]: e.target.checked,
                    }));
                    office.log(
                      `Documento de ${s.name} marcado como ${e.target.checked ? "recibido" : "pendiente"}.`,
                    );
                  }}
                />
                {label}
                <small>
                  {office.documents[`${s.id}:${id}`]
                    ? "Recibido (demo)"
                    : "Pendiente"}
                </small>
              </label>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
