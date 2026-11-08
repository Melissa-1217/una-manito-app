import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

async function installWorker(page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Entra a tu barrio', exact: true })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

test('manifest e iconos válidos, inicio y tutorial disponibles tras recargar sin conexión', async ({ page, context }) => {
  await installWorker(page);
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.map(icon => icon.sizes)).toEqual(['192x192', '512x512']);
  for (const icon of manifest.icons) {
    const response = await page.request.get(icon.src);
    const bytes = await response.body();
    expect(bytes.readUInt32BE(16)).toBe(Number(icon.sizes.split('x')[0]));
  }
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Entra a tu barrio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await page.getByRole('button', { name: 'Cómo usar la app', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hola, soy Manolito' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('dialog img')].every(img => img.complete && img.naturalWidth > 0))).toBe(true);
  const keys = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async name => (await (await caches.open(name)).keys()).map(r => r.url)))).flat());
  expect(keys.some(url => url.includes('/api/') || url.includes('supabase.co'))).toBe(false);
  expect(await page.evaluate(async () => { try { await fetch('/api/prepare-publication'); return false; } catch { return true; } })).toBe(true);
});

test('copia guardada sin mensajes y borrador persistente, sin publicar ni reconectar automáticamente', async ({ page, context }) => {
  await installWorker(page);
  await page.evaluate(() => {
    const profile = { id: 'offline-user', nombre: 'Ana', barrio: 'Barrio Demo' };
    localStorage.setItem('una-manito-offline-profile-v1', JSON.stringify(profile));
    localStorage.setItem('una-manito-offline-v1:support:offline-user:Barrio%20Demo', JSON.stringify({ savedAt:'2026-11-07T12:00:00Z', contacts:[{ id:'policia', nombre:'Policía Nacional guardada', descripcion:'Central policial.', ambito:'nacional', telefono:'105', fuente_url:'https://www.gob.pe/pnp', revisado_en:'2026-11-07' }] }));
    localStorage.setItem('una-manito-offline-v1:publications:offline-user:Barrio%20Demo', JSON.stringify({ savedAt: new Date().toISOString(), publicaciones: [{ id: 'p', autor_id: 'otro', tipo: 'solicitud', titulo: 'Escalera de la copia guardada', descripcion: 'Una publicación pública guardada para consulta.', categoria: 'Herramientas', barrio: 'Barrio Demo', estado: 'pendiente', cupos: 1, primera_respuesta_en: new Date().toISOString() }] }));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Copia de consulta', { exact: true })).toBeVisible();
  await navigateTo(page, 'Apoyo en emergencia');
  await page.getByRole('group', { name:'Explorar apoyo en emergencia' }).getByRole('button', { name:'Directorio de apoyo', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Policía Nacional guardada' })).toBeVisible();
  await expect(page.getByRole('region', { name:'Directorio de apoyo', exact:true }).getByText(/Copia guardada el/)).toBeVisible();
  await navigateTo(page, 'Mi barrio');
  await page.getByRole('button').filter({ has: page.getByRole('heading', { name: 'Escalera de la copia guardada' }) }).click();
  await expect(page.getByRole('button', { name: 'Yo te ayudo', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Tu mensaje', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await page.getByRole('button', { name: 'Pedir una manito', exact: true }).click();

  await page.getByLabel('Título', { exact: true }).fill('Borrador sin conexión');
  await page.getByLabel('Cuéntale un poco más al barrio').fill('Lo revisaré cuando tenga conexión otra vez.');
  await page.getByRole('button', { name: 'Revisar publicación' }).click();
  await expect(page.getByRole('button', { name: 'Publicar solicitud', exact: true })).toBeDisabled();
  await page.reload();
  await navigateTo(page, 'Publicar');
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Borrador sin conexión');
  let writes = 0;
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/rest/v1/publicaciones')) writes++; });
  await context.setOffline(false);
  await expect(page.getByRole('heading', { name: 'Entra a tu barrio', exact: true })).toBeVisible();
  expect(writes).toBe(0);
});

test('la instalación solo se solicita después de pulsar el botón', async ({ page }) => {
  await installWorker(page);
  await page.evaluate(() => {
    window.installCalls = 0;
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { window.installCalls++; };
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(event);
  });
  expect(await page.evaluate(() => window.installCalls)).toBe(0);
  await page.getByRole('button', { name: 'Instalar app', exact: true }).click();
  expect(await page.evaluate(() => window.installCalls)).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByText('Instalar app', { exact: true })).toHaveCount(0);
});

test('una actualización espera confirmación y conserva el borrador manual', async ({ page }) => {
  await installWorker(page);
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await navigateTo(page, 'Publicar');
  await page.getByLabel('Título', { exact: true }).fill('Borrador antes de actualizar');
  const original = await readFile('dist/sw.js', 'utf8');
  try {
    await writeFile('dist/sw.js', original + '\n// PWA update integration test\n');
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); });
    await expect(page.getByRole('button', { name: 'Actualizar app', exact: true })).toBeVisible();
    await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Borrador antes de actualizar');
    await page.getByRole('button', { name: 'Actualizar app', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Entra a tu barrio', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Explorar demostración' }).click();
    await navigateTo(page, 'Publicar');
    await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Borrador antes de actualizar');
  } finally { await writeFile('dist/sw.js', original); }
});
