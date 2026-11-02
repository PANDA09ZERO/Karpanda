import { useState } from "react";
import { localDay } from "./demoData";
import { schoolStudents, type SchoolStudent } from "./demoSchoolData";

export type DemoTeacher = {
  id: number;
  name: string;
  course: string;
  active: boolean;
};
export type DemoFamily = { id: number; name: string; students: number[] };
export type DemoEnrollment = {
  id: number;
  student: number;
  group: string;
  active: boolean;
  date: string;
};
export type DemoCharge = {
  id: number;
  student: number;
  enrollment: number;
  concept: string;
  total: number;
  paid: number;
  void: boolean;
};
export type DemoPayment = {
  id: number;
  charge: number;
  amount: number;
  method: string;
  date: string;
};
export type DemoSchedule = {
  id: number;
  course: string;
  teacher: number;
  group: string;
  day: string;
  start: string;
  end: string;
  room: string;
};
const teachers = (): DemoTeacher[] => [
  { id: 1, name: "Profesora Aurora", course: "Matemática", active: true },
  { id: 2, name: "Profesor Roble", course: "Comunicación", active: true },
];
const families = (): DemoFamily[] => [
  { id: 1, name: "Familia Brisa", students: [1, 2] },
  { id: 2, name: "Familia Bosque", students: [3] },
];
const enrollments = (): DemoEnrollment[] =>
  schoolStudents.map((s) => ({
    id: s.id,
    student: s.id,
    group: s.group,
    active: true,
    date: localDay(),
  }));
const charges = (): DemoCharge[] =>
  schoolStudents.flatMap((s) => [
    {
      id: s.id,
      student: s.id,
      enrollment: s.id,
      concept: "Matrícula del periodo",
      total: 20000,
      paid: s.id === 1 ? 20000 : 0,
      void: false,
    },
    {
      id: s.id + 3,
      student: s.id,
      enrollment: s.id,
      concept: "Mensualidad de ejemplo",
      total: 15000,
      paid: s.id === 1 ? 15000 : 0,
      void: false,
    },
  ]);
const schedule = (): DemoSchedule[] => [
  {
    id: 1,
    course: "Matemática",
    teacher: 1,
    group: "1.º secundaria",
    day: "Lunes",
    start: "08:00",
    end: "09:00",
    room: "Aula A",
  },
  {
    id: 2,
    course: "Comunicación",
    teacher: 2,
    group: "1.º secundaria",
    day: "Lunes",
    start: "09:00",
    end: "10:00",
    room: "Aula A",
  },
  {
    id: 3,
    course: "Matemática",
    teacher: 1,
    group: "2.º secundaria",
    day: "Martes",
    start: "08:00",
    end: "09:00",
    room: "Aula B",
  },
];
export function useSchoolOffice() {
  const [staff, setStaff] = useState(teachers),
    [familiesList, setFamilies] = useState(families),
    [registrations, setRegistrations] = useState(enrollments),
    [bills, setBills] = useState(charges),
    [payments, setPayments] = useState<DemoPayment[]>([]),
    [slots, setSlots] = useState(schedule),
    [documents, setDocuments] = useState<Record<string, boolean>>({
      "1:ficha": true,
      "1:autorizacion": true,
      "2:ficha": true,
    }),
    [activity, setActivity] = useState<string[]>([
      "Periodo de ejemplo abierto",
      "Se cargaron alumnos, matrículas y cargos ficticios",
    ]),
    [closedAlerts, setClosedAlerts] = useState<string[]>([]);
  const log = (text: string) =>
    setActivity((prev) => [text, ...prev].slice(0, 12));
  function reset() {
    setStaff(teachers());
    setFamilies(families());
    setRegistrations(enrollments());
    setBills(charges());
    setPayments([]);
    setSlots(schedule());
    setDocuments({ "1:ficha": true, "1:autorizacion": true, "2:ficha": true });
    setActivity(["Demo reiniciada. Se restauró el escenario inicial."]);
    setClosedAlerts([]);
  }
  function enroll(student: SchoolStudent) {
    if (registrations.some((e) => e.student === student.id && e.active))
      throw Error("El alumno ya tiene una matrícula activa en este periodo.");
    const id = Math.max(0, ...registrations.map((e) => e.id)) + 1;
    setRegistrations((prev) => [
      ...prev,
      {
        id,
        student: student.id,
        group: student.group,
        active: true,
        date: localDay(),
      },
    ]);
    setBills((prev) => [
      ...prev,
      {
        id: Math.max(0, ...prev.map((b) => b.id)) + 1,
        student: student.id,
        enrollment: id,
        concept: "Matrícula del periodo",
        total: 20000,
        paid: 0,
        void: false,
      },
    ]);
    log(`Matrícula de ${student.name} registrada; cargo de ejemplo creado.`);
  }
  function cancelEnrollment(id: number) {
    setRegistrations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, active: false } : e)),
    );
    setBills((prev) =>
      prev.map((b) =>
        b.enrollment === id && b.paid === 0 ? { ...b, void: true } : b,
      ),
    );
    log(`Matrícula DEMO-M${id} cancelada. Se anularon sus cargos sin pagos.`);
  }
  function pay(chargeId: number, amount: number, method: string) {
    const bill = bills.find((b) => b.id === chargeId);
    if (
      !bill ||
      bill.void ||
      !Number.isInteger(amount) ||
      amount <= 0 ||
      amount > bill.total - bill.paid
    )
      throw Error(
        "El importe debe ser mayor a cero y no superar el saldo pendiente.",
      );
    setBills((prev) =>
      prev.map((b) =>
        b.id === chargeId ? { ...b, paid: b.paid + amount } : b,
      ),
    );
    setPayments((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        charge: chargeId,
        amount,
        method,
        date: localDay(),
      },
    ]);
    log(`Pago ficticio registrado para ${bill.concept}.`);
  }
  function addSlot(slot: Omit<DemoSchedule, "id">) {
    if (slot.end <= slot.start)
      throw Error("La hora final debe ser posterior a la inicial.");
    if (!staff.some((t) => t.id === slot.teacher && t.active))
      throw Error("Elige un profesor activo.");
    if (
      slots.some(
        (s) =>
          s.day === slot.day &&
          s.start < slot.end &&
          slot.start < s.end &&
          (s.teacher === slot.teacher ||
            s.group === slot.group ||
            s.room.trim().toLowerCase() === slot.room.trim().toLowerCase()),
      )
    )
      throw Error(
        "Ese horario se cruza con otro del profesor, grado o aula. Elige un espacio libre.",
      );
    setSlots((prev) => [
      ...prev,
      { ...slot, id: Math.max(0, ...prev.map((s) => s.id)) + 1 },
    ]);
    log(`Horario de ${slot.course} agregado para ${slot.group}.`);
  }
  return {
    staff,
    setStaff,
    families: familiesList,
    setFamilies,
    registrations,
    bills,
    payments,
    slots,
    setSlots,
    documents,
    setDocuments,
    activity,
    closedAlerts,
    setClosedAlerts,
    reset,
    enroll,
    cancelEnrollment,
    pay,
    addSlot,
    log,
  };
}
export type SchoolOffice = ReturnType<typeof useSchoolOffice>;
