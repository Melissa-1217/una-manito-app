import SkipLink from './components/SkipLink.jsx';
import VoiceDictation from './components/VoiceDictation.jsx';
import LifecycleActions from './components/LifecycleActions.jsx';
import { changeDemoLifecycle, initializeDemoDates, isActive, publicationState, WEEK_MS } from './lib/lifecycle.js';
import CapacityField from './components/CapacityField.jsx';
import Participants from './components/Participants.jsx';
import { availableSlots, validateCapacity } from './lib/participation.js';
import NeighborProfile, { RecommendAction } from './components/NeighborProfile.jsx';
import LocationControl from './components/LocationControl.jsx';
import PublicationMap from './components/PublicationMap.jsx';
import { distanceKm, formatDistance } from './lib/location.js';
import { sendResponse, acceptResponse } from './lib/responses.js';
import ManitoChat from './components/ManitoChat.jsx';
import { useEffect, useRef, useState } from 'react';
import { CircleHelp, House, Wrench, Plus, ClipboardList, HandHeart, MapPin, ArrowRight, ArrowLeft, Search, ShieldCheck, AlertTriangle, Check, RotateCcw, X } from 'lucide-react';
import PublicationCard, { statusLabels } from './components/PublicationCard.jsx';
import AiPublicationAssistant from './components/AiPublicationAssistant.jsx';
import { listPublications, createPublication, closePublication, changePublicationLifecycle } from './lib/publications.js';
import { people as demoPeople, initialData, offerHelp, acceptOffer, recommendHelper, helperHistory } from './lib/demo.js';

const STORE = 'una-manito-demo-v1';
const emptyDraft = { tipo: 'solicitud', titulo: '', descripcion: '', categoria: 'Herramientas', cupos: 1, barrio: 'Barrio Demo', es_emergencia: false };
const navItems = [{ id: 'inicio', label: 'Mi barrio', icon: House }, { id: 'servicios', label: 'Servicios', icon: Wrench }, { id: 'publicar', label: 'Publicar', icon: Plus }, { id: 'actividad', label: 'Mi actividad', icon: ClipboardList }];

function loadData(storageKey) {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(data?.publicaciones) && Array.isArray(data?.ofrecimientos)) {
      const initialized = initializeDemoDates(data);
      try { localStorage.setItem(storageKey, JSON.stringify(initialized)); } catch { /* Conservar los datos en memoria aunque no se puedan actualizar sus fechas. */ }
      return initialized;
    }
  } catch { /* Si el almacenamiento no está disponible, usar la demo en memoria. */ }
  return initializeDemoDates(structuredClone(initialData));
}

