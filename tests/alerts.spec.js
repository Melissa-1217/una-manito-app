import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {navigateTo} from './navigation.js';

async function setup(page,user='ana') {
 await page.addInitScript(user=>{window.alertTestUser=user;window.alertReports=[];window.alertPublic=[];},user);
 await page.route('**/src/lib/publications.js*',route=>route.fulfill({contentType:'text/javascript',body:`export async function listPublications(){return [];} export async function createPublication(){} export async function closePublication(){} export async function changePublicationLifecycle(){}`}));
 await page.route('**/src/lib/supabase.js*',route=>route.fulfill({contentType:'text/javascript',body:`
  const uid=window.alertTestUser;
  const profile={id:uid,nombre:uid==='luis'?'Luis':'Ana',barrio:'Barrio Demo'};
  export function getSupabaseClient(){return {
   auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},async getSession(){return {data:{session:{user:{id:uid},access_token:'test-jwt'}}}}},
   from(table) {
    return {select() {
     return {
      eq(column,id){return {async maybeSingle(){return {data:profile};},async single(){return {data:window.alertReports.find(a=>a.id===id)};}};},
      order(){return {async limit(){return {data:table==='avisos_barrio'?window.alertReports:window.alertPublic};}};}
     };
    }};
   },
   async rpc(name,args){
    window.lastAlertRpc={name,args};
    if(name==='soy_revisor_avisos')return {data:uid==='luis'};
    if(name==='guardar_borrador_aviso'){if(!window.alertReports.some(a=>a.id===args.p_id))window.alertReports.push({id:args.p_id,autor_id:uid,barrio:profile.barrio,titulo:args.p_titulo,descripcion:args.p_descripcion,zona:args.p_zona,categoria:args.p_categoria,observado_en:args.p_observado_en,estado:'borrador',creado_en:new Date().toISOString(),actualizado_en:new Date().toISOString()});return {data:args.p_id};}
    if(name==='enviar_aviso'){const a=window.alertReports.find(a=>a.id===args.p_id);a.estado='pendiente';a.foto_path=args.p_con_foto?a.id+'/foto.jpg':null;return {data:null};}
    if(name==='revisar_aviso'){const a=window.alertReports.find(a=>a.id===args.p_id);a.estado=args.p_accion==='aprobar'?'publicado':'rechazado';if(a.estado==='publicado')window.alertPublic.push({...a,titulo:args.p_titulo,descripcion:args.p_descripcion,zona:args.p_zona,prioridad:args.p_prioridad,foto_path:args.p_incluir_foto?a.foto_path:null,version:1,publicado_en:new Date().toISOString()});return {data:null};}
    return {data:null};
   },
   storage:{from(){return {
    async upload(path,blob,opts){window.lastPhoto={path,type:blob.type,size:blob.size,opts};return {};},
    async download(){return {data:new Blob(['photo'],{type:'image/jpeg'})};}
   };}}
  }}
 `}));
 await page.goto('/');await expect(page.getByText('Cuenta conectada',{exact:true})).toBeVisible();
}
test('reporte con foto opcional: revisar y enviar no publica; diseño móvil accesible',async({page},info)=>{
 await setup(page);await navigateTo(page,'Apoyo en emergencia');await page.getByRole('button',{name:'Avisar al barrio',exact:true}).click();
 await page.getByRole('textbox',{name:'Título del incidente',exact:true}).fill('Árbol caído en el parque');
 await page.getByRole('textbox',{name:'¿Qué ocurrió?',exact:true}).fill('Un árbol está bloqueando el camino por el parque.');
 await page.getByRole('textbox',{name:'Zona de referencia',exact:true}).fill('Parque central, lado norte');
 await page.getByRole('combobox',{name:'Tipo de incidente',exact:true}).selectOption('riesgo_vial');
 const photo=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=10;c.height=10;return c.toDataURL('image/png').split(',')[1];});
 await page.locator('input[type=file]').setInputFiles({name:'foto.png',mimeType:'image/png',buffer:Buffer.from(photo,'base64')});
 await expect(page.getByAltText('Vista previa de tu foto del incidente')).toBeVisible();
 await page.getByRole('button',{name:'Revisar reporte',exact:true}).click();await expect(page.getByRole('heading',{name:'Revisa tu reporte'})).toBeVisible();
 await page.getByRole('checkbox',{name:/Confirmo que/}).check();
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
 await page.getByRole('heading',{name:'Revisa tu reporte',exact:true}).focus();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`../una-manito-aviso-revision-${info.project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Enviar a revisión',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Avisos del barrio'})).toBeVisible();await expect(page.getByText('En revisión',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>window.alertPublic.length)).toBe(0);
 expect(await page.evaluate(()=>window.lastPhoto.type)).toBe('image/jpeg');expect(await page.evaluate(()=>window.lastPhoto.opts.upsert)).toBe(false);
 expect(await page.evaluate(()=>Object.values(localStorage).some(v=>v.includes('Árbol caído')))).toBe(false);
});
test('Luis revisa, edita y aprueba: foto privada por defecto, avisos sin leer y modo offline',async({page},info)=>{
 await setup(page,'luis');
 await page.evaluate(()=>{window.alertReports=[{id:'a0000000-0000-0000-0000-000000000001',autor_id:'ana',barrio:'Barrio Demo',titulo:'Árbol en el parque',descripcion:'Un árbol bloquea el paso en el parque.',zona:'Parque central',categoria:'riesgo_vial',estado:'pendiente',observado_en:new Date().toISOString(),actualizado_en:new Date().toISOString(),foto_path:'a0000000-0000-0000-0000-000000000001/foto.jpg'}];});
 await page.getByRole('button',{name:'Avisos del barrio',exact:true}).first().click();
 await page.getByRole('button',{name:'Revisión (1)',exact:true}).click();
 await expect(page.getByRole('button',{name:'Aprobar y avisar al barrio'})).toBeDisabled();
 await expect(page.getByRole('checkbox',{name:'Incluir la foto en el aviso público'})).not.toBeChecked();
 await page.getByRole('textbox',{name:'Título público',exact:true}).fill('Paso bloqueado en el parque');
 await page.getByRole('checkbox',{name:/Revisé el contenido/}).check();
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
 await page.getByRole('heading',{name:'Avisos del barrio',exact:true}).focus();
 await page.screenshot({path:`../una-manito-revisor-${info.project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Aprobar y avisar al barrio'}).click();
 await page.getByRole('button',{name:'Del barrio',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Paso bloqueado en el parque',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Ver foto adjunta'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Avisos del barrio, 1 sin leer',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Marcar como leídos'}).click();
 await expect(page.getByRole('button',{name:'Avisos del barrio, 1 sin leer',exact:true})).toHaveCount(0);
 await page.context().setOffline(true);await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
 await expect(page.getByText(/Necesitas conexión y una sesión activa/)).toBeVisible();await expect(page.getByRole('heading',{name:'Paso bloqueado en el parque'})).toHaveCount(0);
});
