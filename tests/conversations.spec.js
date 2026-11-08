import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const post = { id: 'p', autor_id: 'ana', tipo: 'solicitud', titulo: 'Necesito una escalera para mañana', descripcion: 'Quisiera coordinar el préstamo de una escalera.', categoria: 'Herramientas', barrio: 'Barrio Demo', estado: 'pendiente', cupos: 1 };
const offer = { id: 'o', publicacion_id: 'p', vecino_id: 'luis', mensaje: 'Te presto mi escalera.', estado: 'pendiente', perfiles: { nombre: 'Luis' } };

test('dos vecinos conversan, el borrador queda en memoria y el cierre conserva el historial', async ({ page }, testInfo) => {
  await page.addInitScript(({ post, offer }) => localStorage.setItem('una-manito-demo-v1', JSON.stringify({ publicaciones: [post], ofrecimientos: [offer] })), { post, offer });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  const open = () => page.getByRole('button').filter({ has: page.getByRole('heading', { name: post.titulo, exact: true }) }).click();
  await open();
  await page.getByRole('button', { name: 'Conversar con Luis', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(offer.mensaje, { exact: true })).toBeVisible();
  await page.getByLabel('Mensaje privado', { exact: true }).fill('¿Puedes traerla a las cinco?');
  await page.getByRole('button', { name: 'Cerrar conversación' }).click();
  await expect(page.getByRole('button', { name: 'Conversar con Luis', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Conversar con Luis', exact: true }).click();
  await expect(page.getByLabel('Mensaje privado', { exact: true })).toHaveValue('¿Puedes traerla a las cinco?');
  await page.getByRole('button', { name: 'Enviar mensaje privado', exact: true }).click();
  await expect(dialog.getByText('¿Puedes traerla a las cinco?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar conversación' }).click();
  await page.getByLabel('Cambiar usuario de demostración').selectOption('luis');
  await open();
  await page.getByRole('button', { name: 'Conversar con Ana', exact: true }).click();
  await expect(dialog.getByText('¿Puedes traerla a las cinco?', { exact: true })).toBeVisible();
  await page.getByLabel('Mensaje privado', { exact: true }).fill('Sí, llego a las cinco.');
  await page.getByRole('button', { name: 'Enviar mensaje privado', exact: true }).click();
  await expect(dialog.getByText('Sí, llego a las cinco.', { exact: true })).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(result.violations.map(v => v.id)).toEqual([]);
  await dialog.getByRole('button', { name: 'Cerrar conversación' }).focus();
  await page.screenshot({ path: `../una-manito-conversacion-${testInfo.project.name}.png` });
  await page.getByRole('button', { name: 'Cerrar conversación' }).click();
  await page.getByLabel('Cambiar usuario de demostración').selectOption('ana');
  await open();
  await page.getByRole('button', { name: 'Aceptar ayuda', exact: true }).click();
  await page.getByRole('button', { name: 'Marcar como resuelta', exact: true }).click();
  await page.getByRole('button', { name: 'Conversar con Luis', exact: true }).click();
  await expect(dialog.getByText('Sí, llego a las cinco.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar mensaje privado', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Mensaje privado', { exact: true })).toHaveAttribute('readonly', '');
});

test('mensajes remotos: páginas anteriores, actualización y reintento sin duplicar', async ({ page }) => {
  await page.route('**/src/lib/supabase.js*', route => route.fulfill({ contentType: 'text/javascript', body: `
    export function getSupabaseClient(){return {auth:{
      onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
      async getSession(){return {data:{session:{user:{id:'ana'}}}}}
    },from(){return {select(){return {eq(){return {async maybeSingle(){return {data:{id:'ana',nombre:'Ana',barrio:'Barrio Demo'}}}}}}}}}}}
  ` }));
  await page.route('**/src/lib/publications.js*', route => route.fulfill({ contentType: 'text/javascript', body: `
    export async function listPublications(){return [${JSON.stringify({ ...post, perfiles: { nombre: 'Ana' }, ofrecimientos: [offer] })}]}
    export async function createPublication(){} export async function closePublication(){} export async function changePublicationLifecycle(){}
  ` }));
  await page.route('**/src/lib/messages.js*', route => route.fulfill({ contentType: 'text/javascript', body: `
    export const MESSAGE_PAGE_SIZE=50;
    window.messageRows=Array.from({length:51},(_,i)=>({id:'m'+(i+1),orden:i+1,ofrecimiento_id:'o',autor_id:'luis',contenido:'Mensaje anterior '+(i+1),creado_en:new Date().toISOString()}));
    window.sentIds=[];let first=true;
    export async function listMessages(id,{before,after}={}){
      const rows=window.messageRows.filter(m=>m.ofrecimiento_id===id && (before===undefined||m.orden<before) && (after===undefined||m.orden>after));
      return structuredClone(after!==undefined?rows.slice(0,50):rows.slice(-50));
    }
    export async function sendPrivateMessage(id,text,key){
      window.sentIds.push(key);let row=window.messageRows.find(m=>m.id===key);
      if(!row){row={id:key,orden:52,ofrecimiento_id:id,autor_id:'ana',contenido:text,creado_en:new Date().toISOString()};window.messageRows.push(row)}
      if(first){first=false;throw new Error('Lost response')}
      return structuredClone(row);
    }
  ` }));
  await page.goto('/');
  await page.getByRole('button').filter({ has: page.getByRole('heading', { name: post.titulo, exact: true }) }).click();
  await page.getByRole('button', { name: 'Conversar con Luis', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Mensaje anterior 51', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Mensaje anterior 1', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver mensajes anteriores' }).click();
  await expect(dialog.getByText('Mensaje anterior 1', { exact: true })).toBeVisible();
  await page.getByLabel('Mensaje privado', { exact: true }).fill('Reintento seguro.');
  await page.getByRole('button', { name: 'Enviar mensaje privado', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('No se confirmó el envío');
  await expect(page.getByLabel('Mensaje privado', { exact: true })).toHaveValue('Reintento seguro.');
  await page.getByRole('button', { name: 'Enviar mensaje privado', exact: true }).click();
  await expect(page.getByLabel('Mensaje privado', { exact: true })).toHaveValue('');
  await expect(dialog.getByText('Reintento seguro.', { exact: true })).toHaveCount(1);
  const ids = await page.evaluate(() => window.sentIds);
  expect(ids).toHaveLength(2); expect(ids[0]).toBe(ids[1]);
  await page.evaluate(() => window.messageRows.push({ id:'new',orden:53,ofrecimiento_id:'o',autor_id:'luis',contenido:'Ya estoy llegando.',creado_en:new Date().toISOString() }));
  await page.getByRole('button', { name: 'Actualizar mensajes', exact: true }).click();
  await expect(dialog.getByText('Ya estoy llegando.', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Reintento seguro.', { exact: true })).toHaveCount(1);
  const cached = await page.evaluate(() => Object.keys(localStorage).filter(key=>key.startsWith('una-manito-offline-v1:publications')).map(key=>localStorage.getItem(key)).join(''));
  expect(cached).not.toContain('Reintento seguro');
  await page.getByLabel('Mensaje privado', { exact: true }).fill('Un borrador privado sin enviar.');
  await page.context().setOffline(true);
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar mensaje privado', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Mensaje privado', { exact: true })).toHaveValue('Un borrador privado sin enviar.');
  const stored = await page.evaluate(() => Object.keys(localStorage).map(key => localStorage.getItem(key)).join(''));
  expect(stored).not.toContain('Un borrador privado sin enviar.');
  await page.context().setOffline(false);
  await expect(page.getByLabel('Mensaje privado', { exact: true })).toHaveValue('Un borrador privado sin enviar.');
  expect(await page.evaluate(() => window.sentIds.length)).toBe(2);
});
