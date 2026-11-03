import type { Product } from "../types";
import { productDemo } from "./catalog";
import { demoProducts, demoServices, demoStaff } from "./demoData";
import { schoolStudents, schoolGroups } from "./demoSchoolData";
type Overview = {
  subtitle: string;
  audience: string;
  summary: string;
  brand: string;
  nav: string[];
  stats: [string, string][];
  modules: [string, string][];
  steps: string[];
};
const content: Record<string, Overview> = {
  ventas: {
    subtitle: "Del producto a la venta, con el inventario en orden.",
    audience: "Para tiendas, papelerías y pequeños comercios",
    summary:
      "Reúne productos, punto de venta e historial en un mismo espacio. Registra una venta y observa cómo se actualizan las existencias y el resumen del negocio.",
    brand: "Panda Papelería",
    nav: ["Dashboard", "Punto de venta", "Inventario", "Ventas"],
    stats: [
      [
        "Unidades en stock",
        String(demoProducts.reduce((n, p) => n + p.stock, 0)),
      ],
      ["Ventas de ejemplo", "0"],
      ["Total simulado", "S/ 0.00"],
    ],
    modules: [
      [
        "Dashboard del negocio",
        "Consulta las unidades disponibles, los productos vendidos y la actividad reciente.",
      ],
      [
        "Punto de venta",
        "Busca productos, agrega cantidades y revisa el total antes de confirmar una venta.",
      ],
      [
        "Inventario conectado",
        "Consulta cada producto y sus existencias; una venta descuenta las unidades correspondientes.",
      ],
      [
        "Historial y comprobantes",
        "Abre el detalle de una venta para revisar sus productos, cantidades y medio de pago simulado.",
      ],
    ],
    steps: [
      "Elige productos y cantidades.",
      "Revisa y confirma la venta de prueba.",
      "Consulta el comprobante y el nuevo stock.",
    ],
  },
  reservas: {
    subtitle: "Servicios, profesionales y horarios en una sola agenda.",
    audience: "Para negocios que trabajan con citas y atención por horario",
    summary:
      "Organiza la disponibilidad del equipo y las reservas de tus servicios. Cada cita confirmada ocupa un horario; cancelarla permite volver a utilizar ese espacio.",
    brand: "Estudio Panda",
    nav: ["Dashboard", "Nueva reserva", "Agenda", "Servicios y equipo"],
    stats: [
      ["Reservas de ejemplo", "1"],
      ["Profesionales", String(demoStaff.length)],
      ["Servicios", String(demoServices.length)],
    ],
    modules: [
      [
        "Dashboard de la agenda",
        "Revisa las citas de hoy y la carga de cada profesional.",
      ],
      [
        "Reservas paso a paso",
        "Selecciona servicio, profesional, fecha y un horario disponible antes de confirmar.",
      ],
      [
        "Agenda con detalles",
        "Consulta las citas confirmadas y sus datos. Cancela una reserva para liberar el horario.",
      ],
      [
        "Servicios y equipo",
        "Explora la duración y el importe de cada servicio de ejemplo y el equipo disponible.",
      ],
    ],
    steps: [
      "Elige un servicio, profesional y fecha.",
      "Selecciona un horario libre y confirma.",
      "Consulta la agenda o cancela para liberar el espacio.",
    ],
  },
  gestion: {
    subtitle: "Cada cliente, proyecto y tarea con un siguiente paso claro.",
    audience: "Para equipos de servicios y negocios que trabajan por proyectos",
    summary:
      "Conecta el directorio de clientes con sus proyectos, presupuestos y tareas. Asigna responsables, actualiza los estados y consulta el avance del trabajo sin perder el contexto de cada cliente.",
    brand: "Panda Studio",
    nav: ["Dashboard", "Clientes", "Proyectos y tareas", "Reportes"],
    stats: [
      ["Clientes activos", "2"],
      ["Proyectos en seguimiento", "2"],
      ["Tareas pendientes", "3"],
    ],
    modules: [
      [
        "Dashboard de seguimiento",
        "Consulta el progreso de los proyectos, las tareas pendientes y la actividad del equipo.",
      ],
      [
        "Directorio de clientes",
        "Agrega o edita los datos de ejemplo de un cliente y consulta sus proyectos. Archivar conserva su historial.",
      ],
      [
        "Proyectos y tareas",
        "Define cliente, presupuesto, entrega y responsables. Cambia estados, agrega tareas y pausa o reanuda proyectos.",
      ],
      [
        "Reportes por cliente",
        "Filtra los proyectos y descarga un resumen con avances y presupuestos simulados.",
      ],
    ],
    steps: [
      "Explora o agrega un cliente.",
      "Crea un proyecto y asigna su primera tarea.",
      "Completa tareas y revisa el avance y el reporte.",
    ],
  },
  educacion: {
    subtitle:
      "Una visión conectada de la vida académica y la operación del colegio.",
    audience:
      "Para instituciones educativas que necesitan organizar sus procesos",
    summary:
      "Conecta alumnos, profesores, familias y gestión académica con matrículas, cargos y seguimiento documental. El dashboard refleja los cambios que realizas en los módulos del colegio.",
    brand: "Colegio Panda",
    nav: ["Dashboard", "Alumnos", "Académico", "Documentos"],
    stats: [
      ["Alumnos de ejemplo", String(schoolStudents.length)],
      ["Grados", String(schoolGroups.length)],
      ["Asistencia registrada", "67%"],
    ],
    modules: [
      [
        "Alumnos y familias",
        "Consulta expedientes, edita alias y vincula alumnos con sus apoderados de ejemplo.",
      ],
      [
        "Profesores y horarios",
        "Organiza docentes y clases por grado y aula, con validación de cruces de horarios.",
      ],
      [
        "Asistencia y calificaciones",
        "Guarda el registro de asistencia y las notas por curso; consulta el resultado en el expediente y la libreta.",
      ],
      [
        "Matrículas y pagos",
        "Crea matrículas con cargos ficticios, registra abonos parciales o totales y revisa sus comprobantes.",
      ],
      [
        "Documentos y alertas",
        "Simula la recepción de documentos y revisa avisos por ausencias, notas bajas o expedientes incompletos.",
      ],
      [
        "Libretas y reportes",
        "Genera una libreta de ejemplo, imprime el resumen o exporta reportes CSV. Explora perspectivas de lectura por rol.",
      ],
    ],
    steps: [
      "Explora el expediente de un alumno.",
      "Guarda asistencia y calificaciones.",
      "Revisa el dashboard, la libreta y los demás módulos.",
    ],
  },
  "landing-corporativa": {
    subtitle: "Una presencia web clara para tu negocio.",
    audience: "Para negocios que necesitan una página profesional",
    summary:
      "Presenta quién eres, qué ofreces y cómo contactarte en una página rápida, clara y adaptable a cualquier pantalla.",
    brand: "Karpanda Web",
    nav: ["Inicio", "Servicios", "Nosotros", "Contacto"],
    stats: [
      ["Secciones", "4"],
      ["Dispositivos", "Todos"],
      ["Tiempo de entrega", "Acordado"],
    ],
    modules: [
      ["Hero y mensaje principal", "Comunica tu propuesta de valor en los primeros segundos."],
      ["Servicios o productos", "Presenta tu oferta con información clara y ordenada."],
      ["Prueba social", "Testimonios o logos para generar confianza."],
      ["Contacto y llamada a la acción", "Formulario o enlace directo para que te escriban."],
    ],
    steps: [
      "Revisamos tu negocio y objetivos.",
      "Diseñamos y construimos la página.",
      "Publicamos y te acompañamos a empezar.",
    ],
  },
  "landing-campana": {
    subtitle: "Convierte visitas en consultas para tu campaña.",
    audience: "Para campañas, lanzamientos y promociones",
    summary:
      "Una página enfocada en una oferta concreta, con mensaje claro y un solo objetivo: que te contacten.",
    brand: "Karpanda Campaña",
    nav: ["Oferta", "Beneficios", "Preguntas", "Contacto"],
    stats: [
      ["Objetivo", "Conversión"],
      ["Secciones", "5"],
      ["Dispositivos", "Todos"],
    ],
    modules: [
      ["Oferta principal", "Presenta tu promoción o lanzamiento con claridad."],
      ["Beneficios", "Explica por qué elegirte en puntos simples."],
      ["Preguntas frecuentes", "Resuelve dudas antes de que te escriban."],
      ["Formulario de contacto", "Captura leads de forma directa."],
    ],
    steps: [
      "Definimos la oferta y el mensaje.",
      "Diseñamos la landing de campaña.",
      "Medimos y ajustamos según resultados.",
    ],
  },
  "landing-catalogo": {
    subtitle: "Tu catálogo de productos o servicios en la web.",
    audience: "Para negocios que quieren mostrar su oferta online",
    summary:
      "Presenta tus productos o servicios con fotos, descripciones y contacto directo, sin complicaciones.",
    brand: "Karpanda Catálogo",
    nav: ["Catálogo", "Categorías", "Detalle", "Contacto"],
    stats: [
      ["Productos", "A medida"],
      ["Categorías", "Flexibles"],
      ["Dispositivos", "Todos"],
    ],
    modules: [
      ["Listado de productos", "Muestra tu oferta con imágenes y descripciones."],
      ["Categorías", "Organiza por tipo o línea de productos."],
      ["Detalle de producto", "Amplía la información de cada item."],
      ["Contacto directo", "Botón para consultar o comprar."],
    ],
    steps: [
      "Reunimos tu catálogo y fotos.",
      "Construimos la página de catálogo.",
      "Publicamos y te enseñamos a actualizarlo.",
    ],
  },

};
export function productContent(p: Product) {
  const key = content[p.slug]
    ? p.slug
    : productDemo(p)?.split("/").at(-1) || "";
  return {
    kind: key,
    ...(content[key] || {
      subtitle: p.description,
      audience: "Una solución para organizar tu operación",
      summary: p.description,
      brand: p.name,
      nav: ["Resumen", "Operación", "Reportes"],
      stats: [],
      modules: [["Información del producto", p.description]],
      steps: [],
    }),
  };
}
