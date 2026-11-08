import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts, validateProduct } from '../src/lib/products.js';

test('productos: filtra modalidad, barrio y estado sin adivinar publicaciones antiguas', () => {
  const base={tipo:'ofrecimiento',producto_modalidad:'prestamo',titulo:'Taladro',descripcion:'Para prestar',categoria:'Herramientas',barrio:'San Miguel',estado:'pendiente'};
  const posts=[{...base,id:'loan'},{...base,id:'donation',producto_modalidad:'donacion'},{...base,id:'other',barrio:'Otra zona'},{...base,id:'closed',estado:'resuelta'},{...base,id:'legacy',producto_modalidad:null},{...base,id:'service',tipo:'servicio'}];
  assert.deepEqual(filterProducts(posts,{barrio:'san miguel',modality:'prestamo',query:'TALÁDRO'}).map(p=>p.id),['loan']);
  assert.deepEqual(filterProducts(posts,{barrio:'San Miguel',modality:'donacion'}).map(p=>p.id),['donation']);
  assert.equal(validateProduct({tipo:'servicio'}),null);
  assert.throws(()=>validateProduct({...base,producto_modalidad:'venta'}));
  assert.throws(()=>validateProduct({...base,tipo:'servicio'}));
});
