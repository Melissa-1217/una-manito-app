import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('menú lateral: navegación desplegable, teclado, foco y espacio libre para publicaciones', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  await expect(page.getByRole('heading', { name:'Publicaciones recientes', exact:true })).toBeVisible();
  await expect(page.getByRole('button', { name:'Pedir una manito', exact:true })).toHaveCount(0);
  const toggle = page.getByRole('button', { name:'Abrir menú', exact:true });
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await toggle.click();
  const menu = page.getByRole('dialog', { name:'Menú', exact:true });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('navigation').getByRole('button')).toHaveText([
    'Publicaciones recientes', 'Pedir una manito', 'Ofrecer una manito',
    'Buscar un servicio', 'Apoyo en emergencia',
  ]);
  await expect(menu.getByRole('button', { name:'Publicaciones recientes', exact:true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name:'Cerrar menú', exact:true })).toBeFocused();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await toggle.click();
  await menu.getByRole('button', { name:'Buscar un servicio', exact:true }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('heading', { name:'Servicios del barrio', exact:true })).toBeVisible();
  await toggle.click();
  await menu.getByRole('button', { name:'Publicaciones recientes', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Publicaciones recientes', exact:true })).toBeVisible();
  await page.getByRole('button', { name:'Abrir perfil', exact:true }).click();
  const profile = page.getByRole('dialog', { name:'Perfil', exact:true });
  await profile.getByRole('button', { name:'Mi actividad', exact:true }).click();
  await expect(profile).toHaveCount(0);
  await expect(page.getByRole('heading', { name:'Mi actividad', exact:true })).toBeVisible();
});

test('menú lateral conserva el borrador y permite cerrar tocando fuera', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  await navigateTo(page, 'Pedir una manito');
  await page.getByText('Añadir detalles', { exact:true }).click();
  await page.getByLabel('Título', { exact:true }).fill('Borrador conservado en el menú');
  await page.getByRole('button', { name:'Abrir menú', exact:true }).click();
  await page.mouse.click(5,200);
  await expect(page.getByRole('dialog', { name:'Menú', exact:true })).toHaveCount(0);
  await expect(page.getByLabel('Título', { exact:true })).toHaveValue('Borrador conservado en el menú');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
