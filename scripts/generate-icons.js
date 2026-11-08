// Adapta el archivo ORIGINAL entregado por el equipo a los tamaños de instalación.
// Solo cambia el tamaño de presentación: no genera ni rediseña la imagen.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

const root=new URL('../',import.meta.url);
const original=await readFile(new URL('public/manolito-icon-original.png',root));
const browser=await chromium.launch({headless:true});
try {
 for(const [size,name] of [[192,'icon-192.png'],[512,'icon-512.png'],[180,'apple-touch-icon.png']]) {
  const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
  await page.setContent(`<html><body style="margin:0;background:#fff"><img style="display:block;width:100vw;height:100vh;object-fit:contain" src="data:image/png;base64,${original.toString('base64')}" alt=""></body></html>`);
  await page.locator('img').evaluate(image=>image.decode());
  await page.screenshot({path:fileURLToPath(new URL(`public/${name}`,root))});
  await page.close();
 }
}finally{await browser.close();}
