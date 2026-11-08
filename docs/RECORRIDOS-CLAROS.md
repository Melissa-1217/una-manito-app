# Recorridos separados

| Acceso | Propósito | Formulario / destino |
|---|---|---|
| Pedir una manito | Recibir ayuda cotidiana | Qué necesitas, revisión y publicación |
| Dar una manito | Ofrecer tiempo o habilidades sin cobrar | Cómo puedes ayudar, revisión y publicación |
| Buscar un servicio | Encontrar un oficio | Directorio de servicios cotidianos |
| Publicar un servicio | Presentar un oficio profesional | Descripción del trabajo, revisión y publicación |
| Productos | Compartir objetos en el día a día | Préstamo, donación o intercambio |
| Necesito apoyo | Coordinar necesidades durante una emergencia | Formulario propio de apoyo, categoría y zona |
| Tengo recursos | Coordinar recursos durante una emergencia | Formulario propio de recursos, categoría y zona |

## Listados

- Inicio: solicitudes y ofrecimientos cotidianos de ayuda.
- Servicios: publicaciones de servicios sin la marca de emergencia.
- Productos: objetos con modalidad definida, sin la marca de emergencia.
- Emergencias: necesidades, recursos y servicios marcados para ese contexto.
- Mi actividad e Historial: reúne los registros de la cuenta y sus participaciones. Esta agregación personal es intencional.

No se borran ni se reclasifican registros antiguos. Si una publicación anterior tiene marca de emergencia y modalidad de producto, aparece en recursos de emergencia, no también en Productos. La app no adivina el contexto a partir del texto libre.

Los formularios cotidianos ya no permiten cambiar a emergencia o a otro tipo mediante un selector. Los accesos son explícitos. «Continuar borrador» permite recuperar el último borrador guardado, incluidos los de productos y emergencias.

## Manolito

Su acceso principal es una burbuja flotante en Inicio. Se oculta mientras hay un diálogo abierto, bienvenida o menú, y no se coloca sobre los formularios. Al cerrar el chat devuelve el foco al acceso. El final del feed y los controles de las tarjetas reservan espacio para la burbuja.

## Avisar al barrio

Ya existe un flujo independiente: reporte privado con foto opcional, orientación de IA sobre el texto, revisión humana y avisos por barrio. Luis puede revisar reportes ajenos de su barrio asignado. La foto se excluye de la publicación por defecto. Ver `supabase/AVISOS-BARRIO.md` para activación, permisos y pruebas. Publicar una necesidad o recurso de emergencia no envía avisos masivos ni confirma que exista una alerta oficial. No hay notificaciones push.

La separación de formularios de apoyo reutiliza `tipo`, `es_emergencia` y `producto_modalidad`. Avisos sí requiere la migración `20261112_avisos_barrio.sql`, separada de Productos. La separación de vistas no sustituye las políticas de autorización del servidor.
