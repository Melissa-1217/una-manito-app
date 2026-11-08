import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { navigateTo } from './navigation.js';

test('producto: publicar, filtrar, solicitar, aceptar y cerrar como ofrecimiento solidario',async({page},testInfo)=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Explorar demostración'}).click();
  await navigateTo(page,'Productos');
  await page.getByRole('button',{name:'Compartir producto',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Compartir un producto',exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Modalidad',exact:true}).selectOption('prestamo');
  await page.getByLabel('¿Qué producto compartes?',{exact:true}).fill('Presto mi taladro mañana. Coordinemos la entrega y la devolución.');
  await page.getByRole('button',{name:'Revisar publicación',exact:true}).click();
  await expect(page.locator('.composer-preview .badge').filter({hasText:'Préstamo'})).toBeVisible();
  await page.getByRole('button',{name:'Publicar producto',exact:true}).click();
  const product=await page.evaluate(()=>JSON.parse(localStorage.getItem('una-manito-demo-v1')).publicaciones[0]);
  expect(product.producto_modalidad).toBe('prestamo');expect(product.tipo).toBe('ofrecimiento');
  await navigateTo(page,'Productos');
  const filters=page.getByRole('group',{name:'Filtrar productos'});
  await filters.getByRole('button',{name:'Donaciones',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No encontramos productos',exact:true})).toBeVisible();
  await filters.getByRole('button',{name:'Préstamos',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Presto mi taladro mañana',exact:true})).toBeVisible();
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({path:`../una-manito-productos-${testInfo.project.name}.png`,fullPage:false});
  await page.getByLabel('Cambiar usuario de demostración').selectOption('luis');
  await page.getByRole('button').filter({has:page.getByRole('heading',{name:'Presto mi taladro mañana',exact:true})}).click();
  await page.getByLabel('Tu mensaje',{exact:true}).fill('Me interesa el taladro para colgar una repisa.');
  await page.getByRole('button',{name:'Me interesa',exact:true}).click();
  await page.getByLabel('Cambiar usuario de demostración').selectOption('ana');
  await navigateTo(page,'Mi actividad');
  await page.getByRole('button').filter({has:page.getByRole('heading',{name:'Presto mi taladro mañana',exact:true})}).click();
  await page.getByRole('button',{name:'Aceptar solicitud',exact:true}).click();
  await expect(page.getByText('En coordinación',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Marcar como resuelta',exact:true}).click();
  await navigateTo(page,'Productos');
  await expect(page.getByRole('heading',{name:'Presto mi taladro mañana',exact:true})).toHaveCount(0);
});

for(const mode of ['donacion','intercambio'])test(`producto ${mode}: conserva modalidad al revisar, editar y recargar`,async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Explorar demostración'}).click();await navigateTo(page,'Productos');
  await page.getByRole('button',{name:'Compartir producto',exact:true}).click();
  await page.getByRole('combobox',{name:'Modalidad',exact:true}).selectOption(mode);
  await page.getByLabel('¿Qué producto compartes?',{exact:true}).fill('Comparto libros en buen estado para vecinos de mi barrio.');
  await page.getByRole('button',{name:'Revisar publicación',exact:true}).click();
  await page.getByRole('button',{name:'Volver a editar',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Modalidad',exact:true})).toHaveValue(mode);
  await page.reload();await page.getByRole('button',{name:'Explorar demostración'}).click();await navigateTo(page,'Publicar');
  await expect(page.getByRole('combobox',{name:'Modalidad',exact:true})).toHaveValue(mode);
  await page.getByRole('button',{name:'Revisar publicación',exact:true}).click();await page.getByRole('button',{name:'Publicar producto',exact:true}).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('una-manito-demo-v1')).publicaciones[0].producto_modalidad)).toBe(mode);
});

test('antes de aplicar SQL: mantiene servicios anteriores y no pierde la modalidad del producto',async({page})=>{
  await page.route('**/src/components/AuthFlow.jsx*',route=>route.fulfill({contentType:'text/javascript',body:`import React from '/node_modules/.vite/deps/react.js';import App from '/src/App.jsx';const account={id:'ana',nombre:'Ana',barrio:'Barrio Demo'};export default function(){return React.createElement(App,{account})}`}));
  await page.route('**/src/lib/supabase.js*',route=>route.fulfill({contentType:'text/javascript',body:`
    window.selectedFields=[];window.productInserts=[];
    export function getSupabaseClient(){return {
      async rpc(name){return name==='vencer_publicaciones'?{error:null}:{data:[],error:null}},
      from(){return {
        select(fields){window.selectedFields.push(fields);return {async order(){return fields.includes('producto_modalidad')?{error:{code:'42703',message:'column publicaciones.producto_modalidad does not exist'}}:{data:[{id:'old',autor_id:'luis',tipo:'servicio',titulo:'Servicio anterior conservado',descripcion:'Un servicio que existía antes de la nueva migración.',categoria:'Otros',barrio:'Barrio Demo',estado:'pendiente',perfiles:{nombre:'Luis'},ofrecimientos:[]}],error:null}}}},
        insert(row){window.productInserts.push(row);return {select(){return {async single(){return row.producto_modalidad?{error:{code:'PGRST204',message:'Could not find producto_modalidad column'}}:{data:{...row,id:'new',estado:'pendiente',ofrecimientos:[]},error:null}}}}}}
      }}
    }}
  `}));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Servicio anterior conservado',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.selectedFields.some(fields=>fields.includes('producto_modalidad')) && window.selectedFields.some(fields=>!fields.includes('producto_modalidad')))).toBe(true);
  await navigateTo(page,'Productos');await page.getByRole('button',{name:'Compartir producto',exact:true}).click();
  await page.getByLabel('¿Qué producto compartes?',{exact:true}).fill('Presto una escalera para mis vecinos mañana.');
  await page.getByRole('button',{name:'Revisar publicación',exact:true}).click();await page.getByRole('button',{name:'Publicar producto',exact:true}).click();
  await expect(page.getByText('Productos aún no está habilitado. El equipo debe activar esta función. Tu borrador se conserva.',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.productInserts[0].producto_modalidad)).toBe('prestamo');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('una-manito-offline-v1:draft:ana:Barrio%20Demo')).producto_modalidad)).toBe('prestamo');
  await navigateTo(page,'Mi barrio');await page.getByRole('button',{name:'Publicar mi servicio',exact:true}).click();
  await page.getByLabel('¿Qué servicio brindas?',{exact:true}).fill('Reparo caños cerca de casa. Consulta para coordinar atención.');
  await page.getByRole('button',{name:'Revisar publicación',exact:true}).click();await page.getByRole('button',{name:'Publicar servicio',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Reparo caños cerca de casa',exact:true})).toBeVisible();
});
