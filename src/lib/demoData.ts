export const demoProducts = [
  {
    id: "cuaderno",
    name: "Cuaderno kraft",
    category: "Papelería",
    price: 1800,
    stock: 12,
    mark: "CK",
  },
  {
    id: "agenda",
    name: "Agenda semanal",
    category: "Papelería",
    price: 3500,
    stock: 8,
    mark: "AS",
  },
  {
    id: "lapiceros",
    name: "Set de lapiceros",
    category: "Papelería",
    price: 1200,
    stock: 20,
    mark: "LP",
  },
  {
    id: "termo",
    name: "Termo de acero",
    category: "Accesorios",
    price: 5500,
    stock: 6,
    mark: "TA",
  },
  {
    id: "bolso",
    name: "Bolso reutilizable",
    category: "Accesorios",
    price: 2500,
    stock: 10,
    mark: "BR",
  },
  {
    id: "organizador",
    name: "Organizador de escritorio",
    category: "Accesorios",
    price: 4200,
    stock: 5,
    mark: "OE",
  },
] as const;
export const demoServices = [
  { id: "asesoria", name: "Asesoría inicial", duration: 45, price: 8000 },
  {
    id: "diagnostico",
    name: "Diagnóstico de negocio",
    duration: 30,
    price: 6000,
  },
  { id: "plan", name: "Sesión de planificación", duration: 45, price: 10000 },
] as const;
export const demoStaff = ["Sofía (demo)", "Mateo (demo)"];
export const demoTimes = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];
export function localDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function bookingKey(day: string, staff: string, time: string) {
  return [day, staff, time].join("|");
}
