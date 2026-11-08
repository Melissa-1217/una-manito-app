import { test, expect } from '@playwright/test';

async function enterDemo(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
}

test('tutorial interactivo se puede omitir, completar y volver a abrir desde el chat', async ({ page }, testInfo) => {
  let aiCalls = 0;
  page.on('request', request => { if (request.url().includes('/api/prepare-publication')) aiCalls++; });
  await enterDemo(page);
  await page.getByRole('button', { name: 'Cómo usar la app', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hola, soy Manolito' })).toBeVisible();
  await page.getByRole('button', { name: 'Omitir tutorial' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cómo usar la app', exact: true }).click();
  await expect(page.getByText('Paso 1 de 5')).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Ofrecer ayuda', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  await expect(page.getByRole('region', { name: 'Tutorial con Manolito' }).getByRole('status')).toContainText('Probemos otra opción');
  await page.getByRole('region', { name: 'Tutorial con Manolito' }).getByRole('button', { name: 'Pedir una manito', exact: true }).click();
  await page.screenshot({ path: `../una-manito-tutorial-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Anterior' }).click();
  await expect(page.getByRole('region', { name: 'Tutorial con Manolito' }).getByRole('button', { name: 'Pedir una manito', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Ofrecer ayuda', exact: true }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Gasfitería', exact: true }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByRole('heading', { name: 'Tú tienes la última palabra' })).toBeVisible();
  await page.getByRole('button', { name: 'Terminar tutorial' }).click();
  await page.getByRole('button', { name: 'Chat con Manolito', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cómo usar la app', exact: true }).click();
  await expect(page.getByText('Paso 1 de 5')).toBeVisible();
  expect(aiCalls).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

async function mockVoice(page) {
  await page.addInitScript(() => {
    window.voiceInstances = [];
    window.SpeechRecognition = class {
      constructor() { window.voiceInstances.push(this); }
      start() { this.started = true; this.onstart?.(); }
      stop() { this.onend?.(); }
      abort() { this.aborted = true; this.onend?.(); }
    };
  });
}

test('dictado se revisa y añade sin enviar; cerrar el chat detiene el micrófono', async ({ page }) => {
  await mockVoice(page);
  let aiCalls = 0;
  await page.route('**/api/prepare-publication', async route => {
    aiCalls++;
    expect(route.request().postDataJSON().texto).toBe('Necesito una escalera mañana');
    await route.fulfill({ json: { propuesta: { titulo: 'Necesito una escalera', descripcion: 'Necesito una escalera mañana.', categoria: 'Herramientas', por_confirmar: [] } } });
  });
  await enterDemo(page);
  await page.getByRole('button', { name: 'Chat con Manolito', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Pedir una manito', exact: true }).click();
  await page.getByLabel('Mensaje para Manolito').fill('Necesito');
  await page.getByRole('button', { name: 'Dictar por voz', exact: true }).click();
  await expect(page.getByLabel('Enviar mensaje')).toBeDisabled();
  await page.evaluate(() => window.voiceInstances.at(-1).onresult({ results: [[{ transcript: 'una escalera hoy' }]] }));
  await page.getByRole('button', { name: 'Detener dictado' }).click();
  await page.getByLabel('Revisa el dictado').fill('una escalera mañana');
  await expect(page.getByLabel('Mensaje para Manolito')).toHaveValue('Necesito');
  await page.getByRole('button', { name: 'Usar este texto' }).click();
  await expect(page.getByLabel('Mensaje para Manolito')).toHaveValue('Necesito una escalera mañana');
  expect(aiCalls).toBe(0);
  expect(await page.evaluate(() => window.voiceInstances[0].lang)).toBe('es-PE');
  await page.getByLabel('Enviar mensaje').click();
  await expect(page.getByLabel('Título del borrador')).toBeVisible();
  expect(aiCalls).toBe(1);
  await page.getByRole('button', { name: 'Dictar por voz', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar chat' }).click();
  expect(await page.evaluate(() => window.voiceInstances.at(-1).aborted)).toBe(true);
  expect(aiCalls).toBe(1);
});

test('denegar voz mantiene la escritura manual y no borra el mensaje', async ({ page }) => {
  await mockVoice(page);
  await enterDemo(page);
  await page.getByRole('button', { name: 'Chat con Manolito', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Pedir una manito', exact: true }).click();
  await page.getByLabel('Mensaje para Manolito').fill('Mi texto original');
  await page.getByRole('button', { name: 'Dictar por voz', exact: true }).click();
  await page.evaluate(() => window.voiceInstances.at(-1).onerror({ error: 'not-allowed' }));
  await expect(page.getByRole('alert')).toContainText('No se permitió usar el micrófono');
  await expect(page.getByLabel('Mensaje para Manolito')).toBeEnabled();
  await expect(page.getByLabel('Mensaje para Manolito')).toHaveValue('Mi texto original');
});

test('un navegador sin servicio de voz permite escribir', async ({ page }) => {
  await page.addInitScript(() => { window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; });
  await enterDemo(page);
  await page.getByRole('button', { name: 'Chat con Manolito', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Pedir una manito', exact: true }).click();
  await expect(page.getByText('Este navegador no admite dictado por voz. Puedes escribir.', { exact: true })).toBeVisible();
  await page.getByLabel('Mensaje para Manolito').fill('Necesito ayuda');
  await expect(page.getByLabel('Enviar mensaje')).toBeEnabled();
});
