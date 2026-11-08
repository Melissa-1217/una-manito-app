import useOnline from '../lib/useOnline.js';
import { readOfflineProfile, saveOfflineProfile, clearOfflineAccount } from '../lib/offline.js';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, HandHeart, MapPin, MailCheck, ShieldCheck, LogOut } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase.js';
import App from '../App.jsx';
import NeighborhoodField from './NeighborhoodField.jsx';

function AuthLayout({ children }) {
  return <><div className="auth-page">
    <aside className="auth-story">
      <div className="brand"><span className="brand-mark"><HandHeart size={28} /></span>Una Manito</div>
      <div><HandHeart size={90} strokeWidth={1} /><h1>Entre vecinos, nos damos una manito.</h1><p>Encuentra servicios, comparte lo que puedes y conecta con tus vecinos.</p></div>
      
    </aside>
    <main id="contenido" tabIndex={-1} className="auth-content"><div className="auth-mobile-brand"><HandHeart size={27} />Una Manito</div><p className="auth-tagline">Entre vecinos, nos damos una manito.</p>{children}</main>
  </div></>;
}

function Credentials({ client, onDemo }) {
  const [screen, setScreen] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  function switchScreen(next) {
    setScreen(next);
    setError('');
    setConfirmation(false);
    setPassword('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!client) {
      setError('Falta configurar la conexión a Supabase para usar cuentas reales.');
      return;
    }
    if (screen === 'register' && name.trim().length < 2) {
      setError('Escribe un nombre de al menos dos caracteres.');
      return;
    }
    setPending(true);
    try {
      const result = screen === 'register'
        ? await client.auth.signUp({ email: email.trim(), password, options: { data: { nombre: name.trim() }, emailRedirectTo: window.location.origin } })
        : await client.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (screen === 'register' && !result.data.session) {
        setConfirmation(true);
        setPassword('');
      }
    } catch (failure) {
      const messages = {
        invalid_credentials: 'El correo o la contraseña no coinciden.',
        email_not_confirmed: 'Confirma tu correo antes de entrar. Revisa también la carpeta de spam.',
        over_email_send_rate_limit: 'Se alcanzó el límite de correos de confirmación. Intenta más tarde.',
        user_already_exists: 'Ya existe una cuenta con ese correo. Intenta iniciar sesión.',
      };
      setError(messages[failure.code] || 'No se pudo completar el acceso. Comprueba la conexión y vuelve a intentar.');
    } finally {
      setPending(false);
    }
  }

  if (confirmation) return <AuthLayout>
    <div className="auth-symbol"><MailCheck size={36} /></div><h1>Revisa tu correo</h1>
    <p>Si el registro procede, recibirás un enlace en <strong>{email}</strong> para confirmar tu cuenta.</p>
    <p className="muted">Abre el enlace y vuelve para elegir tu barrio. Revisa también la carpeta de spam.</p>
    <button className="button primary wide" onClick={() => switchScreen('login')}>Ir a iniciar sesión<ArrowRight size={17} /></button>
  </AuthLayout>;

  return <AuthLayout>
    {screen === 'register' && <button className="text-button" onClick={() => switchScreen('login')}><ArrowLeft size={17} />Volver</button>}
    
    <h1>{screen === 'register' ? 'Únete a tu comunidad' : 'Entra a tu barrio'}</h1>
    <p className="muted">{screen === 'register' ? 'Crea tu cuenta. Después podrás elegir el barrio donde quieres participar.' : 'Servicios, favores y apoyo cerca de casa.'}</p>
    {!client && <div className="auth-configuration" role="status">La conexión con Supabase está pendiente. Puedes explorar las pantallas en la demostración.</div>}
    <form className="panel auth-form" onSubmit={submit}>
      <fieldset disabled={pending}>
        {screen === 'register' && <label>Tu nombre<input autoComplete="given-name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Cómo quieres que te conozcan" /></label>}
        <label>Correo electrónico<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vecino@correo.com" /></label>
        <label htmlFor="account-password">Contraseña</label>
        <div className="password-field"><input id="account-password" type={showPassword ? 'text' : 'password'} autoComplete={screen === 'register' ? 'new-password' : 'current-password'} required minLength={screen === 'register' ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
        {screen === 'register' && <p className="ai-hint">Usa al menos ocho caracteres.</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button primary wide" type="submit">{pending ? 'Un momento…' : screen === 'register' ? 'Crear mi cuenta' : 'Entrar a mi barrio'}<ArrowRight size={17} /></button>
      </fieldset>
    </form>
    <button className="button secondary wide" onClick={() => switchScreen(screen === 'register' ? 'login' : 'register')}>{screen === 'register' ? 'Ya tengo cuenta' : 'Crear cuenta de vecino'}</button>
    
    <button className="text-button auth-demo-link" onClick={onDemo}>Explorar demostración</button>
  </AuthLayout>;
}

function ChooseNeighborhood({ client, session, profile, onSaved, onSignOut, onCancel }) {
  const [name, setName] = useState(profile?.nombre || session.user.user_metadata?.nombre || '');
  const [neighborhood, setNeighborhood] = useState(profile?.barrio || '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function save(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const values = { id: session.user.id, nombre: name.trim(), barrio: neighborhood.trim().replace(/\s+/g, ' ') };
      if (values.nombre.length < 2 || values.barrio.length < 2) throw new Error('Completa tu nombre y barrio con al menos dos caracteres.');
      let result = profile
        ? await client.from('perfiles').update({ barrio: values.barrio }).eq('id', session.user.id).select('id,nombre,barrio').single()
        : await client.from('perfiles').insert(values).select('id,nombre,barrio').single();
      if (result.error?.code === '23505') {
        result = await client.from('perfiles').select('id,nombre,barrio').eq('id', session.user.id).single();
      }
      if (result.error) throw result.error;
      onSaved(result.data);
    } catch (failure) {
      setError(failure.code ? 'No pudimos guardar tu perfil. Comprueba los permisos de la tabla perfiles y vuelve a intentar.' : failure.message);
    } finally { setPending(false); }
  }

  return <AuthLayout><div className="auth-symbol"><MapPin size={34} /></div><h1>{profile ? 'Cambiar barrio' : 'Elige tu barrio'}</h1>
    <p className="muted">¿En qué comunidad quieres participar?</p>
    <form className="panel auth-form" onSubmit={save}><fieldset disabled={pending}>
      {!profile && <label>Tu nombre<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} autoComplete="given-name" /></label>}
      <NeighborhoodField client={client} value={neighborhood} onChange={setNeighborhood} />
      {profile && <p className="ai-hint">Verás las publicaciones del barrio elegido. Tus publicaciones anteriores conservarán su barrio original.</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" className="button primary wide">{pending ? 'Guardando…' : profile ? 'Guardar barrio' : 'Entrar a mi barrio'}<ArrowRight size={17} /></button>
    </fieldset></form>
    <div className="privacy"><ShieldCheck size={20} />El barrio es una referencia para encontrar publicaciones cercanas.</div>
    {onCancel && <button className="button secondary wide" disabled={pending} onClick={onCancel}>Cancelar</button>}
    <button className="text-button" disabled={pending} onClick={onSignOut}><LogOut size={16} />Cerrar sesión</button>
  </AuthLayout>;
}

export default function AuthFlow() {
  const client = useMemo(() => {
    try { return getSupabaseClient(); } catch { return null; }
  }, []);
  const [demo, setDemo] = useState(false);
  const online = useOnline();
  const [offlineProfile, setOfflineProfile] = useState(readOfflineProfile);
  const [sessionResult, setSessionResult] = useState(null);
  const [profileResult, setProfileResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const [editingNeighborhood, setEditingNeighborhood] = useState(false);
  const session = sessionResult?.session;
  const userId = session?.user.id;

  useEffect(() => {
    if (!client) return;
    let active = true;
    let authEventReceived = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      authEventReceived = true;
      if (active) setSessionResult({ session: nextSession });
    });
    client.auth.getSession().then(({ data, error }) => {
      if (active && !authEventReceived) setSessionResult({ session: data.session, error });
    }).catch(() => { if (active && !authEventReceived) setSessionResult({ session: null }); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (!client || !userId || !online) return;
    let active = true;
    async function loadProfile() {
      try {
        const { data, error } = await client.from('perfiles').select('id,nombre,barrio').eq('id', userId).maybeSingle();
        if (active) { setProfileResult({ userId, profile: data, error, attempt: retry }); if (data && !error) { setOfflineProfile(data); try { saveOfflineProfile(data); } catch { /* Offline storage is optional. */ } } }
      } catch {
        if (active) setProfileResult({ userId, error: true, attempt: retry });
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, [client, userId, retry, online]);

  async function signOut() {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) { window.alert('No se pudo cerrar la sesión. Intenta nuevamente.'); return; }
    if (profileResult?.profile) { try { clearOfflineAccount(profileResult.profile); } catch { /* Storage may be unavailable. */ } }
    setOfflineProfile(null);
    setProfileResult(null);
    setEditingNeighborhood(false);
  }

  function profileSaved(profile) {
    setProfileResult({ userId, profile, attempt: retry }); setOfflineProfile(profile); setEditingNeighborhood(false);
    try { saveOfflineProfile(profile); } catch { /* Offline storage is optional. */ }
  }

  if (demo) return <App onExitDemo={() => setDemo(false)} />;
  if (!online && offlineProfile && !(session && profileResult?.profile && profileResult.userId === userId)) return <App key={`offline-${offlineProfile.id}-${offlineProfile.barrio}`} account={offlineProfile} offlineSession onSignOut={() => { try { clearOfflineAccount(offlineProfile); } catch { /* Storage may be unavailable. */ } setOfflineProfile(null); }} />;
  if (client && !sessionResult) return <AuthLayout><p role="status">Recuperando tu sesión…</p></AuthLayout>;
  if (!session) return <Credentials client={client} onDemo={() => setDemo(true)} />;
  if (profileResult?.userId !== userId || profileResult.attempt !== retry) return <AuthLayout><p role="status">Cargando tu perfil…</p></AuthLayout>;
  if (profileResult.error) return <AuthLayout><h1>Tu perfil está pendiente</h1><p role="alert">No pudimos consultar tu perfil. Revisa la conexión y los permisos de Supabase.</p><button className="button primary wide" onClick={() => setRetry(retry + 1)}>Volver a intentar</button><button className="text-button" onClick={signOut}>Cerrar sesión</button></AuthLayout>;
  if (!profileResult.profile) return <ChooseNeighborhood key={userId} client={client} session={session} onSaved={profileSaved} onSignOut={signOut} />;
  if (editingNeighborhood) return <ChooseNeighborhood key={userId} client={client} session={session} profile={profileResult.profile} onSaved={profileSaved} onCancel={() => setEditingNeighborhood(false)} onSignOut={signOut} />;
  return <App key={`${userId}-${profileResult.profile.barrio}`} account={profileResult.profile} onSignOut={signOut} onChangeNeighborhood={() => setEditingNeighborhood(true)} />;
}
