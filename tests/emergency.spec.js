import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('emergencia: separar recursos, pedidos y contactos sin mezclar sus acciones', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  const emergency = async () => {
    const button = page.getByRole('button', { name: 'Apoyo en emergencia', exact: true }).filter({ visible: true }).first();
    if (!await button.count()) await navigateTo(page, 'Mi barrio');
    await button.click();
  };
  await emergency();
  const tabs = page.getByRole('group', { name: 'Explorar apoyo en emergencia' });
  await expect(tabs.getByRole('button', { name: 'Necesidades', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Tengo recursos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ofrecer una manito', exact: true })).toBeVisible();
  await page.getByLabel('Título', { exact: true }).fill('Agua para compartir en emergencia');
  await page.getByLabel('Cuéntale un poco más al barrio').fill('Tengo botellas de agua para compartir con mis vecinos.');
  await page.getByRole('button', { name: 'Revisar publicación', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar ofrecimiento', exact: true }).click();
  await emergency();
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
  await page.getByRole('button', { name: 'Necesito apoyo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pedir una manito', exact: true })).toBeVisible();
});
