import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { navigateTo } from './navigation.js';

test('inicio de publicaciones y burbuja de Manolito con foco restaurado',async({page},testInfo)=>{
  await page.goto('/');await page.getByRole('button',{name:'Explorar demostración'}).click();
  await expect(page.getByRole('heading',{name:'Publicaciones recientes',exact:true})).toBeVisible();
  const bubble=page.getByRole('button',{name:'Chat con Manolito',exact:true});
  await expect(bubble).toBeVisible();
  expect(await bubble.evaluate(node=>getComputedStyle(node).position)).toBe('fixed');
  await page.screenshot({path:`../una-manito-inicio-intenciones-${testInfo.project.name}.png`,fullPage:false});
  await bubble.click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Cerrar chat',exact:true}).click();await expect(bubble).toBeFocused();
  await navigateTo(page,'Ofrecer una manito');
  await expect(page.getByRole('heading',{name:'Ofrecer una manito',exact:true})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'¿Cómo puedes ayudar?',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Chat con Manolito',exact:true})).toHaveCount(0);
  await navigateTo(page,'Buscar un servicio');
  await page.getByRole('button',{name:'Publicar un servicio',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Publicar un servicio',exact:true})).toBeVisible();
  await navigateTo(page,'Buscar un servicio');
  await expect(page.getByRole('heading',{name:'Servicios del barrio',exact:true})).toBeVisible();
});

test('emergencias, productos y manitos no mezclan sus listados',async({page})=>{
  await page.addInitScript(()=>{
    const base={autor_id:'luis',descripcion:'Publicación de prueba para separar los recorridos.',categoria:'Otros',barrio:'Barrio Demo',estado:'pendiente',cupos:1};
    localStorage.setItem('una-manito-demo-v1',JSON.stringify({publicaciones:[
      {...base,id:'daily-help',tipo:'ofrecimiento',titulo:'Acompaño en compras',es_emergencia:false},
      {...base,id:'daily-product',tipo:'ofrecimiento',titulo:'Taladro del día a día',producto_modalidad:'prestamo',es_emergencia:false},
      {...base,id:'urgent-product',tipo:'ofrecimiento',titulo:'Agua durante la emergencia',producto_modalidad:'donacion',es_emergencia:true},
      {...base,id:'service',tipo:'servicio',titulo:'Gasfitería cotidiana',es_emergencia:false},
      {...base,id:'emergency-service',tipo:'servicio',titulo:'Traslados de apoyo',es_emergencia:true},
    ],ofrecimientos:[]}));
  });
  await page.goto('/');await page.getByRole('button',{name:'Explorar demostración'}).click();
  await expect(page.getByRole('heading',{name:'Acompaño en compras',exact:true})).toBeVisible();
  for(const name of ['Taladro del día a día','Agua durante la emergencia','Gasfitería cotidiana','Traslados de apoyo']) await expect(page.getByRole('heading',{name,exact:true})).toHaveCount(0);
  await navigateTo(page,'Productos');await expect(page.getByRole('heading',{name:'Taladro del día a día',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Agua durante la emergencia',exact:true})).toHaveCount(0);
  await navigateTo(page,'Buscar un servicio');await expect(page.getByRole('heading',{name:'Gasfitería cotidiana',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Traslados de apoyo',exact:true})).toHaveCount(0);
  await navigateTo(page,'Apoyo en emergencia');
  await page.getByRole('group',{name:'Explorar apoyo en emergencia'}).getByRole('button',{name:'Recursos',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Agua durante la emergencia',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Taladro del día a día',exact:true})).toHaveCount(0);
  await page.getByRole('group',{name:'Explorar apoyo en emergencia'}).getByRole('button',{name:'Directorio de apoyo',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Traslados de apoyo',exact:true})).toBeVisible();
});

for(const flow of [
  {action:'Ayuda urgente',heading:'Pedir una manito',question:'¿Qué apoyo necesitas?',type:'solicitud',publish:'Publicar pedido de apoyo'},
  {action:'Yo ofrezco',heading:'Ofrecer una manito',question:'¿Qué recurso o apoyo tienes?',type:'ofrecimiento',publish:'Publicar recurso'},
])test(`${flow.action}: formulario propio, revisión y contexto de emergencia`,async({page},testInfo)=>{
  await page.goto('/');await page.getByRole('button',{name:'Explorar demostración'}).click();await navigateTo(page,'Apoyo en emergencia');
  await page.getByRole('button',{name:flow.action,exact:true}).click();
  await expect(page.getByRole('heading',{name:flow.heading,exact:true})).toBeVisible();
  await expect(page.getByText('Ayuda con IA',{exact:true})).toBeVisible();
  await expect(page.getByText('Añadir detalles',{exact:true})).toHaveCount(0);
  await page.getByRole('textbox',{name:flow.question,exact:true}).fill('Agua para familias del barrio durante esta emergencia. Coordinemos por privado.');
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await page.screenshot({path:`../una-manito-formulario-emergencia-${flow.type}-${testInfo.project.name}.png`,fullPage:false});
  await page.getByRole('button',{name:'Revisar apoyo',exact:true}).click();await page.getByRole('button',{name:flow.publish,exact:true}).click();
  const post=await page.evaluate(()=>JSON.parse(localStorage.getItem('una-manito-demo-v1')).publicaciones[0]);
  expect(post.es_emergencia).toBe(true);expect(post.producto_modalidad).toBe(null);expect(post.tipo).toBe(flow.type);
  await navigateTo(page,'Productos');await expect(page.getByRole('heading',{name:post.titulo,exact:true})).toHaveCount(0);
  await navigateTo(page,'Publicaciones recientes');await expect(page.getByRole('heading',{name:post.titulo,exact:true})).toHaveCount(0);
});
