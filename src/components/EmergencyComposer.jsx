import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle, MapPin } from 'lucide-react';
import CapacityField from './CapacityField.jsx';
import LocationControl from './LocationControl.jsx';
import { validateCapacity } from '../lib/participation.js';
import EmergencyTopics, { emergencyTopics } from './EmergencyTopics.jsx';
import AiPublicationAssistant from './AiPublicationAssistant.jsx';

export default function EmergencyComposer({ draft, onChange, review, onReview, onEdit, onBack, onPublish, onError, busy, readOnly, account }) {
  const heading = useRef(null);
  const resource = draft.tipo === 'ofrecimiento';
  const topic = emergencyTopics.find(item => item.id === draft.emergency_intent);
  useEffect(() => { heading.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'}); },[review,resource]);
  const update = fields => onChange({...draft,...fields,es_emergencia:true,producto_modalidad:null});
  return <section className="form-page emergency-composer">
    <button className="text-button" onClick={review ? onEdit : onBack}><ArrowLeft size={17}/>{review ? 'Volver a editar' : 'Volver a emergencias'}</button>
    <header className="emergency-form-heading"><span>APOYO EN EMERGENCIA · PASO {review ? 2 : 1} DE 2</span>
    <h1 ref={heading} tabIndex={-1}>{review ? resource ? 'Revisa tu recurso' : 'Revisa tu pedido de apoyo' : resource ? 'Compartir recursos de emergencia' : 'Solicitar apoyo de emergencia'}</h1>
    {topic && <strong>{topic.label}</strong>}</header>
    <p className="emergency-context"><AlertTriangle size={18} aria-hidden="true"/>Coordinación vecinal. No es una alerta oficial.</p>
    <form className="panel" onInvalid={event=>{const details=event.target.closest('details');if(details)details.open=true;}} onSubmit={event=>{
      event.preventDefault();
      const text=draft.descripcion.trim();
      const next={...draft,tipo:resource?'ofrecimiento':'solicitud',es_emergencia:true,producto_modalidad:null,titulo:draft.titulo.trim() || `${topic ? topic.label+': ' : ''}${text.replace(/\s+/g,' ')}`.slice(0,120)};
      try {validateCapacity(next);} catch(error){onError(error.message);return;}
      if(next.titulo.length<5 || text.length<10 || next.barrio.trim().length<2){onError('Describe el apoyo y revisa la zona de referencia.');return;}
      onError('');if(review){void onPublish(next);}else{onReview(next);}
    }}>
      {review ? <><span className="badge emergency-badge">{resource?'Recurso de emergencia':'Pedido de emergencia'}</span><label>Título<input required minLength={5} maxLength={120} value={draft.titulo} onChange={event=>update({titulo:event.target.value})}/></label><label>Descripción<textarea required minLength={10} maxLength={2000} value={draft.descripcion} onChange={event=>update({descripcion:event.target.value})}/></label><p className="composer-zone"><MapPin size={16} aria-hidden="true"/>{draft.barrio}</p></> : <>
        <label className="emergency-question">{resource?'¿Qué recurso o apoyo tienes?':'¿Qué apoyo necesitas?'}<textarea required minLength={10} maxLength={2000} value={draft.descripcion} onChange={event=>update({descripcion:event.target.value})} placeholder={resource?'Ej.: tengo botellas de agua para compartir hoy. Indica cantidad y cuándo puedes entregarlas.':'Ej.: necesitamos agua para dos familias hoy. Indica qué falta y para cuántas personas.'}/></label>
      </>}
      {!review && <><EmergencyTopics value={draft.emergency_intent} disabled={busy} onChange={emergency_intent=>update({emergency_intent})}/>{draft.descripcion.trim().length>=3 && <details className="emergency-ai"><summary>Organizar el mensaje con IA · opcional</summary><AiPublicationAssistant key={draft.descripcion} text={draft.descripcion} type={draft.tipo} onApply={({titulo,descripcion})=>update({titulo,descripcion})}/></details>}</>}
      <label>{resource?'Tipo de recurso':'Tipo de apoyo'}<select value={draft.categoria} onChange={event=>update({categoria:event.target.value})}><option value="Otros">Otro apoyo</option><option>Agua y alimentos</option><option value="Compras y traslados">Traslados y entregas</option><option>Herramientas</option></select></label>
      <details className="composer-details"><summary>Zona y coordinación</summary><label>Barrio<input minLength={2} maxLength={120} readOnly={Boolean(account)} value={draft.barrio} onChange={event=>update({barrio:event.target.value})}/></label><LocationControl forPublication value={draft} onChange={point=>update({latitud:point?.latitud ?? null,longitud:point?.longitud ?? null})}/><CapacityField type={draft.tipo} value={draft.cupos} onChange={cupos=>update({cupos})}/><small>Usa una zona de referencia, sin direcciones privadas.</small></details>
      <button className="button primary wide" disabled={busy || (review && readOnly)}>{busy?'Un momento…':review?resource?'Publicar recurso':'Publicar pedido de apoyo':'Revisar apoyo'}<ArrowRight size={17}/></button>
      {review && readOnly && <p className="ai-hint" role="status">Necesitas conexión para publicar. El borrador se conserva.</p>}
    </form>
    <p className="draft-note">El apoyo se coordina por privado. Publicar no envía avisos masivos.</p>
  </section>;
}
