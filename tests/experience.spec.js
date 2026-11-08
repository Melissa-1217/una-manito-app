import { test, expect } from '@playwright/test';

for (const flow of [
  { action: 'Pedir una manito', heading: 'Pedir una manito', publish: 'Publicar solicitud' },
  { action: 'Ofrece una manito', heading: 'Ofrecer una manito', publish: 'Publicar ofrecimiento' },
  { action: 'Publicar mi servicio', heading: 'Publicar un servicio', publish: 'Publicar servicio' },
]) {
  test(`${flow.action}: publica en tres pulsaciones desde el inicio, sin pasar por el chat`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explorar demostración' }).click();
    await page.evaluate(() => {
      window.journeyClicks = 0;
      document.addEventListener('click', event => { if (event.target.closest('button')) window.journeyClicks++; }, true);
    });
    await page.getByRole('button', { name: flow.action, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: flow.heading, exact: true })).toBeVisible();
    await page.getByLabel('Título', { exact: true }).fill('Una publicación para mi barrio');
    await page.getByLabel('Cuéntale un poco más al barrio').fill('Estoy describiendo lo que necesito u ofrezco para mañana.');
    await page.getByRole('button', { name: 'Revisar publicación', exact: true }).click();
    await page.getByRole('button', { name: flow.publish, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Una publicación para mi barrio', exact: true })).toBeVisible();
    expect(await page.evaluate(() => window.journeyClicks)).toBe(3);
  });
}

test('buscar por oficio y limpiar filtros permite recuperar servicios existentes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await expect(page.getByText('Entre vecinos, nos damos una manito.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Busca un servicio', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const categories = page.getByRole('group', { name: 'Filtrar servicios por oficio' });
  await categories.getByRole('button', { name: 'Electricidad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No encontramos servicios para esta búsqueda' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
  await expect(categories.getByRole('button', { name: 'Todos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Una mano con tus caños', exact: true })).toBeVisible();
});
