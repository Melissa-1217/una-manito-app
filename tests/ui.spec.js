import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
});

test('distingue ofrecer ayuda de buscar servicios y filtra publicaciones reales', async ({ page }) => {
  await page.route('**/api/prepare-publication', async (route) => {
    const body = route.request().postDataJSON();
    if (body.tipo === 'ofrecimiento') {
      return route.fulfill({ json: { propuesta: { titulo: 'Presto una escalera', descripcion: 'Ofrezco una escalera en préstamo los sábados.', categoria: 'Herramientas', por_confirmar: [] } } });
    }
    expect(body.tipo).toBe('busqueda');
    return route.fulfill({ json: { propuesta: { interpretacion: 'Buscar un gasfitero para revisar el caño', categoria: 'Gasfitería', terminos: ['gasfitero', 'caño'] } } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await page.getByRole('button', { name: /Dar una manito/ }).click();

  await page.getByLabel(/(?:¿Qué (?:necesitas|servicio brindas)|¿Cómo puedes ayudar)\?/).fill('Presto escalera los sábados');
  await page.getByText('Ayuda con IA', { exact:true }).click();
  await page.getByRole('button', { name: 'Preparar mi ofrecimiento con IA' }).click();
  await page.getByRole('button', { name: 'Usar propuesta en los campos' }).click();
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Presto una escalera');
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await page.getByRole('button', { name: /Buscar un servicio/ }).click();

  await page.getByLabel('Buscar publicaciones').fill('Se rompió un caño');
  await page.getByRole('button', { name: 'Interpretar mi búsqueda con IA' }).click();
  await page.getByRole('button', { name: 'Buscar en los servicios publicados' }).click();
  await expect(page.getByRole('heading', { name: 'Una mano con tus caños' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¿Me prestas una escalera?' })).toHaveCount(0);
});

test('revisa y aplica una propuesta de IA antes de publicar', async ({ page }) => {
  await page.route('**/api/prepare-publication', async (route) => {
    expect(route.request().postDataJSON().texto).toContain('caño');
    await route.fulfill({ json: { propuesta: { titulo: 'Necesito un gasfitero', descripcion: 'Se rompió un caño y necesito un gasfitero cerca.', categoria: 'Gasfitería' } } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await page.getByRole('button', { name: 'Pedir una manito', exact: true }).click();

  await page.getByLabel(/(?:¿Qué (?:necesitas|servicio brindas)|¿Cómo puedes ayudar)\?/).fill('Veci se rompió un caño y necesito un gasfitero cerca.');
  await page.getByText('Ayuda con IA', { exact:true }).click();
  await page.getByRole('button', { name: 'Preparar mi pedido con IA', exact: true }).click();
  await expect(page.getByText('Propuesta para revisar', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Usar propuesta en los campos' }).click();
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('Necesito un gasfitero');
  await page.getByRole('button', { name: 'Revisar publicación' }).click();
  await expect(page.getByRole('button', { name: 'Publicar solicitud' })).toBeVisible();
});

test('publicar, responder con otro vecino, aceptar y resolver', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await expect(page.getByRole('heading', { name: 'Publicaciones del barrio' })).toBeVisible();
  await page.screenshot({ path: `../una-manito-${testInfo.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (testInfo.project.name === 'mobile') await expect(page.getByRole('button', { name: 'Abrir menú', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pedir una manito', exact: true }).click();

  if (!await page.getByLabel('Título', { exact:true }).isVisible()) await page.getByText('Añadir detalles', { exact:true }).click();

  await page.getByLabel('Título', { exact: true }).fill('Necesito un taladro por una hora');
  await page.getByLabel(/(?:¿Qué (?:necesitas|servicio brindas)|¿Cómo puedes ayudar)\?/).fill('Para colocar una repisa esta tarde. Lo devuelvo al terminar.');
  await page.getByRole('button', { name: 'Revisar publicación' }).click();
  await page.getByRole('button', { name: 'Publicar solicitud' }).click();
  await expect(page.getByRole('heading', { name: 'Necesito un taladro por una hora', exact: true })).toBeVisible();
  await page.getByLabel('Cambiar usuario de demostración').selectOption('luis');
  await navigateTo(page, 'Mi barrio');
  await page.getByRole('button').filter({ has: page.getByRole('heading', { name: 'Necesito un taladro por una hora' }) }).click();
  await page.getByLabel('Tu mensaje').fill('Tengo uno. Te lo presto esta tarde.');
  await page.getByRole('button', { name: 'Yo te ayudo', exact: true }).click();
  await expect(page.getByText('Respuesta enviada. Continúa en Mi actividad.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Marcar como resuelta' })).toHaveCount(0);
  await page.getByLabel('Cambiar usuario de demostración').selectOption('ana');
  await navigateTo(page, 'Mi actividad');
  await page.getByRole('button').filter({ has: page.getByRole('heading', { name: 'Necesito un taladro por una hora' }) }).click();
  await page.getByRole('button', { name: 'Aceptar ayuda' }).click();
  await expect(page.getByText('En coordinación', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como resuelta' }).click();
  await expect(page.getByText('Publicación resuelta.', { exact:true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  await navigateTo(page, 'Mi actividad');
  await page.getByRole('button', { name: 'Historial', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Necesito un taladro por una hora' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Manolito conserva el borrador al corregirlo y publica con confirmación', async ({ page }) => {
  await page.route('**/api/prepare-publication', async route => {
    const body = route.request().postDataJSON();
    const correction = body.texto === 'mejor mañana';
    if (correction) expect(body.contexto.anterior.descripcion).toContain('hoy');
    await route.fulfill({ json: { propuesta: {
      titulo: 'Busco una escalera', descripcion: 'Necesito una escalera ' + (correction ? 'mañana' : 'hoy'),
      categoria: 'Herramientas', por_confirmar: [],
    } } });
  });
  await page.getByRole('button', {name:'Chat con Manolito',exact:true}).click();
  await page.getByRole('dialog').getByRole('button', {name:'Pedir una manito',exact:true}).click();
  await page.getByLabel('Mensaje para Manolito').fill('Necesito una escalera hoy');
  await page.getByLabel('Enviar mensaje').click();
  await expect(page.getByLabel('Descripción del borrador')).toHaveValue(/hoy/);
  await page.getByLabel('Mensaje para Manolito').fill('mejor mañana');
  await page.getByLabel('Enviar mensaje').click();
  await expect(page.getByLabel('Descripción del borrador')).toHaveValue(/mañana/);
  await page.getByRole('button',{name:'Confirmar y publicar'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Busco una escalera',exact:true})).toBeVisible();
});

test('ubicación opcional se redondea y permite abrir el mapa', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -12.076456, longitude: -77.086456, accuracy: 10 });
  await page.route('https://www.openstreetmap.org/**', route => route.fulfill({ contentType:'text/html',body:'<p>Mapa de prueba</p>' }));
  await page.getByRole('button',{name:'Pedir una manito',exact:true}).click();
  if (!await page.getByLabel('Título', { exact:true }).isVisible()) await page.getByText('Añadir detalles', { exact:true }).click();
  await page.getByLabel('Título',{exact:true}).fill('Prueba de zona aproximada');
  await page.getByLabel(/(?:¿Qué (?:necesitas|servicio brindas)|¿Cómo puedes ayudar)\?/).fill('Necesito una herramienta para esta tarde.');
  await page.getByRole('button',{name:'Añadir ubicación aproximada'}).click();
  await expect(page.getByText('Ubicación aproximada añadida.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Revisar publicación'}).click();
  await page.getByRole('button',{name:'Publicar solicitud',exact:true}).click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('una-manito-demo-v1')).publicaciones[0]);
  expect(stored.latitud).toBe(-12.076);
  expect(stored.longitud).toBe(-77.086);
  await page.getByRole('button',{name:'Ver ubicación aproximada en el mapa'}).click();
  await expect(page.getByTitle('Mapa de la ubicación aproximada')).toHaveAttribute('src',/marker=-12.076%2C-77.086/);
});
