# Una Manito: fundamentación, propuesta de valor y referencias ISO

Revisión del 8 de noviembre de 2026. Este documento relaciona decisiones del MVP
con las descripciones públicas de las normas. El alcance permite defender prácticas
concretas. Una declaración de conformidad integral requiere una evaluación adicional.

## La propuesta que podemos defender

Una Manito conecta necesidades y capacidades cercanas mediante tres recorridos.
Un vecino encuentra un oficio y consulta sus referencias. Otro consigue ayuda o un
objeto compartido. Durante una emergencia, la comunidad coordina recursos y reporta
incidentes que pasan por revisión humana antes de aparecer como avisos.

El nombre recoge una expresión familiar en Perú. El eslogan, «Entre vecinos, nos damos
una manito», conecta esa identidad con la colaboración que realiza la aplicación.
Manolito acompaña la navegación y explica cómo usar las funciones.

El beneficio esperado es facilitar el acceso a recursos cercanos, aprovechar objetos
y habilidades disponibles y reducir compras o desplazamientos que puedan evitarse.
El piloto debe medir ahorro, distancias y tiempos antes de presentar cifras de impacto.

### Apertura propuesta para Melissa

«Ana necesita una escalera para colocar una repisa. Luis vive en su barrio y tiene
una que puede prestar. Una Manito permite que esa necesidad encuentre una respuesta
cercana. La misma comunidad puede encontrar un oficio recomendado y coordinar apoyo
cuando ocurre una emergencia. Creamos una experiencia móvil que lleva al vecino
desde su necesidad hasta una coordinación concreta.»

## Función, beneficio y evidencia

| Decisión del producto | Beneficio esperado | Qué mostrar al jurado |
|---|---|---|
| Directorio por barrio y oficio | Facilitar encontrar un prestador próximo | Buscar gasfitería, abrir perfil y consultar |
| Préstamos, donaciones e intercambios | Aprovechar recursos disponibles y evitar compras puntuales | Solicitar una herramienta y coordinar su devolución |
| Pedidos y ofrecimientos con estados | Dar seguimiento a una necesidad | Publicar, responder, aceptar y resolver |
| Cupos y aceptación transaccional | Evitar aceptar más participantes que los previstos | Probar dos respuestas para el último cupo |
| Estrellas, comentario y Visto Bueno | Aportar referencias de experiencias anteriores | Mostrar una valoración vinculada a una interacción completada |
| Mensajes privados | Facilitar coordinación con acceso restringido | Entrar con autor, participante y una tercera cuenta |
| Necesidades y recursos de emergencia | Coordinar apoyo disponible | Mostrar ambos listados y sus estados |
| Reporte y revisión humana | Controlar qué contenido se comparte como aviso | Enviar pendiente, revisar con Luis y publicar |
| Manolito e IA | Ayudar a expresar una necesidad y encontrar el oficio pertinente | Convertir un texto breve en borrador editable |
| PWA y copia offline | Facilitar acceso móvil y consulta de información guardada | Instalar, desconectar y consultar la copia o preparar un borrador |

## Referencias normativas y alcance real

### ISO/IEC 25010:2023, calidad del producto

La norma ofrece un modelo de calidad para especificar, medir y evaluar productos
de software y TIC. Nuestra relación con ella es un mapeo de decisiones verificables.

- Adecuación funcional. Los casos de servicios, solidaridad y emergencia responden
  a los recorridos del reto. Se prueban mediante acciones completas.
- Fiabilidad e integridad de operaciones. Se comprueban reintentos de mensajes,
  transiciones de estados y aceptación con cupos.
- Seguridad. Existen controles de acceso a conversaciones, reportes y fotos.
- Capacidad de interacción. Se verifican nombres de controles, teclado y recorridos móviles.
- Mantenibilidad. La separación en componentes, módulos y migraciones facilita cambios.

Faltan métricas de carga, disponibilidad y rendimiento de producción. La compilación
todavía advierte un bundle superior a 500 kB. Las pruebas locales aportan evidencia
para algunos aspectos del modelo, con alcance limitado a los casos evaluados.

Fuente oficial: https://www.iso.org/standard/78176.html

### ISO 9241-210:2019, diseño centrado en las personas

La norma aborda principios y actividades de diseño centrado en las personas durante
el ciclo de vida. El proyecto ha iterado la interfaz a partir de observaciones del
mentor y del equipo, reduciendo texto y diferenciando acciones. También incorpora
una guía, entradas por voz y acceso móvil.

Para completar la fundamentación del proceso hacen falta pruebas con vecinos reales,
incluidas personas con poca experiencia digital, registro de sus dificultades y nuevas
iteraciones a partir de esos resultados. Las observaciones del equipo y del mentor
constituyen evidencia parcial del proceso.

Fuente oficial: https://www.iso.org/standard/77520.html

### ISO 9241-11:2018, usabilidad

Esta referencia permite plantear la evaluación de efectividad, eficiencia y satisfacción
en un contexto de uso definido. Podemos medir si los participantes completan una tarea,
el tiempo y las ayudas que requieren, los errores y la comodidad percibida.

Los tres clics son una condición del reto y del recorrido básico implementado. Su número
por sí solo no demuestra satisfacción o efectividad. Se cuentan desde Inicio para pedir,
ofrecer o publicar un servicio, incluyendo elegir acción, revisar y confirmar. La escritura,
la autenticación y las opciones adicionales requieren sus propias interacciones.

