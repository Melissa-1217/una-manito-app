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

Las cuentas conectadas usan Supabase para perfiles y publicaciones. La demostración Ana/Luis conserva sus datos en localStorage. El selector Ana/Luis solo sirve para la demo; sus comprobaciones de autor no sustituyen RLS.

Recorrido: Ana publica una necesidad → cambia el selector a Luis → abre la publicación y responde → cambia a Ana → acepta → marca como resuelta. `Reiniciar demo` restablece los datos iniciales tras confirmación.

Incluye inicio, directorio de servicios de ejemplo, formulario y revisión, detalle, actividad y listado de apoyo en emergencia. Recomendaciones, contacto, mapa, tutorial, notificaciones, fotos y PWA/offline completo están pendientes. localStorage por sí solo no permite abrir la aplicación sin conexión.

## Diseño y archivos

Paleta: primario `#1E4532`, secundario `#C85A32`, terciario `#D2E3D6`, neutro `#FAF7F0`. Fuente: Plus Jakarta Sans.

- `src/App.jsx`: navegación y pantallas del prototipo.
- `src/components/PublicationCard.jsx`: tarjeta de publicaciones.
- `src/lib/demo.js`: datos y operaciones locales con campos equivalentes a las tablas existentes.
- `src/lib/supabase.js`: cliente preparado para la siguiente etapa; aún no usado por la interfaz.
- `src/styles.css`: estilos adaptables y tokens.
- `tests/demo.test.js`: recorrido de ayuda y restricciones locales.

Antes de editar la misma pantalla, acuerden quién la modifica.

## Conexión con Supabase

Las tablas existentes son `perfiles`, `publicaciones` y `ofrecimientos`. No vuelvas a ejecutar su creación.

1. Copia `.env.example` a `.env.local`.
2. Completa URL y clave **publicable** (`sb_publishable_...`).
3. Reinicia Vite tras cambiar variables.
4. Auth, creación del perfil y operaciones reales están implementados; las cuentas reales usan UUID de Auth.
5. Comprueba RLS con dos sesiones y sin iniciar sesión: Luis no debe editar publicaciones de Ana y solo los participantes deben leer los ofrecimientos.
6. Aplica las migraciones de `supabase/migrations` que aún no hayas ejecutado. La aceptación utiliza la RPC `aceptar_ofrecimiento`.

Todo `VITE_*` es visible en el navegador. Nunca incluyas contraseñas de base de datos, `service_role`, `sb_secret_` o claves de IA. La clave publicable depende de RLS y permisos correctos.

Con las variables configuradas puedes iniciar sesión con una cuenta real o elegir explícitamente la demostración. Las pruebas automáticas de interfaz usan dobles del SDK; no sustituyen la comprobación con dos cuentas en tu proyecto.

## Cupos y participantes: actualización de Supabase

**Antes de publicar este frontend**, ejecuta el contenido completo de `supabase/migrations/20261107_cupos_participantes.sql` en Supabase → SQL Editor → New query → Run. Esta migración necesita las tablas existentes; no vuelve a crearlas. Después haz commit/push y espera al despliegue de Vercel. No modifica las migraciones anteriores ya aplicadas.

- Solicitudes y ofrecimientos: de 1 a 100 cupos, con 1 como valor inicial. Los define el autor tanto en el formulario como en el borrador de IA. Responder no reserva: solo aceptar ocupa un cupo.
- Servicios: varias consultas privadas; aceptar coordinación no supone reservar un horario ni garantiza disponibilidad del prestador. No hay agenda de reservas en este MVP.
- La lista de participantes muestra nombres de aceptados de solicitudes/ofrecimientos. Antes de responder, se avisa al vecino de que su nombre aparecerá si es aceptado. No se publica una lista de clientes de servicios.
- Los mensajes los leen el remitente y el autor. Una política RLS restrictiva impide que una política de lectura más amplia los exponga. La función `participantes_confirmados` devuelve únicamente publicación, identificador del participante y nombre; requiere sesión y comunidad coincidente, autoría o participación previa.
- La aceptación bloquea la publicación con `FOR UPDATE`, vuelve a contar las aceptaciones y actualiza respuesta/publicación dentro de la misma transacción. Al competir por el último cupo, la segunda aceptación debe fallar con `CAPACITY_FULL`. Repetir una aceptación ya guardada no ocupa otro cupo.
- Se revoca la actualización directa de ofrecimientos para que los clientes no omitan esta función. Un trigger impide nuevas respuestas a publicaciones llenas o cerradas. Las aceptaciones existentes se conservan ampliando sus cupos cuando sea necesario. Si una publicación tiene más de 100 aceptados, la migración se detiene para revisar ese caso.

