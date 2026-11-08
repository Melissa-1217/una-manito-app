import { useState } from 'react';
import { Plus, Package, Search } from 'lucide-react';
import { filterProducts } from '../lib/products.js';
import { distanceKm, formatDistance } from '../lib/location.js';
import PublicationCard from './PublicationCard.jsx';
import LocationControl from './LocationControl.jsx';
import PublicationLoading from './PublicationLoading.jsx';

export default function ProductsDirectory({ publications, barrio, people, onOpen, onCreate, loading, loadError, readOnly }) {
  const [modality,setModality] = useState('todos');
  const [query,setQuery] = useState('');
  const [origin,setOrigin] = useState(null);
  const products = filterProducts(publications,{barrio,modality,query});
  if (origin) products.sort((a,b) => distanceKm(origin,a)-distanceKm(origin,b));
  const filtered = modality !== 'todos' || query.trim();
  return <section className="products-directory">
    <header className="page-heading"><h1>Productos del barrio</h1><p className="page-purpose">Préstamos, donaciones e intercambios entre vecinos.</p><button className="button primary" onClick={onCreate}><Plus size={18} aria-hidden="true"/>{readOnly ? 'Preparar producto' : 'Compartir producto'}</button></header>
    <div className="service-categories product-filters" role="group" aria-label="Filtrar productos">{[['todos','Todos'],['prestamo','Préstamos'],['donacion','Donaciones'],['intercambio','Intercambios']].map(([value,label]) => <button key={value} aria-pressed={modality === value} onClick={() => setModality(value)}>{label}</button>)}</div>
    <label className="search-box"><Search size={19} aria-hidden="true"/><input aria-label="Buscar productos" placeholder="Ej.: taladro, libros, ropa…" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    <details className="feed-location"><summary>Ordenar por cercanía</summary><LocationControl value={origin} onChange={setOrigin}/></details>
    <div className="publication-grid publication-list" aria-busy={loading}>{loading && <PublicationLoading/>}{products.map(post=><PublicationCard key={post.id} publication={post} compact authorName={people[post.autor_id]} onOpen={onOpen} distance={origin ? formatDistance(distanceKm(origin,post)) : null}/>)}</div>
    {!loading && !loadError && !products.length && <div className="empty"><Package size={32} aria-hidden="true"/><h2>{readOnly ? 'No hay productos guardados' : filtered ? 'No encontramos productos' : 'Todavía no hay productos publicados'}</h2><p>{readOnly ? 'Conéctate para actualizar los productos del barrio.' : filtered ? 'Prueba otro nombre o modalidad.' : 'Comparte algo que otro vecino pueda necesitar.'}</p>{filtered && <button className="button secondary" onClick={()=>{setQuery('');setModality('todos');}}>Limpiar filtros</button>}</div>}
  </section>;
}
