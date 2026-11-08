import AxeBuilder from '@axe-core/playwright';
import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';

for (const flow of [
  { action: 'Pedir una manito', heading: 'Pedir una manito', publish: 'Publicar solicitud' },
  { action: 'Ofrecer una manito', heading: 'Ofrecer una manito', publish: 'Publicar ofrecimiento' },
  { action: 'Publicar un servicio', fromServices: true, heading: 'Publicar un servicio', publish: 'Publicar servicio' },
]) {
  test(`${flow.action}: publica con el formulario progresivo desde el menú`, async ({ page }, testInfo) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explorar demostración' }).click();
    await page.evaluate(() => {
      window.journeyClicks = 0;
      document.addEventListener('click', event => { if (event.target.closest('button')) window.journeyClicks++; }, true);
    });
    if (flow.fromServices) {
      await navigateTo(page, 'Buscar un servicio');
      await page.getByRole('button', { name: flow.action, exact: true }).click();
    } else {
      await navigateTo(page, flow.action);
    }
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
    expect(await page.evaluate(() => window.journeyClicks)).toBe(flow.fromServices ? 5 : 4);
  });
}

test('la revisión abre los detalles si contienen un título inválido', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await navigateTo(page, 'Pedir una manito');
  await page.getByLabel('¿Qué necesitas?', { exact: true }).fill('Necesito una escalera para trabajar mañana.');
  const details = page.getByText('Añadir detalles', { exact: true });
  await details.click();
  const title = page.getByLabel('Título', { exact: true });
  await title.pressSequentially('abc');
  await details.click();
  await expect(title).toBeHidden();
  await page.getByRole('button', { name: 'Revisar publicación', exact: true }).click();
  await expect(title).toBeFocused();
  await title.fill('Necesito una escalera');
  await page.getByRole('button', { name: 'Revisar publicación', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisa tu publicación', exact: true })).toBeVisible();
});

test('buscar por oficio y limpiar filtros permite recuperar servicios existentes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await expect(page.getByRole('heading', { name: 'Publicaciones recientes', exact: true })).toBeVisible();
  await navigateTo(page, 'Buscar un servicio');
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
  await navigateTo(page, 'Pedir una manito');
  await page.getByLabel(/¿Qué (necesitas|puedes compartir|servicio brindas)\?/).fill('Necesito dos vecinos para mover una mesa.');
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
