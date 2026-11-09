import { useEffect, useRef, useState } from 'react';
import { registerSW } from '../lib/registerPwa.js';
import useOnline from '../lib/useOnline.js';

export default function PwaControls() {
  const online = useOnline();
  const [install, setInstall] = useState(null);
  const [standalone, setStandalone] = useState(() => matchMedia('(display-mode: standalone)').matches || Boolean(navigator.standalone));
  const [update, setUpdate] = useState(false);
  const [error, setError] = useState('');
  const updater = useRef(null);
  useEffect(() => {
    let active = true;
    updater.current = registerSW({ onNeedRefresh() { if (active) setUpdate(true); }, onRegisterError() { if (active) setError('No se pudo preparar el acceso sin conexión. Puedes seguir usando la web.'); } });
    const prompt = event => { event.preventDefault(); setInstall(event); };
    const installed = () => { setInstall(null); setStandalone(true); };
    window.addEventListener('beforeinstallprompt', prompt);
    window.addEventListener('appinstalled', installed);
    return () => { active = false; window.removeEventListener('beforeinstallprompt', prompt); window.removeEventListener('appinstalled', installed); };
  }, []);
  return <aside className="pwa-bar" aria-label="Instalación y conexión">
    {!online && <p role="status">Sin conexión. Puedes consultar lo guardado y preparar un borrador. Los cambios no se enviarán automáticamente.</p>}
    {update && <div role="status"><span>Hay una versión nueva. Guarda tu borrador antes de actualizar.</span><button className="button secondary" disabled={!online} onClick={() => updater.current?.(true)}>Actualizar app</button></div>}
    {error && <p role="status">{error}</p>}
    {!standalone && (install ? <button className="button secondary" onClick={async () => {
      try { await install.prompt(); await install.userChoice; } catch { setError('Abre el menú del navegador para instalar la app.'); }
      setInstall(null);
    }}>Instalar app</button> : <details className="pwa-install-help"><summary>Cómo instalar la app</summary><p>Abre esta página directamente en Chrome o Safari si la estás viendo dentro de otra aplicación.</p><p>Android: en Chrome, pulsa ⋮ y elige «Añadir a la pantalla principal» o «Instalar aplicación». En iPhone: en Safari, pulsa Compartir → Añadir a pantalla de inicio. En computadora: busca el icono de instalación en la barra de direcciones de Chrome o Edge.</p></details>)}
  </aside>;
}
