import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  GraduationCap,
  Users,
  ClipboardCheck,
  BookOpen,
  FileText,
  Plus,
  Check,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { DemoSystem } from "../components/DemoSystem";
import {
  SchoolModules,
  SchoolOverview,
  SchoolDocumentChecklist,
} from "../components/SchoolModules";
import { useSchoolOffice } from "../lib/schoolOffice";
import { trackDemoAction } from "../lib/analytics";
import { localDay } from "../lib/demoData";
import {
  schoolStudents,
  schoolGroups,
  schoolCourses,
  schoolAttendance,
  schoolGrades,
  attendanceLabels,
  gradeKey,
  type SchoolStudent,
  type Attendance,
} from "../lib/demoSchoolData";

export function EducationDemo() {
  const office = useSchoolOffice();
  const [editingStudent, setEditingStudent] = useState<number | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [view, setView] = useState("dashboard"),
    [students, setStudents] = useState<SchoolStudent[]>(() =>
      schoolStudents.map((s) => ({ ...s })),
    ),
    [attendance, setAttendance] = useState({ ...schoolAttendance }),
    [attendanceDraft, setAttendanceDraft] = useState({ ...schoolAttendance }),
    [grades, setGrades] = useState({ ...schoolGrades }),
    [gradeDraft, setGradeDraft] = useState<Record<string, string>>(() =>
      Object.fromEntries(
        Object.entries(schoolGrades).map(([k, v]) => [
          k,
          v === null ? "" : String(v),
        ]),
      ),
    ),
    [tab, setTab] = useState("attendance"),
    [group, setGroup] = useState("Todos"),
    [course, setCourse] = useState(schoolCourses[0]),
    [search, setSearch] = useState(""),
    [adding, setAdding] = useState(false),
    [alias, setAlias] = useState(""),
    [newGroup, setNewGroup] = useState(schoolGroups[0]),
    [reportStudent, setReportStudent] = useState(1),
    [report, setReport] = useState(false),
    [started, setStarted] = useState(false),
    [savedAttendance, setSavedAttendance] = useState(false),
    [savedGrades, setSavedGrades] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const completed = useRef(false);
  const marked = students.filter(
    (s) => (attendance[s.id] || "pending") !== "pending",
  );
  const present = marked.filter((s) =>
    ["present", "late"].includes(attendance[s.id]),
  ).length;
  const percentage = marked.length
    ? Math.round((present / marked.length) * 100)
    : 0;
  const values = Object.values(grades).filter((n): n is number => n !== null);
  const average = values.length
    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    : "—";
  const shown = students.filter((s) => group === "Todos" || s.group === group);
  const selected = students.find((s) => s.id === reportStudent) || students[0];
  function navigate(v: string) {
    if (v === "attendance" || v === "grades") {
      setTab(v);
      setView("academic");
    } else setView(v);
    setError("");
  }
  function start() {
    setStarted(true);
    navigate("students");
    trackDemoAction("demo_start", "educacion");
    setNotice(
      "Explora un alumno; después registra la asistencia y guarda las calificaciones.",
    );
  }
  function reset() {
    office.reset();
    setEditingStudent(null);
    setResetKey((prev) => prev + 1);
    setStudents(schoolStudents.map((s) => ({ ...s })));
    setAttendance({ ...schoolAttendance });
    setAttendanceDraft({ ...schoolAttendance });
    setGrades({ ...schoolGrades });
    setGradeDraft(
      Object.fromEntries(
        Object.entries(schoolGrades).map(([k, v]) => [
          k,
          v === null ? "" : String(v),
        ]),
      ),
    );
    setTab("attendance");
    setGroup("Todos");
    setCourse(schoolCourses[0]);
    setSearch("");
    setAdding(false);
    setAlias("");
    setNewGroup(schoolGroups[0]);
    setReportStudent(1);
    setReport(false);
    setStarted(false);
    setSavedAttendance(false);
    setSavedGrades(false);
    completed.current = false;
    navigate("dashboard");
    setNotice(
      "Demo reiniciada. Se restauraron los tres alumnos y sus datos de ejemplo.",
    );
    trackDemoAction("demo_reset", "educacion");
  }
  function progress(att: boolean, grade: boolean) {
    if (!started) {
      setStarted(true);
      trackDemoAction("demo_start", "educacion");
    }
    trackDemoAction("demo_step", "educacion");
    if (att && grade && !completed.current) {
      completed.current = true;
      trackDemoAction("demo_complete", "educacion");
    }
  }
  function addStudent(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = alias.trim();
    if (name.length < 2) {
      setError("Escribe un alias ficticio de al menos dos caracteres.");
      return;
    }
    if (editingStudent !== null) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent
            ? {
                ...s,
                name,
                group: office.registrations.some(
                  (r) => r.student === s.id && r.active,
                )
                  ? s.group
                  : newGroup,
              }
            : s,
        ),
      );
      office.log("Datos del alumno ficticio actualizados.");
      setEditingStudent(null);
      setAdding(false);
      setAlias("");
      setError("");
      setNotice("Datos del alumno actualizados en la demo.");
      return;
    }
    const id = Math.max(...students.map((s) => s.id)) + 1;
    setStudents((prev) => [...prev, { id, name, group: newGroup }]);
    office.log(`Alumno ficticio ${name} agregado al directorio.`);
    setAttendanceDraft((prev) => ({ ...prev, [id]: "pending" }));
    setAlias("");
    setAdding(false);
    setError("");
    setNotice(
      "Alumno ficticio agregado. Ya está disponible en asistencia, calificaciones y documentos.",
    );
  }
  function saveAttendance() {
    if (
      shown.some(
        (s) => !attendanceDraft[s.id] || attendanceDraft[s.id] === "pending",
      )
    ) {
      setError(
        "Elige un estado de asistencia para cada alumno del grupo visible.",
      );
      return;
    }
    setAttendance((prev) => ({
      ...prev,
      ...Object.fromEntries(shown.map((s) => [s.id, attendanceDraft[s.id]])),
    }));
    setSavedAttendance(true);
    office.log(`Asistencia guardada para ${shown.length} alumnos.`);
    setError("");
    setNotice(
      "Asistencia guardada en la demo. El dashboard y los expedientes se actualizaron.",
    );
    progress(true, savedGrades);
  }
  function saveGrades() {
    if (
      shown.some((s) => {
        const value = gradeDraft[gradeKey(s.id, course)] || "";
        return (
          value.trim() !== "" &&
          (!Number.isFinite(Number(value)) ||
            Number(value) < 0 ||
            Number(value) > 20)
        );
      })
    ) {
      setError(
        "Las notas deben estar entre 0 y 20. Deja vacío si todavía no hay nota.",
      );
      return;
    }
    setGrades((prev) => ({
      ...prev,
      ...Object.fromEntries(
        shown.map((s) => {
          const v = gradeDraft[gradeKey(s.id, course)] || "";
          return [gradeKey(s.id, course), v.trim() === "" ? null : Number(v)];
        }),
      ),
    }));
    setSavedGrades(true);
    office.log(`Calificaciones de ${course} guardadas.`);
    setError("");
    setNotice(
      "Calificaciones guardadas. Puedes ver los resultados en la libreta de ejemplo.",
    );
    progress(savedAttendance, true);
  }
  function exportReport() {
    const text = [
      "COLEGIO PANDA · LIBRETA DE DEMOSTRACIÓN",
      "Documento ficticio, sin validez académica.",
      `Alumno: ${selected.name}`,
      `Grupo: ${selected.group}`,
      `Periodo: ${new Date().getFullYear()} · ejemplo`,
      `Asistencia de ${localDay()}: ${attendanceLabels[attendance[selected.id] || "pending"]}`,
      ...schoolCourses.map(
        (c) =>
          `${c}: ${grades[gradeKey(selected.id, c)] ?? "Sin registrar"} / 20`,
      ),
      "Generado localmente. No contiene datos de una institución real.",
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "libreta-demo-colegio-panda.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Libreta de ejemplo descargada como archivo de texto.");
  }
  const guide = (
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
        <span className="demo-live-label">
          <GraduationCap size={14} />
          DEMO BASADA EN TESIS
        </span>
        <h2>Explora un colegio, paso a paso.</h2>
        <p>
          Consulta un expediente, registra asistencia y guarda notas. Luego
          observa el dashboard y genera una libreta de ejemplo.
        </p>
      </div>
      <div className="demo-safety">
        <GraduationCap size={20} />
        <p>
          Colegio y alumnos ficticios. Usa solo alias de ejemplo. Los cambios
          viven en esta pestaña y se reinician al salir. Explora también
          matrículas, pagos de ejemplo, horarios, familias y reportes desde el
          menú.
        </p>
      </div>
      <ol className="demo-steps" aria-label="Pasos de la demostración">
        {["Explora alumnos", "Guarda asistencia", "Guarda calificaciones"].map(
          (s, i) => {
            const done =
              i === 0 ? started : i === 1 ? savedAttendance : savedGrades;
            return (
              <li
                key={s}
                className={
                  done
                    ? "done"
                    : i === (!started ? 0 : !savedAttendance ? 1 : 2)
                      ? "current"
                      : ""
                }
                aria-current={
                  !done && i === (!started ? 0 : !savedAttendance ? 1 : 2)
                    ? "step"
                    : undefined
                }
              >
                <span>{done ? <Check size={15} /> : i + 1}</span>
                <div>
                  <small>PASO {i + 1}</small>
                  <strong>{s}</strong>
                </div>
              </li>
            );
          },
        )}
      </ol>
    </>
  );
  return (
    <DemoSystem kind="educacion" view={view} onView={navigate} guide={guide}>
      <div className="ds-page education-demo">
        <div className="edu-period">
          <span>
            <GraduationCap size={17} />
            Gestión académica y documental
          </span>
          <span>Periodo {new Date().getFullYear()} · Datos de ejemplo</span>
        </div>
        <div className="demo-stat-grid edu-stats">
          <article>
            <Users size={19} />
            <span>Alumnos de ejemplo</span>
            <strong>{students.length}</strong>
          </article>
          <article>
            <ClipboardCheck size={19} />
            <span>Asistencia registrada hoy</span>
            <strong>{percentage}%</strong>
            <small className="edu-stat-meta">
              {marked.length} de {students.length} alumnos registrados
            </small>
          </article>
          <article>
            <BookOpen size={19} />
            <span>Promedio de notas</span>
            <strong>
              {average}
              <small> / 20</small>
            </strong>
          </article>
        </div>
        {view === "dashboard" && (
          <>
            <section className="ds-welcome">
              <div>
                <p className="eyebrow">COLEGIO PANDA · INSTITUCIÓN FICTICIA</p>
                <h2>Más cerca de cada alumno.</h2>
                <p>
                  Una vista clara de tus alumnos, su asistencia y su progreso
                  académico. Basado en el proyecto de gestión educativa Tesis.
                </p>
              </div>
              <button className="button" onClick={start}>
                {started ? "Continuar recorrido" : "Comenzar recorrido"}
                <ArrowRight size={17} />
              </button>
            </section>
            <div className="ds-dashboard-grid">
              <section className="ds-card">
                <div className="ds-card-heading">
                  <div>
                    <p className="eyebrow">EL APRENDIZAJE, DE UN VISTAZO</p>
                    <h3>Rendimiento por curso</h3>
                  </div>
                  <BookOpen size={22} />
                </div>
                <p className="muted">
                  Promedio de las notas guardadas, en escala de 0 a 20.
                </p>
                <div className="edu-course-bars">
                  {schoolCourses.map((c) => {
                    const numbers = students
                      .map((s) => grades[gradeKey(s.id, c)])
                      .filter((n): n is number => typeof n === "number");
                    const avg = numbers.length
                      ? numbers.reduce((a, b) => a + b, 0) / numbers.length
                      : 0;
                    return (
                      <div key={c}>
                        <div>
                          <strong>{c}</strong>
                          <span>
                            {numbers.length ? avg.toFixed(1) : "—"} / 20
                          </span>
                        </div>
                        <div className="edu-track">
                          <i style={{ width: `${(avg / 20) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  className="text-link button-plain"
                  onClick={() => {
                    navigate("academic");
                    setTab("grades");
                  }}
                >
                  Revisar calificaciones <ArrowRight size={15} />
                </button>
              </section>
              <section className="ds-card">
                <p className="eyebrow">ACOMPAÑAMIENTO ACADÉMICO</p>
                <h3>Alumnos que necesitan atención</h3>
                <div className="edu-alerts">
                  {students
                    .filter(
                      (s) =>
                        attendance[s.id] === "absent" ||
                        schoolCourses.some((c) => {
                          const n = grades[gradeKey(s.id, c)];
                          return typeof n === "number" && n < 11;
                        }),
                    )
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSearch(s.name);
                          navigate("students");
                        }}
                      >
                        <AlertTriangle size={19} />
                        <span>
                          <strong>{s.name}</strong>
                          <small>
                            {attendance[s.id] === "absent"
                              ? "Ausencia registrada hoy"
                              : "Una nota menor a 11"}{" "}
                            · {s.group}
                          </small>
                        </span>
                        <ArrowRight size={15} />
                      </button>
                    ))}
                </div>
                <p className="muted">
                  Avisos ilustrativos; no se envían mensajes a alumnos ni
                  familias.
                </p>
              </section>
            </div>
            <div className="ds-shortcuts">
              <button
                onClick={() => {
                  navigate("academic");
                  setTab("attendance");
                }}
              >
                <ClipboardCheck size={25} />
                <span>
                  <strong>Registrar asistencia</strong>
                  <small>Marca el estado de cada alumno para hoy.</small>
                </span>
                <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate("documents")}>
                <FileText size={25} />
                <span>
                  <strong>Generar una libreta</strong>
                  <small>Consulta notas y asistencia de un alumno.</small>
                </span>
                <ArrowRight size={18} />
              </button>
            </div>
            <SchoolOverview
              office={office}
              students={students}
              attendance={attendance}
              grades={grades}
              navigate={navigate}
            />
          </>
        )}
        {view === "students" && (
          <section>
            <div className="ds-module-heading">
              <div>
                <p className="eyebrow">DIRECTORIO Y EXPEDIENTES</p>
                <h2>Alumnos</h2>
                <p>
                  Abre una tarjeta para consultar el expediente del alumno
                  ficticio.
                </p>
              </div>
              <button
                className="button"
                aria-expanded={adding}
                onClick={() => {
                  setEditingStudent(null);
                  setAlias("");
                  setAdding(!adding);
                  setError("");
                }}
              >
                <Plus size={16} />
                Agregar alumno de ejemplo
              </button>
            </div>
            {adding && (
              <form className="ds-card edu-add-form" onSubmit={addStudent}>
                <label>
                  Alias ficticio
                  <input
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    maxLength={40}
                    required
                    placeholder="Por ejemplo, Alumno Estrella"
                  />
                </label>
                <label>
                  Grado de ejemplo
                  <select
                    value={newGroup}
                    disabled={
                      editingStudent !== null &&
                      office.registrations.some(
                        (r) => r.student === editingStudent && r.active,
                      )
                    }
                    onChange={(e) => setNewGroup(e.target.value)}
                  >
                    {schoolGroups.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <button className="button" type="submit">
                  {editingStudent !== null
                    ? "Guardar cambios"
                    : "Guardar alumno"}
                </button>
              </form>
            )}
            <label className="demo-search">
              <Search size={17} />
              <input
                aria-label="Buscar alumno de ejemplo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca por alias o grado…"
              />
            </label>
            <div className="ds-record-grid">
              {students
                .filter((s) =>
                  (s.name + " " + s.group)
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase()),
                )
                .map((s) => (
                  <article key={s.id} className="ds-card edu-student">
                    <details>
                      <summary>
                        <span className="ds-avatar">
                          {s.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <span className="state-pill state-active">
                          {office.registrations.some(
                            (r) => r.student === s.id && r.active,
                          )
                            ? "Matriculado (demo)"
                            : "Sin matrícula activa"}
                        </span>
                        <h3>{s.name}</h3>
                        <p>{s.group}</p>
                        <small>Ver expediente +</small>
                      </summary>
                      <dl>
                        <div>
                          <dt>Código de ejemplo</dt>
                          <dd>DEMO-{String(s.id).padStart(3, "0")}</dd>
                        </div>
                        <div>
                          <dt>Asistencia de hoy</dt>
                          <dd>
                            {attendanceLabels[attendance[s.id] || "pending"]}
                          </dd>
                        </div>
                        {schoolCourses.map((c) => (
                          <div key={c}>
                            <dt>{c}</dt>
                            <dd>
                              {grades[gradeKey(s.id, c)] ?? "Sin registrar"} /
                              20
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <p className="muted">
                        Expediente sintético, sin documentos ni datos personales
                        reales.
                      </p>
                      <button
                        className="button secondary full"
                        onClick={() => {
                          setReportStudent(s.id);
                          setReport(true);
                          navigate("documents");
                        }}
                      >
                        Ver libreta de este alumno
                      </button>
                      <p className="muted">
                        Familias:{" "}
                        {office.families
                          .filter((f) => f.students.includes(s.id))
                          .map((f) => f.name)
                          .join(", ") || "Sin vincular"}
                      </p>
                      <button
                        className="button secondary full"
                        onClick={() => {
                          setEditingStudent(s.id);
                          setAlias(s.name);
                          setNewGroup(s.group);
                          setAdding(true);
                          setError("");
                          window.scrollTo(0, 0);
                        }}
                      >
                        Editar alumno de ejemplo
                      </button>
                    </details>
                  </article>
                ))}
            </div>
            {!students.some((s) =>
              (s.name + " " + s.group)
                .toLocaleLowerCase()
                .includes(search.toLocaleLowerCase()),
            ) && (
              <p className="ds-empty">
                No hay alumnos que coincidan con la búsqueda.
              </p>
            )}
          </section>
        )}
        {view === "academic" && (
          <section>
            <div className="ds-module-heading">
              <div>
                <p className="eyebrow">AULA DE DEMOSTRACIÓN</p>
                <h2>Gestión académica</h2>
                <p>
                  Los cambios se aplican al guardar y se reflejan en el
                  dashboard y las libretas.
                </p>
              </div>
            </div>
            <div
              className="edu-tabs"
              role="group"
              aria-label="Módulo académico"
            >
              <button
                className={tab === "attendance" ? "active" : ""}
                aria-pressed={tab === "attendance"}
                onClick={() => {
                  setTab("attendance");
                  setError("");
                }}
              >
                <ClipboardCheck size={17} />
                Asistencia
              </button>
              <button
                className={tab === "grades" ? "active" : ""}
                aria-pressed={tab === "grades"}
                onClick={() => {
                  setTab("grades");
                  setError("");
                }}
              >
                <BookOpen size={17} />
                Calificaciones
              </button>
            </div>
            <div className="ds-card edu-academic-controls">
              <label>
                Grupo
                <select
                  aria-label="Grupo"
                  value={group}
                  onChange={(e) => {
                    setGroup(e.target.value);
                    setError("");
                  }}
                >
                  <option>Todos</option>
                  {schoolGroups.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              {tab === "grades" ? (
                <label>
                  Curso
                  <select
                    value={course}
                    onChange={(e) => {
                      setCourse(e.target.value);
                      setError("");
                    }}
                  >
                    {schoolCourses.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <p>
                  Registro del{" "}
                  {new Date(localDay() + "T12:00:00").toLocaleDateString(
                    "es-PE",
                  )}
                  <small>Solo se simula el día de hoy.</small>
                </p>
              )}
            </div>
            <div className="ds-record-grid">
              {shown.map((s) => (
                <article className="ds-card" key={s.id}>
                  <span className="ds-avatar">
                    <Users size={19} />
                  </span>
                  <h3>{s.name}</h3>
                  <p className="muted">{s.group}</p>
                  {tab === "attendance" ? (
                    <label>
                      Asistencia de {s.name}
                      <select
                        aria-label={`Asistencia de ${s.name}`}
                        value={attendanceDraft[s.id] || "pending"}
                        onChange={(e) =>
                          setAttendanceDraft((prev) => ({
                            ...prev,
                            [s.id]: e.target.value as Attendance,
                          }))
                        }
                      >
                        {Object.entries(attendanceLabels).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label>
                      Nota de {s.name}
                      <input
                        aria-label={`Nota de ${s.name}`}
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        inputMode="decimal"
                        value={gradeDraft[gradeKey(s.id, course)] ?? ""}
                        placeholder="Sin registrar"
                        onChange={(e) =>
                          setGradeDraft((prev) => ({
                            ...prev,
                            [gradeKey(s.id, course)]: e.target.value,
                          }))
                        }
                      />
                      <small className="muted">
                        Escala de 0 a 20 · {course}
                      </small>
                    </label>
                  )}
                </article>
              ))}
            </div>
            <div className="edu-save-bar">
              <p>
                {shown.length} alumnos visibles ·{" "}
                {tab === "attendance"
                  ? "La tardanza cuenta como asistencia en este ejemplo."
                  : "Deja la nota vacía para mantenerla sin registrar."}
              </p>
              <button
                className="button"
                onClick={tab === "attendance" ? saveAttendance : saveGrades}
              >
                <Check size={17} />
                {tab === "attendance"
                  ? "Guardar asistencia"
                  : "Guardar calificaciones"}
              </button>
            </div>
          </section>
        )}
        {view === "documents" && (
          <section>
            <div className="ds-module-heading">
              <div>
                <p className="eyebrow">EXPEDIENTE Y LIBRETA</p>
                <h2>Documentos académicos</h2>
                <p>
                  Genera un resumen con las notas y asistencia guardadas de un
                  alumno ficticio.
                </p>
              </div>
            </div>
            <div className="ds-card edu-report-controls">
              <label>
                Alumno de la libreta
                <select
                  value={reportStudent}
                  onChange={(e) => {
                    setReportStudent(Number(e.target.value));
                    setReport(false);
                  }}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.group}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button" onClick={() => setReport(true)}>
                <FileText size={17} />
                Generar libreta de ejemplo
              </button>
            </div>
            {report ? (
              <article className="ds-card edu-report">
                <header>
                  <GraduationCap size={34} />
                  <div>
                    <p className="eyebrow">COLEGIO PANDA</p>
                    <h3>Libreta de ejemplo</h3>
                    <p>
                      Periodo {new Date().getFullYear()} · Sin validez académica
                    </p>
                  </div>
                  <span className="state-pill state-active">DEMOSTRACIÓN</span>
                </header>
                <dl>
                  <div>
                    <dt>Alumno</dt>
                    <dd>{selected.name}</dd>
                  </div>
                  <div>
                    <dt>Grado</dt>
                    <dd>{selected.group}</dd>
                  </div>
                  <div>
                    <dt>Asistencia de hoy</dt>
                    <dd>
                      {attendanceLabels[attendance[selected.id] || "pending"]}
                    </dd>
                  </div>
                </dl>
                <div className="edu-report-grades">
                  {schoolCourses.map((c) => (
                    <div key={c}>
                      <span>
                        <BookOpen size={17} />
                        {c}
                      </span>
                      <strong>
                        {grades[gradeKey(selected.id, c)] ?? "Sin registrar"}
                        <small> / 20</small>
                      </strong>
                    </div>
                  ))}
                </div>
                <p className="muted">
                  Esta vista refleja los últimos datos guardados de la demo. No
                  se suben archivos ni se generan documentos institucionales.
                </p>
                <button className="button secondary" onClick={exportReport}>
                  <Download size={17} />
                  Descargar resumen de texto
                </button>
                <button
                  className="button secondary"
                  onClick={() => window.print()}
                >
                  Imprimir libreta de ejemplo
                </button>
              </article>
            ) : (
              <div className="ds-card ds-empty">
                <FileText size={35} />
                <h3>Prepara una libreta de prueba</h3>
                <p>
                  Selecciona un alumno y genera su resumen. Después puedes
                  descargarlo como texto.
                </p>
              </div>
            )}
          </section>
        )}
        {view === "documents" && (
          <SchoolDocumentChecklist office={office} students={students} />
        )}
        <SchoolModules
          key={resetKey}
          view={view}
          office={office}
          students={students}
          attendance={attendance}
          grades={grades}
          navigate={navigate}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <p className="demo-notice" role="status">
          {notice}
        </p>
        {savedAttendance && savedGrades && (
          <section className="edu-completed">
            <CheckCircle2 size={26} />
            <div>
              <strong>Recorrido académico completado</strong>
              <p>
                Guardaste asistencia y calificaciones. Revisa los resultados en
                el dashboard o la libreta.
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() => navigate("documents")}
            >
              Ver documentos
            </button>
          </section>
        )}
        <div className="ds-footer edu-interest">
          <span>¿Buscas un sistema para tu institución?</span>
          <Link
            className="text-link"
            to="/producto/educacion"
            onClick={() => trackDemoAction("demo_consult", "educacion")}
          >
            Conocer Karpanda Educación <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </DemoSystem>
  );
}
