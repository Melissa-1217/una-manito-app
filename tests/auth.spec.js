import { navigateTo } from './navigation.js';
import { test, expect } from '@playwright/test';

test('registro y acceso conservan el diseño móvil', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Entra a tu barrio', exact: true })).toBeVisible();
  await page.screenshot({ path: `../una-manito-acceso-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Crear cuenta de vecino' }).click();
  await expect(page.getByRole('heading', { name: 'Únete a tu comunidad' })).toBeVisible();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('minlength', '8');
  await page.getByLabel('Contraseña', { exact: true }).fill('prueba123');
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('cuenta sin perfil elige barrio, persiste y cierra sesión', async ({ page }) => {
  await page.route('**/src/lib/publications.js*', route => route.fulfill({ contentType: 'text/javascript', body: `
    export async function listPublications(){return [
      {id:'old-post',autor_id:'test-uid',tipo:'solicitud',titulo:'Escalera en mi barrio anterior',descripcion:'Necesito una escalera para esta tarde.',categoria:'Herramientas',barrio:'San Miguel · Media Luna',estado:'pendiente',ofrecimientos:[]},
      {id:'new-post',autor_id:'another-user',tipo:'solicitud',titulo:'Ayuda del barrio elegido',descripcion:'Necesito ayuda para mover algunas cajas.',categoria:'Herramientas',barrio:'Barrio Demo',estado:'pendiente',ofrecimientos:[]}
    ]}
    export async function createPublication(){}
    export async function changePublicationLifecycle(){}
    export async function closePublication(){}
  ` }));
  // Dobles del SDK para verificar pantallas y transiciones sin crear cuentas reales.
  await page.route('**/src/lib/supabase.js', async (route) => {
    await route.fulfill({ contentType: 'text/javascript', body: `
      let listener;
      let savedProfile = null;
      const session={user:{id:'test-uid',user_metadata:{nombre:'María'}}};
      export function getSupabaseClient(){ return {
        auth:{
          onAuthStateChange(callback){listener=callback;return {data:{subscription:{unsubscribe(){}}}}},
          async getSession(){return {data:{session:null}}},
          async signInWithPassword(){listener('SIGNED_IN',session);return {data:{session}}},
          async signOut(){listener('SIGNED_OUT',null);return {error:null}},
        },
        from(table){
          if(table==='publicaciones') return {select(){return {async order(){return {data:[],error:null}}}}};
          if(table!=='perfiles') throw new Error('Unexpected table');
          return {
            select(){return {then(resolve){return Promise.resolve({data:[{barrio:'Barrio Demo'},{barrio:'San Miguel · Media Luna'}],error:null}).then(resolve)},eq(){return {async maybeSingle(){return {data:savedProfile,error:null}}}}}},
            insert(profile){return {select(){return {async single(){savedProfile=profile;window.savedTestProfile=profile;return {data:profile,error:null}}}}}},
            update(values){return {eq(column,id){window.updatedProfileId=id;return {select(){return {async single(){if(window.failNeighborhoodSave)return {error:{code:'42501'}};savedProfile={...savedProfile,...values};window.savedTestProfile=savedProfile;return {data:savedProfile,error:null}}}}}}}}
          }
        }
      }}
    ` });
  });
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('maria@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('prueba123');
  await page.getByRole('button', { name: 'Entrar a mi barrio', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Elige tu barrio' })).toBeVisible();
  await page.getByLabel('Barrio o sector').selectOption('San Miguel · Media Luna');
  await page.screenshot({ path: '../una-manito-elegir-barrio.png', fullPage: true });
  await page.getByRole('button', { name: 'Entrar a mi barrio', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¡Hola, María!' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver las manitos' }).click();
  await expect(page.getByRole('region', { name: 'Tutorial con Manolito' })).toBeVisible();
  await page.getByRole('button', { name: 'Omitir tutorial' }).click();
  expect(await page.evaluate(() => localStorage.getItem('una-manito-tutorial-v1-test-uid'))).toBe('seen');
  await expect(page.getByText('Cuenta conectada', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Cambiar usuario de demostración')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Escalera en mi barrio anterior' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ayuda del barrio elegido' })).toHaveCount(0);
  expect(await page.evaluate(() => window.savedTestProfile)).toEqual({ id: 'test-uid', nombre: 'María', barrio: 'San Miguel · Media Luna' });
  await page.getByRole('button', { name: 'Cambiar barrio', exact: true }).click();
  await expect(page.getByLabel('Barrio o sector')).toHaveValue('San Miguel · Media Luna');
  await page.getByLabel('Barrio o sector').selectOption('Barrio Demo');
  await page.evaluate(() => { window.failNeighborhoodSave = true; });
  await page.getByRole('button', { name: 'Guardar barrio' }).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos guardar tu perfil');
  expect(await page.evaluate(() => window.savedTestProfile.barrio)).toBe('San Miguel · Media Luna');
  await page.evaluate(() => { window.failNeighborhoodSave = false; });
  await page.getByRole('button', { name: 'Guardar barrio' }).click();
  await expect(page.getByText('Cuenta conectada', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.updatedProfileId)).toBe('test-uid');
  expect(await page.evaluate(() => window.savedTestProfile.barrio)).toBe('Barrio Demo');
  await expect(page.getByRole('heading', { name: 'Ayuda del barrio elegido' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Escalera en mi barrio anterior' })).toHaveCount(0);
  await navigateTo(page, 'Mi actividad');
  await expect(page.getByRole('heading', { name: 'Escalera en mi barrio anterior' })).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar barrio', exact: true }).click();
  await expect(page.getByLabel('Barrio o sector')).toHaveValue('Barrio Demo');
  await page.getByLabel('Barrio o sector').selectOption('__other');
  await page.getByLabel('Nombre de tu barrio').fill('Otro sector');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(await page.evaluate(() => window.savedTestProfile.barrio)).toBe('Barrio Demo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await navigateTo(page, 'Cerrar sesión');
  await expect(page.getByRole('heading', { name: 'Entra a tu barrio' })).toBeVisible();
});

test('registro con confirmación pendiente dirige al correo', async ({ page }) => {
  await page.route('**/src/lib/supabase.js', (route) => route.fulfill({ contentType: 'text/javascript', body: `
    export function getSupabaseClient(){return {auth:{
      onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
      async getSession(){return {data:{session:null}}},
      async signUp(values){window.registration=values;return {data:{user:{id:'pending'},session:null}}}
    }}}
  ` }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear cuenta de vecino' }).click();
  await page.getByLabel('Tu nombre').fill('Rosa');
  await page.getByLabel('Correo electrónico').fill('rosa@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('prueba123');
  await page.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisa tu correo' })).toBeVisible();
  expect(await page.evaluate(() => window.registration.options.data)).toEqual({ nombre: 'Rosa' });
  await page.getByRole('button', { name: 'Ir a iniciar sesión' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
});


test('bienvenida y guía son propias de cada cuenta y se pueden reabrir', async ({ page }) => {
  await page.route('**/src/lib/publications.js*', route => route.fulfill({ contentType: 'text/javascript', body: `
    export async function listPublications(){return []}
    export async function createPublication(){}
    export async function changePublicationLifecycle(){}
    export async function closePublication(){}
  ` }));
  await page.route('**/src/lib/supabase.js*', route => route.fulfill({ contentType: 'text/javascript', body: `
    export function getSupabaseClient(){
      const id=localStorage.getItem('test-active-account')||'first-account';
      const profile={id,nombre:id==='first-account'?'Ana':'Luis',barrio:'Barrio Demo'};
      return {
        auth:{
          onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
          async getSession(){return {data:{session:{user:{id}}}}}
        },
        from(){return {select(){return {eq(){return {async maybeSingle(){return {data:profile,error:null}}}}}}}}
      };
    }
  ` }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '¡Hola, Ana!' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar bienvenida', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Tutorial con Manolito' })).toBeVisible();
  await page.getByRole('button', { name: 'Omitir tutorial' }).click();
  await page.reload();
  await expect(page.getByText('Cuenta conectada', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¡Hola, Ana!' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Tutorial con Manolito' })).toHaveCount(0);
  await navigateTo(page, 'Cómo usar la app');
  await expect(page.getByRole('region', { name: 'Tutorial con Manolito' })).toBeVisible();
  await page.getByRole('button', { name: 'Omitir tutorial' }).click();
  await page.evaluate(() => localStorage.setItem('test-active-account', 'second-account'));
  await page.reload();
  await expect(page.getByRole('heading', { name: '¡Hola, Luis!' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver las manitos' }).click();
  await expect(page.getByRole('region', { name: 'Tutorial con Manolito' })).toBeVisible();
});
