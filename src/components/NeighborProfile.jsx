import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { loadNeighbor, recommendNeighbor } from '../lib/recommendations.js';

function ProfileDialog({ id, onClose }) {
  const dialog = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    let active = true;
    loadNeighbor(id).then(data => { if (active) setResult(data); }).catch(() => {
      if (active) setError('No pudimos consultar las referencias. Intenta más tarde.');
    });
    return () => { active = false; node.close(); };
  }, [id]);
  return <dialog className="neighbor-dialog" ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }} aria-label="Perfil vecinal">
    <button className="neighbor-close" aria-label="Cerrar perfil" onClick={onClose}><X size={22}/></button>
    {error ? <p role="alert">{error}</p> : !result ? <p role="status">Consultando referencias…</p> : <>
      <h2>{result.profile.nombre}</h2><p className="muted">{result.profile.barrio} · Barrio elegido por el vecino</p>
      <h3>Visto Bueno Vecinal</h3>
      <p>{new Set(result.recommendations.map(item => item.autor_id)).size} vecinos le dieron su visto bueno.</p>
      {result.recommendations.length === 0 ? <p className="muted">Todavía no tiene recomendaciones registradas.</p> :
        result.recommendations.map(item => <blockquote key={item.id}><p>{item.comentario}</p><small>{item.autor?.nombre || 'Vecino'} · {new Date(item.creado_en).toLocaleDateString('es-PE')}</small></blockquote>)}
      <small>Las recomendaciones se registran después de aceptar y cerrar una ayuda.</small>
    </>}
  </dialog>;
}

export default function NeighborProfile({ id, name }) {
  const [open, setOpen] = useState(false);
  return <><button className="neighbor-link" onClick={() => setOpen(true)} type="button">Ver perfil de {name}</button>
    {open && <ProfileDialog id={id} onClose={() => setOpen(false)}/>}</>;
}

export function RecommendAction({ publication, response, userId }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const receiver = publication.tipo === 'solicitud' ? publication.autor_id : response.vecino_id;
  const helper = publication.tipo === 'solicitud' ? response.vecino_id : publication.autor_id;
  if (publication.estado !== 'resuelta' || response.estado !== 'aceptado' || receiver !== userId || helper === userId) return null;
  if (done) return <p role="status">Tu visto bueno quedó registrado.</p>;
  if (!open) return <button className="text-button" onClick={() => setOpen(true)}>Recomendar la ayuda recibida</button>;
  return <form className="recommend-form" onSubmit={async event => {
    event.preventDefault();
    if (pending || comment.trim().length < 5) return;
    setPending(true); setError('');
    try { await recommendNeighbor(response.id, userId, helper, comment); setDone(true); }
    catch { setError('No se pudo guardar la recomendación. Comprueba que la ayuda esté aceptada y resuelta.'); }
    finally { setPending(false); }
  }}>
    <label>¿Cómo fue la ayuda?<textarea required minLength={5} maxLength={500} value={comment} disabled={pending} onChange={event => setComment(event.target.value)}/></label>
    {error && <p role="alert">{error}</p>}
    <button className="button secondary" disabled={pending}>{pending ? 'Guardando…' : 'Dar mi visto bueno'}</button>
  </form>;
}
