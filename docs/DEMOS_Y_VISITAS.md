# Demos y visitas de Karpanda

## Página pública

En `/demos` se puede elegir Ventas o Reservas. Cada demo abre un sistema independiente con marca de negocio ficticio, dashboard y menú propio; en teléfonos, el menú se sitúa abajo. La guía de instrucciones se puede abrir u ocultar sin perder el progreso. Ambas son demostraciones adaptadas a teléfonos y sin registro. Los datos viven en la memoria de la página y desaparecen al recargar o salir. Reiniciar devuelve el escenario original.

- Ventas: explorar productos, buscar, añadir unidades, comprobar existencias, elegir un medio de pago simulado y emitir un comprobante ficticio. El stock disminuye dentro de la sesión. No se solicitan datos bancarios ni se cobra dinero.
- Reservas: elegir servicio, profesional, fecha y horario; confirmar, ver la agenda y cancelar para liberar el horario. No se envían notificaciones ni se crean citas reales.
- La portada, la navegación y las fichas de productos enlazan a las demos. Al finalizar se puede consultar por una solución adaptada al negocio.
- Panda Papelería: dashboard con productos vendidos y actividad reciente, punto de venta, inventario en tarjetas con detalles e historial de comprobantes. Todas las vistas comparten las ventas y existencias de la misma sesión.
- Estudio Panda: dashboard con citas de hoy y carga del equipo, creación de reservas, agenda en tarjetas con detalles y cancelación, catálogo de servicios y profesionales. Las cancelaciones también actualizan el dashboard y los horarios disponibles.

## Panel privado

Un administrador activo puede abrir **Visitas de la web**, también desde el resumen del dashboard. Incluye periodos de 7, 30 y 90 días, páginas vistas, sesiones, actividad de los últimos 30 minutos, evolución diaria, páginas populares, procedencias, dispositivos y uso de demos. El botón Actualizar solicita los datos actuales; no es un monitor en tiempo real.

La fuente es **Karpanda**. Empieza a registrar desde esta implementación, con zona horaria de Lima. No importa datos de Google Analytics. Las sesiones pertenecen a una pestaña del navegador, caducan tras 30 minutos de inactividad y se separan al cambiar de día; no equivalen a personas únicas. Inicios, finalizaciones y clics de consulta de demos son cantidades de acciones, no ventas ni contactos recibidos. Una demo se puede repetir.

## Consentimiento y datos

Se solicita permiso antes de cargar Google o registrar una visita propia. La preferencia dura hasta 180 días y se puede cambiar desde el pie de página. Esta ampliación renueva el consentimiento anterior. Rechazar detiene nuevos envíos y borra el identificador de sesión del navegador; no borra agregados ya registrados. Los bloqueadores, la falta de conexión y el rechazo reducen los recuentos.

El colector admite únicamente páginas públicas y eventos predefinidos. No recibe nombres, correos, búsquedas, formularios, pedidos reales ni parámetros de URL. Almacena contadores diarios y hashes de sesión que cambian cada día. Usa un hash diario de la dirección de conexión únicamente para limitar solicitudes; no guarda la IP original en las tablas de medición. El proveedor de infraestructura puede tener sus propios registros operativos.

La limpieza se ejecuta al recibir nuevas mediciones: elimina controles de frecuencia con más de dos horas, comprobantes de deduplicación con más de siete días y sesiones con más de 90 días. Los contadores agregados diarios se conservan. No es una tarea programada de borrado exacto.

## Configuración y comprobación

1. Aplicar las migraciones de Supabase, incluida `20261102145102_website_traffic.sql`.
2. Desplegar las funciones `kp-traffic` (pública, `verify_jwt=false`) y `kp-office` (informe con autenticación y comprobación del administrador). No exponer claves secretas en Vite.
3. Configurar URL y clave publicable de Supabase. `VITE_TRAFFIC_ENABLED=false` desactiva la medición propia. El modo `VITE_DEMO_MODE=true` también la desactiva. No se cuentan visitas locales: el colector acepta únicamente los dominios de producción incluidos en su lista.
4. Desplegar el frontend en Vercel. `VITE_GA_MEASUREMENT_ID` controla Google por separado. Cambios de dominio requieren actualizar la lista de orígenes del colector.
5. Abrir la página pública, aceptar medición y recorrer una demo. En el panel, Actualizar muestra los nuevos contadores. Antes de aceptar, al rechazar y en rutas privadas no debe haber envíos al colector.

Las tablas están en el esquema privado, con RLS y sin permisos para visitantes ni usuarios autenticados. Solo el servidor registra y consulta. El informe vuelve a comprobar el rol activo del administrador. Se limitan 120 eventos por conexión y minuto y se deduplican identificadores de evento. Estas medidas reducen ruido, pero las estadísticas públicas no son un sistema antifraude ni una auditoría de ventas.

`npm test` comprueba las demos, tamaños de pantalla, consentimiento y presentación de informes con respuestas controladas. `supabase/tests/traffic.sql` verifica agregación, deduplicación, rutas privadas, límites y permisos dentro de una transacción que se revierte. `npm run build` verifica TypeScript y el empaquetado de producción.
