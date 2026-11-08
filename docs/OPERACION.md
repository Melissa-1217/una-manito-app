# Operación de publicaciones y conversaciones

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



## Conversaciones privadas entre vecinos

Antes de desplegar esta versión, ejecuta `supabase/migrations/20261109_mensajes_privados.sql` en SQL Editor, después de las migraciones de cupos y ciclo de publicaciones. Crea `mensajes_privados` y la RPC `enviar_mensaje_privado`. No cambies claves ni desactives RLS. El SQL nuevo se ha probado en PostgreSQL embebido con roles y un esquema aislado; las políticas del proyecto remoto se comprueban después de aplicarlo.

Cada respuesta/consulta tiene su propia conversación entre el autor de la publicación y el vecino que respondió. **Conversar** aparece en los mensajes privados de esa publicación, también accesibles desde Mi actividad. El mensaje inicial ya existente abre el historial; no se copia de nuevo como mensaje enviado. Se puede aclarar un pedido antes de aceptarlo: conversar no reserva un cupo ni un horario.

Solo esas dos cuentas pueden leer sus mensajes mediante RLS. Los envíos pasan por una función que comprueba participantes, usa la identidad de la sesión, bloquea la publicación y rechaza mensajes nuevos si la respuesta está rechazada o la publicación está resuelta/cancelada/vencida. Las escrituras directas, cambios de autor, edición y borrado de mensajes no están permitidos al cliente. Resolver/cancelar conserva el historial en modo lectura. Un identificador UUID por envío permite reintentar la misma operación sin duplicarla, incluso si la confirmación se perdió antes del cierre.

La conversación carga los últimos 50 mensajes, permite consultar páginas anteriores y consulta novedades cada 10 segundos mientras está abierta, visible y online. **Actualizar mensajes** permite pedirlas de inmediato. No se implementan notificaciones push/correo, confirmación de lectura ni archivos adjuntos. El mensaje «enviado» significa que el servidor confirmó su guardado, no que el destinatario lo leyó.

Los mensajes reales no se envían a Gemini ni se guardan en la copia offline de la PWA. Un borrador privado puede conservarse en memoria al cerrar y volver a abrir la conversación durante la misma sesión; no se escribe al almacenamiento local y se pierde al recargar/cerrar sesión. Si la conexión se pierde con una sesión abierta, se conserva el texto en memoria y se desactiva el envío; no se reenvía automáticamente al volver. En la **demostración**, los mensajes ficticios se guardan junto a sus datos de ejemplo en el navegador.

`npm run test:db` usa PGlite con `tests/fixtures/conversation-schema.sql`, aplica las migraciones y comprueba lectura entre participantes, rechazo de terceros (incluido otro participante del mismo pedido), identidad del remitente, escrituras directas denegadas, reintentos, cierre e historial. No necesita credenciales ni modifica Supabase. `tests/conversations.spec.js` prueba la interfaz en móvil/escritorio, la demo de ida y vuelta, accesibilidad, paginación, actualización y reintento tras una respuesta perdida. [RLS y permisos de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

Después del despliegue, prueba con Ana/Luis y una tercera cuenta real: enviar en ambos sentidos, actualizar desde el otro dispositivo, comprobar que el tercero no ve esos mensajes ni puede acceder por API y resolver la publicación para verificar que el historial permanece y ya no acepta envíos nuevos.

## Vencimiento e historial de publicaciones

Antes de desplegar esta actualización, ejecuta `supabase/migrations/20261108_ciclo_publicaciones.sql` en SQL Editor. Necesita que la migración de cupos ya esté aplicada. No vuelvas a ejecutar migraciones anteriores que sustituyan las mismas funciones por sus versiones antiguas.

- Una publicación pendiente sin ninguna respuesta vence siete días después de crearla o renovarla. Una respuesta, aunque siga pendiente de aceptación, evita este vencimiento automático. Esto también se aplica a servicios sin consultas; no es una regla de siete días de inactividad.
- Las publicaciones en coordinación permanecen activas hasta que el autor las resuelva o cancele. Las respuestas anteriores se conservan.
- Las resueltas salen inmediatamente de Mi barrio, Servicios, Apoyo en emergencia y los resultados de Manito. Quedan en Mi actividad → Historial, donde siguen disponibles las valoraciones de las ayudas aceptadas.
- Las vencidas y canceladas también aparecen en Historial. Solo las vencidas sin respuestas se pueden renovar; conservan su identificador y reciben otros siete días desde la renovación. Una publicación cancelada no se reabre. La cancelación requiere un motivo de 5 a 300 caracteres, visible en el historial.
- No se borran publicaciones, respuestas, participantes ni valoraciones. No hay una política de borrado definitivo en este MVP.

El servidor fija las fechas y comprueba los estados al responder, aceptar, resolver, renovar y cancelar. La actualización directa del estado se sustituye por `gestionar_publicacion`, con comprobación de autoría y bloqueo de la publicación. El frontend revisa las fechas cada 30 segundos mientras la página está abierta y oculta las vencidas. `vencer_publicaciones` persiste el estado al cargar o actualizar las listas: no necesita un cron, pero una fila sin visitas puede seguir almacenada como pendiente hasta esa consulta; aun así, el servidor rechaza respuestas fuera del plazo.

Comprobación después de aplicar el SQL: crea una publicación sin respuestas, verifica su renovación desde Historial cuando venza, cancela otra indicando el motivo y confirma que una resuelta conserva sus participantes y valoraciones. La migración conserva las respuestas previas y usa la fecha de creación para calcular el vencimiento de las publicaciones existentes. Algunas publicaciones antiguas sin respuestas dejarán de aparecer en las listas activas al actualizar.

