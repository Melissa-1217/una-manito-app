import { useState } from 'react';
import { House, Wrench, Plus, ClipboardList, HandHeart, MapPin, ArrowRight, ArrowLeft, Search, Heart, ShieldCheck, AlertTriangle, Check, RotateCcw, Users, X } from 'lucide-react';
import PublicationCard, { statusLabels } from './components/PublicationCard.jsx';
import AiPublicationAssistant from './components/AiPublicationAssistant.jsx';
import { people, initialData, offerHelp, acceptOffer, resolvePublication, recommendHelper, helperHistory } from './lib/demo.js';

const STORE = 'una-manito-demo-v1';
const emptyDraft = { tipo: 'solicitud', titulo: '', descripcion: '', categoria: 'Herramientas', barrio: 'Barrio Demo', es_emergencia: false };
const navItems = [{ id: 'inicio', label: 'Mi barrio', icon: House }, { id: 'servicios', label: 'Servicios', icon: Wrench }, { id: 'publicar', label: 'Publicar', icon: Plus }, { id: 'actividad', label: 'Mi actividad', icon: ClipboardList }];

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE));
    if (Array.isArray(data?.publicaciones) && Array.isArray(data?.ofrecimientos)) return data;
  } catch { /* Si el almacenamiento no está disponible, usar la demo en memoria. */ }
  return structuredClone(initialData);
}

