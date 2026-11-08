# Limpiar pruebas y cargar ejemplos por cuenta

Scripts manuales, no migraciones. Se prepararon a petición de borrar todo el contenido
y conservar las cuentas; **no se han ejecutado en Supabase desde Codex**.

1. Guarda una copia del contenido que quieras conservar y coordina que nadie publique
   durante la limpieza. La limpieza borra también publicaciones reales y chats anteriores.
2. En **SQL Editor**, ejecuta el archivo completo `supabase/limpiar_contenido.sql`.
   El resultado muestra cuántos registros había y que quedan cero. Mantiene cuentas
   de Auth, perfiles, barrios, permisos de revisor y directorio de apoyo.
   No elimina tablas ni usa `CASCADE`: una dependencia inesperada cancela la transacción.
3. En **Storage → avisos-fotos**, elimina los archivos y carpetas de las pruebas previas
   mediante la interfaz de Storage. Conserva el bucket privado y sus políticas. Borrar
   las filas del reporte no elimina los archivos almacenados; no borres manualmente
   las filas de `storage.objects`.
4. Para un arranque con **contenido real**, deja las tablas vacías y pide a los vecinos
   que publiquen desde sus cuentas. Para una **demostración con ejemplos**, ejecuta
   en otra consulta `supabase/cargar_demo_cuentas.sql`.

## Qué carga cada cuenta existente

Se usa el UUID real y el barrio del perfil, sin inventar cuentas nuevas. Cada perfil
registrado en Auth y con barrio recibe ocho publicaciones con títulos **[DEMO]**:

- Un pedido y un ofrecimiento de ayuda.
- Un servicio ficticio para probar búsquedas y consultas.
- Un préstamo, una donación y un intercambio de productos.
- Un pedido y un recurso de un ejercicio de emergencia claramente identificado.
- Además, un reporte de incidente en estado **borrador privado**.

Los perfiles sin barrio quedan sin contenido: completa su registro desde la app y
ejecuta de nuevo la carga. Los UUID deterministas evitan duplicar ejemplos al repetirla;
el script no actualiza ni renueva ejemplos ya existentes. Las publicaciones nuevas
empiezan pendientes y siguen el ciclo de vencimiento habitual de siete días.

La carga inicial no inventa mensajes, participantes, reseñas, estrellas o vistos buenos.
Para probarlos, usa dos cuentas del **mismo barrio**: una publica o tiene un ejemplo,
la otra responde, la primera acepta y ambas coordinan. Después de resolver la ayuda,
se registra una valoración desde la app. La IA y el tutorial se prueban desde la interfaz;
no se simula un historial de conversación ni una respuesta de Gemini mediante SQL.

No se crean avisos públicos de emergencia. Luis revisa únicamente los reportes que
otros usuarios envíen; su propio borrador necesita otro revisor.

## Después de ejecutar

En cada dispositivo conectado, recarga e inicia sesión con una cuenta real, no con
«Explorar demostración», y pulsa **Actualizar** para sustituir la copia de publicaciones.
Las cuentas de un mismo barrio deben ver las publicaciones de las demás. Cada una
debe ver las suyas en **Mi actividad** y su borrador de aviso en **Mis reportes**.
La demostración local del navegador es independiente de Supabase y conserva sus ejemplos.

Las copias offline de otros dispositivos no se pueden borrar a distancia con este SQL.
Cada usuario debe conectarse y actualizar; cerrar sesión elimina la copia de su cuenta
en ese navegador. Los borradores locales no publicados tampoco son filas de Supabase.

La segunda limpieza, si se necesita retirar toda la demostración, debe hacerse **antes**
de comenzar a recibir publicaciones reales. El script de limpieza siempre borra TODO
el contenido, no solo los ejemplos [DEMO].
