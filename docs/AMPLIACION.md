# Ampliación del panel Karpanda

Alcance: usuarios/clientes, licencias, pedidos, soporte conversacional y dashboard Bento responsive. Se conservarán los datos y la marca existentes.

Reglas de esta versión:

- Desactivar y archivar conservan el historial; no se borran cuentas ni documentos comerciales permanentemente.
- Los pagos y devoluciones manuales registran operaciones realizadas fuera de Karpanda. Requieren referencia, motivo y confirmación explícita; no ejecutan cobros ni transferencias.
- Un pedido contiene un producto/plan, con cantidad y precio histórico. Los pedidos anteriores conservan su importe.
- Las licencias de pedidos mensuales se emiten una sola vez por pedido al confirmar el pago. Las manuales requieren motivo y quedan identificadas.
- Solo el servidor decide roles, estados e importes. El último administrador activo y la cuenta administradora que ejecuta la acción quedan protegidos.
- Las notas internas de pedidos, usuarios y soporte no se muestran al cliente.
- La desactivación y los cambios de rol se comprueban contra el estado actual en la base de datos, sin esperar a que caduque un JWT antiguo.
- No se añaden adjuntos en esta versión; las conversaciones son de texto.

Aceptación: CRUD persistente, detalles y relaciones navegables, búsqueda/filtros/paginación, auditoría, transacciones idempotentes de pagos/licencias, siete permisos críticos verificados y escritorio/móvil sin desbordamientos.

## Navegación y presentación

Los listados activos de clientes, usuarios, pedidos, licencias, soporte y productos utilizan tarjetas independientes en todos los tamaños. Cada tarjeta abre la ficha completa con un enlace accesible desde teclado; los enlaces secundarios siguen abriendo sus registros correspondientes. Los productos cuentan con ficha propia en `/admin/productos/:id` y la edición/publicación se realiza desde ella.

Hasta 767 px se muestra una barra inferior: Inicio, Pedidos, Licencias, Soporte y Más. El menú Más permite abrir todas las secciones, cambiar entre administración y cuenta, volver a la tienda y cerrar sesión cuando corresponde. Usa un diálogo con foco contenido, cierre con Escape y retorno al botón de origen. La vista reserva espacio inferior y respeta el área segura del dispositivo. El encabezado y la barra se mantienen al cargar una sección.
