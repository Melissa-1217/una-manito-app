import { useEffect, useState } from 'react';
import { MapPin, ArrowRight, Star } from 'lucide-react';
import { loadNeighbor } from '../lib/recommendations.js';
import { RatingHistory } from './NeighborProfile.jsx';

export default function MyProfile({ profile, remote, readOnly, publications, demoHistory, onActivity }) {
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!remote || readOnly) return;
    let active = true;
    loadNeighbor(profile.id).then(result => { if (active) { setReviews(result.recommendations); setError(''); } }).catch(() => { if (active) setError('No pudimos cargar tus valoraciones.'); });
    return () => { active = false; };
  }, [profile.id, remote, readOnly, retry]);
  return <section className="my-profile" aria-label="Mi perfil vecinal">
    <h1>Mi perfil</h1>
    <div className="panel profile-identity"><span className="profile-avatar" aria-hidden="true">{profile.nombre[0]}</span><div><h2>{profile.nombre}</h2><p><MapPin size={16} aria-hidden="true"/>{profile.barrio}</p></div></div>
    <section className="panel profile-activity"><div><strong>{publications}</strong><span>{publications === 1 ? 'publicación' : 'publicaciones'}</span></div><button className="button secondary" onClick={onActivity}>Ver mi actividad<ArrowRight size={17} aria-hidden="true"/></button></section>
    <section className="panel profile-reputation" aria-label="Mi reputación vecinal"><h2><Star size={20} aria-hidden="true"/>Mi reputación</h2>
      {!remote ? <><span className="badge">Demostración</span><p>{demoHistory.total} ayudas completadas · {demoHistory.neighbors} recomendaciones de vecinos.</p></> : readOnly ? <p>Conéctate y actualiza las publicaciones para consultar tus valoraciones.</p> : error ? <><p role="alert">{error}</p><button className="button secondary" onClick={() => { setError(''); setRetry(value => value + 1); }}>Reintentar</button></> : reviews === null ? <p role="status">Cargando valoraciones…</p> : <RatingHistory reviews={reviews}/>}
    </section>
  </section>;
}