Comprobación en Supabase antes de dar la mejora por terminada:

1. Crea una solicitud de un cupo; dos vecinos distintos responden. Ambos quedan pendientes.
2. Con dos sesiones del autor, acepta respuestas diferentes al mismo tiempo. Debe quedar una sola aceptada, la otra pendiente y aparecer `CAPACITY_FULL` en la segunda transacción. Actualiza ambas pantallas.
3. Con un tercer vecino, consulta participantes: verá el nombre aceptado, sin mensajes. Comprueba también por API que no puede leer los mensajes de otras personas ni aceptar sus respuestas.
4. Crea una solicitud de dos cupos y acepta dos respuestas; una tercera no debe aceptarse. Comprueba que un servicio admite más de una coordinación y no muestra su lista de clientes.

Validación local: pruebas de interfaz en móvil/escritorio, reglas de la demo y migración en PostgreSQL embebido con un esquema de prueba (permisos, privacidad, cupos, idempotencia y servicios). La concurrencia real y las políticas del proyecto remoto requieren la comprobación anterior; no se han verificado desde este equipo.

## Vercel

### PWA: instalación y uso sin conexión

La compilación incluye `manifest.webmanifest`, iconos de 192/512 px y un service worker generado por `pwa-build.js`, sin dependencias adicionales. El icono reutiliza la mano de la identidad visual de la app. Se mantiene el despliegue Vite en Vercel; no requiere SQL ni claves nuevas. La instalación utiliza HTTPS (o localhost para pruebas).

- Abre la página online una vez y espera a que cargue. **Instalar app** ofrece la instalación cuando el navegador la permite; de lo contrario explica cómo encontrarla en su menú. En iPhone/iPad se indica Safari → Compartir → Añadir a pantalla de inicio. Instalar no es obligatorio para usarla como web.
- Se guardan la interfaz, fuentes, iconos y las imágenes del tutorial. El worker solo atiende archivos públicos de esa compilación: no intercepta Supabase ni `/api/`, ni guarda respuestas de autenticación o de Gemini.
- Después de una consulta correcta con una cuenta real se guarda una copia de hasta 200 publicaciones públicas relevantes, por cuenta y barrio, con fecha de consulta. Incluye nombres de participantes confirmados; excluye ofrecimientos, mensajes privados, datos de contacto del perfil y valoraciones. Las publicaciones pueden contener información antigua: la copia se identifica como tal.
- Al volver a abrir sin internet, el dispositivo puede mostrar esa copia de consulta con el último nombre y barrio guardados. **No es un inicio de sesión offline ni una validación de identidad**. Los botones de publicación, respuestas, aceptaciones, cambios de estado y barrio requieren conexión y datos actualizados. Los mapas, Gemini y el servicio de dictado pueden necesitar internet.
- El formulario conserva un borrador por cuenta/barrio en este navegador. En el chat, **Guardar borrador y continuar manualmente** pasa la propuesta al formulario antes de salir. Al volver la conexión se consultan datos del servidor; nunca se envían borradores ni se repiten operaciones automáticamente.
- Cerrar sesión online elimina las copias y borradores locales de esa cuenta. **Cerrar copia**, durante la consulta offline, elimina esa información local y vuelve al acceso; no revoca por sí mismo una sesión de Supabase. Los datos locales también pueden desaparecer si el usuario borra el almacenamiento del navegador.
- Las versiones nuevas muestran **Actualizar app** y esperan a que el vecino lo pulse. El borrador del formulario se conserva antes de recargar. Una conversación de IA que todavía no se haya pasado al formulario no se guarda: la interfaz pide guardar antes de actualizar.

