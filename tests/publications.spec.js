import { test, expect } from '@playwright/test';

test('publica con la cuenta real, otro vecino la consulta y solo el autor la cierra', async ({ page }) => {
  await page.route('**/src/lib/supabase.js', (route) => route.fulfill({ contentType: 'text/javascript', body: `
    let listener;
    let user;
    export function getSupabaseClient(){return {
      auth:{
        onAuthStateChange(callback){listener=callback;return {data:{subscription:{unsubscribe(){}}}}},
        async getSession(){return {data:{session:null}}},
        async signInWithPassword(credentials){user={id:credentials.email.startsWith('ana')?'ana-uuid':'luis-uuid'};listener('SIGNED_IN',{user});return {data:{session:{user}}}},
        async signOut(){listener('SIGNED_OUT',null);return {error:null}},
      },
      from(){return {select(){return {eq(){return {async maybeSingle(){return {data:{id:user.id,nombre:user.id==='ana-uuid'?'Ana':'Luis',barrio:'Barrio Demo'},error:null}}}}}}}}
    }}
  ` }));
  await page.route('**/src/lib/responses.js*', route => route.fulfill({contentType:'text/javascript', body: `
    export async function sendResponse(id, user, msg){
      const row={id:'offer-1',publicacion_id:id,vecino_id:user,mensaje:msg,estado:'pendiente',perfiles:{nombre:'Luis'}};
      window.testPost.ofrecimientos=[row];return structuredClone(row);
    }
    export async function acceptResponse(){window.testPost.estado='en_coordinacion';window.testPost.ofrecimientos[0].estado='aceptado'}
  ` }));
  await page.route('**/src/lib/publications.js*', (route) => route.fulfill({ contentType: 'text/javascript', body: `
    let posts=[];
    export async function listPublications(){return structuredClone(posts)}
    export async function createPublication(draft,authorId){
      const post={...draft,id:'real-publication',autor_id:authorId,estado:'pendiente',perfiles:{nombre:'Ana'}};
      window.testPost=post;posts.unshift(post);window.createdPost=post;return structuredClone(post);
    }
    export async function closePublication(id,authorId){
      const post=posts.find(p=>p.id===id && p.autor_id===authorId);
      if(!post)throw new Error('Not allowed');post.estado='resuelta';return structuredClone(post);
    }
  ` }));
  async function login(email) {
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('prueba123');
    await page.getByRole('button', { name: 'Entrar a mi barrio', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Actualizar publicaciones', exact: true })).toBeEnabled();
  }
  await page.route('**/src/lib/recommendations.js*', route => route.fulfill({contentType:'text/javascript',body: `
    export function summarizeRatings(reviews){return {average:4,count:reviews.length,endorsements:reviews.length}}
    let saved=[];
    export async function recommendNeighbor(id,author,neighbor,comment,stars){
      saved=[{id:'rec-1',autor_id:author,estrellas:stars,comentario:comment,creado_en:new Date().toISOString(),autor:{nombre:'Ana'}}];
    }
    export async function loadNeighbor(id){return {profile:{id,nombre:id==='luis-uuid'?'Luis':'Ana',barrio:'Barrio Demo'},recommendations:saved}}
  `}));
  await page.goto('/');
  await login('ana@example.com');
  await page.getByRole('button', { name: 'Pedir una manito', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar manualmente' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Necesito un carrito para mudanza');
  await page.getByLabel('Cuéntale un poco más al barrio').fill('Necesito un carrito para trasladar cajas esta tarde.');
  await page.getByRole('button', { name: 'Revisar publicación' }).click();
  await page.getByRole('button', { name: 'Publicar solicitud', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Necesito un carrito para mudanza', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.createdPost.autor_id)).toBe('ana-uuid');
  await page.getByRole('button', { name: /Cerrar sesión/ }).click();
  await login('luis@example.com');
  await page.getByRole('button').filter({ has: page.getByRole('heading', { name: 'Necesito un carrito para mudanza' }) }).click();
  await expect(page.getByRole('button', { name: 'Marcar como resuelta' })).toHaveCount(0);
  await page.getByLabel('Tu mensaje').fill('Puedo prestar mi carrito.');
  await page.getByRole('button', {name:'Yo te ayudo',exact:true}).click();
  await expect(page.getByText('Puedo prestar mi carrito.',{exact:true})).toBeVisible();
  await page.getByRole('button', { name: /Cerrar sesión/ }).click();
  await login('ana@example.com');
  await page.getByRole('button').filter({ has: page.getByRole('heading', { name: 'Necesito un carrito para mudanza' }) }).click();
  await page.getByRole('button', {name:'Aceptar ayuda'}).click();
  await expect(page.getByText('Aceptado',{exact:true})).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como resuelta', exact: true }).click();
  await expect(page.getByText('Esta publicación ya está cerrada.')).toBeVisible();
  await page.getByRole('button',{name:'Valorar la experiencia'}).click();
  await page.getByLabel('4 estrellas', {exact:true}).check();
  await page.getByLabel('¿Cómo fue la ayuda?').fill('Luis fue puntual y prestó el carrito.');
  await page.getByRole('button',{name:'Guardar valoración'}).click();
  await expect(page.getByText('Tu valoración quedó registrada.')).toBeVisible();
  await page.getByRole('button',{name:'Ver perfil de Luis',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Perfil vecinal'})).toBeVisible();
  await expect(page.getByText('Luis fue puntual y prestó el carrito.',{exact:true})).toBeVisible();
});
