import MyProfile from './components/MyProfile.jsx';
import PublicationComposer from './components/PublicationComposer.jsx';
import SidePanel from './components/SidePanel.jsx';
import WelcomeDialog from './components/WelcomeDialog.jsx';
import PublicationLoading from './components/PublicationLoading.jsx';
import SupportDirectory from './components/SupportDirectory.jsx';
import PrivateConversation from './components/PrivateConversation.jsx';
import { canConverse, sendDemoMessage } from './lib/conversations.js';
import DetailGuidance from './components/DetailGuidance.jsx';
import useOnline from './lib/useOnline.js';
import { readSnapshot, saveSnapshot, readDraft, saveDraft } from './lib/offline.js';
import LifecycleActions from './components/LifecycleActions.jsx';
import { changeDemoLifecycle, initializeDemoDates, isActive, publicationState, WEEK_MS } from './lib/lifecycle.js';
import Participants from './components/Participants.jsx';
import { availableSlots, validateCapacity } from './lib/participation.js';
import NeighborProfile, { RecommendAction } from './components/NeighborProfile.jsx';
import LocationControl from './components/LocationControl.jsx';
import PublicationMap from './components/PublicationMap.jsx';
import { distanceKm, formatDistance } from './lib/location.js';
import { sendResponse, acceptResponse } from './lib/responses.js';
import ManitoChat from './components/ManitoChat.jsx';
import { useEffect, useRef, useState } from 'react';
import { UserRound, Menu, MessageCircle, House, Gift, Wrench, Plus, ClipboardList, LogOut, HandHeart, MapPin, ArrowRight, ArrowLeft, Search, ShieldCheck, AlertTriangle, Check, RotateCcw, X } from 'lucide-react';
import PublicationCard, { statusLabels } from './components/PublicationCard.jsx';
import AiPublicationAssistant from './components/AiPublicationAssistant.jsx';
import { listPublications, createPublication, closePublication, changePublicationLifecycle } from './lib/publications.js';
import { people as demoPeople, initialData, offerHelp, acceptOffer, recommendHelper, helperHistory } from './lib/demo.js';

const STORE = 'una-manito-demo-v1';
const emptyDraft = { tipo: 'solicitud', titulo: '', descripcion: '', categoria: 'Otros', cupos: 1, barrio: 'Barrio Demo', es_emergencia: false };
const navItems = [
  { id: 'inicio', label: 'Publicaciones recientes', icon: House },
  { id: 'solicitud', label: 'Pedir una manito', icon: HandHeart },
  { id: 'ofrecimiento', label: 'Ofrecer una manito', icon: Gift },
  { id: 'servicios', label: 'Buscar un servicio', icon: Wrench },
  { id: 'emergencia', label: 'Apoyo en emergencia', icon: AlertTriangle },
];

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