export default function App() {
  const [data, setStoredData] = useState(loadData);
  const [user, setUser] = useState('ana');
  const [view, setView] = useState('inicio');
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [review, setReview] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);

  function setData(next) {
    try { localStorage.setItem(STORE, JSON.stringify(next)); }
    catch { setStorageError(true); }
    setStoredData(next);
  }

  function navigate(next) { setView(next); setSelected(null); setReview(false); setMessage(''); setQuery(''); setNotice(''); }
  function open(id) { setSelected(id); setMessage(''); setNotice(''); }
  function perform(action, success) {
    try { setData(action(data)); setNotice(success); }
    catch (error) { setNotice(error.message); }
  }
  function startPublication(type = 'solicitud', emergency = false) { navigate('publicar'); setDraft({ ...emptyDraft, tipo: type, es_emergencia: emergency }); }
  function publish() {
    const publication = { ...draft, titulo: draft.titulo.trim(), descripcion: draft.descripcion.trim(), barrio: draft.barrio.trim(), id: crypto.randomUUID(), autor_id: user, estado: 'pendiente' };
    setData({ ...data, publicaciones: [publication, ...data.publicaciones] });
    setReview(false); setView('actividad'); setSelected(publication.id); setDraft(emptyDraft); setNotice('¡Tu publicación ya está en el barrio!');
  }
  const publication = data.publicaciones.find((p) => p.id === selected);
  const offers = data.ofrecimientos.filter((o) => o.publicacion_id === selected);
  const alreadyOffered = offers.some((o) => o.vecino_id === user);
  const own = publication?.autor_id === user;
  const filtered = data.publicaciones.filter((p) => {
    const matchesView = view === 'servicios' ? p.tipo === 'servicio' : view === 'emergencia' ? p.es_emergencia : view === 'actividad' ? p.autor_id === user || data.ofrecimientos.some((o) => o.publicacion_id === p.id && o.vecino_id === user) : true;
    return matchesView && `${p.titulo} ${p.descripcion} ${p.categoria}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'));
  });

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); navigate('inicio'); }}><span className="brand-mark"><HandHeart size={28} /></span><span>Una Manito<small>ENTRE VECINOS, MEJOR.</small></span></a>
      <div className="neighborhood"><MapPin size={17} /><span>Tu comunidad<strong>Barrio Demo · San Miguel</strong></span></div>
      <nav aria-label="Navegación principal">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={20} />{label}{view === id && <span className="nav-dot" />}</button>)}</nav>
      <button className={`nav-item emergency-link ${view === 'emergencia' ? 'active' : ''}`} onClick={() => navigate('emergencia')}><AlertTriangle size={20} />Apoyo en emergencia</button>
      <div className="sidebar-note"><Users size={27} /><h3>Un barrio se construye entre todos.</h3><p>Una herramienta, un oficio o un poquito de tu tiempo pueden hacer la diferencia.</p><span>Hoy por ti, mañana por mí. <Heart size={13} /></span></div>
      <div className="sidebar-bottom"><ShieldCheck size={16} />Con cercanía y respeto</div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span className="topbar-location"><MapPin size={16} />San Miguel <span>/</span> Barrio Demo</span><label className="user-switch"><span className="avatar">{people[user][0]}</span><select aria-label="Cambiar usuario de demostración" value={user} onChange={(e) => { setUser(e.target.value); setSelected(null); setMessage(''); setNotice(''); }}><option value="ana">Ana · demo</option><option value="luis">Luis · demo</option></select></label></header>
      <div className="demo-banner"><span><strong>Prototipo local</strong> · Datos ilustrativos guardados en este navegador. Aún sin conexión a Supabase.</span><button onClick={() => { if (window.confirm('¿Restablecer los datos de ejemplo? Se borrarán las publicaciones de esta demo local.')) { setData(structuredClone(initialData)); navigate('inicio'); } }}><RotateCcw size={13} />Reiniciar demo</button></div>
      {storageError && <p className="notice" role="alert">No se pudo guardar en este navegador. Los cambios durarán mientras mantengas esta página abierta.</p>}
      <main id="contenido">
        {view === 'inicio' && !selected && <button className="mobile-emergency" onClick={() => navigate('emergencia')}><AlertTriangle size={16} />Apoyo en emergencia<ArrowRight size={16} /></button>}
        {notice && <div className="notice" role="status"><Check size={18} /><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={16} /></button></div>}
        {publication ? <section className="detail-page"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={16} />Volver</button><div className="detail-heading"><span className="eyebrow">{publication.categoria}</span><span className={`badge ${publication.estado}`}>{statusLabels[publication.estado]}</span></div><h1>{publication.titulo}</h1><p className="muted"><MapPin size={15} />{publication.barrio} · Publicado por {people[publication.autor_id]}</p><div className="panel"><p className="description">{publication.descripcion}</p><div className="privacy"><ShieldCheck size={19} />Este ejemplo solo muestra el barrio; no contiene una dirección exacta.</div></div>
          {publication.tipo === 'servicio' ? <div className="panel"><h2>Visto Bueno Vecinal</h2><p className="muted">Las recomendaciones y el contacto del prestador se incorporarán en la siguiente etapa.</p></div> : <>
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
          </>}
          {own && publication.estado !== 'resuelta' && <button className="button primary" onClick={() => perform((current) => resolvePublication(current, publication.id, user), '¡Solicitud resuelta! Gracias por construir comunidad.')}><Check size={18} />Marcar como resuelta</button>}
          {publication.estado === 'resuelta' && <div className="resolved"><HandHeart size={25} /><strong>Una manito que hizo la diferencia.</strong><span>Esta publicación ya está cerrada.</span></div>}
        </section> : view === 'publicar' ? <section className="form-page"><button className="text-button" onClick={() => review ? setReview(false) : navigate('inicio')}><ArrowLeft size={16} />{review ? 'Editar publicación' : 'Volver al barrio'}</button><span className="eyebrow">{review ? 'PASO 2 DE 2' : 'PASO 1 DE 2'} · UNA MANITO</span><h1>{review ? `¿Así está bien, ${people[user]}?` : 'Cuéntanos qué necesitas'}</h1><p className="muted">{review ? 'Revisa los datos antes de compartirlos con el barrio.' : 'Unas pocas palabras pueden ser el comienzo de una buena ayuda.'}</p>
          {review ? <div className="panel review"><span className="badge">{draft.categoria}</span><h2>{draft.titulo}</h2><p>{draft.descripcion}</p><p className="muted"><MapPin size={16} />{draft.barrio}</p>{draft.es_emergencia && <span className="badge emergency-badge">Apoyo en emergencia</span>}<div className="privacy"><ShieldCheck size={19} />Solo compartimos tu zona, no tu dirección exacta.</div><button className="button primary wide" onClick={publish}>Publicar {draft.tipo === 'solicitud' ? 'solicitud' : draft.tipo === 'servicio' ? 'servicio' : 'ofrecimiento'}<ArrowRight size={18} /></button></div> : <form className="panel publish-form" onSubmit={(e) => { e.preventDefault(); if (draft.titulo.trim().length < 5 || draft.descripcion.trim().length < 10 || draft.barrio.trim().length < 2) { setNotice('Completa el título, la descripción y el barrio con más detalle.'); return; } setNotice(''); setReview(true); }}><AiPublicationAssistant key={draft.tipo} type={draft.tipo} onApply={(proposal) => { setDraft({ ...draft, ...proposal }); setNotice('Propuesta aplicada. Revisa los campos antes de publicar.'); }} /><fieldset><legend>¿Qué quieres compartir?</legend><div className="type-options">{[['solicitud', 'Necesito ayuda'], ['ofrecimiento', 'Ofrezco ayuda'], ['servicio', 'Un servicio']].map(([type, label]) => <button key={type} type="button" aria-pressed={draft.tipo === type} className={draft.tipo === type ? 'selected' : ''} onClick={() => setDraft({ ...draft, tipo: type })}>{label}</button>)}</div></fieldset><label>Título<input required minLength={5} maxLength={120} value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} placeholder="Ej.: Necesito una escalera prestada" /></label><label>Cuéntale un poco más al barrio<textarea required minLength={10} maxLength={2000} value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} placeholder="¿Qué necesitas u ofreces y para cuándo?" /></label><div className="form-row"><label>Categoría<select value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })}>{['Herramientas', 'Gasfitería', 'Electricidad', 'Compras y traslados', 'Clases', 'Agua y alimentos', 'Otros'].map((c) => <option key={c}>{c}</option>)}</select></label><label>Barrio<input required minLength={2} maxLength={120} value={draft.barrio} onChange={(e) => setDraft({ ...draft, barrio: e.target.value })} /></label></div><label className="checkbox"><input type="checkbox" checked={draft.es_emergencia} onChange={(e) => setDraft({ ...draft, es_emergencia: e.target.checked })} />Es una necesidad o recurso de apoyo en emergencia</label><button type="submit" className="button primary wide">Revisar publicación<ArrowRight size={18} /></button></form>}
        </section> : <>
          {view === 'inicio' ? <><section className="hero"><div><span className="eyebrow">HOLA, {people[user].toUpperCase()} <span aria-hidden="true">☀</span></span><h1>Tu barrio te da<br />una <span>mano.</span></h1><p>Lo que necesitas puede estar a la vuelta.<br />Conecta, comparte y cuenta con tus vecinos.</p><button className="button primary" onClick={() => startPublication()}>Pedir una manito<ArrowRight size={18} /></button></div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-home"><House size={96} strokeWidth={1} /><span>BARRIO ES COMUNIDAD</span></div><span className="art-heart"><Heart size={29} fill="currentColor" /></span><span className="art-hand"><HandHeart size={35} /></span><span className="art-label"><span />Hoy por ti, mañana por mí</span></div></section><div className="quick-actions"><button onClick={() => navigate('servicios')}><span className="action-icon"><Wrench /></span><span><strong>Busca un servicio</strong><small>Talento a pocas cuadras</small></span><ArrowUpRightIcon /></button><button onClick={() => startPublication('ofrecimiento')}><span className="action-icon peach"><HandHeart /></span><span><strong>Ofrece una manito</strong><small>Comparte lo que puedes</small></span><ArrowUpRightIcon /></button></div></> : <section className="page-heading"><span className="eyebrow">TU COMUNIDAD, MÁS CERCA</span><h1>{view === 'servicios' ? 'El talento de tu barrio' : view === 'emergencia' ? 'Nos apoyamos en emergencia' : 'Tus manitos cuentan'}</h1><p className="muted">{view === 'servicios' ? 'Encuentra oficios y servicios locales.' : view === 'emergencia' ? 'Necesidades y recursos para coordinar apoyo vecinal.' : 'Tus publicaciones y las ayudas en las que participas.'}</p>{view === 'emergencia' && <><div className="emergency-note"><AlertTriangle size={19} />Apoyo vecinal. No reemplaza a los servicios de emergencia.</div><button className="button primary" onClick={() => startPublication('solicitud', true)}>Publicar necesidad o recurso<Plus size={17} /></button></>}</section>}
          <section className="feed"><div className="section-heading"><div><span className="eyebrow">{view === 'inicio' ? 'CERCA DE TI' : 'PUBLICACIONES'}</span><h2>{view === 'inicio' ? 'Está pasando en tu barrio' : 'Encuentra tu próxima conexión'}</h2></div><span className="result-count">{filtered.length} publicaciones</span></div><label className="search-box"><Search size={19} /><input aria-label="Buscar publicaciones" placeholder="Busca una necesidad, un oficio o una herramienta…" value={query} onChange={(e) => setQuery(e.target.value)} /></label><div className="publication-grid">{filtered.map((p) => <PublicationCard key={p.id} publication={p} onOpen={open} />)}</div>{filtered.length === 0 && <div className="empty"><HandHeart size={35} /><h3>Aquí comienza una nueva conexión</h3><p>No hay publicaciones que coincidan con tu búsqueda.</p><button className="button secondary" onClick={() => startPublication()}>Publicar en mi barrio</button></div>}</section>
        </>}
        <footer className="page-footer"><HandHeart size={17} />Hecho para ayudarnos, de vecino a vecino.<span>Una Manito · Prototipo 2026</span></footer>
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Navegación móvil">{navItems.map(({ id, label, icon: Icon }) => <button key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'active' : ''} onClick={() => navigate(id)}><Icon size={21} /><span>{label}</span></button>)}</nav>
  </div>;
}

function ArrowUpRightIcon() { return <ArrowRight size={18} className="action-arrow" />; }
