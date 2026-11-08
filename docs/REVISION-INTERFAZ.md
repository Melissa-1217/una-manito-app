# Revisión de interfaz del MVP

Se revisaron acceso, registro, confirmación de correo, selección y cambio de barrio, inicio, servicios, publicación y revisión, detalle, participantes, actividad e historial, perfil y valoraciones, conversación privada, Manolito, tutorial, dictado y emergencias. Los estados sin conexión y de carga conservan sus avisos.

## Criterios compartidos

- Una jerarquía de títulos, campos legibles y botones con áreas táctiles consistentes.
- Mismos colores, bordes y radios en formularios, tarjetas, avisos y ventanas.
- Textos cortos que indican qué pasó o qué hacer después.
- Privacidad, restricciones de reserva, cupos y estados conservados.
- Sin cambiar las tablas ni los flujos de coordinación del MVP.

Las reglas comunes viven en `src/interface.css`. Las vistas conservan su estructura: un chat, un formulario y el menú usan patrones propios dentro del mismo sistema visual.

## Bienvenida de Manolito

La versión anterior guardaba `una-manito-welcome-v1` como vista. Esa era una posible causa de que no reapareciera.

Esta actualización utiliza `una-manito-welcome-v2`: se abre una vez al entrar al barrio con esta versión y, al cerrarla o abrir el tutorial, queda registrada como vista en ese navegador. No necesita borrar publicaciones, cuentas ni borradores.

Se puede recuperar en cualquier momento desde **Menú → Ver bienvenida** en celular, o **Bienvenida** en la cabecera del escritorio. **Cómo usar la app** sigue abriendo directamente el tutorial.

Estos cambios requieren publicar el nuevo código. En una PWA instalada hay que aceptar **Actualizar app** cuando se ofrezca; mientras se conserve la versión anterior, continuará su comportamiento anterior. No se requieren SQL ni variables de entorno nuevas.

## Comprobación

Las pruebas cubren reapertura de bienvenida, migración desde la marca anterior, teclado y foco, conservación de borradores, navegación, publicación, perfiles y valoraciones, mensajes, estados y copia sin conexión. Se comprobaron anchos de 320, 390, 800 y 1024 píxeles, escritorio y ampliación del texto.

La revisión es local con pruebas automatizadas y capturas; no equivale a verificar la versión que esté publicada en Vercel ni a una certificación de accesibilidad.
