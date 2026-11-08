import { useEffect, useRef, useState } from 'react';
import { MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { listMessages, MESSAGE_PAGE_SIZE, sendPrivateMessage } from '../lib/messages.js';
import { conversationWritable, mergeMessages } from '../lib/conversations.js';
import useOnline from '../lib/useOnline.js';
import './private-conversation.css';

export default function PrivateConversation({ publication, response, userId, people, remote, readOnly, demoMessages, onSendDemo, onClose, initialDraft = '', onDraftChange }) {
  const dialog = useRef(null);
  const bottom = useRef(null);
  const cursor = useRef(0);
  const initialized = useRef(false);
  const sending = useRef(false);
  const retry = useRef(null);
  const online = useOnline();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState(initialDraft);
  const [pending, setPending] = useState(false);
  const [fetching, setFetching] = useState(Boolean(remote));
  const [hasEarlier, setHasEarlier] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [ready, setReady] = useState(!remote);
  const [serverClosed, setServerClosed] = useState(false);
  const otherId = userId === publication.autor_id ? response.vecino_id : publication.autor_id;
  const otherName = people[otherId] || 'Tu vecino';
  const history = remote ? messages : (demoMessages || []).filter(message => message.ofrecimiento_id === response.id);
  const activeConversation = conversationWritable(publication, response) && !serverClosed;
  const writable = activeConversation && (!remote || (!readOnly && online));

  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    node.showModal();
    return () => { node.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [scroll]);

  useEffect(() => {
    if (!remote || !online) return;
    let active = true;
    let inFlight = false;
    async function update() {
      if (inFlight) return;
      inFlight = true;
      setFetching(true);
      try {
        const first = !initialized.current;
        const rows = await listMessages(response.id, first ? {} : { after: cursor.current });
        if (!active) return;
        setMessages(current => mergeMessages(current, rows));
        if (first) { setHasEarlier(rows.length === MESSAGE_PAGE_SIZE); setScroll(value => value + 1); }
        initialized.current = true;
        setReady(true);
        if (rows.length) { cursor.current = rows.at(-1).orden; setStatus('Mensajes actualizados.'); }
        setError('');
      } catch {
        if (active) setError('No pudimos cargar los mensajes. Revisa la conexión y pulsa Actualizar mensajes. Si es una actualización nueva, comprueba que se aplicó el SQL.');
      } finally { inFlight = false; if (active) setFetching(false); }
    }
    void update();
    const interval = setInterval(() => { if (document.visibilityState === 'visible') void update(); }, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [remote, online, response.id, refresh]);

  async function older() {
    if (fetching || !online || !history.length) return;
    setFetching(true);
    try {
      const rows = await listMessages(response.id, { before: history[0].orden });
      setMessages(current => mergeMessages(current, rows));
      setHasEarlier(rows.length === MESSAGE_PAGE_SIZE);
    } catch { setError('No se pudieron cargar los mensajes anteriores. Vuelve a intentar.'); }
    finally { setFetching(false); }
  }

  async function send(event) {
    event.preventDefault();
    if (!writable || sending.current || !text.trim() || text.trim().length > 1000 || (remote && !initialized.current)) return;
    sending.current = true;
    setPending(true); setError(''); setStatus('');
    const content = text.trim();
    if (!retry.current || retry.current.text !== content) retry.current = { id: crypto.randomUUID(), text: content };
    try {
      const row = remote ? await sendPrivateMessage(response.id, content, retry.current.id) : await onSendDemo(content, retry.current.id);
      if (remote) setMessages(current => mergeMessages(current, [row]));
      setText(''); onDraftChange?.(''); retry.current = null;
      setStatus('Mensaje enviado.'); setScroll(value => value + 1);
    } catch (failure) {
      if (failure.message?.includes('CONVERSATION_CLOSED')) setServerClosed(true);
      setError(failure.message?.includes('CONVERSATION_CLOSED') ? 'La publicación ya está cerrada o la respuesta no admite más mensajes. Conservamos tu texto.' : 'No se confirmó el envío. Conservamos tu texto. Si lo reintentas sin editarlo, comprobaremos el mismo mensaje para evitar duplicados.');
    } finally { sending.current = false; setPending(false); }
  }

  return <dialog ref={dialog} className="private-dialog" aria-labelledby="private-title" onCancel={event => { event.preventDefault(); if (!sending.current) onClose(); }}>
    <header><span className="private-symbol"><MessageCircle size={23} aria-hidden="true"/></span><div><h2 id="private-title">Conversación con {otherName}</h2><p>{publication.titulo}</p></div><button aria-label="Cerrar conversación" autoFocus disabled={pending} onClick={onClose}><X size={22}/></button></header>
    <p className="private-scope">Esta conversación es privada entre {otherName} y tú. {remote ? 'Los mensajes no se envían a Manolito ni se guardan en la copia offline.' : 'Esta es una demostración: los mensajes de ejemplo se guardan en este navegador.'}</p>
    <div className="private-toolbar">{remote && <button className="text-button" disabled={!online || fetching} onClick={() => setRefresh(value => value + 1)}><RotateCcw size={15} aria-hidden="true"/>{fetching ? 'Actualizando mensajes…' : 'Actualizar mensajes'}</button>}<span role="status">{status}</span></div>
    <div className="private-scroll">
      {hasEarlier && <button className="button secondary" disabled={fetching || !online} onClick={older}>Ver mensajes anteriores</button>}
      <ol aria-label="Historial de mensajes privados">
        <li className={`private-message ${response.vecino_id === userId ? 'mine' : ''}`}><strong>{response.vecino_id === userId ? 'Tú' : people[response.vecino_id] || 'Vecino'}</strong><p>{response.mensaje}</p><small>Mensaje inicial</small></li>
        {history.map(message => <li className={`private-message ${message.autor_id === userId ? 'mine' : ''}`} key={message.id}><strong>{message.autor_id === userId ? 'Tú' : people[message.autor_id] || otherName}</strong><p>{message.contenido}</p><time dateTime={message.creado_en}>{new Date(message.creado_en).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</time></li>)}
      </ol>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div ref={bottom}/>
    </div>
    <footer>{!writable && <p>{!online && remote ? 'Sin conexión: conservamos el texto mientras esta conversación siga abierta. Necesitas internet para enviar y actualizar.' : remote && readOnly ? 'Espera a tener conexión y publicaciones actualizadas para enviar.' : 'La conversación está cerrada. Puedes consultar su historial.'}</p>}
      <form onSubmit={send}><label htmlFor="private-message-text">Mensaje privado</label><textarea id="private-message-text" required maxLength={1000} value={text} readOnly={!activeConversation} disabled={pending || !ready} onChange={event => { retry.current = null; setText(event.target.value); onDraftChange?.(event.target.value); }}/><button className="button primary" disabled={!writable || pending || !text.trim() || !ready}><Send size={17} aria-hidden="true"/>{pending ? 'Enviando…' : 'Enviar mensaje privado'}</button></form>
    </footer>
  </dialog>;
}
