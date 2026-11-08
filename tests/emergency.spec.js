import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('emergencia: diseño integrado y opciones voluntarias conservan el borrador',async({page},info)=>{
 await page.goto('/');await page.getByRole('button',{name:'Explorar demostración'}).click();await navigateTo(page,'Apoyo en emergencia');
 await page.getByRole('button',{name:'Necesito apoyo',exact:true}).click();
 const text='Necesitamos un espacio de reunión para dos familias después de un siniestro.';
 await page.getByRole('textbox',{name:'¿Qué apoyo necesitas?',exact:true}).fill(text);
 await page.getByText('Elegir tipo de incidente · opcional',{exact:true}).click();
 await page.getByRole('button',{name:/Incendio o siniestro/}).click();
 await expect(page.getByRole('textbox',{name:'¿Qué apoyo necesitas?',exact:true})).toHaveValue(text);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
 await page.screenshot({path:`../una-manito-emergencia-integrada-${info.project.name}.png`,fullPage:true});
 await page.reload();await page.getByRole('button',{name:'Explorar demostración'}).click();await navigateTo(page,'Continuar borrador');
 await expect(page.getByRole('textbox',{name:'¿Qué apoyo necesitas?',exact:true})).toHaveValue(text);
 await expect(page.locator('.emergency-form-heading strong')).toHaveText('Incendio o siniestro');
 await page.getByRole('button',{name:'Revisar apoyo',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Título',exact:true})).toHaveValue('Incendio o siniestro: '+text);
});

test('emergencia: el recorrido básico desde su sección sigue siendo de tres clics',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explorar demostración'}).click();await navigateTo(page,'Apoyo en emergencia');
 await page.evaluate(()=>{window.supportClicks=0;document.addEventListener('click',event=>{if(event.target.closest('button'))window.supportClicks++;},true);});
 await page.getByRole('button',{name:'Tengo recursos',exact:true}).click();
 await page.getByRole('textbox',{name:'¿Qué recurso o apoyo tienes?',exact:true}).fill('Tengo agua y alimentos para compartir con dos familias.');
 await page.getByRole('button',{name:'Revisar apoyo',exact:true}).click();
 await page.getByRole('button',{name:'Publicar recurso',exact:true}).click();
 expect(await page.evaluate(()=>window.supportClicks)).toBe(3);
});

test('emergencia: separar recursos, pedidos y contactos sin mezclar sus acciones', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demostración' }).click();
  const emergency = () => navigateTo(page, 'Apoyo en emergencia');
  await emergency();
  const tabs = page.getByRole('group', { name: 'Explorar apoyo en emergencia' });
  await expect(tabs.getByRole('button', { name: 'Necesidades', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Tengo recursos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Compartir recursos de emergencia', exact: true })).toBeVisible();
  await page.getByRole('textbox',{name:'¿Qué recurso o apoyo tienes?',exact:true}).fill('Tengo botellas de agua para compartir con mis vecinos.');
  await page.getByRole('button', { name: 'Revisar apoyo', exact: true }).click();
  await page.getByLabel('Título', { exact:true }).fill('Agua para compartir en emergencia');
  await page.getByRole('button', { name: 'Publicar recurso', exact: true }).click();
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
  await expect(page.getByRole('heading', { name: 'Solicitar apoyo de emergencia', exact: true })).toBeVisible();
});
