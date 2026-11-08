import { isActive } from './lifecycle.js';

export const productModes = { prestamo:'Préstamo', donacion:'Donación', intercambio:'Intercambio' };
export function validateProduct(publication) {
  if (publication.producto_modalidad == null) return null;
  if (publication.tipo !== 'ofrecimiento' || !Object.hasOwn(productModes, publication.producto_modalidad)) throw new Error('Elige préstamo, donación o intercambio para compartir un producto.');
  return publication.producto_modalidad;
}
const normalize = value => (value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
export function filterProducts(publications, { barrio, modality = 'todos', query = '' } = {}) {
  return publications.filter(post => post.tipo === 'ofrecimiento' && Object.hasOwn(productModes,post.producto_modalidad || '') && isActive(post)
    && (!barrio || normalize(post.barrio) === normalize(barrio))
    && (modality === 'todos' || post.producto_modalidad === modality)
    && normalize(`${post.titulo} ${post.descripcion} ${post.categoria}`).includes(normalize(query)));
}
