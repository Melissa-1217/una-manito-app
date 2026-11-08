import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('menú móvil: navegación desplegable, teclado, foco y espacio libre para publicaciones', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'El escritorio conserva su navegación lateral.');
  await page.goto('/');
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  await expect(page.locator('.mobile-nav')).toHaveCount(0);
  const toggle = page.getByRole('button', { name:'Abrir menú', exact:true });
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await toggle.click();
  const menu = page.getByRole('dialog', { name:'Menú', exact:true });
  await expect(menu).toBeVisible();
  await expect(page.getByRole('button', { name:'Cerrar menú', exact:true })).toBeFocused();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path:'../una-manito-menu-mobile.png', fullPage:false });
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await toggle.click();
  await menu.getByRole('button', { name:'Buscar servicios', exact:true }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('heading', { name:'Servicios del barrio', exact:true })).toBeVisible();
  await toggle.click();
  await menu.getByRole('button', { name:'Mi barrio', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Publicaciones del barrio', exact:true })).toBeVisible();
  await page.screenshot({ path:'../una-manito-inicio-menu-mobile.png', fullPage:true });
  await toggle.click();
  await menu.getByRole('button', { name:'Cómo usar la app', exact:true }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('heading', { name:'Hola, soy Manolito', exact:true })).toBeVisible();
});

test('menú móvil conserva el borrador y permite cerrar tocando fuera', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'El escritorio conserva su navegación lateral.');
  await page.goto('/');
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  await page.getByRole('button', { name:'Pedir una manito', exact:true }).click();
  if (!await page.getByLabel('Título', { exact:true }).isVisible()) await page.getByText('Añadir detalles', { exact:true }).click();
  await page.getByLabel('Título', { exact:true }).fill('Borrador conservado en el menú');
  await page.getByRole('button', { name:'Abrir menú', exact:true }).click();
  await page.mouse.click(5,200);
  await expect(page.getByRole('dialog', { name:'Menú', exact:true })).toHaveCount(0);
  await expect(page.getByLabel('Título', { exact:true })).toHaveValue('Borrador conservado en el menú');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