export default function App({ account, onSignOut, onExitDemo, onChangeNeighborhood }) {
  const storageKey = account ? `${STORE}-${account.id}` : STORE;
  const neighborhood = account?.barrio || 'Barrio Demo · San Miguel';
  const newDraft = { ...emptyDraft, barrio: account?.barrio || emptyDraft.barrio };
  const [data, setStoredData] = useState(() => account ? { publicaciones: [], ofrecimientos: [] } : loadData(storageKey));
  const [user, setUser] = useState(account?.id || 'ana');
  const [chat, setChat] = useState(null);
  const [view, setView] = useState('inicio');
  const [activityTab, setActivityTab] = useState('activas');
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const [selected, setSelected] = useState(null);
  const [origin, setOrigin] = useState(null);
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
        : { ...confirmedDraft, titulo: confirmedDraft.titulo.trim(), descripcion: confirmedDraft.descripcion.trim(), barrio: confirmedDraft.barrio.trim(), cupos: validateCapacity(confirmedDraft), creado_en: new Date().toISOString(), vence_en: new Date(Date.now() + WEEK_MS).toISOString(), primera_respuesta_en: null, id: crypto.randomUUID(), autor_id: user, estado: 'pendiente' };
      loadVersion.current += 1;
      if (account) setStoredData((current) => ({ ...current, publicaciones: [publication, ...current.publicaciones.filter((post) => post.id !== publication.id)] }));
      else setData({ ...data, publicaciones: [publication, ...data.publicaciones] });
      setReview(false); setView('actividad'); setActivityTab('activas'); setSelected(publication.id); setDraft(newDraft); setNotice(account ? 'Publicación guardada en tu comunidad.' : '¡Tu publicación ya está en el barrio!');
      return true;
    } catch {
      setNotice('No se pudo confirmar la publicación. Conservamos tus datos. Actualiza la lista para comprobar si se guardó antes de volver a publicar.');
      return false;
    } finally {
      mutationPending.current = false;
      setSaving(false);
    }
  }

  async function changeLifecycle(action, reason = '') {
    if (mutationPending.current) return false;
    mutationPending.current = true;
    setSaving(true);
    try {
      if (account) {
        const updated = action === 'resolver' ? await closePublication(publication.id, account.id) : await changePublicationLifecycle(publication.id, action, reason);
        loadVersion.current += 1;
        setStoredData(current => ({ ...current, publicaciones: current.publicaciones.map(post => post.id === updated.id ? { ...post, ...updated } : post) }));
      } else setData(changeDemoLifecycle(data, publication.id, user, action, reason));
      setView('actividad'); setActivityTab(action === 'renovar' ? 'activas' : 'historial');
      setNotice(action === 'resolver' ? 'Publicación resuelta. Conservamos el historial y las valoraciones.' : action === 'renovar' ? 'Publicación renovada por 7 días.' : 'Publicación cancelada. Conservamos su historial.');
      return true;
    } catch (error) {
      setNotice(account ? 'No se pudo confirmar el cambio. Actualiza la lista para comprobar su estado antes de reintentar.' : error.message);
      return false;
    } finally { mutationPending.current = false; setSaving(false); }
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
      setNotice(error.message?.includes('CAPACITY_FULL') ? 'Los cupos se completaron. Actualiza la publicación.' : error.message?.includes('PUBLICATION_CLOSED') ? 'La publicación ya está cerrada. Actualiza la lista.' : error.code === '23505' ? 'Ya respondiste. Actualiza las publicaciones para ver tu mensaje.' : 'No se pudo confirmar el envío. Actualiza las publicaciones antes de reintentar.');
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
    } catch (error) {
      setNotice(error.message?.includes('CAPACITY_FULL') ? 'El último cupo ya fue ocupado. Actualiza la publicación para ver los participantes.' : 'No se pudo confirmar la aceptación. Actualiza la publicación para revisar su estado.');
    } finally { mutationPending.current = false; setSaving(false); }
  }
  const publications = data.publicaciones.map(post => ({ ...post, estado: publicationState(post, now, data.ofrecimientos.some(response => response.publicacion_id === post.id)) }));
  const publication = publications.find((p) => p.id === selected);
  const offers = data.ofrecimientos.filter((o) => o.publicacion_id === selected);
  const alreadyOffered = offers.some((o) => o.vecino_id === user);
  const own = publication?.autor_id === user;
  const remainingSlots = publication ? availableSlots(publication, offers) : null;
  const filtered = publications.filter((p) => {
    if (view === 'actividad' ? (activityTab === 'activas') !== isActive(p) : !isActive(p)) return false;
    if (account && view !== 'actividad' && p.barrio.trim().toLocaleLowerCase('es') !== account.barrio.trim().toLocaleLowerCase('es')) return false;
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
  if (origin) filtered.sort((a,b) => distanceKm(origin,a) - distanceKm(origin,b));

  return <><SkipLink/><div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); navigate('inicio'); }}><span className="brand-mark"><HandHeart size={28} /></span><span>Una Manito</span></a>
      <nav aria-label="Navegación principal">{navItems.map(({ id, label, icon: Icon }) => <button key={id} aria-current={view === id ? 'page' : undefined} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={20} />{label}{view === id && <span className="nav-dot" />}</button>)}</nav>
      <button className={`nav-item emergency-link ${view === 'emergencia' ? 'active' : ''}`} onClick={() => navigate('emergencia')}><AlertTriangle size={20} />Apoyo en emergencia</button>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="topbar-community"><span className="topbar-location"><MapPin size={16} />{neighborhood}</span>{account && <button className="change-neighborhood" disabled={saving} onClick={() => {
        if ((draft.titulo.trim() || draft.descripcion.trim() || message.trim()) && !window.confirm('Tienes un texto sin publicar. Si cambias de barrio se descartará. ¿Continuar?')) return;
        onChangeNeighborhood?.();
      }}>Cambiar barrio</button>}</div><div className="topbar-actions"><button className="tutorial-entry" aria-label="Cómo usar la app" title="Cómo usar la app" onClick={() => setChat({ mode: 'guia' })}><CircleHelp size={20}/><span>Cómo usar la app</span></button>{account ? <button className="account-menu" onClick={onSignOut}><span className="avatar">{account.nombre[0]}</span><span>{account.nombre}</span><span>Cerrar sesión</span></button> : <label className="user-switch"><span className="avatar">{people[user][0]}</span><select aria-label="Cambiar usuario de demostración" value={user} onChange={(e) => { setUser(e.target.value); setSelected(null); setMessage(''); setNotice(''); }}><option value="ana">Ana · demo</option><option value="luis">Luis · demo</option></select></label>}</div></header>
      <div className="demo-banner"><span><strong>{account ? "Cuenta conectada" : "Demostración"}</strong> {account ? "" : "Datos ilustrativos guardados en este navegador."}</span>{account ? <button disabled={loading || saving} onClick={refreshPublications}><RotateCcw size={13} />{loading ? "Actualizando…" : "Actualizar publicaciones"}</button> : <button onClick={() => { if (window.confirm('¿Restablecer los datos de ejemplo? Se borrarán las publicaciones de esta demo local.')) { setData(initializeDemoDates(structuredClone(initialData))); navigate('inicio'); } }}><RotateCcw size={13} />Reiniciar demo</button>}{!account && <button onClick={onExitDemo}>Volver al acceso</button>}</div>
      {storageError && <p className="notice" role="alert">No se pudo guardar en este navegador. Los cambios durarán mientras mantengas esta página abierta.</p>}
      <main id="contenido" tabIndex={-1}>{account && loading && <p role="status">Cargando publicaciones…</p>}{account && loadError && <div className="auth-error" role="alert">{loadError}<button className="text-button" onClick={refreshPublications}>Volver a intentar</button></div>}
        {view === 'inicio' && !selected && <button className="mobile-emergency" onClick={() => navigate('emergencia')}><AlertTriangle size={16} />Apoyo en emergencia<ArrowRight size={16} /></button>}
        {notice && <div className="notice" role="status"><Check size={18} /><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={16} /></button></div>}
        {publication ? <section className="detail-page"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={16} />Volver</button><div className="detail-heading"><span className="eyebrow">{publication.categoria}</span><span className={`badge ${publication.estado}`}>{statusLabels[publication.estado]}</span></div><h1>{publication.titulo}</h1><p className="muted"><MapPin size={15} />{publication.barrio} · Publicado por {people[publication.autor_id]}</p>{account && <NeighborProfile id={publication.autor_id} name={people[publication.autor_id]}/>}<div className="panel"><p className="description">{publication.descripcion}</p><div className="privacy"><ShieldCheck size={19} />Esta publicación muestra una zona de referencia.</div><PublicationMap key={publication.id} publication={publication}/></div>
          <Participants publication={publication} responses={offers} people={people}/>
          <>
            {!own && isActive(publication) && remainingSlots !== 0 && !alreadyOffered && <form className="panel" onSubmit={(e) => { e.preventDefault(); void respond(); }}><h2>{publication.tipo === 'servicio' ? 'Consulta al prestador' : publication.tipo === 'ofrecimiento' ? 'Coordina con tu vecino' : '¿Cómo puedes ayudar?'}</h2><p className="ai-hint">Tu mensaje solo lo verán el autor y tú.{publication.tipo !== 'servicio' && ' Si te acepta, tu nombre aparecerá en la lista de participantes.'}</p><label>Tu mensaje<textarea required minLength={2} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe cómo te gustaría coordinar con tu vecino." /></label><button className="button primary" disabled={saving || loading} type="submit"><HandHeart size={18} />{publication.tipo === 'servicio' ? 'Solicitar servicio' : publication.tipo === 'ofrecimiento' ? 'Me interesa' : 'Yo te ayudo'}</button></form>}
            {!own && !alreadyOffered && remainingSlots === 0 && isActive(publication) && <p className="privacy">Los cupos están completos. Esta publicación no recibe nuevas respuestas.</p>}
            {alreadyOffered && <p className="privacy"><Check size={18} />Ya enviaste una respuesta. Puedes verla en Mi actividad.</p>}
            {(own || alreadyOffered) && <div className="panel"><h2>{own ? 'Mensajes privados recibidos' : 'Tu mensaje privado'}</h2>{offers.filter((o) => own || o.vecino_id === user).length === 0 ? <p className="muted">Todavía no hay respuestas para mostrar.</p> : offers.filter((o) => own || o.vecino_id === user).map((o) => {
              const history = helperHistory(data, o.vecino_id);
              return <div className="offer" key={o.id}><div><strong>{people[o.vecino_id]}</strong>{account && <NeighborProfile id={o.vecino_id} name={people[o.vecino_id]}/>}<p>{o.mensaje}</p><span className="badge">{o.estado === 'aceptado' ? 'Aceptado' : o.estado === 'rechazado' ? 'Rechazado' : 'Por confirmar'}</span>
                {own && !account && <section className="helper-history">
                  <strong>Referencias del barrio</strong>
                  <p>{history.total ? `Ayudas aceptadas en solicitudes cerradas: ${history.total}.` : 'Todavía no hay ayudas anteriores registradas.'}</p>
                  <p>{history.neighbors ? `Vecinos que le dieron su visto bueno: ${history.neighbors}.` : 'Sin recomendaciones por ahora.'}</p>
                </section>}
                </div>{own && o.estado === 'pendiente' && isActive(publication) && <button className="button secondary" disabled={saving || loading || remainingSlots === 0} onClick={() => accept(o.id)}>{publication.tipo === 'servicio' ? 'Aceptar coordinación' : 'Aceptar ayuda'}</button>}
                {account && <RecommendAction publication={publication} response={o} userId={user}/>}
                {own && !account && publication.estado === 'resuelta' && o.estado === 'aceptado' &&
                  (o.recomendado ? <span className="badge">Diste tu visto bueno</span> :
                  <button className="button secondary" onClick={() => perform((current) => recommendHelper(current, o.id, user), 'Tu recomendación quedó registrada.')}>Cumplió lo acordado. Recomendar</button>)}
              </div>;
            })}</div>}
          </>
<LifecycleActions key={publication.id} publication={publication} own={own} busy={saving || loading} onAction={changeLifecycle}/>
        </section> : view === 'publicar' ? <section className="form-page"><button className="text-button" onClick={() => review ? setReview(false) : navigate('inicio')}><ArrowLeft size={16} />{review ? 'Editar publicación' : 'Volver al barrio'}</button><span className="eyebrow">{review ? 'PASO 2 DE 2' : 'PASO 1 DE 2'}</span><h1>{review ? `¿Así está bien, ${people[user]}?` : 'Nueva publicación'}</h1>
          {review ? <div className="panel review"><span className="badge">{draft.categoria}</span><h2>{draft.titulo}</h2><p>{draft.descripcion}</p>{draft.tipo !== 'servicio' && <p>{draft.cupos} cupos disponibles</p>}<p className="muted"><MapPin size={16} />{draft.barrio}</p>{draft.es_emergencia && <span className="badge emergency-badge">Apoyo en emergencia</span>}<div className="privacy"><ShieldCheck size={19} />Solo compartimos tu zona, no tu dirección exacta.</div><button className="button primary wide" disabled={saving || loading} onClick={() => publish()}>Publicar {draft.tipo === 'solicitud' ? 'solicitud' : draft.tipo === 'servicio' ? 'servicio' : 'ofrecimiento'}<ArrowRight size={18} /></button></div> : <form className="panel publish-form" onSubmit={(e) => { e.preventDefault(); try { validateCapacity(draft); } catch (failure) { setNotice(failure.message); return; } if (draft.titulo.trim().length < 5 || draft.descripcion.trim().length < 10 || draft.barrio.trim().length < 2) { setNotice('Completa el título, la descripción y el barrio con más detalle.'); return; } setNotice(''); setReview(true); }}><fieldset><legend>¿Qué quieres compartir?</legend><div className="type-options">{[['solicitud', 'Necesito ayuda'], ['ofrecimiento', 'Ofrezco ayuda'], ['servicio', 'Un servicio']].map(([type, label]) => <button key={type} type="button" aria-pressed={draft.tipo === type} className={draft.tipo === type ? 'selected' : ''} onClick={() => setDraft({ ...draft, tipo: type })}>{label}</button>)}</div></fieldset><label>Título<input required minLength={5} maxLength={120} value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} placeholder="Ej.: Necesito una escalera prestada" /></label><label>Cuéntale un poco más al barrio<textarea required minLength={10} maxLength={2000} value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} placeholder="¿Qué necesitas u ofreces y para cuándo?" /></label><VoiceDictation onTranscript={text => {
            const next = [draft.descripcion.trim(), text].filter(Boolean).join(' ');
            if (next.length > 2000) { setNotice('La descripción supera 2000 caracteres. Acorta el texto antes de añadir el dictado.'); return false; }
            setDraft({ ...draft, descripcion: next }); return true;
          }}/><AiPublicationAssistant key={draft.tipo + draft.descripcion} text={draft.descripcion} type={draft.tipo} onApply={(proposal) => { setDraft({ ...draft, ...proposal }); setNotice('Propuesta aplicada. Revisa los campos antes de publicar.'); }} /><div className="form-row"><label>Categoría<select value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}>{['Herramientas', 'Gasfitería', 'Electricidad', 'Compras y traslados', 'Clases', 'Agua y alimentos', 'Otros'].map((c) => <option key={c}>{c}</option>)}</select></label><label>Barrio<input required minLength={2} maxLength={120} readOnly={Boolean(account)} value={draft.barrio} onChange={(e) => setDraft({ ...draft, barrio: e.target.value })} /></label></div><CapacityField type={draft.tipo} value={draft.cupos} onChange={cupos => setDraft({ ...draft, cupos })}/><LocationControl forPublication value={draft} onChange={point => setDraft({ ...draft, latitud: point?.latitud ?? null, longitud: point?.longitud ?? null })}/><label className="checkbox"><input type="checkbox" checked={draft.es_emergencia} onChange={(e) => setDraft({ ...draft, es_emergencia: e.target.checked })} />Es una necesidad o recurso de apoyo en emergencia</label><button type="submit" className="button primary wide">Revisar publicación<ArrowRight size={18} /></button></form>}
        </section> : <>
          {view === 'inicio' ? <><section className="home-intro">
            <h1>Hola, {people[user]}</h1>
            <div className="home-actions">
              <button className="button primary" onClick={() => setChat({mode: 'solicitud'})}><HandHeart size={19} />Pedir una manito</button>
              <button className="button secondary" onClick={() => setChat({mode: 'ofrecimiento'})}><Plus size={19} />Ofrece una manito</button>
              <button className="button secondary" onClick={() => setChat({mode: 'busqueda'})}><Search size={19} />Busca un servicio</button>
            </div>
          </section></> : <section className="page-heading"><h1>{view === 'servicios' ? 'Servicios del barrio' : view === 'emergencia' ? 'Nos apoyamos en emergencia' : 'Mi actividad'}</h1>{view === 'emergencia' && <><div className="emergency-note"><AlertTriangle size={19} />Apoyo vecinal. No reemplaza a los servicios de emergencia.</div><button className="button primary" onClick={() => startPublication('solicitud', true)}>Publicar necesidad o recurso<Plus size={17} /></button></>}</section>}
          <section className="feed">{view === 'actividad' && <div className="activity-tabs" role="group" aria-label="Filtrar mi actividad">{[['activas', 'Activas'], ['historial', 'Historial']].map(([id, label]) => <button key={id} className="button secondary" aria-pressed={activityTab === id} onClick={() => setActivityTab(id)}>{label}</button>)}</div>}{view === 'servicios' && <>{serviceIntent && <div className="notice"><span>{serviceIntent.interpretacion} · Resultados de publicaciones existentes.</span><button onClick={() => setServiceIntent(null)} aria-label="Quitar filtro de IA"><X size={16} /></button></div>}</>}<div className="section-heading"><div>{view === 'inicio' && <h2>Publicaciones del barrio</h2>}</div><span className="result-count">{filtered.length} publicaciones</span></div><label className="search-box"><Search size={19} /><input aria-label="Buscar publicaciones" placeholder="Busca una necesidad, un oficio o una herramienta…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>{view === 'servicios' && <AiPublicationAssistant key={query} text={query} type="busqueda" onApply={(intent) => { setServiceIntent(intent); setQuery(''); }} />}<LocationControl value={origin} onChange={setOrigin}/><div className="publication-grid" aria-busy={loading}>{filtered.map((p) => <PublicationCard key={p.id} publication={p} onOpen={open} distance={origin ? formatDistance(distanceKm(origin,p)) : null} />)}</div>{!loading && !loadError && filtered.length === 0 && <div className="empty"><HandHeart size={35} /><p>{view === 'actividad' && activityTab === 'historial' ? 'Aquí aparecerán tus publicaciones resueltas, canceladas o vencidas y aquellas en las que participaste.' : 'No hay publicaciones activas que coincidan con tu búsqueda.'}</p><button className="button secondary" onClick={() => startPublication()}>Publicar en mi barrio</button></div>}</section>
        </>}
      </main>
      {view === 'inicio' && !selected && <>
        <button className="manito-launch" onClick={() => setChat({mode: null})}><img src="/manolito-avatar.png" alt=""/>Chat con Manolito</button>
      </>}
      {chat && <ManitoChat initialMode={chat.mode} name={people[user]} barrio={account?.barrio || emptyDraft.barrio}
        posts={publications} saving={saving} loading={loading} onClose={() => setChat(null)} onPublish={publish}
        onOpen={id => { setChat(null); navigate('servicios'); open(id); }}
        onManual={mode => { setChat(null); if (mode === 'busqueda') navigate('servicios'); else startPublication(mode); }}
      />}
    </div>
    <nav className="mobile-nav" aria-label="Navegación móvil">{navItems.map(({ id, label, icon: Icon }) => <button key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'active' : ''} onClick={() => navigate(id)}><Icon size={21} /><span>{label}</span></button>)}</nav>
  </div></>;
}

