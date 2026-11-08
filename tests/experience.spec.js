import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

for (const flow of [
  { action: 'Pedir una manito', heading: 'Pedir una manito', publish: 'Publicar solicitud' },
  { action: 'Dar una manito', heading: 'Dar una manito', publish: 'Publicar ofrecimiento' },
  { action: 'Publicar un servicio', heading: 'Publicar un servicio', publish: 'Publicar servicio' },
]) {
  test(`${flow.action}: publica en tres pulsaciones desde el inicio, sin pasar por el chat`, async ({ page }, testInfo) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explorar demostración' }).click();
    await page.evaluate(() => {
      window.journeyClicks = 0;
      document.addEventListener('click', event => { if (event.target.closest('button')) window.journeyClicks++; }, true);
    });
    await page.getByRole('button', { name: flow.action, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: flow.heading, exact: true })).toBeVisible();
    await expect(page.getByLabel('Título', { exact:true })).toBeHidden();
    await expect(page.getByRole('textbox')).toHaveCount(1);
    const screen = flow.publish.split(' ')[1];
    await page.screenshot({ path:`../una-manito-formulario-${screen}-${testInfo.project.name}.png`, fullPage:false });
    await page.getByLabel(/(?:¿Qué (?:necesitas|servicio brindas)|¿Cómo puedes ayudar)\?/).fill('Una publicación para mi barrio. Estoy describiendo lo que necesito u ofrezco para mañana.');
    await page.getByRole('button', { name: 'Revisar publicación', exact: true }).click();
    await expect(page.getByLabel('Título', { exact:true })).toHaveValue('Una publicación para mi barrio');
    if (flow.publish === 'Publicar solicitud') expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
    await page.screenshot({ path:`../una-manito-revision-${screen}-${testInfo.project.name}.png`, fullPage:false });
    await page.getByRole('button', { name: flow.publish, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Una publicación para mi barrio', exact: true })).toBeVisible();
    expect(await page.evaluate(() => window.journeyClicks)).toBe(3);
  });
}

test('buscar por oficio y limpiar filtros permite recuperar servicios existentes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await expect(page.getByRole('heading', { name: 'Publicaciones del barrio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Buscar un servicio', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const categories = page.getByRole('group', { name: 'Filtrar servicios por oficio' });
  await categories.getByRole('button', { name: 'Electricidad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No encontramos servicios para esta búsqueda' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
  await expect(categories.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Una mano con tus caños', exact: true })).toBeVisible();
});

test('la revisión permite corregir el título y el mensaje y volver sin perderlos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  await page.getByRole('button', { name:'Pedir una manito', exact:true }).click();
  await page.getByLabel(/(?:¿Qué (?:necesitas|servicio brindas)|¿Cómo puedes ayudar)\?/).fill('Necesito dos vecinos para mover una mesa.');
  await page.getByRole('button', { name:'Revisar publicación', exact:true }).click();
  await page.getByLabel('Título', { exact:true }).fill('Apoyo para mover mi mesa');
  await page.getByRole('textbox', { name:'Descripción', exact:true }).fill('Necesito dos vecinos para mover una mesa al patio mañana.');
  await page.getByRole('button', { name:'Volver a editar', exact:true }).click();
  await expect(page.getByLabel(/(?:¿Qué (?:necesitas|servicio brindas)|¿Cómo puedes ayudar)\?/)).toHaveValue('Necesito dos vecinos para mover una mesa al patio mañana.');
  await page.getByRole('button', { name:'Revisar publicación', exact:true }).click();
  await expect(page.getByLabel('Título', { exact:true })).toHaveValue('Apoyo para mover mi mesa');
  await page.getByRole('button', { name:'Publicar solicitud', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Apoyo para mover mi mesa', exact:true })).toBeVisible();
});
