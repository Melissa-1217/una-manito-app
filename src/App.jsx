import { sendResponse, acceptResponse } from './lib/responses.js';
import ManitoChat from './components/ManitoChat.jsx';
import { useEffect, useRef, useState } from 'react';
import { House, Wrench, Plus, ClipboardList, HandHeart, MapPin, ArrowRight, ArrowLeft, Search, ShieldCheck, AlertTriangle, Check, RotateCcw, X } from 'lucide-react';
import PublicationCard, { statusLabels } from './components/PublicationCard.jsx';
import AiPublicationAssistant from './components/AiPublicationAssistant.jsx';
import { listPublications, createPublication, closePublication } from './lib/publications.js';
import { people as demoPeople, initialData, offerHelp, acceptOffer, resolvePublication, recommendHelper, helperHistory } from './lib/demo.js';

const STORE = 'una-manito-demo-v1';
const emptyDraft = { tipo: 'solicitud', titulo: '', descripcion: '', categoria: 'Herramientas', barrio: 'Barrio Demo', es_emergencia: false };
const navItems = [{ id: 'inicio', label: 'Mi barrio', icon: House }, { id: 'servicios', label: 'Servicios', icon: Wrench }, { id: 'publicar', label: 'Publicar', icon: Plus }, { id: 'actividad', label: 'Mi actividad', icon: ClipboardList }];

function loadData(storageKey) {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(data?.publicaciones) && Array.isArray(data?.ofrecimientos)) return data;
  } catch { /* Si el almacenamiento no está disponible, usar la demo en memoria. */ }
  return structuredClone(initialData);
}

