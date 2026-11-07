import { useState } from 'react';
import { isActive } from '../lib/lifecycle.js';

export default function LifecycleActions({ publication, own, busy, onAction }) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const state = publication.estado;
  return <section className="lifecycle-actions" aria-label="Estado de la publicación">
    {state === 'resuelta' && <p className="resolved">Esta publicación ya está cerrada.</p>}
    {state === 'cancelada' && <><p className="privacy">Esta publicación fue cancelada.</p><p>Motivo: {publication.motivo_cancelacion}</p></>}
    {state === 'vencida' && <p className="privacy">Venció después de 7 días sin respuestas. Su historial se conserva.{own && ' Puedes renovarla por otros 7 días.'}</p>}
    {own && isActive(publication) && <button className="button primary" disabled={busy} onClick={() => onAction('resolver')}>Marcar como resuelta</button>}
    {own && state === 'vencida' && <button className="button primary" disabled={busy} onClick={() => onAction('renovar')}>Renovar por 7 días</button>}
    {own && !['resuelta', 'cancelada'].includes(state) && <>
      {!cancelling ? <button className="text-button" disabled={busy} onClick={() => setCancelling(true)}>Cancelar publicación</button> :
        <form className="panel" onSubmit={async event => {
          event.preventDefault();
          if (await onAction('cancelar', reason)) { setCancelling(false); setReason(''); }
        }}>
          <label>Motivo de cancelación<textarea required minLength={5} maxLength={300} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} placeholder="Ej.: Ya no necesito esta ayuda." /></label>
          <small>Este motivo aparecerá en el historial. Evita incluir datos personales.</small>
          <div className="lifecycle-buttons"><button className="button secondary" disabled={busy}>Confirmar cancelación</button><button type="button" className="text-button" disabled={busy} onClick={() => setCancelling(false)}>Volver sin cancelar</button></div>
        </form>}
    </>}
    {!isActive(publication) && <p className="ai-hint">Conservamos participantes y valoraciones en Mi actividad → Historial.</p>}
  </section>;
}
