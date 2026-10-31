# Google Analytics 4 en Karpanda

Estado inicial: integración preparada, **sin una propiedad ni ID de medición de producción**. Una variable vacía no carga la etiqueta de Google ni muestra el aviso de medición. No hay datos de tráfico reales hasta completar la configuración.

## Activación

1. Entra con tu cuenta en [Google Analytics](https://analytics.google.com/) y crea una cuenta y una propiedad llamada **Karpanda**. Selecciona la zona horaria de Perú y moneda PEN. El propietario debe revisar y aceptar las condiciones de Google.
2. Añade un flujo de datos **Web** para `https://karpanda.vercel.app`, con nombre **Karpanda pública**.
3. **Desactiva la medición mejorada del flujo**. Karpanda envía manualmente sus páginas y eventos. Esto evita duplicar visitas por los cambios de historial de React y que eventos automáticos midan formularios o recorridos privados. No instales simultáneamente otra etiqueta de Analytics o Tag Manager para la misma propiedad.
4. Copia el **ID de medición** que comienza por `G-`. No hace falta una contraseña, clave privada ni secreto de API.
5. En el proyecto **Karpanda** de Vercel, añade `VITE_GA_MEASUREMENT_ID` con ese ID en **Production** y vuelve a desplegar. Para probar en local se puede definir en `.env.local`; no uses la propiedad de producción para las pruebas automatizadas.
6. Abre el dominio, pulsa **Aceptar medición** y revisa **Tiempo real** en Analytics. Prueba el cambio entre Inicio, Servicios y un producto. Luego elige **Solo necesarias** desde **Preferencias de medición** para comprobar que la medición se detiene.

Guía oficial: [Configurar Analytics para una web](https://support.google.com/analytics/answer/9304153?hl=es).

## Qué se mide

- `page_view`: Inicio, Servicios, Cómo funciona, Términos y fichas públicas de productos. Se envía una vez por cambio de ruta; no se envían parámetros de consulta ni fragmentos.
- `explore_catalog`: botón de explorar el catálogo.
- `filter_catalog`: categoría elegida, sin texto libre de búsqueda.
- `view_service`: interés por uno de los servicios propuestos.
- `consult_service`: copia del resumen de proyecto, **sin enviar el resumen**. Este evento indica interés, no una consulta enviada ni una venta.
- `open_faq`: apertura de una pregunta frecuente, mediante su identificador fijo.

No hay eventos de compra ni ingresos porque este sitio no procesa cobros. No se envían nombres, correos, contraseñas, mensajes, datos de pedidos o identificadores de usuarios con esta integración. No se mide `/admin`, `/cuenta`, `/acceso`, `/cambiar-contrasena`, `/compra` ni las conversaciones de soporte. Al entrar en una ruta excluida, se deshabilita el destino de Analytics.

Se usa consentimiento básico: la etiqueta no carga hasta aceptar la medición. La elección se conserva hasta 180 días y puede cambiarse en el pie de página. Al rechazar, se detiene la medición de esta integración y se eliminan las cookies de Analytics accesibles en el dominio. Esto no elimina datos ya recibidos por Google. Si el navegador bloquea almacenamiento local, la elección dura solo durante la sesión de la pestaña. Google Signals y la personalización publicitaria están desactivados.

En Analytics se podrán revisar usuarios estimados, páginas vistas, procedencia del tráfico, dispositivos y eventos. Los bloqueadores y las preferencias de los visitantes pueden impedir la medición; el informe no cuenta todas las personas con exactitud.

Referencias técnicas: [Vistas de página en aplicaciones React](https://developers.google.com/analytics/devguides/collection/ga4/views?technology=websites) y [consentimiento de la etiqueta](https://developers.google.com/tag-platform/security/guides/consent).
