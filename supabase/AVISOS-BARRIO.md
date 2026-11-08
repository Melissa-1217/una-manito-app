# Activar «Avisar al barrio»

Esta función es independiente de los pedidos de apoyo y los recursos de emergencia.
Un reporte no notifica a los vecinos hasta que un revisor humano lo aprueba.

## 1. Base de datos

En el proyecto existente de Supabase, abre **SQL Editor → New query**.
Copia y ejecuta el contenido completo de:

`supabase/migrations/20261112_avisos_barrio.sql`

Crea tablas, permisos RLS, funciones y el bucket **privado** `avisos-fotos`.
Se puede ejecutar nuevamente. No reemplaza ni elimina publicaciones existentes.
No vuelvas a ejecutar migraciones antiguas de aceptación de ofrecimientos.

## 2. Autorizar a Luis

En otra consulta, ejecuta `supabase/configurar_revisor_luis.sql`.
El script comprueba el UUID conocido `3e9bed3f-0ee0-44ae-bba2-9746f292311d`,
el nombre Luis y su barrio actual. Si no coinciden, se detiene: revisa **Table Editor → perfiles**.
No autorices por nombre solamente: puede haber varios Luis.

El resultado debe mostrar a Luis y el barrio asignado. La asignación solo funciona
mientras su perfil tenga ese mismo barrio. Cambiarlo no le concede permisos sobre otro barrio.
Para revocar el acceso, el administrador puede ejecutar:

```sql
delete from public.revisores_avisos
where vecino_id = '3e9bed3f-0ee0-44ae-bba2-9746f292311d';
```

Luis **no puede aprobar sus propios reportes**. Otro revisor autorizado tendría
que revisarlos; de lo contrario permanecen privados. No se otorgan permisos generales
de administrador ni acceso a conversaciones privadas.

## 3. Vercel

Publica los cambios del repositorio con tu flujo habitual de commit/push y espera
el despliegue. Se usan las variables existentes:

- `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`: configuración pública.
- `GEMINI_API_KEY`: secreto exclusivo del servidor, sin prefijo `VITE_`.
- `GEMINI_MODEL`: el modelo disponible que ya utiliza el proyecto.

El endpoint nuevo es `/api/classify-alert`. No necesita `service_role` ni otra
clave privilegiada. Comprueba el JWT con `auth.getUser()` y consulta mediante RLS.
Si la IA falla, la revisión humana sigue funcionando. En desarrollo local reinicia Vite
después de cambiar `.env.local`; no publiques este archivo.

## 4. Probar con dos cuentas reales

1. Ana y Luis deben elegir el mismo barrio. El barrio es el elegido en el perfil;
   esta función **no verifica residencia física**.
2. Ana abre **Apoyo en emergencia → Avisar al barrio**, describe el hecho y zona
   aproximada, elige cuándo lo observó y opcionalmente adjunta una foto.
3. **Revisar reporte → Enviar a revisión**. Ana ve «En revisión». Otro vecino
   no debe verlo en «Del barrio».
4. Luis abre la **campana → Revisión**. Lee el original; puede consultar la IA,
   editar el texto público y decidir si comparte la foto. La foto se excluye por defecto.
5. Luis confirma la revisión de contenido/privacidad y pulsa **Aprobar y avisar al barrio**.
6. En otra cuenta del mismo barrio aparece el aviso y aumenta el contador de la campana.
   Si la app está visible, la consulta se actualiza cada 30 segundos; también hay botón
   **Actualizar avisos**. Una cuenta de otro barrio no debe recibirlo.
7. Prueba **rechazar** con motivo: el original sigue privado. Prueba **finalizar**
   y **retirar** con explicación: el aviso cambia de estado, su versión aumenta y
   vuelve a contar como no leído. Retirar oculta la foto y sustituye el texto por la corrección.
8. Prueba que Luis no pueda revisar un reporte propio. Desconecta internet: los avisos
   requieren conexión y sesión activa; no se presenta una copia offline como vigente.

## Alcance y límites del MVP

- **Avisos dentro de la app**, disponibles para cuentas del mismo barrio. No son
  notificaciones push, SMS ni correos. Con la aplicación cerrada no hay aviso al dispositivo.
- El contenido aprobado se comparte por barrio, no mediante una lista pública de destinatarios.
- El centro muestra los últimos 100 avisos y reportes accesibles. Para mayor volumen
  se deberá añadir paginación y gestión de colas; no es un sistema de despacho de emergencias.
- Texto de IA: categoría sugerida, prioridad de **revisión**, resumen y hasta 3 datos
  por confirmar. No determina si el hecho es real, no aprueba y no envía avisos.
- La imagen **no se envía a Gemini**, ni constituye prueba de autenticidad. El navegador
  la convierte a JPEG de máximo 1600 px, eliminando metadatos EXIF/GPS; el revisor debe
  excluirla si expone personas o datos. Se admite JPG/PNG/WebP original de hasta 5 MB.
- Fotos privadas con descarga autenticada bajo RLS, sin enlaces públicos; no se guardan
  en localStorage ni en el caché del service worker. Una foto ya vista puede ser copiada
  por el destinatario, como cualquier contenido compartido.
- Máximo 5 nuevos reportes por cuenta/hora y 10 intentos de IA por cuenta/hora, controlados
  en PostgreSQL. Los reintentos de un mismo reporte mantienen su UUID.
- Solo se aceptan hechos declarados dentro de los últimos 7 días; no se verifica su fecha
  automáticamente. Los avisos requieren cierre o corrección humana, con fechas visibles.
- Los originales, rechazos y acciones se conservan para trazabilidad; no se borran solos.
  Antes de uso público amplio se debe definir la retención y limpieza de fotos/borradores
  mediante la API de Storage. No eliminar solo filas de `storage.objects`.
- La primera autorización es Luis; para cobertura continua hacen falta más revisores
  y un procedimiento de contraste y respuesta. Una aprobación no equivale a verificación oficial.
- Ante riesgo inmediato se deben usar los servicios de emergencia del directorio.

## Validación local

```powershell
npm test
npm run test:db
npm run test:ui
npm run test:pwa
npm run lint
npm run build
```

Las pruebas SQL usan una base PGlite aislada; las de interfaz usan dobles del SDK.
No crean cuentas ni reportes reales. Después de activar Supabase/Vercel, realiza
también el recorrido de dos cuentas indicado arriba, incluida una consulta real de IA.

Referencias técnicas: [Storage privado y RLS](https://supabase.com/docs/guides/storage/security/access-control),
[validación de usuario en el servidor](https://supabase.com/docs/reference/javascript/auth-getuser).
