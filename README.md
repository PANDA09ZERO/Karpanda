# Karpanda

Aplicación React + TypeScript + Vite basada en el [diseño de Figma](https://www.figma.com/design/9lVkuMmrAV5a0cEJ2NHV9z?node-id=5-791). Incluye catálogo adaptable a móvil, producto y plan, compra, registro e inicio de sesión, portal del cliente y administración.

## Ejecutar

Requiere Node.js 22.12 o posterior.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Abre la dirección que imprime Vite, normalmente **http://127.0.0.1:5173/**. La aplicación React requiere el servidor; no abras `index.html` ni `prototipos/figma-referencias.html` como archivos. Los documentos de `prototipos/` conservan las referencias iniciales.

La copia local de trabajo ya tiene `.env.local` conectado al proyecto **Karpanda** (`buuvmedtbekykowgejaa`). Ese archivo está excluido de Git. En otra máquina, completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con los datos de Settings → API del mismo proyecto. Solo se usa la clave **publishable**, nunca una clave secreta o `service_role`.

Sin ambas credenciales, la app funciona en modo demostración y muestra una franja indicándolo. Puedes forzarlo con `VITE_DEMO_MODE=true`; los pedidos y solicitudes de esa modalidad solo se guardan en el navegador y se pueden restablecer en Mi cuenta. Con credenciales y `VITE_DEMO_MODE=false`, usa Supabase real.

## Supabase

El esquema ya está aplicado al proyecto **Karpanda**. Las migraciones de `supabase/migrations/` son el historial reproducible. No vuelvas a ejecutar `schema.sql` sobre el proyecto conectado; es una referencia del esquema inicial. Las tablas tienen el prefijo `kp_` y políticas RLS:

- `kp_products`: catálogo publicado; edición solo para administradores.
- `kp_orders`: pedidos del propietario; precio y estado inicial calculados por el servidor.
- `kp_licenses`: licencias del propietario; sin permisos de emisión desde el navegador.
- `kp_tickets`: solicitudes del propietario; los administradores pueden cerrarlas.
- `kp_releases`: versiones disponibles únicamente con una licencia activa.
- Bucket privado `kp-downloads`: descargas con enlaces firmados de 60 segundos y comprobación de licencia.

### Cuentas y administración

En Supabase → Authentication → URL Configuration, configura **Site URL** y **Redirect URLs** para `http://127.0.0.1:5173/cuenta` y el dominio de Vercel con `/cuenta`. Mantén la confirmación de correo según tu política; el formulario avisa cuando se requiere confirmar el registro. Para producción configura un proveedor SMTP.

Se han aprovisionado las cuentas `cristian@karpanda.com` y `karen@karpanda.com` mediante Supabase Auth Admin. Las contraseñas temporales se entregan al propietario y nunca se guardan en el repositorio. Al primer acceso, `/cambiar-contrasena` exige una contraseña personal antes de habilitar la administración. El correo de estas cuentas fue confirmado al aprovisionarlas; no necesitan recibir un mensaje para entrar.

Las cuentas temporales tienen `role: pending_admin` y `must_change_password: true` en `app_metadata`: no pueden consultar usuarios ni administrar productos con la credencial inicial. El servidor activa `role: admin` después de verificar la contraseña actual y completar el cambio. Estos roles no se toman de `user_metadata`.

En **Administración → Usuarios** (`/admin/usuarios`) se muestran las cuentas, sus roles y el estado de cambio inicial. Cada usuario cambia únicamente su propia contraseña. Los clientes disponen del mismo formulario en **Mi espacio → Contraseña** (`/cuenta/seguridad`). Se requieren al menos 12 caracteres, mayúscula, minúscula, número y símbolo; tras el cambio se revocan las sesiones de renovación y se vuelve a iniciar sesión. Los JWT de acceso ya emitidos caducan según la configuración de Supabase.

La Edge Function `kp-accounts` valida el token con `auth.getUser`, comprueba el rol actualizado para listar usuarios y vuelve a autenticar la contraseña actual antes de cambiarla. La clave `service_role` permanece en el entorno servidor de Supabase. Su configuración `verify_jwt = false` evita la verificación antigua de JWT de la pasarela: la autenticación se realiza dentro de la función, tanto para tokens actuales como para los antiguos. No contiene un endpoint público de aprovisionamiento ni de restablecimiento de contraseñas ajenas.

Para desplegar esta función en otro proyecto:

```sh
supabase functions deploy kp-accounts --project-ref TU_PROJECT_REF
```

Para otras cuentas, registra al usuario desde `/acceso` y confirma el correo. Un operador autorizado puede asignar el rol administrador en `app_metadata`, nunca en `user_metadata`. Por ejemplo, desde el SQL Editor y sustituyendo el correo por el de la cuenta elegida:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'tu-correo@ejemplo.com';
```

Después, cierra sesión e inicia nuevamente para renovar el token. El panel está en `/admin`; el portal muestra el enlace a Administración a las cuentas autorizadas. Los clientes no pueden asignarse roles por el formulario.

### Compra y activación

Los productos y precios cargados son ejemplos. La compra conectada **registra un pedido pendiente**. No procesa cobros ni simula confirmaciones en Supabase. La pasarela, impuestos y reglas comerciales deben elegirse antes de cobrar.

Un futuro webhook debe validar firma, importe y moneda, confirmar el pedido y emitir la licencia en una transacción idempotente. `kp_licenses.order_id` es único para evitar duplicados. No habilites una licencia desde el retorno del navegador. La integración de pagos no está implementada en esta versión.

Para productos descargables, un operador sube el archivo a `kp-downloads/<product_id>/<archivo>` y registra una fila en `kp_releases` con `product_id`, `version` y `storage_path`. El usuario necesita una licencia activa y no vencida. Para SaaS, configura la URL HTTPS de acceso en el producto; el software de destino debe verificar la licencia y autenticar al usuario.

## Desplegar en Vercel

Importa el repositorio `PANDA09ZERO/Karpanda` y selecciona:

| Ajuste                          | Valor                                      |
| ------------------------------- | ------------------------------------------ |
| Framework                       | Vite                                       |
| Root Directory                  | Raíz del repositorio                       |
| Build Command                   | `npm run build`                            |
| Output Directory                | `dist`                                     |
| Node.js                         | 22.x o posterior compatible                |
| `VITE_SUPABASE_URL`             | `https://buuvmedtbekykowgejaa.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publishable del proyecto Karpanda    |
| `VITE_DEMO_MODE`                | `false`                                    |

`vercel.json` incluye el fallback de rutas para que `/producto/ventas`, `/cuenta` y `/admin` funcionen al recargar. Las variables `VITE_*` se incorporan al bundle durante la compilación: vuelve a desplegar después de cambiarlas. Nunca pongas secretos en ellas. La publicación de producción está en https://karpanda.vercel.app y está vinculada a los cambios de `main` en GitHub.

## Verificación

```sh
npm run build
npm test
```

Las siete pruebas de navegador cubren compra simulada con persistencia, edición y publicación de productos, soporte, móvil, enlaces directos, cambio inicial y gestión de usuarios. En Windows usan Google Chrome instalado; en CI se instala Chromium. Los tests arrancan un servidor de demostración en el puerto 5175 y otro en 5176 con una API simulada que nunca usa credenciales reales.

Para probar además el catálogo y la protección de rutas contra Supabase real, mantén `npm run dev` en el puerto 5173 y ejecuta en PowerShell:

```powershell
$env:KARPANDA_LIVE_TEST='true'
npm test
```

`supabase/tests/rls.sql` prueba permisos, cálculo del precio, estado pendiente, aislamiento entre propietarios y rechazo de elevación de roles mediante `user_metadata`. Usa una transacción con rollback: no deja cuentas ni pedidos de prueba. Fue ejecutada contra el proyecto Karpanda.

Las pruebas no cobran dinero ni verifican entrega de correos reales. Además de las pruebas reproducibles, se verificó contra Supabase el acceso de las cuentas aprovisionadas, el cambio real de contraseña, el rechazo de la contraseña anterior y la denegación de cambios sobre otra cuenta. Ambas cuentas se entregan con el cambio inicial pendiente. La comprobación de contraseñas filtradas de Supabase requiere un plan compatible; no se modificó la facturación del proyecto.