export default function App({ account, onSignOut, onExitDemo }) {
  const storageKey = account ? `${STORE}-${account.id}` : STORE;
  const neighborhood = account?.barrio || 'Barrio Demo · San Miguel';
  const newDraft = { ...emptyDraft, barrio: account?.barrio || emptyDraft.barrio };
  const [data, setStoredData] = useState(() => account ? { publicaciones: [], ofrecimientos: [] } : loadData(storageKey));
  const [user, setUser] = useState(account?.id || 'ana');
  const [chat, setChat] = useState(null);
  const [view, setView] = useState('inicio');
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [serviceIntent, setServiceIntent] = useState(null);
  const [draft, setDraft] = useState(newDraft);
  const [review, setReview] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [loading, setLoading] = useState(Boolean(account));
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [saving, setSaving] = useState(false);
  const mutationPending = useRef(false);
  const loadVersion = useRef(0);
  const people = {
    ...demoPeople,
    ...Object.fromEntries(data.ofrecimientos.map(o => [o.vecino_id, o.perfiles?.nombre || demoPeople[o.vecino_id] || "Vecino"])),
    ...Object.fromEntries(data.publicaciones.map((post) => [post.autor_id, post.perfiles?.nombre || demoPeople[post.autor_id] || 'Vecino'])),
    ...(account ? { [account.id]: account.nombre } : {}),
  };

  useEffect(() => {
    if (!account) return;
    let active = true;
    const version = ++loadVersion.current;
    async function load() {
      try {
        const publications = await listPublications();
        if (active && version === loadVersion.current) {
          setStoredData({ publicaciones: publications, ofrecimientos: publications.flatMap(p => p.ofrecimientos || []) });
          setLoadError('');
        }
      } catch {
        if (active && version === loadVersion.current) setLoadError('No pudimos cargar las publicaciones. Revisa tu conexión y vuelve a intentar.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [account, refresh]);

  function refreshPublications() {
    if (saving) return;
    setLoading(true);
    setRefresh((previous) => previous + 1);
  }

  function setData(next) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setStorageError(true); }
    setStoredData(next);
  }

  function navigate(next) { setView(next); setSelected(null); setReview(false); setMessage(''); setQuery(''); setServiceIntent(null); setNotice(''); }
  function open(id) { setSelected(id); setMessage(''); setNotice(''); }
  function perform(action, success) {
    try { setData(action(data)); setNotice(success); }
    catch (error) { setNotice(error.message); }
  }
  function startPublication(type = 'solicitud', emergency = false) { navigate('publicar'); setDraft({ ...newDraft, tipo: type, es_emergencia: emergency }); }
  async function publish(confirmedDraft = draft) {
    if (mutationPending.current) return;
    mutationPending.current = true;
    setSaving(true);
    try {
      const publication = account
        ? await createPublication(confirmedDraft, account.id)
        : { ...confirmedDraft, titulo: confirmedDraft.titulo.trim(), descripcion: confirmedDraft.descripcion.trim(), barrio: confirmedDraft.barrio.trim(), id: crypto.randomUUID(), autor_id: user, estado: 'pendiente' };
      loadVersion.current += 1;
      if (account) setStoredData((current) => ({ ...current, publicaciones: [publication, ...current.publicaciones.filter((post) => post.id !== publication.id)] }));
      else setData({ ...data, publicaciones: [publication, ...data.publicaciones] });
      setReview(false); setView('actividad'); setSelected(publication.id); setDraft(newDraft); setNotice(account ? 'Publicación guardada en tu comunidad.' : '¡Tu publicación ya está en el barrio!');
      return true;
    } catch {
      setNotice('No se pudo confirmar la publicación. Conservamos tus datos. Actualiza la lista para comprobar si se guardó antes de volver a publicar.');
      return false;
    } finally {
      mutationPending.current = false;
      setSaving(false);
    }
  }

  async function resolveSelected() {
    if (!account) {
      perform((current) => resolvePublication(current, publication.id, user), '¡Solicitud resuelta! Gracias por construir comunidad.');
      return;
    }
    if (mutationPending.current) return;
    mutationPending.current = true;
    setSaving(true);
    try {
      const updated = await closePublication(publication.id, account.id);
      loadVersion.current += 1;
      setStoredData((current) => ({ ...current, publicaciones: current.publicaciones.map((post) => post.id === updated.id ? updated : post) }));
      setNotice('Solicitud marcada como resuelta.');
    } catch { setNotice('No se pudo cerrar la solicitud. Revisa tu conexión e intenta nuevamente.'); }
    finally { mutationPending.current = false; setSaving(false); }
  }
  async function respond() {
    if (!account) {
      perform(current => offerHelp(current, selected, user, message, crypto.randomUUID()), 'Tu respuesta quedó registrada en esta demo.');
      return;
    }
    if (mutationPending.current || !message.trim()) return;
    mutationPending.current = true;
    setSaving(true);
    try {
      const row = await sendResponse(selected, account.id, message);
      loadVersion.current += 1;
      setStoredData(current => ({ ...current, ofrecimientos: [...current.ofrecimientos.filter(o => o.id !== row.id), row] }));
      setMessage('');
      setNotice('Respuesta enviada. El autor podrá leerla en su publicación.');
    } catch (error) {
      setNotice(error.code === '23505' ? 'Ya respondiste. Actualiza las publicaciones para ver tu mensaje.' : 'No se pudo confirmar el envío. Actualiza las publicaciones antes de reintentar.');
    } finally { mutationPending.current = false; setSaving(false); }
  }

  async function accept(id) {
    if (!account) {
      perform(current => acceptOffer(current, id, user), 'Ayuda aceptada. Ya están en coordinación.');
      return;
    }
    if (mutationPending.current) return;
    mutationPending.current = true;
    setSaving(true);
    try {
      await acceptResponse(id);
      setNotice('Respuesta aceptada.');
      setLoading(true);
      setRefresh(n => n + 1);
    } catch {
      setNotice('No se pudo confirmar la aceptación. Actualiza la publicación para revisar su estado.');
    } finally { mutationPending.current = false; setSaving(false); }
  }
  const publication = data.publicaciones.find((p) => p.id === selected);
  const offers = data.ofrecimientos.filter((o) => o.publicacion_id === selected);
  const alreadyOffered = offers.some((o) => o.vecino_id === user);
  const own = publication?.autor_id === user;
  const filtered = data.publicaciones.filter((p) => {
    if (account && p.barrio.trim().toLocaleLowerCase('es') !== account.barrio.trim().toLocaleLowerCase('es')) return false;
    if (view === 'servicios' && serviceIntent) {
      const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const matchesIntent = serviceIntent.categoria === 'Otros'
        ? serviceIntent.terminos.some((term) => normalize(`${p.titulo} ${p.descripcion} ${p.categoria}`).includes(normalize(term)))
        : p.categoria === serviceIntent.categoria;
      if (!matchesIntent) return false;
    }
    const matchesView = view === 'servicios' ? p.tipo === 'servicio' : view === 'emergencia' ? p.es_emergencia : view === 'actividad' ? p.autor_id === user || data.ofrecimientos.some((o) => o.publicacion_id === p.id && o.vecino_id === user) : true;
    return matchesView && `${p.titulo} ${p.descripcion} ${p.categoria}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'));
  });

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); navigate('inicio'); }}><span className="brand-mark"><HandHeart size={28} /></span><span>Una Manito</span></a>
      <nav aria-label="Navegación principal">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={20} />{label}{view === id && <span className="nav-dot" />}</button>)}</nav>
      <button className={`nav-item emergency-link ${view === 'emergencia' ? 'active' : ''}`} onClick={() => navigate('emergencia')}><AlertTriangle size={20} />Apoyo en emergencia</button>
    </aside>
    <div className="workspace">
      <header className="topbar"><span className="topbar-location"><MapPin size={16} />{neighborhood}</span>{account ? <button className="account-menu" onClick={onSignOut}><span className="avatar">{account.nombre[0]}</span><span>{account.nombre}</span><span>Cerrar sesión</span></button> : <label className="user-switch"><span className="avatar">{people[user][0]}</span><select aria-label="Cambiar usuario de demostración" value={user} onChange={(e) => { setUser(e.target.value); setSelected(null); setMessage(''); setNotice(''); }}><option value="ana">Ana · demo</option><option value="luis">Luis · demo</option></select></label>}</header>
      <div className="demo-banner"><span><strong>{account ? "Cuenta conectada" : "Demostración"}</strong> {account ? "" : "Datos ilustrativos guardados en este navegador."}</span>{account ? <button disabled={loading || saving} onClick={refreshPublications}><RotateCcw size={13} />{loading ? "Actualizando…" : "Actualizar publicaciones"}</button> : <button onClick={() => { if (window.confirm('¿Restablecer los datos de ejemplo? Se borrarán las publicaciones de esta demo local.')) { setData(structuredClone(initialData)); navigate('inicio'); } }}><RotateCcw size={13} />Reiniciar demo</button>}{!account && <button onClick={onExitDemo}>Volver al acceso</button>}</div>
      {storageError && <p className="notice" role="alert">No se pudo guardar en este navegador. Los cambios durarán mientras mantengas esta página abierta.</p>}
      <main id="contenido">{account && loading && <p role="status">Cargando publicaciones…</p>}{account && loadError && <div className="auth-error" role="alert">{loadError}<button className="text-button" onClick={refreshPublications}>Volver a intentar</button></div>}
        {view === 'inicio' && !selected && <button className="mobile-emergency" onClick={() => navigate('emergencia')}><AlertTriangle size={16} />Apoyo en emergencia<ArrowRight size={16} /></button>}
        {notice && <div className="notice" role="status"><Check size={18} /><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={16} /></button></div>}
        {publication ? <section className="detail-page"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={16} />Volver</button><div className="detail-heading"><span className="eyebrow">{publication.categoria}</span><span className={`badge ${publication.estado}`}>{statusLabels[publication.estado]}</span></div><h1>{publication.titulo}</h1><p className="muted"><MapPin size={15} />{publication.barrio} · Publicado por {people[publication.autor_id]}</p><div className="panel"><p className="description">{publication.descripcion}</p><div className="privacy"><ShieldCheck size={19} />Esta publicación muestra una zona de referencia.</div></div>
          {publication.tipo === 'servicio' && !account ? <div className="panel"><h2>Visto Bueno Vecinal</h2><p className="muted">Las recomendaciones y el contacto del prestador se incorporarán en la siguiente etapa.</p></div> : <>
            {!own && publication.estado !== 'resuelta' && !alreadyOffered && <form className="panel" onSubmit={(e) => { e.preventDefault(); void respond(); }}><h2>{publication.tipo === 'ofrecimiento' ? 'Coordina con tu vecino' : '¿Cómo puedes ayudar?'}</h2><label>Tu mensaje<textarea required minLength={2} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe cómo te gustaría coordinar con tu vecino." /></label><button className="button primary" disabled={saving || loading} type="submit"><HandHeart size={18} />{publication.tipo === 'servicio' ? 'Solicitar servicio' : publication.tipo === 'ofrecimiento' ? 'Me interesa' : 'Yo te ayudo'}</button></form>}
            {alreadyOffered && <p className="privacy"><Check size={18} />Ya enviaste una respuesta. Puedes verla en Mi actividad.</p>}
            <div className="panel"><h2>{own ? 'Respuestas de tus vecinos' : 'Tu respuesta'}</h2>{offers.filter((o) => own || o.vecino_id === user).length === 0 ? <p className="muted">Todavía no hay respuestas para mostrar.</p> : offers.filter((o) => own || o.vecino_id === user).map((o) => {
              const history = helperHistory(data, o.vecino_id);
              return <div className="offer" key={o.id}><div><strong>{people[o.vecino_id]}</strong><p>{o.mensaje}</p><span className="badge">{o.estado === 'aceptado' ? 'Aceptado' : o.estado === 'rechazado' ? 'Rechazado' : 'Por confirmar'}</span>
                {own && !account && <section className="helper-history">
                  <strong>Referencias del barrio</strong>
                  <p>{history.total ? `Ayudas aceptadas en solicitudes cerradas: ${history.total}.` : 'Todavía no hay ayudas anteriores registradas.'}</p>
                  <p>{history.neighbors ? `Vecinos que le dieron su visto bueno: ${history.neighbors}.` : 'Sin recomendaciones por ahora.'}</p>
                </section>}
                </div>{own && o.estado === 'pendiente' && publication.estado !== 'resuelta' && <button className="button secondary" disabled={saving || loading} onClick={() => accept(o.id)}>Aceptar ayuda</button>}
                {own && !account && publication.estado === 'resuelta' && o.estado === 'aceptado' &&
                  (o.recomendado ? <span className="badge">Diste tu visto bueno</span> :
                  <button className="button secondary" onClick={() => perform((current) => recommendHelper(current, o.id, user), 'Tu recomendación quedó registrada.')}>Cumplió lo acordado. Recomendar</button>)}
              </div>;
            })}</div>
          </>}
          {own && publication.estado !== 'resuelta' && <button className="button primary" disabled={saving} onClick={resolveSelected}><Check size={18} />Marcar como resuelta</button>}
          {publication.estado === 'resuelta' && <div className="resolved"><HandHeart size={25} /><span>Esta publicación ya está cerrada.</span></div>}
        </section> : view === 'publicar' ? <section className="form-page"><button className="text-button" onClick={() => review ? setReview(false) : navigate('inicio')}><ArrowLeft size={16} />{review ? 'Editar publicación' : 'Volver al barrio'}</button><span className="eyebrow">{review ? 'PASO 2 DE 2' : 'PASO 1 DE 2'}</span><h1>{review ? `¿Así está bien, ${people[user]}?` : 'Nueva publicación'}</h1>
          {review ? <div className="panel review"><span className="badge">{draft.categoria}</span><h2>{draft.titulo}</h2><p>{draft.descripcion}</p><p className="muted"><MapPin size={16} />{draft.barrio}</p>{draft.es_emergencia && <span className="badge emergency-badge">Apoyo en emergencia</span>}<div className="privacy"><ShieldCheck size={19} />Solo compartimos tu zona, no tu dirección exacta.</div><button className="button primary wide" disabled={saving || loading} onClick={() => publish()}>Publicar {draft.tipo === 'solicitud' ? 'solicitud' : draft.tipo === 'servicio' ? 'servicio' : 'ofrecimiento'}<ArrowRight size={18} /></button></div> : <form className="panel publish-form" onSubmit={(e) => { e.preventDefault(); if (draft.titulo.trim().length < 5 || draft.descripcion.trim().length < 10 || draft.barrio.trim().length < 2) { setNotice('Completa el título, la descripción y el barrio con más detalle.'); return; } setNotice(''); setReview(true); }}><details className="optional-assistant"><summary>Redactar con IA</summary><AiPublicationAssistant key={draft.tipo} type={draft.tipo} onApply={(proposal) => { setDraft({ ...draft, ...proposal }); setNotice('Propuesta aplicada. Revisa los campos antes de publicar.'); }} /></details><fieldset><legend>¿Qué quieres compartir?</legend><div className="type-options">{[['solicitud', 'Necesito ayuda'], ['ofrecimiento', 'Ofrezco ayuda'], ['servicio', 'Un servicio']].map(([type, label]) => <button key={type} type="button" aria-pressed={draft.tipo === type} className={draft.tipo === type ? 'selected' : ''} onClick={() => setDraft({ ...draft, tipo: type })}>{label}</button>)}</div></fieldset><label>Título<input required minLength={5} maxLength={120} value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} placeholder="Ej.: Necesito una escalera prestada" /></label><label>Cuéntale un poco más al barrio<textarea required minLength={10} maxLength={2000} value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} placeholder="¿Qué necesitas u ofreces y para cuándo?" /></label><div className="form-row"><label>Categoría<select value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}>{['Herramientas', 'Gasfitería', 'Electricidad', 'Compras y traslados', 'Clases', 'Agua y alimentos', 'Otros'].map((c) => <option key={c}>{c}</option>)}</select></label><label>Barrio<input required minLength={2} maxLength={120} readOnly={Boolean(account)} value={draft.barrio} onChange={(e) => setDraft({ ...draft, barrio: e.target.value })} /></label></div><label className="checkbox"><input type="checkbox" checked={draft.es_emergencia} onChange={(e) => setDraft({ ...draft, es_emergencia: e.target.checked })} />Es una necesidad o recurso de apoyo en emergencia</label><button type="submit" className="button primary wide">Revisar publicación<ArrowRight size={18} /></button></form>}
        </section> : <>
          {view === 'inicio' ? <><section className="home-intro">
            <h1>Hola, {people[user]}</h1>
            <div className="home-actions">
              <button className="button primary" onClick={() => setChat({mode: 'solicitud'})}><HandHeart size={19} />Pedir una manito</button>
              <button className="button secondary" onClick={() => setChat({mode: 'ofrecimiento'})}><Plus size={19} />Ofrece una manito</button>
              <button className="button secondary" onClick={() => setChat({mode: 'busqueda'})}><Search size={19} />Busca un servicio</button>
            </div>
          </section></> : <section className="page-heading"><h1>{view === 'servicios' ? 'Servicios del barrio' : view === 'emergencia' ? 'Nos apoyamos en emergencia' : 'Mi actividad'}</h1>{view === 'emergencia' && <><div className="emergency-note"><AlertTriangle size={19} />Apoyo vecinal. No reemplaza a los servicios de emergencia.</div><button className="button primary" onClick={() => startPublication('solicitud', true)}>Publicar necesidad o recurso<Plus size={17} /></button></>}</section>}
          <section className="feed">{view === 'servicios' && <><details className="optional-assistant"><summary>Buscar con IA</summary><AiPublicationAssistant type="busqueda" onApply={(intent) => { setServiceIntent(intent); setQuery(''); }} /></details>{serviceIntent && <div className="notice"><span>{serviceIntent.interpretacion} · Resultados de publicaciones existentes.</span><button onClick={() => setServiceIntent(null)} aria-label="Quitar filtro de IA"><X size={16} /></button></div>}</>}<div className="section-heading"><div>{view === 'inicio' && <h2>Publicaciones del barrio</h2>}</div><span className="result-count">{filtered.length} publicaciones</span></div><label className="search-box"><Search size={19} /><input aria-label="Buscar publicaciones" placeholder="Busca una necesidad, un oficio o una herramienta…" value={query} onChange={(e) => setQuery(e.target.value)} /></label><div className="publication-grid" aria-busy={loading}>{filtered.map((p) => <PublicationCard key={p.id} publication={p} onOpen={open} />)}</div>{!loading && !loadError && filtered.length === 0 && <div className="empty"><HandHeart size={35} /><p>No hay publicaciones que coincidan con tu búsqueda.</p><button className="button secondary" onClick={() => startPublication()}>Publicar en mi barrio</button></div>}</section>
        </>}
      </main>
      {view === 'inicio' && !selected && <>
        <button className="manito-launch" onClick={() => setChat({mode: null})}><img src="/manito.png" alt=""/>Chat con Manito</button>
      </>}
      {chat && <ManitoChat initialMode={chat.mode} name={people[user]} barrio={account?.barrio || emptyDraft.barrio}
        posts={data.publicaciones} saving={saving} loading={loading} onClose={() => setChat(null)} onPublish={publish}
        onOpen={id => { setChat(null); navigate('servicios'); open(id); }}
        onManual={mode => { setChat(null); if (mode === 'busqueda') navigate('servicios'); else startPublication(mode); }}
      />}
    </div>
    <nav className="mobile-nav" aria-label="Navegación móvil">{navItems.map(({ id, label, icon: Icon }) => <button key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'active' : ''} onClick={() => navigate(id)}><Icon size={21} /><span>{label}</span></button>)}</nav>
  </div>;
}

