import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function audit(page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
}

test('acceso, registro, inicio y formulario ofrecen nombres y contraste accesibles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Entra a tu barrio', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await audit(page);
  await page.getByRole('button', { name: 'Crear cuenta de vecino' }).click();
  await audit(page);
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await audit(page);
  await page.getByRole('button', { name: 'Pedir una manito', exact: true }).click();

  await audit(page);
});

test('tutorial se maneja por teclado y devuelve el foco al cerrarse', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await page.getByRole('button', { name: 'Cómo usar la app', exact: true }).click();
  await audit(page);
  await expect(page.getByRole('button', { name: 'Cerrar chat' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cómo usar la app', exact: true })).toBeFocused();
});

test('vista estrecha y ampliación conservan formularios y controles', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const width of [390, 800, 1024]) {
    await page.setViewportSize({ width, height:900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width:320, height:800 });
  const sizes = await page.locator('.quick-actions button').evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
  expect(sizes.every(size => size.width >= 44 && size.height >= 44)).toBe(true);
  await page.getByRole('button', { name: 'Pedir una manito', exact: true }).click();

  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  await page.getByLabel('Título', { exact: true }).fill('Una prueba con texto ampliado');
  await page.getByLabel('Cuéntale un poco más al barrio').fill('Puedo completar la publicación con el texto ampliado.');
  await page.getByRole('button', { name: 'Revisar publicación' }).press('Enter');
  await expect(page.getByRole('button', { name: 'Publicar solicitud', exact: true })).toBeVisible();
  await page.evaluate(() => { document.body.style.zoom = '1'; });
  await page.screenshot({ path: `../una-manito-accesibilidad-${testInfo.project.name}.png`, fullPage: true });
});
