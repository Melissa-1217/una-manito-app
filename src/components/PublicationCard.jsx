import { ArrowUpRight, MapPin, Wrench, HandHeart, Droplets, CheckCircle2 } from 'lucide-react';
import { useId } from 'react';
import { productModes } from '../lib/products.js';

export const statusLabels = { pendiente: 'Pendiente', en_coordinacion: 'En coordinación', resuelta: 'Resuelta', vencida: 'Vencida', cancelada: 'Cancelada' };

export default function PublicationCard({ publication, onOpen, distance, compact = false, authorName }) {
  const id = useId();
  const contextLabel = publication.es_emergencia ? publication.tipo === 'servicio' ? 'SERVICIO DE APOYO' : publication.tipo === 'ofrecimiento' ? 'RECURSO DE EMERGENCIA' : 'NECESITA APOYO' : null;
  const Icon = publication.estado === 'resuelta' ? CheckCircle2 : publication.es_emergencia ? Droplets : publication.tipo === 'servicio' ? Wrench : HandHeart;
  return <button className={`publication-card ${compact ? 'compact-card' : ''}`} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description ${id}-status`} onClick={() => onOpen(publication.id)}>
    {!compact && <div className={`card-art ${publication.es_emergencia ? 'coral' : publication.tipo === 'servicio' ? 'sand' : ''}`}><Icon size={38} strokeWidth={1.5} /><span>{publication.categoria}</span></div>}
    <div className="card-content"><div className="card-top"><span className="eyebrow">{contextLabel || productModes[publication.producto_modalidad] || (publication.tipo === 'servicio' ? 'SERVICIO' : publication.tipo === 'ofrecimiento' ? 'OFRECE AYUDA' : 'PIDE AYUDA')}{compact && publication.categoria && publication.categoria !== 'Otros' && ` · ${publication.categoria}`}</span><ArrowUpRight size={19} /></div>
      <h3 id={`${id}-title`}>{publication.titulo}</h3><p id={`${id}-description`}>{publication.descripcion}</p>{(publication.perfiles?.nombre || authorName) && <span className="card-author">Por {publication.perfiles?.nombre || authorName}</span>}<div className="card-footer"><span><MapPin aria-hidden="true" size={13} />{distance || publication.barrio}</span><span id={`${id}-status`} className={`badge ${publication.estado}`}>{statusLabels[publication.estado]}</span></div><span className="card-open">{publication.es_emergencia ? publication.tipo === 'ofrecimiento' ? 'Ver recurso' : 'Ver apoyo' : publication.producto_modalidad ? 'Ver producto' : publication.tipo === 'servicio' ? 'Ver servicio' : publication.tipo === 'ofrecimiento' ? 'Ver ofrecimiento' : 'Ver pedido'}<ArrowUpRight aria-hidden="true" size={16}/></span></div>
  </button>;
}
