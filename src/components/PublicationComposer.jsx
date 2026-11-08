import { ArrowLeft, ArrowRight, MapPin, ShieldCheck } from 'lucide-react';
import VoiceDictation from './VoiceDictation.jsx';
import AiPublicationAssistant from './AiPublicationAssistant.jsx';
import CapacityField from './CapacityField.jsx';
import LocationControl from './LocationControl.jsx';
import { validateCapacity } from '../lib/participation.js';
import { useEffect, useRef } from 'react';

const categories = ['Herramientas','Gasfitería','Electricidad','Compras y traslados','Clases','Agua y alimentos','Otros'];
const modes = {
  solicitud: { title:'Pedir una manito', question:'¿Qué necesitas?', placeholder:'Ej.: necesito una escalera para mañana por la tarde.', publish:'Publicar solicitud' },
  ofrecimiento: { title:'Ofrecer una manito', question:'¿Qué puedes compartir?', placeholder:'Ej.: presto mi escalera este fin de semana.', publish:'Publicar ofrecimiento' },
  servicio: { title:'Publicar un servicio', question:'¿Qué servicio brindas?', placeholder:'Ej.: reparo caños y atiendo por las tardes en el barrio.', publish:'Publicar servicio' },
};

function titleFromDescription(description) {
  const text = description.trim().replace(/\s+/g,' ');
  const first = text.split(/[.!?](?:\s|$)/)[0];
  return (first.length >= 5 ? first : text).slice(0,120).trim();
}

export default function PublicationComposer({ draft, onChange, review, onReview, onEdit, onBack, onPublish, onError, busy, readOnly, account }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll:true }); window.scrollTo({ top:0, behavior:'instant' }); }, [review, draft.tipo]);
  const mode = modes[draft.tipo];
  const update = fields => onChange({ ...draft, ...fields });
  function validate(next) {
    try { validateCapacity(next); } catch (error) { onError(error.message); return false; }
    if (next.titulo.trim().length < 5 || next.descripcion.trim().length < 10 || next.barrio.trim().length < 2) {
      onError('Describe un poco más tu publicación y revisa el barrio.'); return false;
    }
    return true;
  }
  const options = <details className="composer-details">
    <summary>Añadir detalles</summary>
    {!review && <><label>Tipo de publicación<select value={draft.tipo} onChange={event => update({ tipo:event.target.value })}><option value="solicitud">Necesito ayuda</option><option value="ofrecimiento">Ofrezco ayuda</option><option value="servicio">Un servicio</option></select></label><label>Título<input minLength={5} maxLength={120} value={draft.titulo} onChange={event => update({ titulo:event.target.value })} placeholder="Se prepara a partir de tu mensaje"/></label></>}
    <div className="form-row"><label>Categoría<select value={draft.categoria} onChange={event => update({ categoria:event.target.value })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Barrio<input minLength={2} maxLength={120} readOnly={Boolean(account)} value={draft.barrio} onChange={event => update({ barrio:event.target.value })}/></label></div>
    <CapacityField type={draft.tipo} value={draft.cupos} onChange={cupos => update({ cupos })}/>
    <LocationControl forPublication value={draft} onChange={point => update({ latitud:point?.latitud ?? null, longitud:point?.longitud ?? null })}/>
    <label className="checkbox"><input type="checkbox" checked={draft.es_emergencia} onChange={event => update({ es_emergencia:event.target.checked })}/>Es apoyo en emergencia</label>
  </details>;
  return <section className="form-page simple-composer">
    <button className="text-button composer-back" onClick={review ? onEdit : onBack}><ArrowLeft size={17}/>{review ? 'Volver a editar' : 'Volver'}</button>
    <span className="eyebrow">Paso {review ? '2' : '1'} de 2</span>
    <h1 ref={heading} tabIndex={-1}>{review ? 'Revisa tu publicación' : mode.title}</h1>
    <form className="panel composer-panel" onSubmit={event => {
      event.preventDefault();
      const next = { ...draft, titulo:draft.titulo.trim() || titleFromDescription(draft.descripcion) };
      if (!validate(next)) return;
      onError('');
      if (review) { void onPublish(next); } else { onReview(next); }
    }}>
      {review ? <div className="composer-preview">
        {draft.categoria !== 'Otros' && <span className="badge">{draft.categoria}</span>}
        <label className="preview-title">Título<input required minLength={5} maxLength={120} value={draft.titulo} onChange={event => update({ titulo:event.target.value })}/></label>
        <label>Descripción<textarea required minLength={10} maxLength={2000} value={draft.descripcion} onChange={event => update({ descripcion:event.target.value })}/></label>
        <p className="composer-zone"><MapPin size={16} aria-hidden="true"/>{draft.barrio}{draft.tipo !== 'servicio' && ` · ${draft.cupos || 1} ${Number(draft.cupos || 1) === 1 ? 'cupo' : 'cupos'}`}</p>
        {draft.es_emergencia && <span className="badge emergency-badge">Apoyo en emergencia</span>}
      </div> : <>
        <label className="composer-question">{mode.question}<textarea required minLength={10} maxLength={2000} value={draft.descripcion} onChange={event => update({ descripcion:event.target.value })} placeholder={mode.placeholder}/></label>
        <VoiceDictation compact onTranscript={text => {
          const descripcion = [draft.descripcion.trim(),text].filter(Boolean).join(' ');
          if (descripcion.length > 2000) { onError('Acorta el texto antes de añadir el dictado.'); return false; }
          update({ descripcion }); return true;
        }}/>
        {draft.descripcion.trim().length >= 3 && <details className="composer-ai"><summary>Ayuda con IA</summary><AiPublicationAssistant key={draft.tipo + draft.descripcion} text={draft.descripcion} type={draft.tipo} onApply={proposal => update(proposal)}/></details>}
      </>}
      {options}
      {review && <p className="composer-privacy"><ShieldCheck size={17} aria-hidden="true"/>Comparte tu zona, sin dirección exacta.</p>}
      <button className="button primary wide" type="submit" disabled={busy || (review && readOnly)}>{busy ? 'Un momento…' : review ? mode.publish : 'Revisar publicación'}<ArrowRight size={17}/></button>
      {review && readOnly && <p className="ai-hint" role="status">Necesitas conexión y datos actualizados para publicar. Tu borrador se conserva.</p>}
    </form>
    <p className="draft-note">Borrador guardado. Se publica cuando confirmas.</p>
  </section>;
}