export default function App({ account, onSignOut, onExitDemo, onChangeNeighborhood, offlineSession = false }) {
  const online = useOnline();
  const [initialSnapshot] = useState(() => account ? readSnapshot(account) : null);
  const [usingSavedCopy, setUsingSavedCopy] = useState(Boolean(initialSnapshot));
  const [snapshotDate, setSnapshotDate] = useState(initialSnapshot?.savedAt || null);
  const readOnly = Boolean(account) && (!online || offlineSession || usingSavedCopy);
  const draftOwner = account || { id: 'demo', barrio: 'Barrio Demo' };
  const storageKey = account ? `${STORE}-${account.id}` : STORE;
  const neighborhood = account?.barrio || 'Barrio Demo · San Miguel';
  const newDraft = { ...emptyDraft, barrio: account?.barrio || emptyDraft.barrio };
  const [data, setStoredData] = useState(() => account ? { publicaciones: initialSnapshot?.publicaciones || [], ofrecimientos: [] } : loadData(storageKey));
  const [user, setUser] = useState(account?.id || 'ana');
  const [chat, setChat] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [privateDrafts, setPrivateDrafts] = useState({});
  const [view, setView] = useState('inicio');
  const [openPanel, setOpenPanel] = useState(null);
  const [homeFilter, setHomeFilter] = useState('todas');
  const [welcome, setWelcome] = useState(() => { try { return !localStorage.getItem('una-manito-welcome-v2'); } catch { return true; } });
  function closeWelcome() { setWelcome(false); try { localStorage.setItem('una-manito-welcome-v2', 'seen'); } catch { /* Se puede continuar sin almacenamiento. */ } }
  const [activityTab, setActivityTab] = useState('activas');
  const [emergencyTab, setEmergencyTab] = useState('necesidades');
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const [selected, setSelected] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [query, setQuery] = useState('');
  const [serviceIntent, setServiceIntent] = useState(null);
  const [serviceCategory, setServiceCategory] = useState('Todos');
  const [draft, setDraftState] = useState(() => readDraft(draftOwner) || newDraft);
  const [review, setReview] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [loading, setLoading] = useState(Boolean(account) && online && !offlineSession);
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
    if (!account || !online || offlineSession) return;
    let active = true;
    const version = ++loadVersion.current;
    async function load() {
      try {
        const publications = await listPublications();
        if (active && version === loadVersion.current) {
          setStoredData({ publicaciones: publications, ofrecimientos: publications.flatMap(p => p.ofrecimientos || []) });
          setLoadError(''); setUsingSavedCopy(false);
          try { setSnapshotDate(saveSnapshot(account, publications).savedAt); } catch { setStorageError(true); }
        }
      } catch {
        if (active && version === loadVersion.current) { setUsingSavedCopy(true); setLoadError('No pudimos actualizar las publicaciones. Puedes consultar la copia guardada, si existe.'); }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [account, refresh, online, offlineSession]);

  function setDraft(next) {
    try { saveDraft(draftOwner, next); } catch { setStorageError(true); }
    setDraftState(next);
  }

  function cacheCurrent(publications) {
    if (!account) return;
    try { setSnapshotDate(saveSnapshot(account, publications).savedAt); }
    catch { setStorageError(true); }
  }
  function refreshPublications() {
    if (saving || !online || offlineSession) return;
    setLoading(true);
    setRefresh((previous) => previous + 1);
  }

  function setData(next) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setStorageError(true); }
    setStoredData(next);
  }

  function navigate(next) { setOpenPanel(null); setConversationId(null); setView(next); setSelected(null); setReview(false); setMessage(''); setQuery(''); setServiceIntent(null); setServiceCategory('Todos'); setNotice(''); }
  function open(id) { setConversationId(null); setSelected(id); setMessage(''); setNotice(''); }
  function perform(action, success) {
    try { setData(action(data)); setNotice(success); }
    catch (error) { setNotice(error.message); }
  }
  function startPublication(type = 'solicitud', emergency = false, supplied = null) { navigate('publicar'); setDraft(supplied ? { ...newDraft, ...supplied, tipo: type, es_emergencia: emergency } : draft.tipo === type && draft.es_emergencia === emergency ? draft : { ...newDraft, tipo: type, es_emergencia: emergency }); }
  async function publish(confirmedDraft = draft) {
    if (readOnly) { setNotice('Necesitas conexión y datos actualizados para publicar. El borrador se conserva.'); return false; }
    if (mutationPending.current) return;
    mutationPending.current = true;
    setSaving(true);
    try {
      const publication = account
        ? await createPublication(confirmedDraft, account.id)
        : { ...confirmedDraft, titulo: confirmedDraft.titulo.trim(), descripcion: confirmedDraft.descripcion.trim(), barrio: confirmedDraft.barrio.trim(), cupos: validateCapacity(confirmedDraft), creado_en: new Date().toISOString(), vence_en: new Date(Date.now() + WEEK_MS).toISOString(), primera_respuesta_en: null, id: crypto.randomUUID(), autor_id: user, estado: 'pendiente' };
      loadVersion.current += 1;
      cacheCurrent([publication, ...data.publicaciones.filter(post => post.id !== publication.id)]);
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
    if (readOnly) { setNotice('Necesitas conexión y datos actualizados para cambiar el estado.'); return false; }
    if (mutationPending.current) return false;
    mutationPending.current = true;
    setSaving(true);
    try {
      if (account) {
        const updated = action === 'resolver' ? await closePublication(publication.id, account.id) : await changePublicationLifecycle(publication.id, action, reason);
        loadVersion.current += 1;
        cacheCurrent(data.publicaciones.map(post => post.id === updated.id ? { ...post, ...updated } : post));
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
    if (readOnly) { setNotice('Necesitas conexión y datos actualizados para responder.'); return; }
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
      setLoading(true); setRefresh(n => n + 1);
    } catch (error) {
      setNotice(error.message?.includes('CAPACITY_FULL') ? 'Los cupos se completaron. Actualiza la publicación.' : error.message?.includes('PUBLICATION_CLOSED') ? 'La publicación ya está cerrada. Actualiza la lista.' : error.code === '23505' ? 'Ya respondiste. Actualiza las publicaciones para ver tu mensaje.' : 'No se pudo confirmar el envío. Actualiza las publicaciones antes de reintentar.');
    } finally { mutationPending.current = false; setSaving(false); }
  }

  async function accept(id) {
    if (readOnly) { setNotice('Necesitas conexión y datos actualizados para aceptar.'); return; }
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
  const conversationResponse = data.ofrecimientos.find(response => response.id === conversationId);
  const conversationPost = publications.find(post => post.id === conversationResponse?.publicacion_id);
  const filtered = publications.filter((p) => {
    if (view === 'actividad' ? (activityTab === 'activas') !== isActive(p) : !isActive(p)) return false;
    if (account && view !== 'actividad' && p.barrio.trim().toLocaleLowerCase('es') !== account.barrio.trim().toLocaleLowerCase('es')) return false;
    if (view === 'inicio' && homeFilter !== 'todas' && p.tipo !== homeFilter) return false;
    if (view === 'servicios' && serviceCategory !== 'Todos' && p.categoria !== serviceCategory) return false;
    if (view === 'servicios' && serviceIntent) {
      const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const matchesIntent = serviceIntent.categoria === 'Otros'
        ? serviceIntent.terminos.some((term) => normalize(`${p.titulo} ${p.descripcion} ${p.categoria}`).includes(normalize(term)))
        : p.categoria === serviceIntent.categoria;
      if (!matchesIntent) return false;
    }
    const matchesView = view === 'servicios' ? p.tipo === 'servicio' : view === 'emergencia' ? p.es_emergencia && (emergencyTab === 'necesidades' ? p.tipo === 'solicitud' : emergencyTab === 'recursos' ? p.tipo === 'ofrecimiento' : p.tipo === 'servicio') : view === 'actividad' ? p.autor_id === user || data.ofrecimientos.some((o) => o.publicacion_id === p.id && o.vecino_id === user) : true;
    return matchesView && `${p.titulo} ${p.descripcion} ${p.categoria}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'));
  });
  if (origin) filtered.sort((a,b) => distanceKm(origin,a) - distanceKm(origin,b));

  return <><div className="app-shell">
    <div className="workspace">
      {welcome && <WelcomeDialog name={people[user]} onClose={closeWelcome} onTutorial={() => { closeWelcome(); setChat({ mode: 'guia' }); }}/>}
      <header className="topbar">
        <div className="topbar-community">
          <span className="topbar-brand">Una Manito</span>
          <span className="topbar-location"><MapPin size={16} aria-hidden="true"/>{neighborhood}</span>
        </div>
        <div className="topbar-actions">
          {!account && <label className="user-switch">
            <select aria-label="Cambiar usuario de demostración" value={user} onChange={(e) => { setUser(e.target.value); setSelected(null); setMessage(''); setNotice(''); }}>
              <option value="ana">Ana · demo</option>
              <option value="luis">Luis · demo</option>
            </select>
          </label>}
          <button className="topbar-control" aria-label="Chat con Manolito" title="Chat con Manolito" aria-haspopup="dialog" onClick={() => setChat({ mode: null })}>
            <MessageCircle size={21} aria-hidden="true"/>
          </button>
          <button className="topbar-control profile-toggle" aria-label="Abrir perfil" aria-expanded={openPanel === 'perfil'} aria-haspopup="dialog" aria-controls={openPanel === 'perfil' ? 'profile-panel' : undefined} onClick={() => setOpenPanel('perfil')}>
            <span className="avatar" aria-hidden="true">{people[user][0]}</span>
          </button>
          <button className="topbar-control menu-toggle" aria-label="Abrir menú" aria-expanded={openPanel === 'menu'} aria-haspopup="dialog" aria-controls={openPanel === 'menu' ? 'navigation-panel' : undefined} onClick={() => setOpenPanel('menu')}>
            <Menu size={22} aria-hidden="true"/><span>Menú</span>
          </button>
        </div>
      </header>
      <div className="demo-banner"><span><strong>{account ? readOnly ? 'Copia de consulta' : 'Cuenta conectada' : 'Demostración'}</strong>{!account && <span className="demo-description"> · Datos de ejemplo</span>}</span>{account ? <button disabled={loading || saving || !online || offlineSession} onClick={refreshPublications} aria-label={loading ? 'Actualizando publicaciones' : 'Actualizar publicaciones'}><RotateCcw size={16}/><span className="refresh-caption">{loading ? 'Actualizando…' : 'Actualizar'}</span></button> : <details className="demo-options"><summary>Opciones demo</summary><div><button onClick={() => { if (window.confirm('¿Restablecer los datos de ejemplo? Se borrarán las publicaciones de esta demo local.')) { setData(initializeDemoDates(structuredClone(initialData))); navigate('inicio'); } }}>Reiniciar demo</button><button onClick={onExitDemo}>Volver al acceso</button></div></details>}</div>
      {account && snapshotDate && readOnly && <p className="snapshot-note" role="status">Publicaciones guardadas en este dispositivo el {new Date(snapshotDate).toLocaleString('es-PE')}. Pueden haber cambiado. No incluye mensajes privados.</p>}
      {storageError && <p className="notice" role="alert">No se pudo guardar en este navegador. Los cambios durarán mientras mantengas esta página abierta.</p>}
      <main id="contenido" tabIndex={-1}>{account && loadError && <div className="auth-error" role="alert">{loadError}<button className="text-button" onClick={refreshPublications}>Volver a intentar</button></div>}
        {notice && <div className="notice" role="status"><Check size={18} /><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={16} /></button></div>}
        {publication ? <section className="detail-page"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={16} />Volver</button><div className="detail-heading"><span className="eyebrow">{publication.categoria}</span><span className={`badge ${publication.estado}`}>{statusLabels[publication.estado]}</span></div><h1>{publication.titulo}</h1><p className="muted"><MapPin size={15} />{publication.barrio} · Publicado por {people[publication.autor_id]}</p>{account && !readOnly && <NeighborProfile id={publication.autor_id} name={people[publication.autor_id]}/>}<div className="panel"><p className="description">{publication.descripcion}</p><div className="privacy"><ShieldCheck size={19} />Esta publicación muestra una zona de referencia.</div><PublicationMap key={publication.id} publication={publication}/></div>
          <DetailGuidance publication={publication} own={own} response={offers.find(o => o.vecino_id === user)}/><Participants publication={publication} responses={offers} people={people}/>
          <>
            {!own && isActive(publication) && remainingSlots !== 0 && !alreadyOffered && <form className="panel" onSubmit={(e) => { e.preventDefault(); void respond(); }}><h2>{publication.tipo === 'servicio' ? 'Consulta al prestador' : publication.tipo === 'ofrecimiento' ? 'Coordina con tu vecino' : '¿Cómo puedes ayudar?'}</h2><p className="ai-hint">Mensaje privado para el autor.{publication.tipo !== 'servicio' && ' Si te acepta, aparecerás entre los participantes.'}</p><label>Tu mensaje<textarea disabled={readOnly} required minLength={2} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe cómo te gustaría coordinar con tu vecino." /></label><button className="button primary" disabled={saving || loading || readOnly} type="submit"><HandHeart size={18} />{publication.tipo === 'servicio' ? 'Solicitar servicio' : publication.tipo === 'ofrecimiento' ? 'Me interesa' : 'Yo te ayudo'}</button></form>}
            {!own && !alreadyOffered && remainingSlots === 0 && isActive(publication) && <p className="privacy">Los cupos están completos. Esta publicación no recibe nuevas respuestas.</p>}
            {alreadyOffered && <p className="response-confirmation"><Check size={18} />Respuesta enviada. Continúa en Mi actividad.</p>}
            {(own || alreadyOffered) && <div className="panel"><h2>{own ? 'Mensajes privados recibidos' : 'Tu mensaje privado'}</h2>{offers.filter((o) => own || o.vecino_id === user).length === 0 ? <p className="muted">Todavía no hay respuestas para mostrar.</p> : offers.filter((o) => own || o.vecino_id === user).map((o) => {
              const history = helperHistory(data, o.vecino_id);
              return <div className="offer" key={o.id}><div><strong>{people[o.vecino_id]}</strong>{account && <NeighborProfile id={o.vecino_id} name={people[o.vecino_id]}/>}<p>{o.mensaje}</p><span className="badge">{o.estado === 'aceptado' ? 'Aceptado' : o.estado === 'rechazado' ? 'Rechazado' : 'Por confirmar'}</span>
                <button className="button secondary conversation-action" disabled={Boolean(account) && readOnly} aria-label={`Conversar con ${people[own ? o.vecino_id : publication.autor_id] || 'tu vecino'}`} onClick={() => setConversationId(o.id)}>Conversar</button>
                {own && !account && <section className="helper-history">
                  <strong>Referencias del barrio</strong>
                  <p>{history.total ? `Ayudas aceptadas en solicitudes cerradas: ${history.total}.` : 'Todavía no hay ayudas anteriores registradas.'}</p>
                  <p>{history.neighbors ? `Vecinos que le dieron su visto bueno: ${history.neighbors}.` : 'Sin recomendaciones por ahora.'}</p>
                </section>}
                </div>{own && o.estado === 'pendiente' && isActive(publication) && <button className="button secondary" disabled={saving || loading || readOnly || remainingSlots === 0} onClick={() => accept(o.id)}>{publication.tipo === 'servicio' ? 'Aceptar coordinación' : 'Aceptar ayuda'}</button>}
                {account && !readOnly && <RecommendAction publication={publication} response={o} userId={user}/>}
                {own && !account && publication.estado === 'resuelta' && o.estado === 'aceptado' &&
                  (o.recomendado ? <span className="badge">Diste tu visto bueno</span> :
                  <button className="button secondary" onClick={() => perform((current) => recommendHelper(current, o.id, user), 'Tu recomendación quedó registrada.')}>Cumplió lo acordado. Recomendar</button>)}
              </div>;
            })}</div>}
          </>
<LifecycleActions key={publication.id} publication={publication} own={own} busy={saving || loading || readOnly} onAction={changeLifecycle}/>
        </section> : view === 'perfil' ? <MyProfile key={user} profile={{ id:user, nombre:people[user], barrio:account?.barrio || emptyDraft.barrio }} remote={Boolean(account)} readOnly={readOnly} publications={publications.filter(post => post.autor_id === user).length} demoHistory={helperHistory(data,user)} onActivity={() => navigate('actividad')}/> : view === 'publicar' ? <PublicationComposer draft={draft} onChange={setDraft} review={review} onReview={next => { setDraft(next); setReview(true); }} onEdit={() => setReview(false)} onBack={() => navigate('inicio')} onPublish={publish} onError={setNotice} busy={saving || loading} readOnly={readOnly} account={account}/> : <>
          {view === 'inicio' ? <h1 className="feed-title">Publicaciones recientes</h1> : <section className="page-heading"><h1>{view === 'servicios' ? 'Servicios del barrio' : view === 'emergencia' ? 'Nos apoyamos en emergencia' : 'Mi actividad'}</h1><p className="page-purpose">{view === 'servicios' ? 'Busca un oficio, revisa el perfil y envía una consulta privada.' : view === 'emergencia' ? 'Encuentra pedidos, recursos y contactos de apoyo.' : 'Tus publicaciones y las ayudas en las que participas.'}</p>{view === 'servicios' && <button className="button secondary" onClick={() => startPublication('servicio')}><Plus size={17} aria-hidden="true"/>Publicar un servicio</button>}{view === 'emergencia' && <><div className="emergency-note"><AlertTriangle size={19} />Apoyo vecinal. No reemplaza a los servicios de emergencia.</div><div className="emergency-actions"><button className="button primary" onClick={() => startPublication('solicitud', true)}>Necesito apoyo<Plus size={17}/></button><button className="button secondary" onClick={() => startPublication('ofrecimiento', true)}>Tengo recursos<HandHeart size={17}/></button></div></>}</section>}
          {view === 'emergencia' && <><div className="emergency-tabs" role="group" aria-label="Explorar apoyo en emergencia">{[['necesidades','Necesidades'],['recursos','Recursos'],['directorio','Directorio de apoyo']].map(([id,label]) => <button className="button secondary" key={id} aria-pressed={emergencyTab === id} onClick={() => { setEmergencyTab(id); setQuery(''); }}>{label}</button>)}</div>{emergencyTab === 'directorio' && <SupportDirectory account={account} online={online} offlineSession={offlineSession}/>}</>}
          <section className="feed">{view === 'actividad' && <div className="activity-tabs" role="group" aria-label="Filtrar mi actividad">{[['activas', 'Activas'], ['historial', 'Historial']].map(([id, label]) => <button key={id} className="button secondary" aria-pressed={activityTab === id} onClick={() => setActivityTab(id)}>{label}</button>)}</div>}{view === 'servicios' && <>{serviceIntent && <div className="notice"><span>{serviceIntent.interpretacion} · Resultados de publicaciones existentes.</span><button onClick={() => setServiceIntent(null)} aria-label="Quitar filtro de IA"><X size={16} /></button></div>}</>}<div className="section-heading"><div>{view === 'emergencia' && <h2>{emergencyTab === 'necesidades' ? 'Vecinos que necesitan apoyo' : emergencyTab === 'recursos' ? 'Recursos que comparten los vecinos' : 'Servicios vecinales para emergencias'}</h2>}{view === 'inicio' && <div className="feed-filters" role="group" aria-label="Filtrar publicaciones del barrio">{[['todas','Todas'],['solicitud','Necesitan ayuda'],['ofrecimiento','Ofrecen ayuda']].map(([id,label]) => <button key={id} aria-pressed={homeFilter === id} onClick={() => setHomeFilter(id)}>{label}</button>)}</div>}</div><span className="result-count">{filtered.length} {filtered.length === 1 ? 'publicación' : 'publicaciones'}</span></div><label className="search-box"><Search size={19} /><input aria-label="Buscar publicaciones" placeholder={view === 'servicios' ? 'Ej.: gasfitero, electricidad, clases…' : 'Buscar en el barrio…'} value={query} onChange={(e) => setQuery(e.target.value)} /></label>{view === 'servicios' && <div className="service-categories" role="group" aria-label="Filtrar servicios por oficio">{['Todos','Gasfitería','Electricidad','Clases','Compras y traslados','Otros'].map(category => <button key={category} aria-pressed={serviceCategory === category} onClick={() => { setServiceCategory(category); setServiceIntent(null); }}>{category}</button>)}</div>}{view === 'servicios' && <AiPublicationAssistant key={query} text={query} type="busqueda" onApply={(intent) => { setServiceIntent(intent); setServiceCategory('Todos'); setQuery(''); }} />}<details className="feed-location"><summary>Ordenar por cercanía</summary><LocationControl value={origin} onChange={setOrigin}/></details><div className={`publication-grid publication-list ${view === 'servicios' ? 'service-list' : ''}`} aria-busy={loading}>{loading && <PublicationLoading/>}{filtered.map((p) => <PublicationCard key={p.id} publication={p} compact authorName={people[p.autor_id]} onOpen={open} distance={origin ? formatDistance(distanceKm(origin,p)) : null} />)}</div>{!loading && !loadError && filtered.length === 0 && <div className="empty"><HandHeart size={32} aria-hidden="true"/><h3>{readOnly ? 'No hay publicaciones guardadas que coincidan' : view === 'servicios' ? 'No encontramos servicios para esta búsqueda' : view === 'actividad' ? activityTab === 'historial' ? 'Tu historial aparecerá aquí' : 'Todavía no tienes actividad' : view === 'emergencia' ? emergencyTab === 'necesidades' ? 'No hay pedidos de emergencia activos' : emergencyTab === 'recursos' ? 'Todavía no hay recursos publicados' : 'No hay servicios vecinales publicados para emergencias' : 'Tu barrio empieza con una manito'}</h3><p>{readOnly ? 'Vuelve a conectarte para actualizar. Mientras tanto, puedes preparar un borrador.' : view === 'actividad' ? 'Aquí verás lo que publiques y las ayudas en las que participes. Las resueltas, canceladas y vencidas se conservan en Historial.' : view === 'servicios' ? 'Prueba otro oficio o quita los filtros. Solo mostramos servicios publicados por vecinos.' : view === 'emergencia' ? emergencyTab === 'directorio' ? 'Los oficios que los vecinos publiquen para emergencias aparecerán aquí. Son publicaciones vecinales, separadas del directorio de contactos revisados.' : emergencyTab === 'recursos' ? 'Comparte agua, alimentos, herramientas u otro apoyo e indica cómo coordinarlo.' : 'Publica qué apoyo necesitas y coordina por privado con quienes respondan.' : 'Pide ayuda o comparte algo que pueda servirle a un vecino.'}</p>{query || serviceIntent || serviceCategory !== 'Todos' || (view === 'inicio' && homeFilter !== 'todas') ? <button className="button secondary" onClick={() => { setQuery(''); setServiceIntent(null); setServiceCategory('Todos'); setHomeFilter('todas'); }}>Limpiar filtros</button> : view === 'actividad' ? <button className="button secondary" onClick={() => navigate('inicio')}>Volver a Mi barrio</button> : view === 'servicios' ? null : <button className="button secondary" onClick={() => startPublication(view === 'emergencia' && emergencyTab === 'directorio' ? 'servicio' : view === 'emergencia' && emergencyTab === 'recursos' ? 'ofrecimiento' : 'solicitud', view === 'emergencia')}>{readOnly ? 'Preparar borrador' : view === 'emergencia' && emergencyTab === 'directorio' ? 'Publicar un servicio' : view === 'emergencia' && emergencyTab === 'recursos' ? 'Compartir un recurso' : 'Publicar un pedido'}</button>}</div>}</section>
        </>}
      </main>
      {conversationResponse && conversationPost && canConverse(conversationPost, conversationResponse, user) && <PrivateConversation key={user + '-' + conversationResponse.id} publication={conversationPost} response={conversationResponse} userId={user} people={people} remote={Boolean(account)} readOnly={readOnly} demoMessages={data.mensajes || []} initialDraft={privateDrafts[user + ":" + conversationResponse.id] || ''} onDraftChange={text => setPrivateDrafts(current => ({ ...current, [user + ":" + conversationResponse.id]: text }))} onSendDemo={(text, id) => {
        const result = sendDemoMessage(data, conversationResponse.id, user, text, id);
        setData(result.data); return result.message;
      }} onClose={() => setConversationId(null)}/>}
      {chat && <ManitoChat initialMode={chat.mode} name={people[user]} barrio={account?.barrio || emptyDraft.barrio}
        posts={publications} readOnly={readOnly} saving={saving} loading={loading} onClose={() => setChat(null)} onPublish={publish}
        onOpen={id => { setChat(null); navigate('servicios'); open(id); }}
        onManual={(mode, savedDraft) => { setChat(null); if (mode === 'busqueda') navigate('servicios'); else startPublication(mode, false, savedDraft); }}
      />}
    </div>
    {openPanel === 'menu' && <SidePanel id="navigation-panel" title="Menú" closeLabel="Cerrar menú" onClose={() => setOpenPanel(null)}>
      <nav aria-label="Navegación principal">{navItems.map(({ id, label, icon: Icon }) => {
        const isForm = id === 'solicitud' || id === 'ofrecimiento';
        const current = !selected && (isForm ? view === 'publicar' && draft.tipo === id && !draft.es_emergencia : view === id);
        return <button key={id} className={id === 'emergencia' ? 'menu-emergency' : undefined} aria-current={current ? 'page' : undefined} onClick={() => isForm ? startPublication(id) : navigate(id)}>
          <span className="menu-icon"><Icon size={22} aria-hidden="true"/></span><span>{label}</span>
        </button>;
      })}</nav>
    </SidePanel>}
    {openPanel === 'perfil' && <SidePanel id="profile-panel" title="Perfil" closeLabel="Cerrar perfil" onClose={() => setOpenPanel(null)}>
      <div className="menu-profile">
        <span className="avatar" aria-hidden="true">{people[user][0]}</span>
        <div><strong>{people[user]}</strong><span><MapPin size={14} aria-hidden="true"/>{neighborhood}</span></div>
      </div>
      <nav aria-label="Opciones de perfil">
        <button aria-current={view === 'perfil' && !selected ? 'page' : undefined} onClick={() => navigate('perfil')}><span className="menu-icon"><UserRound size={22} aria-hidden="true"/></span><span>Mi perfil</span></button>
        <button aria-current={view === 'actividad' && !selected ? 'page' : undefined} onClick={() => navigate('actividad')}><span className="menu-icon"><ClipboardList size={22} aria-hidden="true"/></span><span>Mi actividad</span></button>
        {account && <button disabled={saving || readOnly} onClick={() => {
          if ((draft.titulo.trim() || draft.descripcion.trim() || message.trim()) && !window.confirm('Tienes un texto sin publicar. Si cambias de barrio se descartará. ¿Continuar?')) return;
          setOpenPanel(null);
          onChangeNeighborhood?.();
        }}><span className="menu-icon"><MapPin size={22} aria-hidden="true"/></span><span>Cambiar barrio</span></button>}
        <button onClick={() => { setOpenPanel(null); setWelcome(true); }}><span className="menu-icon"><HandHeart size={22} aria-hidden="true"/></span><span>Ver bienvenida</span></button>
      </nav>
      <button className="menu-exit" onClick={() => {
        setOpenPanel(null);
        if (account) onSignOut();
        else onExitDemo();
      }}><LogOut size={19} aria-hidden="true"/>{account ? offlineSession ? 'Cerrar copia' : 'Cerrar sesión' : 'Salir de demostración'}</button>
    </SidePanel>}

  </div></>;
}