Fuente oficial: https://www.iso.org/standard/63500.html

### ISO/IEC 40500:2025 y WCAG 2.2, accesibilidad

WCAG 2.2 fue aprobada como ISO/IEC 40500:2025. Las pruebas del proyecto utilizan
axe con etiquetas WCAG A y AA, además de comprobaciones de teclado, foco,
diálogos y adaptación a pantallas estrechas.

Para declarar conformidad AA hay que evaluar todos los criterios aplicables en páginas
y procesos completos, combinando comprobaciones automáticas y evaluación humana.
Se necesitan también pruebas con tecnologías de asistencia. Dictado y lectura son
apoyos adicionales cuya disponibilidad depende del navegador.

Fuentes oficiales:
- https://www.w3.org/news/2025/web-content-accessibility-guidelines-wcag-2-2-approved-as-iso-iec-international-standard/
- https://www.w3.org/WAI/WCAG22/Understanding/conformance

### ISO/IEC 27001:2022, gestión de seguridad de la información

La norma establece requisitos para un sistema de gestión de seguridad de la información.
El MVP implementa controles técnicos relacionados con confidencialidad e integridad,
como acceso autenticado, RLS, fotos privadas, claves de IA en el servidor y control de cupos.

La conformidad requiere además un sistema de gestión con alcance, evaluación de riesgos,
responsables, procesos, seguimiento y evaluación. El equipo todavía debe documentar ese
trabajo y evaluar los requisitos aplicables. Tampoco se dispone de certificación del proyecto.
Faltan, entre otros puntos técnicos, autenticación y límites por usuario en el endpoint
general de IA y una política operativa de retención y eliminación de archivos.

Fuente oficial: https://www.iso.org/standard/27001

## Texto para una diapositiva de calidad

«Relacionamos las decisiones del MVP con ISO/IEC 25010:2023 para calidad del software,
ISO 9241-210:2019 e ISO 9241-11:2018 para diseño y usabilidad, y WCAG 2.2,
adoptada como ISO/IEC 40500:2025, para accesibilidad. Presentamos evidencia de los
aspectos evaluados y tenemos pendientes de validación con usuarios y en producción.»

Conviene presentar tres filas visuales con la referencia, una decisión y su evidencia.
La seguridad puede explicarse con los controles implementados y el alcance de la
evaluación pendiente frente a ISO/IEC 27001.

## Demostración y reparto de la exposición

- Melissa presenta la necesidad, la propuesta de valor, servicios y confianza vecinal.
  Relaciona cada función con un beneficio que pueda verse en la demostración.
- Geordan muestra el caso de la escalera y el recorrido de tres clics. Describe lo que
  hace cada vecino, desde la publicación hasta la resolución.
- Wilian explica emergencias, IA, calidad y los límites técnicos. Cierra con el piloto
  propuesto y cómo se evaluaría su resultado.

### Cierre propuesto para Wilian

«Tenemos un MVP que permite encontrar servicios, compartir recursos y coordinar ayuda
entre vecinos. La IA facilita expresar la necesidad y el vecino conserva la decisión.
La revisión humana controla los avisos compartidos. El siguiente paso es un piloto
para medir tareas completadas, ayudas resueltas y la experiencia de uso.»

## Cómo responder preguntas

**Confianza.** Las referencias provienen de experiencias registradas. La identidad,
residencia y seguridad personal todavía requieren mecanismos y validación adicionales.
Debe reforzarse en la base de datos la condición de recomendaciones del mismo barrio.

**Ahorro.** El préstamo de un objeto y la cercanía ofrecen una vía para evitar una compra
o un traslado. La cuantificación del ahorro queda pendiente del piloto.

**IA.** Se demuestra con un texto que el asistente organiza y el usuario corrige.
En búsquedas se utilizan anuncios existentes. En incidentes aporta orientación textual
para la revisión humana. Cada tipo de intervención tiene una confirmación explícita.

**Concurrencia.** Varios vecinos pueden responder. La aceptación utiliza transacciones
y cupos. Las consultas de servicio requieren acordar disponibilidad con el prestador.

**Emergencias.** El sistema permite coordinación vecinal y avisos revisados. Hay contactos
del directorio para solicitar respuesta especializada. Los avisos se consultan dentro
de la aplicación. El despliegue operativo necesita grupos locales y cobertura de revisión.

**Offline.** Después de cargar la aplicación se puede usar la guía, consultar una copia
y preparar borradores. Las operaciones compartidas requieren recuperar la conexión.

**Escalabilidad.** La estructura permite ampliar funcionalidades. La capacidad concurrente,
los tiempos bajo carga y los costes deben medirse antes de afirmar cifras.

## Evidencia y plan de validación

La versión integrada registró 92 pruebas de interfaz aprobadas, 27 de lógica, cinco
de SQL aislado y cuatro de PWA. Los resultados corresponden a esas pruebas locales.

Para el piloto proponemos registrar la proporción de tareas completadas sin ayuda,
el tiempo para publicar y encontrar un servicio, las necesidades que se resuelven,
los fallos de coordinación y una valoración breve de comodidad. Los resultados deben
informar cuántas personas participaron y en qué condiciones realizaron las tareas.

Las fichas públicas de ISO fundamentan el alcance de las referencias citadas. El mapeo
de funciones con esas referencias es una interpretación técnica del proyecto y requiere
evidencia adicional para una declaración formal de conformidad.
