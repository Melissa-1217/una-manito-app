import { useEffect, useRef, useState } from 'react';
import { House, Wrench, Plus, ClipboardList, HandHeart, MapPin, ArrowRight, ArrowLeft, Search, Heart, ShieldCheck, AlertTriangle, Check, RotateCcw, Users, X } from 'lucide-react';
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
          setStoredData({ publicaciones: publications, ofrecimientos: [] });
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
  async function publish() {
    if (mutationPending.current) return;
    mutationPending.current = true;
    setSaving(true);
    try {
      const publication = account
        ? await createPublication(draft, account.id)
        : { ...draft, titulo: draft.titulo.trim(), descripcion: draft.descripcion.trim(), barrio: draft.barrio.trim(), id: crypto.randomUUID(), autor_id: user, estado: 'pendiente' };
      loadVersion.current += 1;
      if (account) setStoredData((current) => ({ ...current, publicaciones: [publication, ...current.publicaciones.filter((post) => post.id !== publication.id)] }));
      else setData({ ...data, publicaciones: [publication, ...data.publicaciones] });
      setReview(false); setView('actividad'); setSelected(publication.id); setDraft(newDraft); setNotice(account ? 'Publicación guardada en tu comunidad.' : '¡Tu publicación ya está en el barrio!');
    } catch {
      setNotice('No se pudo confirmar la publicación. Conservamos tus datos. Actualiza la lista para comprobar si se guardó antes de volver a publicar.');
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
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); navigate('inicio'); }}><span className="brand-mark"><HandHeart size={28} /></span><span>Una Manito<small>ENTRE VECINOS, MEJOR.</small></span></a>
      <div className="neighborhood"><MapPin size={17} /><span>Tu comunidad<strong>{neighborhood}</strong></span></div>
      <nav aria-label="Navegación principal">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={20} />{label}{view === id && <span className="nav-dot" />}</button>)}</nav>
      <button className={`nav-item emergency-link ${view === 'emergencia' ? 'active' : ''}`} onClick={() => navigate('emergencia')}><AlertTriangle size={20} />Apoyo en emergencia</button>
      <div className="sidebar-note"><Users size={27} /><h3>Un barrio se construye entre todos.</h3><p>Una herramienta, un oficio o un poquito de tu tiempo pueden hacer la diferencia.</p><span>Hoy por ti, mañana por mí. <Heart size={13} /></span></div>
      <div className="sidebar-bottom"><ShieldCheck size={16} />Con cercanía y respeto</div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span className="topbar-location"><MapPin size={16} />{neighborhood}</span>{account ? <button className="account-menu" onClick={onSignOut}><span className="avatar">{account.nombre[0]}</span><span>{account.nombre}</span><span>Cerrar sesión</span></button> : <label className="user-switch"><span className="avatar">{people[user][0]}</span><select aria-label="Cambiar usuario de demostración" value={user} onChange={(e) => { setUser(e.target.value); setSelected(null); setMessage(''); setNotice(''); }}><option value="ana">Ana · demo</option><option value="luis">Luis · demo</option></select></label>}</header>
      <div className="demo-banner"><span><strong>{account ? "Cuenta conectada" : "Demostración"}</strong> · {account ? "Publicaciones compartidas con tu barrio." : "Datos ilustrativos guardados en este navegador."}</span>{account ? <button disabled={loading || saving} onClick={refreshPublications}><RotateCcw size={13} />{loading ? "Actualizando…" : "Actualizar publicaciones"}</button> : <button onClick={() => { if (window.confirm('¿Restablecer los datos de ejemplo? Se borrarán las publicaciones de esta demo local.')) { setData(structuredClone(initialData)); navigate('inicio'); } }}><RotateCcw size={13} />Reiniciar demo</button>}{!account && <button onClick={onExitDemo}>Volver al acceso</button>}</div>
      {storageError && <p className="notice" role="alert">No se pudo guardar en este navegador. Los cambios durarán mientras mantengas esta página abierta.</p>}
      <main id="contenido">{account && loading && <p role="status">Cargando publicaciones…</p>}{account && loadError && <div className="auth-error" role="alert">{loadError}<button className="text-button" onClick={refreshPublications}>Volver a intentar</button></div>}
        {view === 'inicio' && !selected && <button className="mobile-emergency" onClick={() => navigate('emergencia')}><AlertTriangle size={16} />Apoyo en emergencia<ArrowRight size={16} /></button>}
        {notice && <div className="notice" role="status"><Check size={18} /><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={16} /></button></div>}
        {publication ? <section className="detail-page"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={16} />Volver</button><div className="detail-heading"><span className="eyebrow">{publication.categoria}</span><span className={`badge ${publication.estado}`}>{statusLabels[publication.estado]}</span></div><h1>{publication.titulo}</h1><p className="muted"><MapPin size={15} />{publication.barrio} · Publicado por {people[publication.autor_id]}</p><div className="panel"><p className="description">{publication.descripcion}</p><div className="privacy"><ShieldCheck size={19} />Esta publicación muestra una zona de referencia.</div></div>
          {publication.tipo === 'servicio' ? <div className="panel"><h2>Visto Bueno Vecinal</h2><p className="muted">Las recomendaciones y el contacto del prestador se incorporarán en la siguiente etapa.</p></div> : !account ? <>
            {!own && publication.estado !== 'resuelta' && !alreadyOffered && <form className="panel" onSubmit={(e) => { e.preventDefault(); perform((current) => offerHelp(current, publication.id, user, message, crypto.randomUUID()), 'Tu respuesta quedó registrada en esta demo.'); }}><h2>{publication.tipo === 'ofrecimiento' ? 'Coordina con tu vecino' : '¿Cómo puedes ayudar?'}</h2><label>Tu mensaje<textarea required minLength={2} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tengo una escalera. Te la puedo prestar esta tarde." /></label><button className="button primary" type="submit"><HandHeart size={18} />{publication.tipo === 'ofrecimiento' ? 'Me interesa' : 'Yo te ayudo'}</button></form>}
            {alreadyOffered && <p className="privacy"><Check size={18} />Ya enviaste una respuesta. Puedes verla en Mi actividad.</p>}
            <div className="panel"><h2>{own ? 'Respuestas de tus vecinos' : 'Tu respuesta'}</h2>{offers.filter((o) => own || o.vecino_id === user).length === 0 ? <p className="muted">Todavía no hay respuestas para mostrar.</p> : offers.filter((o) => own || o.vecino_id === user).map((o) => {
              const history = helperHistory(data, o.vecino_id);
              return <div className="offer" key={o.id}><div><strong>{people[o.vecino_id]}</strong><p>{o.mensaje}</p><span className="badge">{o.estado === 'aceptado' ? 'Aceptado' : o.estado === 'rechazado' ? 'Rechazado' : 'Por confirmar'}</span>
                {own && <section className="helper-history">
                  <strong>Referencias del barrio</strong>
                  <p>{history.total ? `Ayudas aceptadas en solicitudes cerradas: ${history.total}.` : 'Todavía no hay ayudas anteriores registradas.'}</p>
                  <p>{history.neighbors ? `Vecinos que le dieron su visto bueno: ${history.neighbors}.` : 'Sin recomendaciones por ahora.'}</p>
                </section>}
                </div>{own && o.estado === 'pendiente' && publication.estado !== 'resuelta' && <button className="button secondary" onClick={() => perform((current) => acceptOffer(current, o.id, user), 'Ayuda aceptada. Ya están en coordinación.')}>Aceptar ayuda</button>}
                {own && publication.estado === 'resuelta' && o.estado === 'aceptado' &&
                  (o.recomendado ? <span className="badge">Diste tu visto bueno</span> :
                  <button className="button secondary" onClick={() => perform((current) => recommendHelper(current, o.id, user), 'Tu recomendación quedó registrada.')}>Cumplió lo acordado. Recomendar</button>)}
              </div>;
            })}</div>
          </> : null}
          {own && publication.estado !== 'resuelta' && <button className="button primary" disabled={saving} onClick={resolveSelected}><Check size={18} />Marcar como resuelta</button>}
          {publication.estado === 'resuelta' && <div className="resolved"><HandHeart size={25} /><strong>Una manito que hizo la diferencia.</strong><span>Esta publicación ya está cerrada.</span></div>}
        </section> : view === 'publicar' ? <section className="form-page"><button className="text-button" onClick={() => review ? setReview(false) : navigate('inicio')}><ArrowLeft size={16} />{review ? 'Editar publicación' : 'Volver al barrio'}</button><span className="eyebrow">{review ? 'PASO 2 DE 2' : 'PASO 1 DE 2'} · UNA MANITO</span><h1>{review ? `¿Así está bien, ${people[user]}?` : 'Cuéntanos qué necesitas'}</h1><p className="muted">{review ? 'Revisa los datos antes de compartirlos con el barrio.' : 'Unas pocas palabras pueden ser el comienzo de una buena ayuda.'}</p>
          {review ? <div className="panel review"><span className="badge">{draft.categoria}</span><h2>{draft.titulo}</h2><p>{draft.descripcion}</p><p className="muted"><MapPin size={16} />{draft.barrio}</p>{draft.es_emergencia && <span className="badge emergency-badge">Apoyo en emergencia</span>}<div className="privacy"><ShieldCheck size={19} />Solo compartimos tu zona, no tu dirección exacta.</div><button className="button primary wide" disabled={saving || loading} onClick={publish}>Publicar {draft.tipo === 'solicitud' ? 'solicitud' : draft.tipo === 'servicio' ? 'servicio' : 'ofrecimiento'}<ArrowRight size={18} /></button></div> : <form className="panel publish-form" onSubmit={(e) => { e.preventDefault(); if (draft.titulo.trim().length < 5 || draft.descripcion.trim().length < 10 || draft.barrio.trim().length < 2) { setNotice('Completa el título, la descripción y el barrio con más detalle.'); return; } setNotice(''); setReview(true); }}><AiPublicationAssistant key={draft.tipo} type={draft.tipo} onApply={(proposal) => { setDraft({ ...draft, ...proposal }); setNotice('Propuesta aplicada. Revisa los campos antes de publicar.'); }} /><fieldset><legend>¿Qué quieres compartir?</legend><div className="type-options">{[['solicitud', 'Necesito ayuda'], ['ofrecimiento', 'Ofrezco ayuda'], ['servicio', 'Un servicio']].map(([type, label]) => <button key={type} type="button" aria-pressed={draft.tipo === type} className={draft.tipo === type ? 'selected' : ''} onClick={() => setDraft({ ...draft, tipo: type })}>{label}</button>)}</div></fieldset><label>Título<input required minLength={5} maxLength={120} value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} placeholder="Ej.: Necesito una escalera prestada" /></label><label>Cuéntale un poco más al barrio<textarea required minLength={10} maxLength={2000} value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} placeholder="¿Qué necesitas u ofreces y para cuándo?" /></label><div className="form-row"><label>Categoría<select value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}>{['Herramientas', 'Gasfitería', 'Electricidad', 'Compras y traslados', 'Clases', 'Agua y alimentos', 'Otros'].map((c) => <option key={c}>{c}</option>)}</select></label><label>Barrio<input required minLength={2} maxLength={120} readOnly={Boolean(account)} value={draft.barrio} onChange={(e) => setDraft({ ...draft, barrio: e.target.value })} /></label></div><label className="checkbox"><input type="checkbox" checked={draft.es_emergencia} onChange={(e) => setDraft({ ...draft, es_emergencia: e.target.checked })} />Es una necesidad o recurso de apoyo en emergencia</label><button type="submit" className="button primary wide">Revisar publicación<ArrowRight size={18} /></button></form>}
        </section> : <>
          {view === 'inicio' ? <><section className="hero"><div><span className="eyebrow">HOLA, {people[user].toUpperCase()} <span aria-hidden="true">☀</span></span><h1>Tu barrio te da<br />una <span>mano.</span></h1><p>Lo que necesitas puede estar a la vuelta.<br />Conecta, comparte y cuenta con tus vecinos.</p><button className="button primary" onClick={() => startPublication()}>Pedir una manito<ArrowRight size={18} /></button></div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-home"><House size={96} strokeWidth={1} /><span>BARRIO ES COMUNIDAD</span></div><span className="art-heart"><Heart size={29} fill="currentColor" /></span><span className="art-hand"><HandHeart size={35} /></span><span className="art-label"><span />Hoy por ti, mañana por mí</span></div></section><div className="quick-actions"><button onClick={() => navigate('servicios')}><span className="action-icon"><Wrench /></span><span><strong>Busca un servicio</strong><small>Talento a pocas cuadras</small></span><ArrowUpRightIcon /></button><button onClick={() => startPublication('ofrecimiento')}><span className="action-icon peach"><HandHeart /></span><span><strong>Ofrece una manito</strong><small>Comparte lo que puedes</small></span><ArrowUpRightIcon /></button></div></> : <section className="page-heading"><span className="eyebrow">TU COMUNIDAD, MÁS CERCA</span><h1>{view === 'servicios' ? 'El talento de tu barrio' : view === 'emergencia' ? 'Nos apoyamos en emergencia' : 'Tus manitos cuentan'}</h1><p className="muted">{view === 'servicios' ? 'Encuentra oficios y servicios locales.' : view === 'emergencia' ? 'Necesidades y recursos para coordinar apoyo vecinal.' : 'Tus publicaciones y las ayudas en las que participas.'}</p>{view === 'emergencia' && <><div className="emergency-note"><AlertTriangle size={19} />Apoyo vecinal. No reemplaza a los servicios de emergencia.</div><button className="button primary" onClick={() => startPublication('solicitud', true)}>Publicar necesidad o recurso<Plus size={17} /></button></>}</section>}
          <section className="feed">{view === 'servicios' && <><AiPublicationAssistant type="busqueda" onApply={(intent) => { setServiceIntent(intent); setQuery(''); }} />{serviceIntent && <div className="notice"><span>{serviceIntent.interpretacion} · Resultados de publicaciones existentes.</span><button onClick={() => setServiceIntent(null)} aria-label="Quitar filtro de IA"><X size={16} /></button></div>}</>}<div className="section-heading"><div><span className="eyebrow">{view === 'inicio' ? 'CERCA DE TI' : 'PUBLICACIONES'}</span><h2>{view === 'inicio' ? 'Está pasando en tu barrio' : 'Encuentra tu próxima conexión'}</h2></div><span className="result-count">{filtered.length} publicaciones</span></div><label className="search-box"><Search size={19} /><input aria-label="Buscar publicaciones" placeholder="Busca una necesidad, un oficio o una herramienta…" value={query} onChange={(e) => setQuery(e.target.value)} /></label><div className="publication-grid" aria-busy={loading}>{filtered.map((p) => <PublicationCard key={p.id} publication={p} onOpen={open} />)}</div>{!loading && !loadError && filtered.length === 0 && <div className="empty"><HandHeart size={35} /><h3>Aquí comienza una nueva conexión</h3><p>No hay publicaciones que coincidan con tu búsqueda.</p><button className="button secondary" onClick={() => startPublication()}>Publicar en mi barrio</button></div>}</section>
        </>}
        <footer className="page-footer"><HandHeart size={17} />Hecho para ayudarnos, de vecino a vecino.<span>Una Manito · Prototipo 2026</span></footer>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Navegación móvil">{navItems.map(({ id, label, icon: Icon }) => <button key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'active' : ''} onClick={() => navigate(id)}><Icon size={21} /><span>{label}</span></button>)}</nav>
  </div>;
}

function ArrowUpRightIcon() { return <ArrowRight size={18} className="action-arrow" />; }
