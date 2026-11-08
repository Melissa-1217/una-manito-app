# Estado del MVP frente al reto

Revisión de código y pruebas locales: 8 de noviembre de 2026.
Los cambios de interfaz requieren commit/push y despliegue para aparecer en Vercel.
Este documento no certifica el estado de producción ni sustituye pruebas con cuentas reales.

## Lo implementado

| Requisito del material compartido | Implementación y límite |
|---|---|
| Servicios cercanos y recomendaciones vecinales | Directorio por barrio/oficio, perfil, estrellas/comentarios y Visto Bueno de experiencias completadas. Consultas y coordinación privada; sin garantía de identidad o seguridad. |
| Promover oficios y servicios | Acceso específico Publicar un servicio; revisión antes de publicar. |
| Pedir y ofrecer ayuda solidaria | Formularios independientes, respuestas, aceptación con cupos, participantes, resolución e historial. No hay pagos dentro de la aplicación. |
| Compartir productos | Préstamos, donaciones e intercambios. No hay compraventa ni catálogo de comercios. Confirmar con el mentor si el alcance esperado de «productos» exige también oferta comercial. |
| Coordinar necesidades y recursos en emergencia | Formularios y listados separados, directorio de contactos revisados. Los grupos locales reales deben validarse y cargarse; no se inventan brigadas ni disponibilidad. |
| Avisos de incidentes | Foto privada opcional, revisión humana, publicación por barrio, cierre y corrección. Solo avisos dentro de la app; sin push. El usuario confirmó la asignación de Luis en Supabase. |
| Geolocalización | Ubicación opcional aproximada, distancia/orden por cercanía y enlace de mapa. El barrio es autodeclarado: no acredita residencia física. |
| Tutorial y facilidad de uso | Guía con temas, práctica sin publicar, rutas hacia cada función y lectura opcional según navegador. Menú desplegable, formularios breves y accesos diferenciados. |
| Enfoque móvil y publicación en tres clics | React adaptable y PWA; el recorrido cotidiano Inicio → Revisar → Publicar se verifica en pruebas. Los campos y dictado requieren interacción adicional. No se promete ese mismo número para revisar incidentes. |
| Online y offline | Interfaz/tutorial disponibles sin conexión después de cargar, copia de publicaciones y borradores. Publicar, IA, chats y avisos vigentes requieren conexión. No hay envío automático de publicaciones offline. |
| IA | Prepara pedidos/ofrecimientos/anuncios, interpreta búsquedas y orienta revisión de incidentes. El usuario confirma. No verifica hechos ni inventa proveedores disponibles. |

## Qué falta priorizar

1. **Ensayo real completo en Vercel.** Dos cuentas en el mismo barrio y otra en barrio
   distinto: registro/correo, publicación, conversación, último cupo, cierre, valoración,
   reporte pendiente → aprobación de Luis → aviso/corrección; luego instalar y probar offline.
   Las pruebas automatizadas con dobles del SDK y PGlite no demuestran por sí solas
   la configuración del proyecto Supabase real ni el funcionamiento de Gemini en producción.
2. **Datos y comunidad piloto.** Retirar los ejemplos [DEMO] antes de aceptar actividad
   real; escoger un barrio piloto, validar algunos prestadores y contactos/grupos de apoyo
   con autorización. No atribuir anuncios, reputación o emergencias reales a una cuenta
   solo porque se insertaron mediante SQL. No borrar contenido real con el script de limpieza total.
3. **Pruebas de usabilidad con personas.** Observar sin ayudar a alguien con poca
   experiencia y, si es posible, a una persona mayor o usuaria de lector de pantalla:
   encontrar servicio, pedir/prestar un objeto y volver a Mi actividad. Registrar confusiones
   y corregirlas. El dictado y la lectura dependen del navegador; conservar siempre escritura.
4. **Operación y límites.** Más de un revisor para no dejar reportes propios o ausencias
   sin atención; procedimiento de revisión, denuncia/abuso y retiro de contenido. Revisar
   en producción RLS, retención, respaldo y eliminación de fotos. El endpoint general
   `/api/prepare-publication` todavía necesita autenticación y límite por usuario equivalente
   al endpoint de incidentes. También conviene reducir la carga inicial: el bundle sigue
   superando el umbral de aviso de 500 kB del build y las ilustraciones originales son pesadas.
5. **Entrega y defensa.** Actualizar presentación, capturas, guion y código entregable;
   mostrar evidencia de los tres recorridos centrales y explicar límites del offline,
   reputación, residencia, moderación e IA. No afirmar certificación, verificación de identidad
   ni despliegues/pruebas que no se hayan realizado.

## Mejoras que no bloquean la demostración del MVP

- Push con permiso del usuario, si se decide ampliar avisos fuera de la aplicación.
- Mapa interactivo más completo y verificación de residencia con un procedimiento definido.
- Más barrios, directorios locales verificados y paginación para colas grandes.
- Seguimiento de adopción y tiempos de resolución con consentimiento y datos mínimos.

## Identidad y guía actualizadas

La mano con corazón es el símbolo de Una Manito; Manolito es el acompañante de ayuda,
no un sello de verificación. El acceso, la navegación, el favicon y los iconos instalables
comparten `public/icon.svg`. Para regenerar los PNG, ejecutar `npm run icons:build`.
Se conservaron las ilustraciones originales del equipo y se ajustó su presentación.
La guía contiene ocho pasos con elección de temas, ejercicios, feedback y lectura opcional.
