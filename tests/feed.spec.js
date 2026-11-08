import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('primera entrada: bienvenida accesible, se cierra y no reaparece al recargar', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(() => { localStorage.setItem('una-manito-welcome-v1','seen'); localStorage.removeItem('una-manito-welcome-v2'); });
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  const dialog = page.getByRole('dialog', { name:'¡Hola, Ana!' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name:'Ver las manitos' })).toBeFocused();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path:`../una-manito-bienvenida-${testInfo.project.name}.png`, fullPage:true });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  const selector = page.getByLabel('Cambiar usuario de demostración');
  await selector.selectOption('luis');
  await page.reload();
  await expect(selector).toHaveValue('luis');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name:'Publicaciones del barrio', exact:true })).toBeVisible();
  await navigateTo(page, 'Ver bienvenida');
  await expect(page.getByRole('dialog', { name:'¡Hola, Luis!' })).toBeVisible();
  await page.getByRole('button', { name:'Cerrar bienvenida', exact:true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByText('Opciones demo', { exact: true }).click();
  await page.getByRole('button', { name: 'Volver al acceso' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Entra a tu barrio' })).toBeVisible();
});

test('inicio compacto: publicaciones visibles sin desplazarse y filtros independientes de servicios', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  const first = page.locator('.publication-list .publication-card').first();
  await expect(first).toBeVisible();
  const firstTitle = first.getByRole('heading');
  const titleBox = await firstTitle.boundingBox();
  await page.screenshot({ path:`../una-manito-inicio-simple-${testInfo.project.name}.png`, fullPage:true });
  expect(titleBox.y + titleBox.height).toBeLessThan(testInfo.project.use.viewport.height - 90);
  const filters = page.getByRole('group', { name:'Filtrar publicaciones del barrio' });
  await filters.getByRole('button', { name:'Necesitan ayuda', exact:true }).click();
  await expect(page.getByRole('heading', { name:'¿Me prestas una escalera?', exact:true })).toBeVisible();
  await expect(page.getByRole('heading', { name:'Una mano con tus caños', exact:true })).toHaveCount(0);
  await filters.getByRole('button', { name:'Ofrecen ayuda', exact:true }).click();
  await expect(page.getByRole('heading', { name:'¿Me prestas una escalera?', exact:true })).toHaveCount(0);
  await page.getByRole('button', { name:'Buscar un servicio', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Una mano con tus caños', exact:true })).toBeVisible();
  await expect(page.locator('.service-list .card-art')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('carga real: muestra progreso, avisa después de cinco segundos y retira el indicador al recibir datos', async ({ page }) => {
  await page.clock.install();
  await page.route('**/src/components/AuthFlow.jsx*', route => route.fulfill({ contentType:'text/javascript', body:`
    import React from '/node_modules/.vite/deps/react.js';
    import App from '/src/App.jsx';
    const account={id:'ana',nombre:'Ana',barrio:'Barrio Demo'};
    export default function(){return React.createElement(App,{account})}
  ` }));
  await page.route('**/src/lib/publications.js*', route => route.fulfill({ contentType:'text/javascript', body:`
    const pending=[];
    window.finishPublicationLoad=()=>pending.forEach(resolve=>resolve([{id:'test-load',autor_id:'ana',tipo:'solicitud',titulo:'Pedido recibido del servidor',descripcion:'Necesito una escalera para mañana.',categoria:'Herramientas',barrio:'Barrio Demo',estado:'pendiente',ofrecimientos:[]}]));
    export function listPublications(){return new Promise(resolve=>pending.push(resolve))}
    export async function createPublication(){}
    export async function closePublication(){}
    export async function changePublicationLifecycle(){}
  ` }));
  await page.goto('/');
  await expect(page.getByText('Cargando publicaciones…', { exact:true })).toBeVisible();
  await expect(page.getByRole('heading', { name:'Tu barrio empieza con una manito', exact:true })).toHaveCount(0);
  await page.clock.fastForward(5100);
  await expect(page.getByText('Está tardando un poco. Seguimos buscando las publicaciones de tu barrio…', { exact:true })).toBeVisible();
  await page.evaluate(() => window.finishPublicationLoad());
  await expect(page.getByRole('heading', { name:'Pedido recibido del servidor', exact:true })).toBeVisible();
  await expect(page.locator('.publication-loading')).toHaveCount(0);
});

test('primera entrada permite abrir directamente el tutorial de Manolito', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('una-manito-welcome-v2'));
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  await page.getByRole('button', { name:'Ver tutorial', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Hola, soy Manolito', exact:true })).toBeVisible();
});
