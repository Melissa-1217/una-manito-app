import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { navigateTo } from './navigation.js';

test('mi perfil reúne identidad y actividad de la cuenta elegida sin inventar reputación', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  await navigateTo(page,'Mi perfil');
  const profile = page.getByRole('region', { name:'Mi perfil vecinal' });
  await expect(profile.getByRole('heading', { name:'Mi perfil', exact:true })).toBeVisible();
  await expect(profile.getByRole('heading', { name:'Ana', exact:true })).toBeVisible();
  await expect(profile.getByText('Demostración', { exact:true })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path:`../una-manito-mi-perfil-${testInfo.project.name}.png`, fullPage:false });
  await page.getByLabel('Cambiar usuario de demostración').selectOption('luis');
  await expect(profile.getByRole('heading', { name:'Luis', exact:true })).toBeVisible();
  await expect(profile.getByRole('heading', { name:'Ana', exact:true })).toHaveCount(0);
  await profile.getByRole('button', { name:'Ver mi actividad', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Mi actividad', exact:true })).toBeVisible();
});

test('la publicación de la demo abre el perfil de su autora', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await page.getByRole('heading', { name: '¿Me prestas una escalera?' }).click();
  await page.getByRole('button', { name: 'Ver perfil de Ana', exact: true }).click();
  const profile = page.getByRole('dialog', { name: 'Perfil vecinal' });
  await expect(profile.getByRole('heading', { name: 'Ana', exact: true })).toBeVisible();
  await expect(profile.getByText(/Barrio Demo/)).toBeVisible();
  await profile.getByRole('button', { name: 'Cerrar perfil' }).click();
  await expect(page.getByRole('heading', { name: '¿Me prestas una escalera?' })).toBeVisible();
});
