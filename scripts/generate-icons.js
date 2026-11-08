// Rasteriza el SVG de marca: favicon, icono instalado y navegación comparten fuente.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

const root=new URL('../',import.meta.url);
const svg=await readFile(new URL('public/icon.svg',root),'utf8');
const browser=await chromium.launch({headless:true});
try {
 for(const [size,name] of [[192,'icon-192.png'],[512,'icon-512.png'],[180,'apple-touch-icon.png']]) {
  const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
  await page.setContent(`<html><body style="margin:0;background:#1E4532"><img style="display:block;width:100vw;height:100vh" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" alt=""></body></html>`);
  await page.locator('img').evaluate(image=>image.decode());
  await page.screenshot({path:fileURLToPath(new URL(`public/${name}`,root))});
  await page.close();
 }
}finally{await browser.close();}
