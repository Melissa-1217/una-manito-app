# Directorio de apoyo del MVP

## Activación

En Supabase → SQL Editor → New query, ejecutar el contenido completo de `migrations/20261110_directorio_apoyo.sql`. Requiere la tabla `perfiles` y las migraciones anteriores. La migración es repetible y no borra publicaciones ni contactos editados.

Después, publicar el código con el flujo habitual de GitHub/Vercel. No requiere nuevas variables de entorno. Hasta ejecutar el SQL, las publicaciones siguen funcionando, pero el directorio de cuentas reales informa que no pudo actualizarse. No sustituye ese error por datos de demostración.

## Qué ve el vecino

- Necesidades: solicitudes activas marcadas para emergencia.
- Recursos: ofrecimientos activos marcados para emergencia.
- Directorio: contactos nacionales y grupos revisados de su barrio. Debajo aparecen los servicios vecinales publicados para emergencias, separados de los contactos revisados.
- Cada publicación conserva sus mensajes privados, participantes, cupos y cierre existentes.
- Los teléfonos abren el marcador del dispositivo; la app no realiza llamadas automáticamente.

Se incluyen Policía 105 y Bomberos 116, publicados por la PNP en https://www.gob.pe/institucion/pnp/contacto-y-numeros-de-emergencias. Consulta de la fuente: 7 de noviembre de 2026. La revisión comprueba el contacto publicado; no verifica que la línea responda en ese momento.

## Añadir grupos locales

El equipo administrador utiliza Table Editor → `servicios_apoyo`. Los vecinos no pueden crear, editar ni eliminar registros del directorio desde el cliente.

1. Confirmar el nombre, contacto público y autorización para difundirlo, cobertura y fuente del grupo. No registrar domicilios de vecinos vulnerables.
2. Crear el registro con `ambito = barrio` y `barrio` exactamente igual al valor de los perfiles. Completar nombre, descripción y teléfono o URL HTTPS. Mantener `revisado = false` mientras se comprueba.
3. Completar `fuente_url` HTTPS, `revisado_en` con la fecha real y activar `revisado` y `activo` cuando corresponda.
4. Ante cambios, actualizar la información y fecha; desactivar con `activo = false` si deja de servir. No afirmar capacidad ni disponibilidad en tiempo real.

RLS permite leer solamente registros activos y revisados, nacionales o del barrio del perfil autenticado. Una selección manual de barrio sigue sin ser una verificación de residencia: ese control pertenece a un incremento posterior.

## Sin conexión

Tras consultar el directorio conectado, se guarda una copia pública por cuenta y barrio. No incluye conversaciones ni datos privados de perfiles. Se muestra la fecha de descarga y un aviso de posible desactualización cuando no puede consultarse el servidor. Cerrar la copia/sesión elimina esa caché local. Sin una primera consulta no hay contactos guardados para una cuenta real.

## Límites que continúan pendientes

No incluye despacho de emergencias, disponibilidad en vivo, alertas oficiales, inventario reservado, entrega garantizada ni ubicación exacta de personas vulnerables. Los grupos locales deben incorporarse con datos reales del equipo; no se generan con IA.

Las pruebas SQL se ejecutan en una base aislada con PGlite. No prueban automáticamente la configuración del proyecto Supabase publicado; después de activar la migración, revisar el directorio con una cuenta real.
