import { ArrowUpRight, MapPin, Wrench, HandHeart, Droplets, CheckCircle2 } from 'lucide-react';

export const statusLabels = { pendiente: 'Pendiente', en_coordinacion: 'En coordinación', resuelta: 'Resuelta' };

export default function PublicationCard({ publication, onOpen, distance }) {
  const Icon = publication.estado === 'resuelta' ? CheckCircle2 : publication.es_emergencia ? Droplets : publication.tipo === 'servicio' ? Wrench : HandHeart;
  return <button className="publication-card" onClick={() => onOpen(publication.id)}>
    <div className={`card-art ${publication.es_emergencia ? 'coral' : publication.tipo === 'servicio' ? 'sand' : ''}`}><Icon size={38} strokeWidth={1.5} /><span>{publication.categoria}</span></div>
    <div className="card-content"><div className="card-top"><span className="eyebrow">{publication.tipo === 'servicio' ? 'SERVICIO LOCAL' : publication.tipo === 'ofrecimiento' ? 'QUIERO AYUDAR' : 'NECESITO UNA MANITO'}</span><ArrowUpRight size={19} /></div>
      <h3>{publication.titulo}</h3><p>{publication.descripcion}</p><div className="card-footer"><span><MapPin size={13} />{distance || publication.barrio}</span><span className={`badge ${publication.estado}`}>{statusLabels[publication.estado]}</span></div></div>
  </button>;
}
