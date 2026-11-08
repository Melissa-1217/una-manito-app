import { useEffect, useState } from 'react';
import { Phone, ExternalLink } from 'lucide-react';
import { listSupport, nationalContacts, safeSupportLink } from '../lib/support.js';
import { readSupportSnapshot, saveSupportSnapshot } from '../lib/offline.js';

export default function SupportDirectory({ account, online, offlineSession }) {
  const [state, setState] = useState(() => ({ contacts: account ? readSupportSnapshot(account)?.contacts || [] : nationalContacts, savedAt: account ? readSupportSnapshot(account)?.savedAt : null, loading: Boolean(account && online && !offlineSession), error: '', cached: Boolean(account) }));
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!account || !online || offlineSession) return;
    let active = true;
    listSupport().then(contacts => {
      if (!active) return;
      let savedAt = new Date().toISOString();
      try { savedAt = saveSupportSnapshot(account, contacts).savedAt; } catch { /* La consulta sigue disponible en memoria. */ }
      setState({ contacts, savedAt, loading: false, error: '', cached: false });
    }).catch(() => { if (active) setState(previous => ({ ...previous, loading: false, error: 'No pudimos actualizar el directorio. Los contactos guardados pueden haber cambiado.', cached: true })); });
    return () => { active = false; };
  }, [account, online, offlineSession, retry]);
  const contacts = state.contacts.filter(contact => contact.ambito === 'nacional' || contact.barrio === account?.barrio);
  const cached = state.cached || !online || offlineSession;
  return <section className="support-directory" aria-label="Directorio de apoyo" aria-busy={state.loading}>
    <h2>Contactos de apoyo</h2>
    <p>Contactos revisados, sin confirmación de disponibilidad ni tiempo de respuesta.</p>
    {state.loading && <p role="status">Actualizando contactos…</p>}
    {state.error && <div role="status"><p>{state.error}</p>{online && !offlineSession && <button className="button secondary" onClick={() => setRetry(value => value + 1)}>Reintentar directorio</button>}</div>}
    {cached && <p className="emergency-note">Copia guardada{state.savedAt ? ` el ${new Date(state.savedAt).toLocaleString('es-PE')}` : ': no hay contactos guardados'}. Conéctate para comprobar cambios.</p>}
    <div className="support-grid">{contacts.map(contact => {
      const source = safeSupportLink(contact.fuente_url);
      const website = safeSupportLink(contact.url_contacto);
      return <article className="support-card" key={contact.id}>
        <span className="eyebrow">{contact.ambito === 'nacional' ? 'PERÚ · CONTACTO NACIONAL' : contact.barrio}</span>
        <h3>{contact.nombre}</h3><p>{contact.descripcion}</p>
        <div className="support-actions">{/^\+?[0-9]{3,15}$/.test(contact.telefono || '') && <a className="button primary" href={`tel:${contact.telefono}`}><Phone size={17} aria-hidden="true"/>Llamar al {contact.telefono}</a>}{website && <a className="button secondary" href={website} target="_blank" rel="noopener noreferrer">Abrir contacto<ExternalLink size={16} aria-hidden="true"/></a>}</div>
        <small>Contacto revisado: {contact.revisado_en}. {source && <a href={source} target="_blank" rel="noopener noreferrer">Ver fuente</a>}</small>
      </article>;
    })}</div>
    {!state.loading && !contacts.some(contact => contact.ambito === 'barrio') && <p>Aún no hay grupos locales revisados. Encuentra apoyo vecinal en «Recursos».</p>}
  </section>;
}
