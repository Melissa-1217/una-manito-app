import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('emergencia: separar recursos, pedidos y contactos sin mezclar sus acciones', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await navigateTo(page, 'Apoyo en emergencia');
  const tabs = page.getByRole('group', { name: 'Explorar apoyo en emergencia' });
  await expect(tabs.getByRole('button', { name: 'Necesidades', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Yo ofrezco', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ofrecer una manito', exact: true })).toBeVisible();
  await page.getByRole('textbox',{name:'¿Qué recurso o apoyo tienes?',exact:true}).fill('Tengo botellas de agua para compartir con mis vecinos.');
  await page.getByRole('button', { name: 'Revisar apoyo', exact: true }).click();
  await page.getByLabel('Título', { exact:true }).fill('Agua para compartir en emergencia');
  await page.getByRole('button', { name: 'Publicar recurso', exact: true }).click();
  await navigateTo(page, 'Apoyo en emergencia');
  await expect(page.getByRole('heading', { name: 'Agua para compartir en emergencia', exact: true })).toHaveCount(0);
  await tabs.getByRole('button', { name: 'Recursos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Agua para compartir en emergencia', exact: true })).toBeVisible();
  await tabs.getByRole('button', { name: 'Directorio de apoyo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Agua para compartir en emergencia', exact: true })).toHaveCount(0);
  const directory = page.getByRole('region', { name: 'Directorio de apoyo', exact: true });
  await expect(directory.getByRole('link', { name: 'Llamar al 105' })).toHaveAttribute('href', 'tel:105');
  await expect(directory.getByRole('link', { name: 'Llamar al 116' })).toHaveAttribute('href', 'tel:116');
  await expect(directory.getByText('Contacto revisado:', { exact: false }).first()).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `../una-manito-emergencia-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Ayuda urgente', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pedir una manito', exact: true })).toBeVisible();
});

test('las tarjetas precargan el mensaje y Volver conserva el origen del formulario', async ({ page }) => {
  let aiRequests = 0;
  await page.route('**/api/prepare-publication', route => {
    aiRequests++;
    expect(route.request().postDataJSON()).toEqual({
      tipo: 'solicitud', texto: 'Necesito coordinar apoyo vecinal por una emergencia.',
    });
    return route.fulfill({ json: { propuesta: {
      titulo: 'Apoyo vecinal de emergencia',
      descripcion: 'Necesito coordinar con vecinos por una emergencia.',
      categoria: 'Otros',
    } } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await navigateTo(page, 'Apoyo en emergencia');
  const primary = page.getByRole('group', { name: 'Opciones de emergencia' });
  await expect(primary.getByRole('button')).toHaveCount(4);
  await primary.getByRole('button', { name: 'Préstamo de suministros', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '¿Qué apoyo necesitas?' })).toHaveValue(/suministros prestados/);
  await page.getByRole('button', { name: 'Volver a emergencias', exact: true }).click();
  await primary.getByRole('button', { name: 'Centro de auxilio vecinal', exact: true }).click();
  const incident = page.getByRole('group', { name: 'Tipos de incidente' });
  await expect(incident.getByRole('button')).toHaveCount(4);
  for (const [label, template] of [
    ['Seguridad / Delincuencia', /incidente de seguridad/],
    ['Incendio / Siniestro', /incendio o siniestro/],
    ['Fuga de agua / Colapso', /fuga de agua o un colapso/],
    ['Emergencia eléctrica', /emergencia eléctrica/],
  ]) {
    await incident.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Pedir una manito', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '¿Qué apoyo necesitas?' })).toHaveValue(template);
    await page.getByRole('button', { name: 'Volver a emergencias', exact: true }).click();
    await expect(incident).toBeVisible();
  }
  await expect(page.getByRole('region', { name: 'Directorio de apoyo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Asistente de emergencia', exact: true }).click();
  expect(aiRequests).toBe(0);
  await page.getByRole('button', { name: 'Preparar mi pedido con IA', exact: true }).click();
  await page.getByRole('button', { name: 'Usar propuesta en los campos', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '¿Qué apoyo necesitas?' })).toHaveValue('Necesito coordinar con vecinos por una emergencia.');
  expect(aiRequests).toBe(1);
});
