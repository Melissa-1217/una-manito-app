import ManolitoTutorial from './ManolitoTutorial.jsx';
import VoiceDictation from './VoiceDictation.jsx';
import { useEffect, useRef, useState } from 'react';
import { X, Send, ArrowLeft } from 'lucide-react';
import './manito-chat.css';
import LocationControl from './LocationControl.jsx';
import CapacityField from './CapacityField.jsx';
import { validateCapacity } from '../lib/participation.js';
import { isActive } from '../lib/lifecycle.js';
import useOnline from '../lib/useOnline.js';

const modes = {
  solicitud: ['Pedir una manito', '¿Qué ayuda necesitas?'],
  ofrecimiento: ['Dar una manito', '¿Con qué tiempo o habilidad puedes ayudar?'],
  busqueda: ['Buscar un servicio', '¿Qué problema quieres resolver?'],
  guia: ['Cómo usar la app'],
};
const categories = ['Herramientas', 'Gasfitería', 'Electricidad', 'Compras y traslados', 'Clases', 'Agua y alimentos', 'Otros'];
const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function ManitoChat({ initialMode, name, barrio, posts, onClose, onOpen, onPublish, onManual, saving, loading, readOnly = false, returnFocusElement = null }) {
  const dialog = useRef(null);
  const online = useOnline();
  const bottom = useRef(null);
  const request = useRef(null);
  const [mode, setMode] = useState(initialMode);
  const [turns, setTurns] = useState([]);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [capacity, setCapacity] = useState(1);
  const [dictating, setDictating] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = returnFocusElement || document.activeElement;
    node.showModal();
    return () => {
      request.current?.abort(); node.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [returnFocusElement]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [turns, busy]);

  function choose(next) {
    request.current?.abort();
    setBusy(false); setMode(next); setTurns([]); setDraft(null); setSearch(null); setMessage(''); setError(''); setLocation(null);
    setCapacity(1);
  }

  async function send(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy || saving || dictating) return;
    if (!navigator.onLine) { setError('Sin conexión. Conserva tu mensaje o abre el formulario manual.'); return; }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/prepare-publication', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ tipo: mode, texto: text, contexto: { anterior: draft || search, mensajes: turns.slice(-3).map(t => t.text) } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No pude preparar una respuesta.');
      if (controller.signal.aborted) return;
      const item = result.propuesta;
      if (mode === 'busqueda') setSearch(item); else setDraft(item);
      setTurns(previous => [...previous, { text, reply: item.interpretacion || item.titulo }]);
      setMessage('');
    } catch (e) {
      if (!controller.signal.aborted) setError(e.message || 'No se pudo conectar con Manolito.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }

  const hits = !search ? [] : posts.filter(p => p.tipo === 'servicio' && !p.es_emergencia && isActive(p) &&
    normalize(p.barrio.trim()) === normalize(barrio.trim()) &&
    (search.categoria === 'Otros' ? search.terminos.some(t => normalize(p.titulo + ' ' + p.descripcion).includes(normalize(t))) : p.categoria === search.categoria));

  return <dialog className="manito-dialog" ref={dialog} aria-labelledby="manito-title" onCancel={e => { e.preventDefault(); if (!saving) onClose(); }}>
    <header><img src="/manolito-avatar.png" alt="" /><div><strong id="manito-title">{mode === 'guia' ? 'Aprende con Manolito' : 'Chat con Manolito'}</strong><small>{mode === 'guia' ? 'Tutorial sin publicaciones' : `Asistente de IA · ${barrio}`}</small></div>
      <button autoFocus disabled={saving} aria-label="Cerrar chat" onClick={onClose}><X /></button></header>
    <div className="chat-scroll">{mode === 'guia' ? <ManolitoTutorial name={name} onClose={onClose}/> : <>
      {!mode && <h2>Hola, {name}</h2>}
      {!mode ? <><p>¿En qué te doy una manito hoy?</p><div className="chat-choices">{Object.entries(modes).map(([id, [label]]) => <button key={id} onClick={() => choose(id)}>{label}</button>)}</div></> :
        <><button disabled={saving} className="text-button" onClick={() => choose(null)}><ArrowLeft size={16}/>Cambiar de tema</button>
          <h3>{modes[mode][0]}</h3><p>{modes[mode][1]}</p></>}
      <div aria-live="polite">{turns.map((t,i) => <div key={i}><p className="chat-user">{t.text}</p>{i < turns.length - 1 && <p className="chat-answer">{t.reply}</p>}</div>)}</div>
      {busy && <p role="status">Manolito está preparando tu respuesta…</p>}
      {draft && <form className="panel chat-draft" onSubmit={async e => {
        e.preventDefault(); if (saving || busy || readOnly) return;
        if (draft.titulo.trim().length < 5 || draft.descripcion.trim().length < 10) { setError('Completa el título y la descripción.'); return; }
        let cupos;
        try { cupos = validateCapacity({ tipo: mode, cupos: capacity }); }
        catch (failure) { setError(failure.message); return; }
        const ok = await onPublish({ tipo: mode, titulo: draft.titulo, descripcion: draft.descripcion, categoria: draft.categoria, barrio, cupos, es_emergencia: false, ...location });
        if (ok) onClose(); else setError('No se confirmó el guardado. Comprueba Mi actividad antes de reintentar.');
      }}><h3>Tu borrador</h3><label>Título del borrador<input value={draft.titulo} required minLength={5} maxLength={120} onChange={e=>setDraft({...draft,titulo:e.target.value})}/></label>
      <label>Descripción del borrador<textarea required minLength={10} maxLength={2000} value={draft.descripcion} onChange={e=>setDraft({...draft,descripcion:e.target.value})}/></label>
      <label>Categoría del borrador<select value={draft.categoria} onChange={e=>setDraft({...draft,categoria:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      {draft.por_confirmar?.length > 0 && <ul>{draft.por_confirmar.map(q=><li key={q}>{q}</li>)}</ul>}
      <LocationControl forPublication value={location} onChange={setLocation}/>
      <CapacityField type={mode} value={capacity} onChange={setCapacity}/>
      {readOnly && <p role="status">Necesitas conexión y publicaciones actualizadas para confirmar. Puedes guardar el borrador en el formulario.</p>}
      <button className="button primary wide" disabled={busy || saving || loading || readOnly}>{saving ? 'Publicando…' : 'Confirmar y publicar'}</button></form>}
      {search && <section><h3>{search.interpretacion}</h3>{hits.length ? hits.map(p=><button className="chat-result" key={p.id} onClick={()=>onOpen(p.id)}><strong>{p.titulo}</strong><span>{p.categoria} · Ver servicio →</span></button>) : <p>{loading ? 'Consultando publicaciones…' : 'Sin coincidencias en las publicaciones disponibles.'}</p>}</section>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      </>}<div ref={bottom}/></div>
    {mode && mode !== 'guia' && <footer><form onSubmit={send}><input aria-label="Mensaje para Manolito" maxLength={2000} required value={message} disabled={busy || saving || dictating} onChange={e=>setMessage(e.target.value)} placeholder={turns.length ? 'Cambia o agrega un detalle…' : 'Escribe con tus palabras…'}/><button className="button primary" aria-label="Enviar mensaje" disabled={busy || saving || dictating || !message.trim() || !online}><Send size={18}/></button></form>
    {!online && <small>La IA necesita conexión. Continúa manualmente para preparar tu borrador.</small>}
    <VoiceDictation key={mode} disabled={busy || saving} onListeningChange={setDictating} onTranscript={text => {
      const next = [message.trim(), text].filter(Boolean).join(' ');
      if (next.length > 2000) { setError('El mensaje completo supera 2000 caracteres. Acorta el texto antes de añadir el dictado.'); return false; }
      setMessage(next); setError(''); return true;
    }}/>
    <small>Gemini procesa tu mensaje. Solo se comparte lo que publiques.</small><button className="text-button" disabled={saving} onClick={()=>onManual(mode, draft ? { ...draft, barrio, cupos: capacity, ...location } : null)}>{draft ? 'Guardar borrador y continuar manualmente' : 'Continuar manualmente'}</button></footer>}
  </dialog>;
}
