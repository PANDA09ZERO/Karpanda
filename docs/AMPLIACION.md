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
