import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { loadNeighbor, recommendNeighbor, summarizeRatings } from '../lib/recommendations.js';

export function RatingHistory({ reviews }) {
  const summary = summarizeRatings(reviews);
  return <>
    <h3>Experiencias de vecinos</h3>
    <p>{summary.count ? `${summary.average.toFixed(1)} / 5 · ${summary.count} ${summary.count === 1 ? 'valoración' : 'valoraciones'}` : 'Aún no hay calificaciones con estrellas.'}</p>
    <p><strong>Visto Bueno Vecinal</strong> · {summary.endorsements} {summary.endorsements === 1 ? 'vecino lo recomienda' : 'vecinos lo recomiendan'}. Cuenta su última valoración.</p>
    {reviews.map(item => <blockquote key={item.id}>
      <strong>{item.estrellas == null ? 'Recomendación anterior sin estrellas' : `${'★'.repeat(item.estrellas)}${'☆'.repeat(5-item.estrellas)} · ${item.estrellas}/5`}</strong>
      {item.estrellas >= 4 && <span className="badge">Visto Bueno Vecinal</span>}
      <p>{item.comentario}</p><small>{item.autor?.nombre || 'Vecino'} · {new Date(item.creado_en).toLocaleDateString('es-PE')}</small>
    </blockquote>)}
    <details className="ui-explanation"><summary>¿Cómo funciona el Visto Bueno?</summary><p>4 o 5 estrellas expresan el Visto Bueno Vecinal. Cada vecino cuenta una vez, con su opinión más reciente.</p></details>
  </>;
}

function ProfileDialog({ id, name, localProfile, onClose }) {
  const dialog = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const useRemoteProfile = !localProfile;
  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    node.showModal();
    let active = true;
    if (useRemoteProfile) loadNeighbor(id).then(data => { if (active) setResult(data); }).catch(() => {
      if (active) setError('No pudimos consultar las referencias. Intenta más tarde.');
    });
    return () => { active = false; node.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [id, useRemoteProfile]);
  return <dialog className="neighbor-dialog" ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }} aria-label="Perfil vecinal">
    <button className="neighbor-close" aria-label="Cerrar perfil" onClick={onClose}><X size={22}/></button>
    {localProfile ? <>
      <h2>{name}</h2><p>{localProfile.barrio} · Zona de la publicación</p>
      {localProfile.history ? <p>{localProfile.history.total} ayudas completadas · {localProfile.history.neighbors} recomendaciones en la demo.</p> : <p>Conéctate para consultar las valoraciones actuales.</p>}
    </> : error ? <p role="alert">{error}</p> : !result ? <p role="status">Consultando referencias…</p> : <>
      <h2>{result.profile.nombre}</h2><p className="muted">{result.profile.barrio} · Barrio elegido por el vecino</p>
      <RatingHistory reviews={result.recommendations}/>
    </>}
  </dialog>;
}

export default function NeighborProfile({ id, name, authorLink = false, localProfile = null }) {
  const [open, setOpen] = useState(false);
  return <><button className="neighbor-link" onClick={() => setOpen(true)} aria-label={`Ver perfil de ${name}`} type="button">{authorLink ? name : `Ver perfil de ${name}`}</button>
    {open && <ProfileDialog id={id} name={name} localProfile={localProfile} onClose={() => setOpen(false)}/>}</>;
}

export function RecommendAction({ publication, response, userId }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [stars, setStars] = useState(0);
  const [existing, setExisting] = useState(false);
  const receiver = publication.tipo === 'solicitud' ? publication.autor_id : response.vecino_id;
  const helper = publication.tipo === 'solicitud' ? response.vecino_id : publication.autor_id;
  if (publication.estado !== 'resuelta' || response.estado !== 'aceptado' || receiver !== userId || helper === userId) return null;
  if (done) return <p role="status">{existing ? 'Ya registraste tu opinión para esta experiencia.' : 'Tu valoración quedó registrada.'}</p>;
  if (!open) return <button className="text-button" onClick={() => setOpen(true)}>Valorar la experiencia</button>;
  return <form className="recommend-form" onSubmit={async event => {
    event.preventDefault();
    if (pending || comment.trim().length < 5 || !stars) return;
    setPending(true); setError('');
    try { const result = await recommendNeighbor(response.id, userId, helper, comment, stars); setExisting(result === 'existing'); setDone(true); }
    catch { setError('No se pudo guardar la valoración. Comprueba que la ayuda esté aceptada y resuelta.'); }
    finally { setPending(false); }
  }}>
    <fieldset className="rating-stars" disabled={pending}><legend>¿Cómo fue tu experiencia?</legend>
      {[1,2,3,4,5].map(value => <label key={value}><input type="radio" name={`stars-${response.id}`} required checked={stars === value} onChange={() => setStars(value)} aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}/><span aria-hidden="true">{value <= stars ? '★' : '☆'}</span></label>)}
    </fieldset>
    <small>{stars >= 4 ? 'Esta valoración incluye tu Visto Bueno Vecinal.' : stars ? 'Tu experiencia y comentario aparecerán en el perfil.' : '4 o 5 estrellas incluyen tu Visto Bueno Vecinal.'}</small>
    <label>¿Cómo fue la ayuda?<textarea required minLength={5} maxLength={500} value={comment} disabled={pending} onChange={event => setComment(event.target.value)}/></label>
    {error && <p role="alert">{error}</p>}
    <button className="button secondary" disabled={pending}>{pending ? 'Guardando…' : 'Guardar valoración'}</button>
  </form>;
}
