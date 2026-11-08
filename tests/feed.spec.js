import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('primera entrada: bienvenida accesible, se cierra y no reaparece al recargar', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(() => { localStorage.setItem('una-manito-welcome-v2','seen'); localStorage.removeItem('una-manito-welcome-v3'); });
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  const dialog = page.getByRole('dialog', { name:'¡Hola, Ana!' });
  await expect(dialog).toBeVisible();
  const viewport = page.viewportSize();
  expect(await dialog.boundingBox()).toEqual({ x: 0, y: 0, ...viewport });
  await expect(page.getByRole('button', { name:'Ver las manitos' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Mantener abierta' }).click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path:`../una-manito-bienvenida-${testInfo.project.name}.png`, fullPage:true });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name:'Publicaciones recientes', exact:true })).toBeVisible();
  await navigateTo(page, 'Ver bienvenida');
  await expect(page.getByRole('dialog', { name:'¡Hola, Ana!' })).toBeVisible();
  await page.getByRole('button', { name:'Cerrar bienvenida', exact:true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name:'Abrir perfil', exact:true })).toBeFocused();
});

test('la bienvenida espera para cerrar y permite mantenerla abierta', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('una-manito-welcome-v3'));
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  const dialog = page.getByRole('dialog', { name: '¡Hola, Ana!' });
  const pause = dialog.getByRole('button', { name: 'Mantener abierta' });
  await pause.click();
  await page.clock.fastForward(20000);
  await expect(dialog).toBeVisible();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await pause.click();
  await page.clock.fastForward(4000);
  await expect(dialog).toHaveAttribute('data-closing', 'false');
  await page.clock.fastForward(800);
  await expect(dialog).toHaveAttribute('data-closing', 'true');
  await page.clock.runFor(350);
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Publicaciones recientes' })).toBeVisible();
});

test('el logo vuelve al inicio y el acceso de emergencia abre las cuatro tarjetas', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  const header = page.getByRole('banner');
  const logo = header.getByRole('button', { name: 'Una Manito, ir al inicio' });
  await expect.poll(() => logo.locator('img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await header.getByRole('button', { name: 'Chat con Manolito', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar chat' }).click();
  await header.getByRole('button', { name: 'Abrir emergencias' }).click();
  await expect(page.getByRole('group', { name: 'Opciones de emergencia' }).getByRole('button')).toHaveCount(4);
  await logo.click();
  await expect(page.getByRole('heading', { name: 'Publicaciones recientes' })).toBeVisible();
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
  await navigateTo(page, 'Buscar un servicio');
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
  await page.evaluate(() => localStorage.removeItem('una-manito-welcome-v3'));
  await page.getByRole('button', { name:'Explorar demostración' }).click();
  await page.getByRole('button', { name:'Ver tutorial', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Hola, soy Manolito', exact:true })).toBeVisible();
});
