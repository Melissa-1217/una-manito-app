# Una Manito: resumen para la presentación

**Eslogan:** Entre vecinos, nos damos una manito.

## 1. Qué problema abordamos

Encontrar un servicio cercano, conseguir un objeto prestado o coordinar ayuda requiere
conocer qué vecinos pueden apoyar y cómo contactarlos. Durante una emergencia,
esa coordinación también debe distinguir necesidades, recursos y avisos relevantes.

No presentar cifras de ahorro, adopción o tiempo de respuesta sin haberlas medido.

## 2. Nuestra propuesta

Una aplicación vecinal con enfoque móvil que conecta servicios locales y ayuda solidaria.
«Una manito» toma una expresión familiar en Perú para hacer cercana la idea de colaborar.
La PWA se puede instalar desde un navegador compatible y comparte el mismo proyecto web.

## 3. Las funciones principales

- **Encontrar un servicio:** buscar por oficio o necesidad, revisar perfil y experiencias,
  y consultar al prestador en privado. También hay acceso directo para publicar un servicio.
- **Resolver una necesidad:** pedir u ofrecer ayuda; recibir respuestas, aceptar participantes,
  coordinar y marcar como resuelta. Productos permite préstamo, donación o intercambio.
- **Coordinar apoyo en emergencia:** consultar necesidades, compartir recursos, añadir una
  ubicación aproximada y usar el directorio de apoyo. Los incidentes se reportan por un flujo
  separado con revisión humana antes de aparecer como avisos del barrio.

## 4. El aporte de Manolito y la IA

Manolito acompaña con una guía por temas y ejercicios que no publican nada.
La IA organiza pedidos y ofrecimientos, presenta anuncios de servicios e interpreta
búsquedas para consultar publicaciones existentes. En reportes de incidentes, orienta
la revisión del texto; no verifica la foto, no decide que el hecho es verdadero y no publica.
El vecino revisa y confirma siempre; los formularios manuales siguen disponibles.

## 5. Confianza y coordinación

- Estrellas y comentarios vinculados a experiencias completadas.
- Visto Bueno Vecinal: recomendaciones positivas; no es verificación de identidad.
- Mensajes privados separados de la lista de participantes aceptados.
- Control de cupos para evitar aceptar más participantes de los previstos.
- Reportes pendientes privados; Luis revisa los de otros vecinos de su barrio asignado.
- Ubicación aproximada y recomendaciones para no exponer documentos ni dirección exacta.

Falta reforzar que las recomendaciones correspondan al mismo barrio en la base de datos.
No afirmar que la aplicación garantiza seguridad, identidad o residencia verificada.

## 6. Experiencia móvil y tecnología

React para la interfaz, Supabase para cuentas y datos, Gemini en el servidor y Vercel para
el despliegue. El icono y las ilustraciones son los proporcionados por el equipo.
Los accesos diarios mantienen tres pulsaciones de botones desde Inicio: elegir acción,
revisar y publicar, sin contar escritura ni opciones adicionales. Menú desplegable,
formularios breves, guía, dictado y lectura opcional acompañan el uso.

Sin conexión se puede consultar lo guardado, usar la guía y preparar borradores después
de una primera carga. Publicación, chat, IA y avisos vigentes requieren conexión.

## 7. Qué demostraremos

1. Buscar gasfitería, abrir un perfil y enviar una consulta privada.
2. Publicar «necesito una escalera», responder con otra cuenta, aceptar y resolver;
   luego mostrar dónde se valora la experiencia.
3. Compartir un recurso de emergencia y mostrar un reporte pendiente, su revisión
   por Luis y el aviso aprobado para el mismo barrio.

Usar cuentas y datos de prueba identificados. No emitir una emergencia ficticia al barrio
real para hacer la demostración ni insertar reputación como si fueran opiniones auténticas.

## 8. Estado, evidencia y siguientes pasos

Integración selectiva de la rama `posibles-cambios`: diseño de emergencia e icono,
sin adoptar los menús adicionales que elevaban a cuatro o cinco clics la publicación.
Pruebas locales de esta versión: 92 de interfaz aprobadas y dos omitidas por ser exclusivas
de móvil; 27 de lógica, cinco de SQL aislado y cuatro de PWA aprobadas. Lint y compilación
también pasan. Esto no sustituye el ensayo real con Supabase/Gemini/Vercel configurados.

Pendientes: comunidad piloto y grupos locales revisados, validación con personas mayores
o poco familiarizadas con apps, recomendaciones del mismo barrio, límites de uso para
la IA general, rendimiento y ensayo final. No hay push fuera de la aplicación.

## Propuesta de cierre oral

«Una Manito conecta lo que un vecino necesita con lo que otro puede ofrecer cerca de casa.
Integramos servicios, solidaridad y coordinación de emergencias con una experiencia móvil.
Manolito facilita el uso y la IA ayuda a expresar la necesidad, mientras la decisión queda
en las personas. Nuestro siguiente paso es validar el MVP con una comunidad piloto.»

## Preguntas que conviene ensayar

**¿Cómo saben que alguien es confiable?** Mostramos experiencias y recomendaciones;
no aseguramos identidad ni seguridad. La coordinación sigue siendo una decisión del vecino.

**¿Qué pasa si dos personas responden al mismo tiempo?** Pueden enviar respuestas;
la aceptación de participantes se controla con transacciones y cupos en la base de datos.
Una consulta de servicio no reserva por sí sola una cita o un horario.

**¿La IA puede publicar una emergencia falsa?** No publica. Un reporte se mantiene privado
hasta la revisión humana. La foto tampoco acredita por sí sola autenticidad o fecha.

**¿Funciona sin internet?** Tiene consulta guardada, tutorial y borradores; las operaciones
compartidas requieren conexión. No se presentan avisos antiguos como si fueran vigentes.

**¿Por qué una PWA?** Permite mantener una misma aplicación con enfoque móvil, acceso web
e instalación en navegadores compatibles. No se presenta como aplicación nativa.
