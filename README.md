# Una Manito

App vecinal para encontrar servicios recomendados, intercambiar ayuda y coordinar apoyo en emergencias.

## Empezar

Requiere Node.js 22.12 o posterior; se recomienda una versión LTS compatible.

```sh
npm install
npm run dev
```

Abre la dirección que indique Vite, normalmente http://localhost:5173.

```sh
npm run build
npm run lint
npm test
```

Prueba del recorrido en escritorio y móvil: `npx playwright install chromium` y `npm run test:ui`.

## Estado de esta primera versión

React + Vite, JavaScript, iconos Lucide y Plus Jakarta Sans alojada en el propio proyecto. CSS con variables, sin Tailwind ni Next.js.

La interfaz es un **prototipo local**, no una aplicación conectada a Supabase. Los datos de ejemplo se guardan en localStorage del mismo navegador. No hay sincronización entre dispositivos ni autenticación real. El selector Ana/Luis solo sirve para la demo; sus comprobaciones de autor no sustituyen RLS.

Recorrido: Ana publica una necesidad → cambia el selector a Luis → abre la publicación y responde → cambia a Ana → acepta → marca como resuelta. `Reiniciar demo` restablece los datos iniciales tras confirmación.

Incluye inicio, directorio de servicios de ejemplo, formulario y revisión, detalle, actividad y listado de apoyo en emergencia. Recomendaciones, contacto, mapa, registro, tutorial, notificaciones, fotos y PWA/offline completo están pendientes. localStorage por sí solo no permite abrir la aplicación sin conexión.

## Diseño y archivos

Paleta: primario `#1E4532`, secundario `#C85A32`, terciario `#D2E3D6`, neutro `#FAF7F0`. Fuente: Plus Jakarta Sans.

- `src/App.jsx`: navegación y pantallas del prototipo.
- `src/components/PublicationCard.jsx`: tarjeta de publicaciones.
- `src/lib/demo.js`: datos y operaciones locales con campos equivalentes a las tablas existentes.
- `src/lib/supabase.js`: cliente preparado para la siguiente etapa; aún no usado por la interfaz.
- `src/styles.css`: estilos adaptables y tokens.
- `tests/demo.test.js`: recorrido de ayuda y restricciones locales.

Antes de editar la misma pantalla, acuerden quién la modifica.

## Siguiente etapa: Supabase

Las tablas existentes son `perfiles`, `publicaciones` y `ofrecimientos`. No vuelvas a ejecutar su creación.

1. Copia `.env.example` a `.env.local`.
2. Completa URL y clave **publicable** (`sb_publishable_...`).
3. Reinicia Vite tras cambiar variables.
4. Implementa Auth, creación del perfil y operaciones con sesiones reales. Sustituye los identificadores demo por UUID de Auth.
5. Comprueba RLS con dos sesiones y sin iniciar sesión: Luis no debe editar publicaciones de Ana y solo los participantes deben leer los ofrecimientos.
6. Implementa la aceptación y el cambio a `en_coordinacion` en una transacción del servidor (RPC) antes de usar datos reales.

Todo `VITE_*` es visible en el navegador. Nunca incluyas contraseñas de base de datos, `service_role`, `sb_secret_` o claves de IA. La clave publicable depende de RLS y permisos correctos.

Las variables no activan automáticamente el modo conectado. La interfaz sigue usando demo hasta implementar las operaciones reales. El acceso remoto aún no está probado.

## Vercel

Preset Vite, build `npm run build`, salida `dist`. La base usa navegación por estado sin rutas adicionales. Configura las variables al conectar Supabase.

## Asistente de publicación con Gemini

El formulario incluye un asistente que propone título, descripción y categoría desde un mensaje. El vecino revisa la propuesta y la aplica explícitamente antes de publicar. La propuesta no modifica el barrio ni el indicador de emergencia. El texto se envía a Gemini.

Configura `GEMINI_API_KEY` y, opcionalmente, `GEMINI_MODEL` en `.env.local`. El modelo predeterminado es `gemini-3.5-flash-lite`; puedes cambiarlo por uno compatible con generateContent y salidas estructuradas disponible en tu cuenta. Reinicia `npm run dev` después de cambiar estas variables. En Vercel configura las mismas variables y vuelve a desplegar. No uses el prefijo `VITE_` para estas variables.

`api/prepare-publication.js` es una función Node de Vercel. Vite la sirve localmente mediante middleware. `npm run preview` solo sirve los archivos estáticos y no incluye la función. Las pruebas automatizadas usan respuestas simuladas del proveedor. La conexión real necesita la clave de Gemini y cuota disponible.

El endpoint todavía no usa una sesión Supabase. Antes de abrir el uso de IA a una audiencia amplia, conectar autenticación y límites de solicitudes por usuario para controlar el consumo. El dictado por voz sigue pendiente.