`npm run dev` no registra el worker. `npm run test:pwa` compila y prueba la versión de producción en localhost: recarga offline, tutorial con imágenes, copia pública, borrador persistente, ausencia de envíos al reconectar, interacción de instalación simulada y actualización real del worker sin recarga anticipada. La instalación efectiva en Android/iOS se comprueba manualmente después de desplegar en Vercel. [Requisitos y diferencias de instalación entre navegadores](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

### Accesibilidad del MVP

Se aumentan tamaños de lectura y áreas de interacción, con controles principales de al menos 44 px de alto, campos de 16 px y ajustes de contraste. El diseño permite una vista de 320 px y se comprueba el uso del formulario con ampliación al 200 %. Se añade **Saltar al contenido**, navegación actual identificada con `aria-current`, anuncio del estado de ubicación y restauración del foco al cerrar Manolito. El mapa anuncia si está desplegado. Se respetan movimiento reducido y colores forzados del sistema.

`tests/accessibility.spec.js` utiliza axe-core para revisar reglas WCAG A/AA automatizables en acceso, registro, inicio, formulario y tutorial; comprueba además teclado, foco, pantalla estrecha y ampliación. Estas pruebas no certifican conformidad completa. Queda pendiente una prueba manual con TalkBack/VoiceOver y personas representativas del público. [Referencia de criterios WCAG 2.2](https://www.w3.org/TR/WCAG22/).

### Manolito, tutorial y dictado

El asistente se llama **Manolito**; el nombre del producto sigue siendo **Una Manito**. Se utilizan tres imágenes aportadas por el equipo en `public/manolito-*.png`, sin modificar los archivos originales. El resto de referencias gráficas quedan disponibles para una etapa posterior.

El botón **Cómo usar la app** de la cabecera abre un recorrido de cinco pasos, también accesible desde el chat. Incluye prácticas para pedir ayuda, ofrecerla y buscar servicios, con avance, retroceso, corrección y omisión. Cada apertura empieza desde el principio. Las prácticas son locales: no llaman a Gemini ni crean publicaciones. La animación de la mascota respeta la preferencia de movimiento reducido. No se abre automáticamente para interrumpir el uso habitual.

El dictado está disponible en los tres modos del chat y en la descripción del formulario manual cuando el navegador proporciona `SpeechRecognition` o `webkitSpeechRecognition`. Solo se inicia al pulsar **Dictar por voz**, usa español de Perú y deja una transcripción editable. **Usar este texto** la añade al contenido existente, sin enviarlo ni publicarlo. Cerrar el chat o salir del campo detiene la sesión. La escritura sigue disponible cuando no hay compatibilidad, no se concede permiso o falla el servicio.

El navegador puede procesar audio en un servicio externo y necesitar conexión. La app lo indica antes de activar el micrófono; no guarda grabaciones ni las envía a Gemini. Gemini recibe texto solo cuando el vecino pulsa enviar o pide preparar una publicación. [Compatibilidad y procesamiento de SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

No requiere migraciones nuevas en Supabase ni claves adicionales en Vercel. Las pruebas automatizadas simulan el reconocimiento para verificar revisión, envío manual, permisos denegados y cierre del micrófono; falta comprobar la calidad de transcripción con un micrófono real en los navegadores/dispositivos del equipo.

### Vencimiento e historial de publicaciones

Antes de desplegar esta actualización, ejecuta `supabase/migrations/20261108_ciclo_publicaciones.sql` en SQL Editor. Necesita que la migración de cupos ya esté aplicada. No vuelvas a ejecutar migraciones anteriores que sustituyan las mismas funciones por sus versiones antiguas.

- Una publicación pendiente sin ninguna respuesta vence siete días después de crearla o renovarla. Una respuesta, aunque siga pendiente de aceptación, evita este vencimiento automático. Esto también se aplica a servicios sin consultas; no es una regla de siete días de inactividad.
- Las publicaciones en coordinación permanecen activas hasta que el autor las resuelva o cancele. Las respuestas anteriores se conservan.
- Las resueltas salen inmediatamente de Mi barrio, Servicios, Apoyo en emergencia y los resultados de Manito. Quedan en Mi actividad → Historial, donde siguen disponibles las valoraciones de las ayudas aceptadas.
- Las vencidas y canceladas también aparecen en Historial. Solo las vencidas sin respuestas se pueden renovar; conservan su identificador y reciben otros siete días desde la renovación. Una publicación cancelada no se reabre. La cancelación requiere un motivo de 5 a 300 caracteres, visible en el historial.
- No se borran publicaciones, respuestas, participantes ni valoraciones. No hay una política de borrado definitivo en este MVP.

El servidor fija las fechas y comprueba los estados al responder, aceptar, resolver, renovar y cancelar. La actualización directa del estado se sustituye por `gestionar_publicacion`, con comprobación de autoría y bloqueo de la publicación. El frontend revisa las fechas cada 30 segundos mientras la página está abierta y oculta las vencidas. `vencer_publicaciones` persiste el estado al cargar o actualizar las listas: no necesita un cron, pero una fila sin visitas puede seguir almacenada como pendiente hasta esa consulta; aun así, el servidor rechaza respuestas fuera del plazo.

Comprobación después de aplicar el SQL: crea una publicación sin respuestas, verifica su renovación desde Historial cuando venza, cancela otra indicando el motivo y confirma que una resuelta conserva sus participantes y valoraciones. La migración conserva las respuestas previas y usa la fecha de creación para calcular el vencimiento de las publicaciones existentes. Algunas publicaciones antiguas sin respuestas dejarán de aparecer en las listas activas al actualizar.

Preset Vite, build `npm run build`, salida `dist`. La base usa navegación por estado sin rutas adicionales. Configura las variables al conectar Supabase.

## Asistente de publicación con Gemini

El formulario incluye un asistente que propone título, descripción y categoría desde un mensaje. El vecino revisa la propuesta y la aplica explícitamente antes de publicar. La propuesta no modifica el barrio ni el indicador de emergencia. El texto se envía a Gemini.

Configura `GEMINI_API_KEY` y, opcionalmente, `GEMINI_MODEL` en `.env.local`. El modelo predeterminado es `gemini-3.5-flash-lite`; puedes cambiarlo por uno compatible con generateContent y salidas estructuradas disponible en tu cuenta. Reinicia `npm run dev` después de cambiar estas variables. En Vercel configura las mismas variables y vuelve a desplegar. No uses el prefijo `VITE_` para estas variables.

`api/prepare-publication.js` es una función Node de Vercel. Vite la sirve localmente mediante middleware. `npm run preview` solo sirve los archivos estáticos y no incluye la función. Las pruebas automatizadas usan respuestas simuladas del proveedor. La conexión real necesita la clave de Gemini y cuota disponible.

El endpoint todavía no usa una sesión Supabase. Antes de abrir el uso de IA a una audiencia amplia, conectar autenticación y límites de solicitudes por usuario para controlar el consumo. El dictado por voz sigue pendiente.

## Acceso y perfil

`src/components/AuthFlow.jsx` gestiona inicio de sesión, registro, confirmación por correo, creación del perfil y selección manual de barrio. Usa Supabase Auth y la tabla `perfiles` existente. Un perfil existente permite entrar directamente. El registro pendiente de confirmación invita a revisar el correo antes de continuar. La pantalla permite explorar la demo sin cuenta.

Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` localmente y en Vercel. Reinicia el servidor o vuelve a desplegar tras guardar las variables. En Supabase, Authentication → URL Configuration, configura Site URL con el dominio público y permite también la URL local y el dominio de producción en Redirect URLs. La tabla `perfiles` necesita los permisos y políticas RLS ya creados por el equipo.

Después del acceso, la cuenta, el barrio y las publicaciones provienen de Supabase. El botón Actualizar publicaciones consulta los cambios de otros vecinos; la lista se filtra por el barrio del perfil. El selector Ana/Luis se limita a la demostración. La sesión de Supabase se conserva con su SDK y puede cerrarse desde el encabezado.

Las pruebas de las pantallas de acceso y selección de barrio usan dobles del SDK. Falta probar con las credenciales reales del proyecto. No hay usuarios de prueba incrustados ni contraseñas guardadas en el código.

## Publicaciones compartidas

`src/lib/publications.js` consulta, crea y cierra publicaciones con la sesión de Supabase y las políticas RLS existentes. El autor procede del perfil autenticado. El formulario conserva sus datos si falla el guardado. La interfaz muestra el nombre del autor mediante la relación con perfiles. Las solicitudes, ofrecimientos, servicios y recursos de emergencia comparten esta tabla.

Las respuestas Yo te ayudo, su aceptación y las recomendaciones siguen disponibles en la demostración. Su conexión remota es la siguiente etapa y todavía no se ofrece en cuentas conectadas. Las pruebas de publicación compartida usan dobles de los servicios; la prueba entre dos dispositivos reales sigue pendiente.
