# Productos del barrio

## Activar en Supabase

Ejecutar `migrations/20261111_productos_vecinales.sql` en SQL Editor después de las migraciones anteriores y antes de probar productos con cuentas reales. Luego publicar el código con el flujo habitual de GitHub/Vercel. No necesita variables de entorno nuevas.

La migración añade únicamente `publicaciones.producto_modalidad`: `prestamo`, `donacion` o `intercambio`. Los productos siguen siendo ofrecimientos y utilizan los cupos, mensajes privados, aceptación, cierre e historial existentes. Las publicaciones anteriores conservan su tipo y datos; no se reclasifican por palabras clave.

## Recorrido

1. Menú → Productos → Compartir producto.
2. Elegir modalidad y escribir qué se comparte. El resto continúa en Añadir detalles.
3. Revisar y publicar. Otro vecino pulsa Me interesa y envía su mensaje privado.
4. El autor acepta la solicitud; ambos coordinan entrega y devolución cuando corresponde.
5. Marcar como resuelta al terminar. La publicación sale de los productos activos y queda en Historial.

Los filtros distinguen préstamos, donaciones e intercambios. La cercanía utiliza ubicación aproximada cuando existe; no se inventan distancias. Sin conexión se consulta la copia guardada y se prepara un borrador, sin publicar automáticamente.

No incluye ventas, pagos, entregas garantizadas, fechas automáticas de devolución ni inventario de unidades. Los cupos son personas aceptadas. En un intercambio, las condiciones se acuerdan por privado; aceptar una solicitud no ejecuta un canje automáticamente.

## Compatibilidad

Si falta la nueva columna, la app conserva la consulta y publicación de pedidos, ayudas y servicios anteriores. No permite guardar un producto perdiendo su modalidad: informa que el equipo debe activar la función y conserva el borrador. Los errores de red o de permisos no se tratan como una base antigua.

## Directorio local

El equipo no ha definido un barrio concreto. Se usa Barrio Demo para pruebas y se mantienen los contactos nacionales revisados. Los grupos locales siguen pendientes de una zona y fuentes públicas verificables; no se han añadido instituciones ni contactos ficticios.

La selección de barrio continúa siendo declarada. Este incremento no sustituye la revisión pendiente de autorización por barrio en el servidor ni las pruebas finales del proyecto Supabase publicado.
