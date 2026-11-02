export const schoolGroups = ["1.º secundaria", "2.º secundaria"];
export const schoolCourses = ["Matemática", "Comunicación"];
export type SchoolStudent = { id: number; name: string; group: string };
export type Attendance = "present" | "late" | "absent" | "excused" | "pending";
export const attendanceLabels: Record<Attendance, string> = {
  present: "Presente",
  late: "Tardanza",
  absent: "Ausente",
  excused: "Justificada",
  pending: "Sin registrar",
};
export const schoolStudents: SchoolStudent[] = [
  { id: 1, name: "Alumna Sol", group: schoolGroups[0] },
  { id: 2, name: "Alumno Río", group: schoolGroups[0] },
  { id: 3, name: "Alumna Luna", group: schoolGroups[1] },
];
export const schoolAttendance: Record<number, Attendance> = {
  1: "present",
  2: "late",
  3: "absent",
};
export const schoolGrades: Record<string, number | null> = {
  "1:Matemática": 16,
  "1:Comunicación": 17,
  "2:Matemática": 12,
  "2:Comunicación": 14,
  "3:Matemática": 10,
  "3:Comunicación": 13,
};
export const gradeKey = (id: number, course: string) => `${id}:${course}`;
