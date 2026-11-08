# Integración selectiva de posibles-cambios

Rama revisada: `origin/posibles-cambios`, commit `89455df` (cinco commits sobre
`83c2984`, la versión de main al comenzar la revisión). No se fusionó la rama entera.

## Incorporado

- Tonos terracota y cabecera diferenciada para pedidos y recursos de emergencia.
- Tipos de incidente de la propuesta (seguridad, incendio, agua y electricidad),
  como opciones voluntarias dentro del formulario existente. No requieren un menú
  ni una pantalla intermedia para el recorrido básico.
- Organización del mensaje con IA, opcional y sin envío automático ni instrucciones de rescate.
- Conservación del tipo de incidente en el borrador local. Al generar el título
  se incluye el contexto seleccionado; no se crea un filtro de incidentes en la base de datos.
- Icono del cuy con gorra verde también en la cabecera y la marca. Se reutiliza
  el PNG original del equipo que ya genera los iconos de instalación; no se añade
  la copia JPEG de la rama ni se cambia el eslogan. El logo completo original
  de la mano se conserva en la ilustración de acceso.
- Apertura de detalles cuando un campo oculto contiene un valor inválido.

## Se conserva de main

- Los cuatro accesos visibles en Inicio, incluidos Dar una manito y Publicar un servicio.
- Elegir acción → Revisar → Publicar: tres pulsaciones de botones para los recorridos
  cotidianos básicos desde Inicio, sin contar escritura, configuración opcional ni acceso/login.
- Pedidos/recursos de emergencia: elegir la acción en esa sección → Revisar → Publicar.
  Entrar desde otra sección, elegir detalles, ubicación, dictado o IA añade interacciones.
- Productos, servicios, apoyo de emergencia y avisos revisados siguen separados.
- Menú desplegable y perfil actuales, guía accesible, bienvenida sin cierre forzado,
  conversaciones privadas, cupos y permisos existentes.

La propuesta completa de la otra rama pasa sus pruebas, pero sus nuevos tests de
experiencia esperan **4 clics para pedir/ofrecer y 5 para publicar un servicio**.
Ese cambio de navegación no se incorpora porque contradice el recorrido de tres clics
que el usuario pidió conservar. Tampoco se incorpora el cierre automático de la
bienvenida a los cinco segundos, para permitir leerla al propio ritmo.

No se necesitan migraciones nuevas para esta integración visual. Los datos reales,
la revisión humana de avisos y las reglas de publicación mantienen sus flujos anteriores.
